import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

interface PriceItem {
  symbol: string
  name: string
  price: number
  change: number
  changePct: number
  up: boolean
}

// ── Configuration ───────────────────────────────────────────────────────────────
const CACHE_TTL = 60_000 // 60 seconds
const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 30

// ── Request coalescing (prevent thundering herd) ───────────────────────────────
let pendingFetch: Promise<PriceItem[]> | null = null
let memCache: { prices: PriceItem[]; ts: number } | null = null

// ── Symbol name map ────────────────────────────────────────────────────────────

const YAHOO_NAMES: Record<string, string> = {
  'NQ=F':     'NQ Futures',
  '%5EGSPC':  'S&P 500',
  '%5ERUT':   'Russell 2000',
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

export async function GET(request: Request) {
  // Rate limiting by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    ?? request.headers.get('x-real-ip') 
    ?? 'unknown'
  
  if (!(await checkRateLimit(`prices:${ip}`, { max: RATE_LIMIT_MAX, windowMs: RATE_LIMIT_WINDOW }))) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: RATE_LIMIT_WINDOW / 1000 },
      { status: 429, headers: { 'Retry-After': String(RATE_LIMIT_WINDOW / 1000) } }
    )
  }

  // Serve from cache if still fresh
  if (memCache && Date.now() - memCache.ts < CACHE_TTL) {
    return NextResponse.json(
      { prices: memCache.prices, timestamp: memCache.ts, cached: true },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-Cache': 'HIT',
        },
      }
    )
  }

  // Request coalescing - if there's already a pending fetch, wait for it
  if (pendingFetch) {
    const prices = await pendingFetch
    return NextResponse.json(
      { prices, timestamp: memCache?.ts ?? Date.now(), cached: false },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-Cache': 'HIT-STALE',
        },
      }
    )
  }

  // Create and store the pending fetch promise for coalescing
  pendingFetch = (async () => {
    const [nq, sp500, rut, gc, cl, eurusd, vix, dxy, cop, mxn, brl, btc, eth, sol] = await Promise.allSettled([
      fetchYahoo('NQ=F'),
      fetchYahoo('%5EGSPC'),
      fetchYahoo('%5ERUT'),
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
    for (const result of [nq, sp500, rut, gc, cl, eurusd, vix, dxy, cop, mxn, brl, btc, eth, sol]) {
      if (result.status === 'fulfilled' && result.value) {
        prices.push(result.value)
      }
    }

    // Store in module-level cache
    memCache = { prices, ts: Date.now() }
    
    // Clear pending fetch
    pendingFetch = null
    
    return prices
  })()

  const prices = await pendingFetch

  return NextResponse.json(
    { prices, timestamp: memCache?.ts ?? Date.now(), cached: false },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Cache': 'MISS',
      },
    }
  )
}
