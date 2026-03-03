import { NextRequest } from 'next/server'

async function fetchIndexReturn(symbol: string, period1: number, period2: number): Promise<string | null> {
  try {
    const encoded = encodeURIComponent(symbol)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?period1=${period1}&period2=${period2}&interval=1d`
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    })
    if (!res.ok) return null
    const data = await res.json()
    const prices: (number | null)[] = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []
    const firstPrice = prices.find(p => p != null)
    const lastPrice = [...prices].reverse().find(p => p != null)
    if (firstPrice == null || lastPrice == null) return null
    return ((lastPrice - firstPrice) / firstPrice * 100).toFixed(2)
  } catch {
    return null
  }
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

  const [sp500Result, nasdaqResult] = await Promise.allSettled([
    fetchIndexReturn('^GSPC', period1, period2),
    fetchIndexReturn('^NDX', period1, period2),
  ])

  return Response.json({
    sp500: sp500Result.status === 'fulfilled' ? sp500Result.value : null,
    nasdaq: nasdaqResult.status === 'fulfilled' ? nasdaqResult.value : null,
  })
}
