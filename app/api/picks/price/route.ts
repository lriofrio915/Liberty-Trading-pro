import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const revalidate = 0

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tickers = (new URL(req.url).searchParams.get('tickers') ?? '')
    .split(',').map(t => t.trim().toUpperCase()).filter(Boolean)

  if (!tickers.length) return NextResponse.json({ prices: {} })

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(tickers.join(','))}&fields=regularMarketPrice`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      }
    )
    if (!res.ok) return NextResponse.json({ prices: {} })

    const data = await res.json()
    const prices: Record<string, number> = {}
    for (const quote of data?.quoteResponse?.result ?? []) {
      if (quote.symbol && typeof quote.regularMarketPrice === 'number') {
        prices[quote.symbol] = quote.regularMarketPrice
      }
    }
    return NextResponse.json({ prices }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    })
  } catch {
    return NextResponse.json({ prices: {} })
  }
}
