import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { fetchBrokers } from '@/lib/brokers-client'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const limit = new URL(req.url).searchParams.get('limit') ?? '50'
    const pyRes = await fetchBrokers(`/api/trades/history/${dbUser.id}?limit=${limit}`)
    const data = await pyRes.json()
    return NextResponse.json(data, { status: pyRes.status })
  } catch (err) {
    console.error('[GET /api/brokers/trades]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
