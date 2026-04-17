import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { fetchTickerFinancials } from '@/lib/yahoo-financials'

const ADMIN_EMAIL = 'lriofrio915@gmail.com'

// ── GET ?q=apple  → search suggestions (symbol + name)
// ── GET ?ticker=AAPL → full financial data
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const q      = req.nextUrl.searchParams.get('q')?.trim()
    const ticker = req.nextUrl.searchParams.get('ticker')?.toUpperCase().trim()

    // ── Search suggestions ──────────────────────────────────────────────────
    if (q) {
      const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&listsCount=0`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(6000),
      })
      if (!res.ok) return NextResponse.json({ suggestions: [] })
      const json = await res.json()
      const quotes: Array<{ symbol: string; longname?: string; shortname?: string; quoteType?: string; exchange?: string }> =
        json?.finance?.result?.[0]?.quotes ?? []

      const suggestions = quotes
        .filter(q => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
        .slice(0, 6)
        .map(q => ({
          symbol:   q.symbol,
          name:     q.longname ?? q.shortname ?? q.symbol,
          exchange: q.exchange ?? '',
          type:     q.quoteType ?? '',
        }))

      return NextResponse.json({ suggestions })
    }

    // ── Full data for exact ticker ──────────────────────────────────────────
    if (ticker) {
      const data = await fetchTickerFinancials(ticker)
      return NextResponse.json({ data })
    }

    return NextResponse.json({ error: 'Usa ?q= para buscar o ?ticker= para datos completos' }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al obtener datos'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
