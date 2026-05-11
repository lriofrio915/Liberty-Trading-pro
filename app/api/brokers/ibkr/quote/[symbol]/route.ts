import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { fetchBrokers } from '@/lib/brokers-client'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const pyRes = await fetchBrokers(`/api/ibkr/quote/${dbUser.id}/${symbol}`)
    const data = await pyRes.json()
    return NextResponse.json(data, { status: pyRes.status })
  } catch (err) {
    console.error('[GET /api/brokers/ibkr/quote/:symbol]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
