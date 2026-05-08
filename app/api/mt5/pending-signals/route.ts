import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/mt5/pending-signals
 * Called by the MQL5 EA every 60 seconds.
 * Auth: X-MT5-Secret header matching MT5Account.mt5EaSecret
 * Returns: SignalQueue[] with status=PENDING for this account
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-mt5-secret')
  if (!secret) {
    return NextResponse.json({ error: 'Missing X-MT5-Secret header' }, { status: 401 })
  }

  const mt5Account = await prisma.mT5Account.findUnique({
    where: { mt5EaSecret: secret },
  })

  if (!mt5Account) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
  }

  if (!mt5Account.autoTradeEnabled) {
    return NextResponse.json({ signals: [], autoTradeEnabled: false })
  }

  const signals = await prisma.signalQueue.findMany({
    where: {
      mt5AccountId: mt5Account.id,
      status: 'PENDING',
    },
    orderBy: { createdAt: 'asc' },
    take: 20,
  })

  // Mark as SENT so the EA doesn't re-process them on next poll
  if (signals.length > 0) {
    await prisma.signalQueue.updateMany({
      where: { id: { in: signals.map(s => s.id) } },
      data: { status: 'SENT' },
    })
  }

  return NextResponse.json({ signals, autoTradeEnabled: true })
}
