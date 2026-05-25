import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const VOLATILITY_UNIVERSE = [
  'NVDA', 'TSLA', 'AMD', 'META', 'AMZN', 'NFLX', 'GOOGL',
  'AAPL', 'MSFT', 'COIN', 'MSTR', 'HOOD', 'PLTR', 'SOFI',
  'CRWD', 'SMCI', 'ARM', 'RIVN', 'LCID', 'SNOW', 'RBLX',
  'PYPL', 'SQ', 'UPST',
]

export interface ScreenCandidate {
  ticker: string
  lastPrice: number
  change24hPct: number
  adrPct: number
  recentCloses: number[]
}

async function fetchOHLC(ticker: string): Promise<ScreenCandidate | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=20d`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const json = await res.json()
    const result = json?.chart?.result?.[0]
    if (!result) return null

    const quote = result.indicators?.quote?.[0]
    const highs: (number | null)[] = quote?.high ?? []
    const lows: (number | null)[] = quote?.low ?? []
    const closes: (number | null)[] = quote?.close ?? []
    const meta = result.meta ?? {}

    const valid: Array<{ high: number; low: number; close: number }> = []
    for (let i = 0; i < closes.length; i++) {
      if (highs[i] != null && lows[i] != null && closes[i] != null) {
        valid.push({ high: highs[i]!, low: lows[i]!, close: closes[i]! })
      }
    }
    if (valid.length < 5) return null

    // ADR% = avg((high - low) / prev_close * 100) over last 10 days
    const last11 = valid.slice(-11)
    let adrSum = 0
    let adrCount = 0
    for (let i = 1; i < last11.length; i++) {
      const prevClose = last11[i - 1].close
      if (prevClose > 0) {
        adrSum += ((last11[i].high - last11[i].low) / prevClose) * 100
        adrCount++
      }
    }
    const adrPct = adrCount > 0 ? adrSum / adrCount : 0

    const lastPrice = (meta.regularMarketPrice as number | undefined) ?? valid[valid.length - 1].close
    const prevClose = (meta.chartPreviousClose as number | undefined) ?? valid[valid.length - 2]?.close ?? lastPrice
    const change24hPct = prevClose > 0 ? ((lastPrice - prevClose) / prevClose) * 100 : 0
    const recentCloses = valid.slice(-5).map(v => v.close)

    return { ticker, lastPrice, change24hPct, adrPct, recentCloses }
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const results: ScreenCandidate[] = []
    for (let i = 0; i < VOLATILITY_UNIVERSE.length; i += 8) {
      const batch = VOLATILITY_UNIVERSE.slice(i, i + 8)
      const settled = await Promise.allSettled(batch.map(fetchOHLC))
      for (const r of settled) {
        if (r.status === 'fulfilled' && r.value) results.push(r.value)
      }
      if (i + 8 < VOLATILITY_UNIVERSE.length) {
        await new Promise(r => setTimeout(r, 300))
      }
    }

    const candidates = results
      .filter(r => r.adrPct >= 2.0)
      .sort((a, b) => b.adrPct - a.adrPct)

    return NextResponse.json({ candidates, total: VOLATILITY_UNIVERSE.length })
  } catch (err) {
    console.error('[intraday/screen]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
