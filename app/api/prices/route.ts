import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const revalidate = 0

interface PriceItem {
  symbol: string
  name: string
  price: number
  change: number
  changePct: number
  up: boolean
}

const YAHOO_NAMES: Record<string, string> = {
  'NQ=F': 'NQ Futures',
  'GC=F': 'Oro',
  'CL=F': 'Petróleo WTI',
  'EURUSD=X': 'EUR/USD',
  '%5EVIX': 'VIX',
  'DX=F': 'DXY',
}

async function fetchYahoo(symbol: string): Promise<PriceItem | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const meta = data?.chart?.result?.[0]?.meta
    if (!meta) return null

    const price = meta.regularMarketPrice ?? 0
    const prev = meta.chartPreviousClose ?? meta.previousClose ?? price
    const change = price - prev
    const changePct = prev !== 0 ? (change / prev) * 100 : 0
    const decodedSymbol = decodeURIComponent(symbol)
    return {
      symbol: decodedSymbol,
      name: YAHOO_NAMES[symbol] ?? YAHOO_NAMES[decodedSymbol] ?? symbol,
      price,
      change,
      changePct,
      up: change >= 0,
    }
  } catch {
    return null
  }
}

async function fetchBinance(symbol: string, name: string, display: string): Promise<PriceItem | null> {
  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const price = parseFloat(data.lastPrice ?? '0')
    const changePct = parseFloat(data.priceChangePercent ?? '0')
    const change = parseFloat(data.priceChange ?? '0')
    return { symbol: display, name, price, change, changePct, up: change >= 0 }
  } catch {
    return null
  }
}

export async function GET() {
  const [nq, gc, cl, eurusd, vix, dxy, btc, eth, sol] = await Promise.allSettled([
    fetchYahoo('NQ=F'),
    fetchYahoo('GC=F'),
    fetchYahoo('CL=F'),
    fetchYahoo('EURUSD=X'),
    fetchYahoo('%5EVIX'),
    fetchYahoo('DX=F'),
    fetchBinance('BTCUSDT', 'Bitcoin', 'BTC/USD'),
    fetchBinance('ETHUSDT', 'Ethereum', 'ETH/USD'),
    fetchBinance('SOLUSDT', 'Solana', 'SOL/USD'),
  ])

  const prices: PriceItem[] = []
  for (const result of [nq, gc, cl, eurusd, vix, dxy, btc, eth, sol]) {
    if (result.status === 'fulfilled' && result.value) {
      prices.push(result.value)
    }
  }

  return NextResponse.json({ prices, timestamp: Date.now() })
}
