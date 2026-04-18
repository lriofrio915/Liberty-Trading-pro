import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const METAAPI_BASE = 'https://mt-client-api-v1.new-york.agiliumtrade.ai'

async function getAuthUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function getDbUser(authId: string) {
  return prisma.user.findUnique({ where: { authId } })
}

// GET /api/mt5 — get connected MT5 account + MetaAPI account info
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await getDbUser(user.id)
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const mt5Account = await prisma.mT5Account.findUnique({
      where: { userId: dbUser.id },
    })

    if (!mt5Account) return NextResponse.json({ connected: false })

    const token = process.env.METAAPI_TOKEN
    if (!token) return NextResponse.json({ connected: true, account: mt5Account, metaInfo: null })

    const res = await fetch(
      `${METAAPI_BASE}/users/current/accounts/${mt5Account.metaApiAccountId}/account-information`,
      { headers: { 'auth-token': token }, signal: AbortSignal.timeout(10000) }
    )

    const metaInfo = res.ok ? await res.json() : null

    return NextResponse.json({ connected: true, account: mt5Account, metaInfo })
  } catch (err) {
    console.error('[GET /api/mt5]', err)
    return NextResponse.json({ error: 'Error al obtener cuenta MT5' }, { status: 500 })
  }
}

// POST /api/mt5 — connect MT5 account via MetaAPI account ID
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await getDbUser(user.id)
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json()
    const { metaApiAccountId, accountName, broker, login, server } = body

    if (!metaApiAccountId || !login) {
      return NextResponse.json({ error: 'metaApiAccountId y login son requeridos' }, { status: 400 })
    }

    // Validate the MetaAPI account ID against the API
    const token = process.env.METAAPI_TOKEN
    let isConnected = false

    if (token) {
      const res = await fetch(
        `${METAAPI_BASE}/users/current/accounts/${metaApiAccountId}`,
        { headers: { 'auth-token': token }, signal: AbortSignal.timeout(10000) }
      )
      isConnected = res.ok
    }

    const account = await prisma.mT5Account.upsert({
      where: { userId: dbUser.id },
      create: {
        userId: dbUser.id,
        metaApiAccountId,
        accountName: accountName || `MT5 #${login}`,
        broker: broker || null,
        login,
        server: server || null,
        isConnected,
        lastSyncAt: new Date(),
      },
      update: {
        metaApiAccountId,
        accountName: accountName || `MT5 #${login}`,
        broker: broker || null,
        login,
        server: server || null,
        isConnected,
        lastSyncAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, account })
  } catch (err) {
    console.error('[POST /api/mt5]', err)
    return NextResponse.json({ error: 'Error al conectar cuenta MT5' }, { status: 500 })
  }
}

// DELETE /api/mt5 — disconnect MT5 account
export async function DELETE() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await getDbUser(user.id)
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    await prisma.mT5Account.deleteMany({ where: { userId: dbUser.id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/mt5]', err)
    return NextResponse.json({ error: 'Error al desconectar cuenta MT5' }, { status: 500 })
  }
}
