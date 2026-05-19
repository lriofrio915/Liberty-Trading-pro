import { NextRequest, NextResponse } from 'next/server'
import { getFuturesSpec } from '@/lib/futures-specs'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

function validateCron(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization') ?? ''
  const query = new URL(req.url).searchParams.get('secret') ?? ''
  return auth === `Bearer ${secret}` || query === secret
}

interface YahooCandle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
}

async function fetch1minCandles(symbol: string): Promise<YahooCandle[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) return []
  const json = await res.json()
  const result = json?.chart?.result?.[0]
  if (!result) return []
  const timestamps: number[] = result.timestamp ?? []
  const q = result.indicators?.quote?.[0]
  return timestamps.map((ts: number, i: number) => ({
    timestamp: ts,
    open:  q?.open?.[i]  ?? 0,
    high:  q?.high?.[i]  ?? 0,
    low:   q?.low?.[i]   ?? 0,
    close: q?.close?.[i] ?? 0,
  })).filter(c => c.high > 0 && c.low > 0)
}

function get930ETTimestamp(now: Date): number {
  const etDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(now)
  const [year, month, day] = etDate.split('-').map(Number)
  const edtCandidate = Date.UTC(year, month - 1, day, 13, 30)
  const etHour = parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      hour12: false,
    }).format(new Date(edtCandidate)),
    10,
  )
  return (etHour === 9 ? edtCandidate : Date.UTC(year, month - 1, day, 14, 30)) / 1000
}

interface ResolveResult { resultado: string; pnlUsd: number; closedPrice: number }

function resolveFromCandles(
  candles: YahooCandle[],
  target930: number,
  sesgo: 'COMPRA' | 'VENTA',
  precioEntrada: number,
  stopLoss: number,
  takeProfit: number,
  pointValue: number,
  slUsd: number,
  tpUsd: number,
): ResolveResult {
  const afterOpen = candles.filter(c => c.timestamp >= target930)

  for (const candle of afterOpen) {
    if (sesgo === 'COMPRA') {
      const hitTP = candle.high >= takeProfit
      const hitSL = candle.low  <= stopLoss
      if (hitTP && hitSL) {
        // Both in same candle — green = up first (TP), red = down first (SL)
        return candle.close >= candle.open
          ? { resultado: 'GANADA',  pnlUsd: tpUsd,  closedPrice: takeProfit }
          : { resultado: 'PERDIDA', pnlUsd: -slUsd, closedPrice: stopLoss }
      }
      if (hitTP) return { resultado: 'GANADA',  pnlUsd: tpUsd,  closedPrice: takeProfit }
      if (hitSL) return { resultado: 'PERDIDA', pnlUsd: -slUsd, closedPrice: stopLoss }
    } else {
      const hitTP = candle.low  <= takeProfit
      const hitSL = candle.high >= stopLoss
      if (hitTP && hitSL) {
        // Red = down first (TP for VENTA), green = up first (SL for VENTA)
        return candle.close <= candle.open
          ? { resultado: 'GANADA',  pnlUsd: tpUsd,  closedPrice: takeProfit }
          : { resultado: 'PERDIDA', pnlUsd: -slUsd, closedPrice: stopLoss }
      }
      if (hitTP) return { resultado: 'GANADA',  pnlUsd: tpUsd,  closedPrice: takeProfit }
      if (hitSL) return { resultado: 'PERDIDA', pnlUsd: -slUsd, closedPrice: stopLoss }
    }
  }

  // Neither hit — close EOD at last candle price
  const lastClose = afterOpen.length > 0 ? afterOpen[afterOpen.length - 1].close : precioEntrada
  const rawPnl = sesgo === 'COMPRA'
    ? (lastClose - precioEntrada) * pointValue
    : (precioEntrada - lastClose) * pointValue
  const resultado = rawPnl > 0 ? 'GANADA' : rawPnl < 0 ? 'PERDIDA' : 'BREAKEVEN'
  return { resultado, pnlUsd: parseFloat(rawPnl.toFixed(2)), closedPrice: lastClose }
}

export async function POST(req: NextRequest) {
  if (!validateCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const target930 = get930ETTimestamp(now)

    const today0 = new Date()
    today0.setUTCHours(0, 0, 0, 0)
    const signals = await prisma.cfdSignal.findMany({
      where: {
        sector:        'Futuros',
        resultado:     'PENDIENTE',
        createdAt:     { gte: today0 },
        precioEntrada: { gt: 0 },
        openEntry:     true,
      },
    })

    if (signals.length === 0) {
      return NextResponse.json({ audited: 0, message: 'Sin señales 9:30am PENDIENTE con entrada registrada' })
    }

    const tickerMap: Record<string, string> = {
      NQ:      'NQ=F',
      SP500:   'ES=F',
      RUSSELL: 'RTY=F',
    }

    const uniqueSymbols = [...new Set(signals.map(s => s.simbolo))]
    const candlesBySymbol: Record<string, YahooCandle[]> = {}
    await Promise.all(uniqueSymbols.map(async sym => {
      const ticker = tickerMap[sym]
      if (!ticker) return
      candlesBySymbol[sym] = await fetch1minCandles(ticker)
    }))

    const results: Array<{ id: string; resultado: string; pnlUsd: number }> = []

    for (const sig of signals) {
      const candles = candlesBySymbol[sig.simbolo]
      if (!candles || candles.length === 0) continue

      const spec = getFuturesSpec(sig.simbolo)
      const sesgo = sig.sesgo as 'COMPRA' | 'VENTA'
      const { resultado, pnlUsd, closedPrice } = resolveFromCandles(
        candles,
        target930,
        sesgo,
        sig.precioEntrada,
        sig.stopLoss,
        sig.takeProfit,
        spec.pointValue,
        spec.slUsd,
        spec.tpUsd,
      )

      await prisma.cfdSignal.update({
        where: { id: sig.id },
        data: {
          resultado,
          pnlUsd,
          closedPrice,
          closedAt: new Date(),
        },
      })
      results.push({ id: sig.id, resultado, pnlUsd })
    }

    return NextResponse.json({
      audited: results.length,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[cron/futuros-close]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
