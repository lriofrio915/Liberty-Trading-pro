import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { fetchBrokers } from '@/lib/brokers-client'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { tunnel_url, auth_token } = await req.json()
    if (!tunnel_url || !auth_token) {
      return NextResponse.json({ error: 'tunnel_url and auth_token required' }, { status: 400 })
    }
    if (!tunnel_url.startsWith('https://')) {
      return NextResponse.json({ error: 'tunnel_url must start with https://' }, { status: 400 })
    }

    // Python service encrypts the token and persists it
    const pyRes = await fetchBrokers('/api/mt5/configure', {
      method: 'POST',
      body: JSON.stringify({ user_id: dbUser.id, tunnel_url, auth_token }),
    })
    if (!pyRes.ok) {
      const err = await pyRes.json().catch(() => ({}))
      return NextResponse.json({ error: err.detail ?? 'Broker service error' }, { status: 502 })
    }

    const data = await pyRes.json()
    return NextResponse.json({ ok: true, ...data })
  } catch (err) {
    console.error('[POST /api/brokers/mt5/configure]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
