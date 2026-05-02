import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { fetchBatchFinancials } from '@/lib/yahoo-financials'
import { getLynchScreenerTickers } from '@/lib/screener/sp500-nasdaq-tickers'
import { applyPeterLynchFilter, type LynchResult } from '@/lib/screener/peter-lynch-filter'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const CRON_SECRET = process.env.CRON_SECRET || ''

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const refresh = searchParams.get('refresh') === 'true'
  const secret = searchParams.get('secret') || ''

  if (refresh && secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
  }

  if (!refresh) {
    const cached = await prisma.screenerCache.findFirst({
      where: { type: 'lynch' },
      orderBy: { updatedAt: 'desc' },
    })
    if (cached && Date.now() - cached.updatedAt.getTime() < CACHE_TTL_MS) {
      return NextResponse.json({ results: cached.data as unknown[], cachedAt: cached.updatedAt, cached: true })
    }
  }

  const tickers = getLynchScreenerTickers()

  const financials = await fetchBatchFinancials(tickers, 8, 2000)

  const results: LynchResult[] = []
  for (const f of financials) {
    const r = applyPeterLynchFilter(f)
    if (r) results.push(r)
  }

  results.sort((a, b) => b.score - a.score)

  const existing = await prisma.screenerCache.findFirst({ where: { type: 'lynch' }, orderBy: { updatedAt: 'desc' } })
  if (existing) {
    await prisma.screenerCache.update({ where: { id: existing.id }, data: { data: results as unknown as never } })
  } else {
    await prisma.screenerCache.create({ data: { type: 'lynch', data: results as unknown as never } })
  }

  return NextResponse.json({ results, cachedAt: new Date(), cached: false, total: results.length })
}