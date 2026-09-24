import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export interface TickerSuggestion {
  symbol: string
  name: string
  type: string
  exchange: string
  sector: string
}

const TYPE_TO_SECTOR: Record<string, string> = {
  Equity:         'Acciones',
  ETF:            'ETF',
  Currency:       'Divisas',
  Cryptocurrency: 'Crypto',
  Index:          'Índices',
  Future:         'Materiales',
  'Mutual Fund':  'Fondos',
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ suggestions: [] })

  try {
    const url =
      `https://query2.finance.yahoo.com/v1/finance/search` +
      `?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&enableFuzzyQuery=true&lang=en-US`

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LibertyTrading/1.0)' },
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) return NextResponse.json({ suggestions: [] })

    const data = await res.json() as {
      quotes?: Array<{
        symbol?: string
        shortname?: string
        longname?: string
        typeDisp?: string
        exchDisp?: string
      }>
    }

    const suggestions: TickerSuggestion[] = (data.quotes ?? [])
      .filter(q => q.symbol && (q.shortname ?? q.longname))
      .slice(0, 8)
      .map(q => ({
        symbol:   q.symbol!,
        name:     q.shortname ?? q.longname ?? q.symbol!,
        type:     q.typeDisp ?? '',
        exchange: q.exchDisp ?? '',
        sector:   TYPE_TO_SECTOR[q.typeDisp ?? ''] ?? 'Personalizado',
      }))

    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
