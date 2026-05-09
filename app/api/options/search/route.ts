import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface YahooQuote {
  symbol: string
  shortname?: string
  longname?: string
  quoteType?: string
  exchDisp?: string
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 1) return NextResponse.json([])

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(4000),
    })

    if (!res.ok) return NextResponse.json([])

    const json = await res.json()
    const quotes: YahooQuote[] = json?.quotes ?? []

    const suggestions = quotes
      .filter(q => q.quoteType === 'EQUITY' && q.symbol && !q.symbol.includes('.'))
      .slice(0, 7)
      .map(q => ({
        ticker: q.symbol,
        name: q.shortname ?? q.longname ?? q.symbol,
        exchange: q.exchDisp ?? '',
      }))

    return NextResponse.json(suggestions, {
      headers: { 'Cache-Control': 'public, max-age=300' },
    })
  } catch {
    return NextResponse.json([])
  }
}
