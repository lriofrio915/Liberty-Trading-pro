import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { timesfmForecast, timesfmHealth, TimesFMError } from '@/lib/timesfm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Fetch daily closing prices from Yahoo Finance (up to `days` trading days)
async function fetchClosingPrices(symbol: string, days = 90): Promise<{ closes: number[]; dates: string[] }> {
  const period2 = Math.floor(Date.now() / 1000)
  const period1 = period2 - days * 24 * 3600
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&period1=${period1}&period2=${period2}`

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    cache: 'no-store',
    signal: AbortSignal.timeout(12_000),
  })
  if (!res.ok) throw new Error(`Yahoo Finance error ${res.status} for ${symbol}`)

  const json = await res.json()
  const result = json?.chart?.result?.[0]
  if (!result) throw new Error(`No data for ${symbol}`)

  const timestamps: number[] = result.timestamp ?? []
  const closes: number[] = result.indicators?.quote?.[0]?.close ?? []

  const pairs = timestamps
    .map((ts, i) => ({ date: new Date(ts * 1000).toISOString().split('T')[0], close: closes[i] }))
    .filter(p => p.close != null && !isNaN(p.close))

  return {
    closes: pairs.map(p => p.close),
    dates: pairs.map(p => p.date),
  }
}

function addBusinessDays(dateStr: string, n: number): string[] {
  const dates: string[] = []
  const d = new Date(dateStr)
  let count = 0
  while (count < n) {
    d.setDate(d.getDate() + 1)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) {
      dates.push(d.toISOString().split('T')[0])
      count++
    }
  }
  return dates
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const symbol  = req.nextUrl.searchParams.get('symbol')?.toUpperCase().trim()
  const horizon = parseInt(req.nextUrl.searchParams.get('horizon') ?? '14', 10)

  if (!symbol) return NextResponse.json({ error: 'symbol requerido' }, { status: 400 })
  if (isNaN(horizon) || horizon < 1 || horizon > 30) {
    return NextResponse.json({ error: 'horizon debe ser 1-30' }, { status: 400 })
  }

  try {
    const { closes, dates } = await fetchClosingPrices(symbol, 120)
    if (closes.length < 20) {
      return NextResponse.json({ error: `Datos insuficientes para ${symbol} (${closes.length} días)` }, { status: 422 })
    }

    const result = await timesfmForecast(closes, horizon)

    const lastDate = dates[dates.length - 1]
    const forecastDates = addBusinessDays(lastDate, horizon)

    return NextResponse.json({
      symbol,
      last_price: closes[closes.length - 1],
      prices_history: closes,
      dates_history: dates,
      forecast: result.forecast,
      quantile_p10: result.quantile_p10,
      quantile_p90: result.quantile_p90,
      forecast_dates: forecastDates,
      horizon,
    })
  } catch (err) {
    if (err instanceof TimesFMError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Health check endpoint
  const body = await req.json().catch(() => ({})) as { check?: boolean }
  if (body.check) {
    const online = await timesfmHealth()
    return NextResponse.json({ online })
  }
  return NextResponse.json({ error: 'Usa GET con ?symbol=AAPL&horizon=14' }, { status: 400 })
}
