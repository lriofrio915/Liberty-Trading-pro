import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface PriceItem {
  symbol: string
  name: string
  price: number
  change: number
  changePct: number
  up: boolean
}

// ── Module-level cache (survives across warm invocations) ──────────────────────
const CACHE_TTL = 15_000 // 15 seconds

let memCache: { prices: PriceItem[]; ts: number } | null = null

// ── Symbol name map ────────────────────────────────────────────────────────────

const YAHOO_NAMES: Record<string, string> = {
  'NQ=F':     'NQ Futures',
  'GC=F':     'Oro',
  'CL=F':     'Petróleo WTI',
  'EURUSD=X': 'EUR/USD',
  '%5EVIX':   'VIX',
  'DX=F':     'DXY',
  'USDCOP=X': 'USD/COP',
  'USDMXN=X': 'USD/MXN',
  'USDBRL=X': 'USD/BRL',
  'BTC-USD':  'Bitcoin',
  'ETH-USD':  'Ethereum',
  'SOL-USD':  'Solana',
}

// ── Fetchers ───────────────────────────────────────────────────────────────────

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

// DXY: spot index first, futures fallback
async function fetchDXY(): Promise<PriceItem | null> {
  const spot = await fetchYahoo('DX-Y.NYB')
  if (spot) return { ...spot, symbol: 'DX=F', name: 'DXY' }
  const fut = await fetchYahoo('DX=F')
  if (fut) return { ...fut, name: 'DXY' }
  return null
}

// Crypto via Yahoo Finance (Binance blocked from Vercel serverless)
async function fetchCrypto(yahooSymbol: string, display: string, name: string): Promise<PriceItem | null> {
  const item = await fetchYahoo(yahooSymbol)
  if (!item) return null
  return { ...item, symbol: display, name }
}

// ── Main handler ───────────────────────────────────────────────────────────────

export async function GET() {
  // Serve from cache if still fresh
  if (memCache && Date.now() - memCache.ts < CACHE_TTL) {
    return NextResponse.json(
      { prices: memCache.prices, timestamp: memCache.ts, cached: true },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
        },
      }
    )
  }

  const [nq, gc, cl, eurusd, vix, dxy, cop, mxn, brl, btc, eth, sol] = await Promise.allSettled([
    fetchYahoo('NQ=F'),
    fetchYahoo('GC=F'),
    fetchYahoo('CL=F'),
    fetchYahoo('EURUSD=X'),
    fetchYahoo('%5EVIX'),
    fetchDXY(),
    fetchYahoo('USDCOP=X'),
    fetchYahoo('USDMXN=X'),
    fetchYahoo('USDBRL=X'),
    fetchCrypto('BTC-USD', 'BTC/USD', 'Bitcoin'),
    fetchCrypto('ETH-USD', 'ETH/USD', 'Ethereum'),
    fetchCrypto('SOL-USD', 'SOL/USD', 'Solana'),
  ])

  const prices: PriceItem[] = []
  for (const result of [nq, gc, cl, eurusd, vix, dxy, cop, mxn, brl, btc, eth, sol]) {
    if (result.status === 'fulfilled' && result.value) {
      prices.push(result.value)
    }
  }

  // Store in module-level cache
  memCache = { prices, ts: Date.now() }

  return NextResponse.json(
    { prices, timestamp: memCache.ts, cached: false },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
      },
    }
  )
}
