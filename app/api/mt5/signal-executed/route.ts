import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

/**
 * POST /api/mt5/signal-executed
 * Called by the MQL5 EA after executing a trade.
 * Auth: X-MT5-Secret header
 * Body: { signalId, ticket, executedPrice, status: "EXECUTED"|"FAILED", errorMsg? }
 */
export async function POST(req: NextRequest) {
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

  const body = await req.json().catch(() => ({}))
  const { signalId, ticket, executedPrice, status, errorMsg } = body as {
    signalId: string
    ticket?: number
    executedPrice?: number
    status: 'EXECUTED' | 'FAILED'
    errorMsg?: string
  }

  if (!signalId || !status) {
    return NextResponse.json({ error: 'signalId and status are required' }, { status: 400 })
  }

  // Verify signal belongs to this account
  const signal = await prisma.signalQueue.findFirst({
    where: { id: signalId, mt5AccountId: mt5Account.id },
  })

  if (!signal) {
    return NextResponse.json({ error: 'Signal not found' }, { status: 404 })
  }

  await prisma.signalQueue.update({
    where: { id: signalId },
    data: {
      status,
      mt5Ticket: ticket ?? null,
      executedPrice: executedPrice ?? null,
      executedAt: status === 'EXECUTED' ? new Date() : null,
      errorMsg: errorMsg ?? null,
    },
  })

  console.log(`[signal-executed] ${signal.symbol} ${signal.type} → ${status} ticket=${ticket ?? '—'}`)

  return NextResponse.json({ ok: true })
}
