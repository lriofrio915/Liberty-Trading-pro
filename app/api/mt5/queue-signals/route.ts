import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const maxDuration = 30

const CRON_SECRET = process.env.CRON_SECRET || ''

// Symbol mapping: scan symbol → MT5 symbol name
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
  'EUR/USD':'EURUSD',
  'USD/JPY':'USDJPY',
  'USD/CAD':'USDCAD',
  'GBP/USD':'GBPUSD',
  DXY:      'USDX',
  WTI:      'XTIUSD',
  PLATA:    'XAGUSD',
}

/**
 * POST /api/mt5/queue-signals
 * Called by the cron at 09:05am ET after market-scan completes.
 * Auth: Authorization: Bearer CRON_SECRET
 * Creates SignalQueue entries for all users with autoTradeEnabled=true.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '') || ''
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find today's scan
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

    // Only confidence >= 70, non-NEUTRAL
    const validOps = scan.oportunidades.filter(
      o => o.confianza >= 70 && o.sesgo !== 'NEUTRAL'
    )

    if (validOps.length === 0) {
      return NextResponse.json({ ok: true, message: 'No valid opportunities', queued: 0 })
    }

    // Find all MT5 accounts with auto-trade enabled
    const accounts = await prisma.mT5Account.findMany({
      where: { autoTradeEnabled: true, mt5EaSecret: { not: null } },
    })

    if (accounts.length === 0) {
      return NextResponse.json({ ok: true, message: 'No accounts with auto-trade enabled', queued: 0 })
    }

    let totalQueued = 0

    for (const account of accounts) {
      // Avoid duplicates: skip if already queued today for this account
      const alreadyQueued = await prisma.signalQueue.count({
        where: {
          mt5AccountId: account.id,
          createdAt: { gte: today, lt: tomorrow },
        },
      })

      if (alreadyQueued > 0) continue

      const signalsToCreate = validOps.slice(0, 10).map(op => {
        const type = op.sesgo === 'COMPRA' ? 'BUY' : 'SELL'
        const sl = type === 'BUY'
          ? op.precio9am * 0.995
          : op.precio9am * 1.005
        const tp = type === 'BUY'
          ? op.precio9am * 1.010
          : op.precio9am * 0.990

        return {
          mt5AccountId: account.id,
          scanOpId:     op.id,
          symbol:       MT5_SYMBOL_MAP[op.simbolo] ?? op.simbolo,
          symbolRaw:    op.simbolo,
          type,
          volume:       0.01,
          entryPrice:   op.precio9am,
          sl:           parseFloat(sl.toFixed(5)),
          tp:           parseFloat(tp.toFixed(5)),
          comment:      `Auto:scan=${scan.id.slice(-8)},conf=${op.confianza}%`,
          status:       'PENDING',
        }
      })

      await prisma.signalQueue.createMany({ data: signalsToCreate })
      totalQueued += signalsToCreate.length
    }

    console.log(`[queue-signals] Queued ${totalQueued} signals for ${accounts.length} accounts`)
    return NextResponse.json({ ok: true, queued: totalQueued, accounts: accounts.length })
  } catch (err) {
    console.error('[queue-signals]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error en queue-signals' },
      { status: 500 },
    )
  }
}
