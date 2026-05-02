import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { fetchLivePrices } from '@/lib/yahoo-financials'

export const revalidate = 0

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tickers = (new URL(req.url).searchParams.get('tickers') ?? '')
    .split(',').map(t => t.trim().toUpperCase()).filter(Boolean)

  if (!tickers.length) return NextResponse.json({ prices: {} })

  const prices = await fetchLivePrices(tickers)
  return NextResponse.json({ prices }, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
  })
}
