import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchYahoo } from '@/lib/analisis-engine'
import { notifyMonitorSignals } from '@/lib/notify-nexus'

export const runtime = 'nodejs'
export const maxDuration = 60

const CRON_SECRET = process.env.CRON_SECRET || ''

// Same mapping used in scan-prices cron
const YAHOO_MAP: Record<string, string> = {
  BTC:    'BTC-USD',  ETH:    'ETH-USD',  BNB:    'BNB-USD',  XRP:    'XRP-USD',
  AAPL:   'AAPL',     MSFT:   'MSFT',     AMZN:   'AMZN',     NVDA:   'NVDA',
  META:   'META',     GOOGL:  'GOOGL',    TSLA:   'TSLA',
  NQ:     'NQ=F',     SP500:  '^GSPC',    RUSSELL: '^RUT',     DOW:    '^DJI',  VIX: '%5EVIX',
  DXY:    'DX=F',     'EUR/USD': 'EURUSD=X', 'USD/JPY': 'USDJPY=X',
  'USD/CAD': 'USDCAD=X', 'GBP/USD': 'GBPUSD=X',
  ORO:    'GC=F',     WTI:    'CL=F',     PLATA:  'SI=F',
}

// Point value per lot for P&L calculation (USD per point per lot)
const LOT_MULT: Record<string, number> = {
  NQ: 20, SP500: 50, DOW: 5, RUSSELL: 50, VIX: 1000,
  BTC: 1,  ETH: 1,  BNB: 1,  XRP: 1,
  AAPL: 100, MSFT: 100, AMZN: 100, NVDA: 100, META: 100, GOOGL: 100, TSLA: 100,
  ORO: 100, WTI: 1000, PLATA: 5000,
  DXY: 1000,
}

/**
 * GET /api/cron/monitor-signals
 * Checks current prices for all PENDIENTE CfdSignals.
 * If price hits TP or SL, closes the signal with GANADA/PERDIDA.
 * Called every 15 min during market hours via GitHub Actions.
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || ''
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const pending = await prisma.cfdSignal.findMany({
      where: { resultado: 'PENDIENTE' },
    })

    if (pending.length === 0) {
      return NextResponse.json({ ok: true, checked: 0, closed: 0 })
    }

    // Fetch prices in parallel
    const priceResults = await Promise.allSettled(
      pending.map(sig => {
        const ticker = YAHOO_MAP[sig.simbolo] ?? sig.simbolo
        return fetchYahoo(ticker, sig.simbolo)
      })
    )

    let closed = 0

    for (let i = 0; i < pending.length; i++) {
      const sig = pending[i]
      const pr = priceResults[i]
      if (pr.status !== 'fulfilled' || !pr.value) continue

      const currentPrice = pr.value.price
      const isCompra = sig.sesgo === 'COMPRA'

      let resultado: 'GANADA' | 'PERDIDA' | null = null

      if (isCompra) {
        if (currentPrice >= sig.takeProfit) resultado = 'GANADA'
        else if (currentPrice <= sig.stopLoss) resultado = 'PERDIDA'
      } else {
        // VENTA: price goes DOWN is favorable
        if (currentPrice <= sig.takeProfit) resultado = 'GANADA'
        else if (currentPrice >= sig.stopLoss) resultado = 'PERDIDA'
      }

      if (!resultado) continue

      // Calculate P&L
      const mult = LOT_MULT[sig.simbolo] ?? 1
      const priceDiff = resultado === 'GANADA'
        ? Math.abs(sig.takeProfit - sig.precioEntrada)
        : Math.abs(sig.stopLoss - sig.precioEntrada)
      const pnlUsd = resultado === 'GANADA'
        ? priceDiff * sig.lotaje * mult
        : -(priceDiff * sig.lotaje * mult)

      await prisma.cfdSignal.update({
        where: { id: sig.id },
        data: {
          resultado,
          closedPrice: currentPrice,
          closedAt:    new Date(),
          pnlUsd:      parseFloat(pnlUsd.toFixed(2)),
        },
      })

      console.log(`[monitor-signals] ${sig.simbolo} ${sig.sesgo} → ${resultado} @ ${currentPrice} | PnL $${pnlUsd.toFixed(2)}`)
      closed++
    }

    if (closed > 0) void notifyMonitorSignals(pending.length, closed)

    return NextResponse.json({ ok: true, checked: pending.length, closed })
  } catch (err) {
    console.error('[monitor-signals]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error monitoring signals' },
      { status: 500 }
    )
  }
}
