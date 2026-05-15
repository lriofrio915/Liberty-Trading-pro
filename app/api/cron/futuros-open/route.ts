import { NextRequest, NextResponse } from 'next/server'
import { computeFuturesLevels, FUTURES_SPECS } from '@/lib/futures-specs'
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
  // Get today's date components in America/New_York
  const etDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(now)
  const [year, month, day] = etDate.split('-').map(Number)

  // Test if EDT (UTC-4) or EST (UTC-5) is active by checking 13:30 UTC
  // 13:30 UTC = 9:30 EDT, but 8:30 EST — so if ET hour at 13:30 UTC is 9, we're in EDT
  const edtCandidate = Date.UTC(year, month - 1, day, 13, 30)
  const etHour = parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      hour12: false,
    }).format(new Date(edtCandidate)),
    10,
  )
  // If 13:30 UTC maps to 9 in NY → EDT active; otherwise it's 8 → EST active, use 14:30 UTC
  return (etHour === 9 ? edtCandidate : Date.UTC(year, month - 1, day, 14, 30)) / 1000
}

export async function POST(req: NextRequest) {
  if (!validateCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const target930 = get930ETTimestamp(now)  // Unix seconds for 9:30am ET today

    // Find today's PENDIENTE Futuros signals
    const today0 = new Date()
    today0.setUTCHours(0, 0, 0, 0)
    const signals = await prisma.cfdSignal.findMany({
      where: {
        sector: 'Futuros',
        resultado: 'PENDIENTE',
        createdAt: { gte: today0 },
      },
    })

    if (signals.length === 0) {
      return NextResponse.json({ updated: 0, message: 'No hay señales PENDIENTE hoy' })
    }

    // Fetch 1-min candles for each distinct ticker
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

    const updated: string[] = []
    for (const sig of signals) {
      const candles = candlesBySymbol[sig.simbolo]
      if (!candles || candles.length === 0) continue

      // Find first candle at or after 9:30 AM ET
      const candle930 = candles.find(c => c.timestamp >= target930)
      if (!candle930) continue

      const sesgo = sig.sesgo as 'COMPRA' | 'VENTA'
      const entryPrice = sesgo === 'COMPRA' ? candle930.high : candle930.low
      const levels = computeFuturesLevels(sesgo, entryPrice, sig.simbolo)

      await prisma.cfdSignal.update({
        where: { id: sig.id },
        data: {
          precioEntrada: entryPrice,
          stopLoss:      levels.stopLoss,
          takeProfit:    levels.takeProfit,
        },
      })
      updated.push(sig.id)
    }

    return NextResponse.json({
      updated: updated.length,
      ids: updated,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[cron/futuros-open]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
