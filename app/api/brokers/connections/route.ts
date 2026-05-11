import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const connections = await prisma.brokerConnection.findMany({
      where: { userId: dbUser.id },
      select: {
        id: true,
        brokerType: true,
        mt5TunnelUrl: true,
        mt5AccountNumber: true,
        ibkrHost: true,
        ibkrPort: true,
        ibkrClientId: true,
        ibkrAccountId: true,
        isActive: true,
        lastConnectedAt: true,
        lastStatus: true,
        maxOrderValueUsd: true,
        createdAt: true,
      },
    })

    return NextResponse.json(connections)
  } catch (err) {
    console.error('[GET /api/brokers/connections]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
