import { NextRequest } from 'next/server'

interface SeriesPoint {
  date: string
  sp500: number
  nasdaq: number
}

async function fetchIndexSeries(
  symbol: string,
  period1: number,
  period2: number,
): Promise<{ dates: number[]; closes: (number | null)[] } | null> {
  try {
    const encoded = encodeURIComponent(symbol)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?period1=${period1}&period2=${period2}&interval=1d`
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
      },
    })
    if (!res.ok) return null
    const data = await res.json()
    const result = data?.chart?.result?.[0]
    const timestamps: number[] = result?.timestamp ?? []
    const closes: (number | null)[] = result?.indicators?.quote?.[0]?.close ?? []
    if (timestamps.length === 0) return null
    return { dates: timestamps, closes }
  } catch {
    return null
  }
}

// Normalize an array of prices so the first non-null value = 100
function normalize(closes: (number | null)[]): (number | null)[] {
  const base = closes.find((p) => p != null)
  if (base == null) return closes
  return closes.map((p) => (p != null ? parseFloat(((p / base) * 100).toFixed(3)) : null))
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')

  const period1 = desde
    ? Math.floor(new Date(desde).getTime() / 1000)
    : Math.floor(Date.now() / 1000) - 86400 * 365
  const period2 = hasta
    ? Math.floor(new Date(hasta).getTime() / 1000)
    : Math.floor(Date.now() / 1000)

  const [sp500Raw, nasdaqRaw] = await Promise.all([
    fetchIndexSeries('^GSPC', period1, period2),
    fetchIndexSeries('^NDX', period1, period2),
  ])

  // Build date-keyed maps for each index
  const sp500Map = new Map<string, number | null>()
  if (sp500Raw) {
    const norm = normalize(sp500Raw.closes)
    sp500Raw.dates.forEach((ts, i) => {
      const d = new Date(ts * 1000).toISOString().slice(0, 10)
      sp500Map.set(d, norm[i] ?? null)
    })
  }

  const nasdaqMap = new Map<string, number | null>()
  if (nasdaqRaw) {
    const norm = normalize(nasdaqRaw.closes)
    nasdaqRaw.dates.forEach((ts, i) => {
      const d = new Date(ts * 1000).toISOString().slice(0, 10)
      nasdaqMap.set(d, norm[i] ?? null)
    })
  }

  // Union of all dates, sorted
  const dateSet = new Set<string>()
  sp500Map.forEach((_, k) => dateSet.add(k))
  nasdaqMap.forEach((_, k) => dateSet.add(k))
  const allDates = Array.from(dateSet).sort()

  const series: SeriesPoint[] = allDates
    .map((date) => ({
      date,
      sp500: sp500Map.get(date) ?? null,
      nasdaq: nasdaqMap.get(date) ?? null,
    }))
    .filter((p) => p.sp500 != null || p.nasdaq != null) as SeriesPoint[]

  // Overall return % (kept for backward compatibility)
  function overallPct(map: Map<string, number | null>): string | null {
    const vals = allDates.map((d) => map.get(d)).filter((v) => v != null) as number[]
    if (vals.length < 2) return null
    return (vals[vals.length - 1] - 100).toFixed(2)
  }

  return Response.json({
    sp500: overallPct(sp500Map),
    nasdaq: overallPct(nasdaqMap),
    series,
  })
}
