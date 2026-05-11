import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { host, port, client_id, account_id } = await req.json()
    if (!host || !port) {
      return NextResponse.json({ error: 'host and port required' }, { status: 400 })
    }

    const connection = await prisma.brokerConnection.upsert({
      where: { userId_brokerType: { userId: dbUser.id, brokerType: 'ibkr' } },
      create: {
        userId: dbUser.id,
        brokerType: 'ibkr',
        ibkrHost: host,
        ibkrPort: Number(port),
        ibkrClientId: Number(client_id ?? 1),
        ibkrAccountId: account_id ?? null,
        isActive: false,
        lastStatus: 'configured',
      },
      update: {
        ibkrHost: host,
        ibkrPort: Number(port),
        ibkrClientId: Number(client_id ?? 1),
        ibkrAccountId: account_id ?? null,
        lastStatus: 'configured',
      },
      select: {
        id: true,
        brokerType: true,
        ibkrHost: true,
        ibkrPort: true,
        ibkrClientId: true,
        ibkrAccountId: true,
        isActive: true,
        lastStatus: true,
      },
    })

    return NextResponse.json({ ok: true, connection })
  } catch (err) {
    console.error('[POST /api/brokers/ibkr/configure]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
