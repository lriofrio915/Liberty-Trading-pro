import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ suggestions: [] })

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&listsCount=0`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return NextResponse.json({ suggestions: [] })

    const json = await res.json()
    const quotes: Array<{
      symbol: string
      longname?: string
      shortname?: string
      quoteType?: string
      exchDisp?: string
      exchange?: string
    }> = json?.quotes ?? []

    const suggestions = quotes
      .filter(q => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
      .slice(0, 6)
      .map(q => ({
        symbol:   q.symbol,
        name:     q.longname ?? q.shortname ?? q.symbol,
        exchange: q.exchDisp ?? q.exchange ?? '',
        type:     q.quoteType ?? '',
      }))

    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
