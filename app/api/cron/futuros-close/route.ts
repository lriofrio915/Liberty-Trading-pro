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

interface DayOHLCV {
  price: number
  dayHigh: number
  dayLow: number
}

async function fetchDayOHLCV(symbol: string): Promise<DayOHLCV | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(8_000),
  })
  if (!res.ok) return null
  const json = await res.json()
  const result = json?.chart?.result?.[0]
  if (!result) return null
  const meta = result.meta
  return {
    price:   meta?.regularMarketPrice ?? 0,
    dayHigh: meta?.regularMarketDayHigh ?? 0,
    dayLow:  meta?.regularMarketDayLow  ?? 0,
  }
}

export async function POST(req: NextRequest) {
  if (!validateCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find today's PENDIENTE Futuros signals with a valid entry price
    const today0 = new Date()
    today0.setUTCHours(0, 0, 0, 0)
    const signals = await prisma.cfdSignal.findMany({
      where: {
        sector: 'Futuros',
        resultado: 'PENDIENTE',
        createdAt: { gte: today0 },
        precioEntrada: { gt: 0 },
      },
    })

    if (signals.length === 0) {
      return NextResponse.json({ audited: 0, message: 'Sin señales PENDIENTE con entrada registrada' })
    }

    const tickerMap: Record<string, string> = {
      NQ:      'NQ=F',
      SP500:   'ES=F',
      RUSSELL: 'RTY=F',
    }

    // Fetch day OHLCV for each distinct symbol
    const uniqueSymbols = [...new Set(signals.map(s => s.simbolo))]
    const ohlcvBySymbol: Record<string, DayOHLCV | null> = {}
    await Promise.all(uniqueSymbols.map(async sym => {
      const ticker = tickerMap[sym]
      if (!ticker) return
      ohlcvBySymbol[sym] = await fetchDayOHLCV(ticker)
    }))

    const results: Array<{ id: string; resultado: string; pnlUsd: number }> = []

    for (const sig of signals) {
      const ohlcv = ohlcvBySymbol[sig.simbolo]
      if (!ohlcv || ohlcv.price <= 0) continue

      const spec = getFuturesSpec(sig.simbolo)
      const isCompra = sig.sesgo === 'COMPRA'
      const { dayHigh, dayLow, price: currentPrice } = ohlcv

      let resultado: string
      let pnlUsd: number

      if (isCompra) {
        // SL hit if day low went below stop loss, TP hit if day high went above take profit
        const hitSL = dayLow <= sig.stopLoss
        const hitTP = dayHigh >= sig.takeProfit
        if (hitSL && hitTP) {
          // Both touched — assume SL hit first (conservative)
          resultado = 'PERDIDA'; pnlUsd = -spec.slUsd
        } else if (hitTP) {
          resultado = 'GANADA'; pnlUsd = spec.tpUsd
        } else if (hitSL) {
          resultado = 'PERDIDA'; pnlUsd = -spec.slUsd
        } else {
          // Neither hit — close at current price (EOD)
          pnlUsd = (currentPrice - sig.precioEntrada) * spec.pointValue
          resultado = pnlUsd > 0 ? 'GANADA' : pnlUsd < 0 ? 'PERDIDA' : 'BREAKEVEN'
        }
      } else {
        // VENTA
        const hitSL = dayHigh >= sig.stopLoss
        const hitTP = dayLow <= sig.takeProfit
        if (hitSL && hitTP) {
          resultado = 'PERDIDA'; pnlUsd = -spec.slUsd
        } else if (hitTP) {
          resultado = 'GANADA'; pnlUsd = spec.tpUsd
        } else if (hitSL) {
          resultado = 'PERDIDA'; pnlUsd = -spec.slUsd
        } else {
          pnlUsd = (sig.precioEntrada - currentPrice) * spec.pointValue
          resultado = pnlUsd > 0 ? 'GANADA' : pnlUsd < 0 ? 'PERDIDA' : 'BREAKEVEN'
        }
      }

      await prisma.cfdSignal.update({
        where: { id: sig.id },
        data: {
          resultado,
          pnlUsd:     parseFloat(pnlUsd.toFixed(2)),
          closedPrice: currentPrice,
          closedAt:   new Date(),
        },
      })
      results.push({ id: sig.id, resultado, pnlUsd: parseFloat(pnlUsd.toFixed(2)) })
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
