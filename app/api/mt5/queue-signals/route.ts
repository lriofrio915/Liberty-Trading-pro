import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchBrokers } from '@/lib/brokers-client'

export const runtime = 'nodejs'
export const maxDuration = 30

const CRON_SECRET = process.env.CRON_SECRET || ''

const MT5_SYMBOL_MAP: Record<string, string> = {
  NQ:       'NQ100',
  SP500:    'SPX500',
  RUSSELL:  'US2000',
  DOW:      'DJ30',
  VIX:      'VIX',
  BTC:      'BTCUSD',
  ETH:      'ETHUSD',
  BNB:      'BNBUSD',
  XRP:      'XRPUSD',
  AAPL:     'AAPL',
  MSFT:     'MSFT',
  AMZN:     'AMZN',
  NVDA:     'NVDA',
  META:     'META',
  GOOGL:    'GOOGL',
  TSLA:     'TSLA',
  ORO:      'XAUUSD',
  'EUR/USD': 'EURUSD',
  'USD/JPY': 'USDJPY',
  'USD/CAD': 'USDCAD',
  'GBP/USD': 'GBPUSD',
  DXY:      'USDX',
  WTI:      'XTIUSD',
  PLATA:    'XAGUSD',
}

/**
 * POST /api/mt5/queue-signals
 * Called by the cron at 09:05am ET after market-scan completes.
 * Creates SignalQueue entries and pushes orders to active MT5 BrokerConnections.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '') || ''
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

    const scan = await prisma.marketScan.findFirst({
      where: { fecha: { gte: today, lt: tomorrow } },
      include: { oportunidades: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!scan) {
      return NextResponse.json({ ok: true, message: 'No scan found for today', queued: 0 })
    }

    const validOps = scan.oportunidades.filter(
      o => o.confianza >= 70 && o.sesgo !== 'NEUTRAL'
    )

    if (validOps.length === 0) {
      return NextResponse.json({ ok: true, message: 'No valid opportunities', queued: 0 })
    }

    // Find all active MT5 broker connections
    const connections = await prisma.brokerConnection.findMany({
      where: { brokerType: 'mt5', isActive: true },
    })

    if (connections.length === 0) {
      return NextResponse.json({ ok: true, message: 'No active MT5 connections', queued: 0 })
    }

    let totalQueued = 0
    let totalPushed = 0

    for (const conn of connections) {
      // Avoid duplicates for today
      const alreadyQueued = await prisma.signalQueue.count({
        where: {
          brokerConnectionId: conn.id,
          createdAt: { gte: today, lt: tomorrow },
        },
      })
      if (alreadyQueued > 0) continue

      const signalsToCreate = validOps.slice(0, 10).map(op => {
        const type = op.sesgo === 'COMPRA' ? 'BUY' : 'SELL'
        const sl = type === 'BUY' ? op.precio9am * 0.995 : op.precio9am * 1.005
        const tp = type === 'BUY' ? op.precio9am * 1.010 : op.precio9am * 0.990
        return {
          brokerConnectionId: conn.id,
          scanOpId:    op.id,
          symbol:      MT5_SYMBOL_MAP[op.simbolo] ?? op.simbolo,
          symbolRaw:   op.simbolo,
          type,
          volume:      0.01,
          entryPrice:  op.precio9am,
          sl:          parseFloat(sl.toFixed(5)),
          tp:          parseFloat(tp.toFixed(5)),
          comment:     `Auto:scan=${scan.id.slice(-8)},conf=${op.confianza}%`,
          status:      'PENDING',
        }
      })

      await prisma.signalQueue.createMany({ data: signalsToCreate })
      totalQueued += signalsToCreate.length

      // Push orders via broker service (fire-and-forget, don't fail the cron)
      for (const sig of signalsToCreate) {
        try {
          await fetchBrokers('/api/mt5/order', {
            method: 'POST',
            body: JSON.stringify({
              user_id: conn.userId,
              symbol: sig.symbol,
              side: sig.type,
              volume: sig.volume,
              order_type: 'market',
              stop_loss: sig.sl,
              take_profit: sig.tp,
              signal_source: 'scan_opportunity',
              signal_data: { scanId: scan.id, comment: sig.comment },
            }),
          })
          await prisma.signalQueue.updateMany({
            where: { brokerConnectionId: conn.id, symbol: sig.symbol, status: 'PENDING' },
            data: { status: 'SENT' },
          })
          totalPushed++
        } catch (e) {
          console.error(`[queue-signals] push failed for ${sig.symbol}:`, e)
        }
      }
    }

    console.log(`[queue-signals] Queued ${totalQueued} signals, pushed ${totalPushed} orders`)
    return NextResponse.json({ ok: true, queued: totalQueued, pushed: totalPushed, connections: connections.length })
  } catch (err) {
    console.error('[queue-signals]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error en queue-signals' },
      { status: 500 },
    )
  }
}
