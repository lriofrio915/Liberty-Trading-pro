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

    const body = await req.json()

    const pyRes = await fetchBrokers('/api/mt5/order', {
      method: 'POST',
      body: JSON.stringify({ ...body, user_id: dbUser.id }),
    })
    const data = await pyRes.json()
    return NextResponse.json(data, { status: pyRes.status })
  } catch (err) {
    console.error('[POST /api/brokers/mt5/order]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
