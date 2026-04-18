import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const METAAPI_BASE = 'https://mt-client-api-v1.new-york.agiliumtrade.ai'

// GET /api/mt5/positions — get open positions from MetaAPI
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const mt5Account = await prisma.mT5Account.findUnique({ where: { userId: dbUser.id } })
    if (!mt5Account) return NextResponse.json({ positions: [], connected: false })

    const token = process.env.METAAPI_TOKEN
    if (!token) return NextResponse.json({ positions: [], connected: true, error: 'MetaAPI no configurado' })

    const res = await fetch(
      `${METAAPI_BASE}/users/current/accounts/${mt5Account.metaApiAccountId}/positions`,
      { headers: { 'auth-token': token }, signal: AbortSignal.timeout(10000) }
    )

    if (!res.ok) {
      return NextResponse.json({ positions: [], connected: true, error: `MetaAPI error ${res.status}` })
    }

    const positions = await res.json()
    return NextResponse.json({ positions, connected: true })
  } catch (err) {
    console.error('[GET /api/mt5/positions]', err)
    return NextResponse.json({ error: 'Error al obtener posiciones' }, { status: 500 })
  }
}
