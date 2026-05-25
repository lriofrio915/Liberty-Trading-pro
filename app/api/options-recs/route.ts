import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const strategiesParam = searchParams.get('strategies')
  const strategyFilter = strategiesParam
    ? { strategy: { in: strategiesParam.split(',').map(s => s.trim()) } }
    : {}

  // Auto-dedup: conservar solo la más reciente por ticker+strategy
  const activas = await prisma.optionRecommendation.findMany({
    where: { status: 'ACTIVA', active: true, ...strategyFilter },
    orderBy: { publishedAt: 'desc' },
  })
  const seen = new Map<string, boolean>()
  const toDeactivate: string[] = []
  for (const rec of activas) {
    const key = `${rec.ticker}|${rec.strategy}`
    if (seen.has(key)) toDeactivate.push(rec.id)
    else seen.set(key, true)
  }
  if (toDeactivate.length > 0) {
    await prisma.optionRecommendation.updateMany({
      where: { id: { in: toDeactivate } },
      data: { active: false },
    })
  }

  const isAdmin = user.email === ADMIN_EMAIL
  const recs = await prisma.optionRecommendation.findMany({
    orderBy: { publishedAt: 'desc' },
    where: {
      ...strategyFilter,
      ...(isAdmin ? {} : { active: true }),
    },
  })
  return NextResponse.json({ recommendations: recs })
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
    where: { ticker, strategy, status: 'ACTIVA', active: true },
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
