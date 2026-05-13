import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = user.email === ADMIN_EMAIL
  const recs = await prisma.optionRecommendation.findMany({
    orderBy: { publishedAt: 'desc' },
    ...(isAdmin ? {} : { where: { active: true } }),
  })
  return NextResponse.json({ recommendations: recs, isAdmin })
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const {
    ticker, company = '', direction, strategy, action,
    contractSymbol, contractType, strike, expiration, dte,
    score, label, underlyingPrice,
    bid, ask, mid, impliedVolatility, delta,
    breakeven, maxLossHint, maxProfitHint,
  } = body

  if (!ticker || !direction || !contractSymbol) {
    return NextResponse.json({ error: 'ticker, direction y contractSymbol son requeridos' }, { status: 400 })
  }

  const existing = await prisma.optionRecommendation.findFirst({
    where: { ticker, strategy, status: 'ACTIVA' },
  })
  if (existing) {
    return NextResponse.json({ recommendation: existing, skipped: true }, { status: 200 })
  }

  const rec = await prisma.optionRecommendation.create({
    data: {
      ticker, company, direction, strategy, action,
      contractSymbol, contractType, strike, expiration, dte,
      score, label, underlyingPrice,
      bid, ask, mid, impliedVolatility, delta,
      breakeven, maxLossHint, maxProfitHint,
    },
  })
  return NextResponse.json({ recommendation: rec }, { status: 201 })
}
