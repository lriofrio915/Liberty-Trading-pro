import { describe, it, expect } from 'vitest'
import { extractJSON, matchPrice, PRICE_LOOKUP, type AssetAnalysis, type PriceItem } from '@/lib/analisis-engine'

// ── extractJSON ─────────────────────────────────────────────────────────────────

describe('extractJSON', () => {
  it('returns raw JSON string unchanged', () => {
    const json = '{"key":"value","num":42}'
    expect(extractJSON(json)).toBe(json)
  })

  it('extracts content from a ```json fenced block', () => {
    const text = '```json\n{"key":"value"}\n```'
    expect(extractJSON(text)).toBe('{"key":"value"}')
  })

  it('extracts content from a ``` fenced block without language tag', () => {
    const text = '```\n{"key":"value"}\n```'
    expect(extractJSON(text)).toBe('{"key":"value"}')
  })

  it('strips leading/trailing whitespace inside the fence', () => {
    const text = '```json\n  {"key":"value"}  \n```'
    expect(extractJSON(text)).toBe('{"key":"value"}')
  })

  it('extracts JSON embedded in surrounding prose', () => {
    const text = 'Here is the result: {"activos":[]} — end.'
    expect(extractJSON(text)).toBe('{"activos":[]}')
  })

  it('returns the original text when no JSON delimiters are found', () => {
    const text = 'no json here at all'
    expect(extractJSON(text)).toBe(text)
  })

  it('prefers fenced block over bare JSON when both are present', () => {
    const text = 'prefix {"ignored":true}\n```json\n{"chosen":true}\n```'
    const result = extractJSON(text)
    expect(result).toBe('{"chosen":true}')
  })

  it('handles multiline JSON inside a fenced block', () => {
    const text = '```json\n{\n  "a": 1,\n  "b": 2\n}\n```'
    const result = extractJSON(text)
    expect(JSON.parse(result)).toEqual({ a: 1, b: 2 })
  })
})

// ── matchPrice helpers ──────────────────────────────────────────────────────────

function makeAsset(simbolo: string): AssetAnalysis {
  return { simbolo, nombre: simbolo, precio: 0, cambio24h: 0, sesgo: 'NEUTRAL', confianza: 60, razon: '', riesgo: 'medio', sector: 'Test' }
}

const PRICES: PriceItem[] = [
  { symbol: 'BTC',      name: 'Bitcoin',      price: 65000, change: 1000,  changePct: 1.56,  up: true  },
  { symbol: 'ETH',      name: 'Ethereum',     price: 3000,  change: -50,   changePct: -1.64, up: false },
  { symbol: 'AAPL',     name: 'Apple',        price: 190,   change: 2,     changePct: 1.06,  up: true  },
  { symbol: 'NQ=F',     name: 'NQ Futures',   price: 19000, change: 100,   changePct: 0.53,  up: true  },
  { symbol: '%5EVIX',   name: 'VIX',          price: 18,    change: -0.5,  changePct: -2.7,  up: false },
  { symbol: '^GSPC',    name: 'S&P 500',      price: 5200,  change: 30,    changePct: 0.58,  up: true  },
  { symbol: '^RUT',     name: 'Russell 2000', price: 2100,  change: -10,   changePct: -0.47, up: false },
  { symbol: '^DJI',     name: 'Dow Jones',    price: 39000, change: 150,   changePct: 0.39,  up: true  },
  { symbol: 'DX=F',     name: 'DXY',          price: 104.5, change: 0.3,   changePct: 0.29,  up: true  },
  { symbol: 'EURUSD=X', name: 'EUR/USD',      price: 1.085, change: 0.001, changePct: 0.09,  up: true  },
  { symbol: 'GC=F',     name: 'Oro',          price: 2400,  change: 10,    changePct: 0.42,  up: true  },
  { symbol: 'CL=F',     name: 'Petróleo WTI', price: 82,    change: -1,    changePct: -1.2,  up: false },
  { symbol: 'SI=F',     name: 'Plata',        price: 29,    change: 0.5,   changePct: 1.75,  up: true  },
]

// ── matchPrice — direct symbol lookups ─────────────────────────────────────────

describe('matchPrice — crypto', () => {
  it('matches BTC by direct symbol', () => {
    expect(matchPrice(makeAsset('BTC'), PRICES)).toBe(PRICES[0])
  })

  it('matches BITCOIN alias → BTC', () => {
    expect(matchPrice(makeAsset('BITCOIN'), PRICES)).toBe(PRICES[0])
  })

  it('matches ETH by symbol', () => {
    expect(matchPrice(makeAsset('ETH'), PRICES)).toBe(PRICES[1])
  })

  it('is case-insensitive (btc → BTC)', () => {
    expect(matchPrice(makeAsset('btc'), PRICES)).toBe(PRICES[0])
  })
})

describe('matchPrice — indices', () => {
  it('matches NQ → NQ=F', () => {
    expect(matchPrice(makeAsset('NQ'), PRICES)).toBe(PRICES[3])
  })

  it('matches VIX → %5EVIX', () => {
    expect(matchPrice(makeAsset('VIX'), PRICES)).toBe(PRICES[4])
  })

  it('matches SP500 → ^GSPC', () => {
    expect(matchPrice(makeAsset('SP500'), PRICES)).toBe(PRICES[5])
  })

  it('matches "S&P 500" alias → ^GSPC', () => {
    expect(matchPrice(makeAsset('S&P 500'), PRICES)).toBe(PRICES[5])
  })

  it('matches RUSSELL → ^RUT', () => {
    expect(matchPrice(makeAsset('RUSSELL'), PRICES)).toBe(PRICES[6])
  })

  it('matches DOW → ^DJI', () => {
    expect(matchPrice(makeAsset('DOW'), PRICES)).toBe(PRICES[7])
  })
})

describe('matchPrice — forex', () => {
  it('matches DXY → DX=F', () => {
    expect(matchPrice(makeAsset('DXY'), PRICES)).toBe(PRICES[8])
  })

  it('matches "EUR/USD" → EURUSD=X', () => {
    expect(matchPrice(makeAsset('EUR/USD'), PRICES)).toBe(PRICES[9])
  })

  it('matches EURUSD alias → EURUSD=X', () => {
    expect(matchPrice(makeAsset('EURUSD'), PRICES)).toBe(PRICES[9])
  })
})

describe('matchPrice — commodities', () => {
  it('matches ORO → GC=F', () => {
    expect(matchPrice(makeAsset('ORO'), PRICES)).toBe(PRICES[10])
  })

  it('matches GOLD alias → GC=F', () => {
    expect(matchPrice(makeAsset('GOLD'), PRICES)).toBe(PRICES[10])
  })

  it('matches WTI → CL=F', () => {
    expect(matchPrice(makeAsset('WTI'), PRICES)).toBe(PRICES[11])
  })

  it('matches PLATA → SI=F', () => {
    expect(matchPrice(makeAsset('PLATA'), PRICES)).toBe(PRICES[12])
  })

  it('matches SILVER alias → SI=F', () => {
    expect(matchPrice(makeAsset('SILVER'), PRICES)).toBe(PRICES[12])
  })
})

describe('matchPrice — edge cases', () => {
  it('returns undefined for an unknown symbol', () => {
    expect(matchPrice(makeAsset('DOGECOIN'), PRICES)).toBeUndefined()
  })

  it('returns undefined for empty prices array', () => {
    expect(matchPrice(makeAsset('BTC'), [])).toBeUndefined()
  })
})

// ── PRICE_LOOKUP spot checks ────────────────────────────────────────────────────

describe('PRICE_LOOKUP', () => {
  it('maps well-known aliases to their canonical symbols', () => {
    expect(PRICE_LOOKUP['BITCOIN']).toBe('BTC')
    expect(PRICE_LOOKUP['ETHEREUM']).toBe('ETH')
    expect(PRICE_LOOKUP['NVIDIA']).toBe('NVDA')
    expect(PRICE_LOOKUP['ALPHABET']).toBe('GOOGL')
    expect(PRICE_LOOKUP['GOOGLE']).toBe('GOOGL')
    expect(PRICE_LOOKUP['FACEBOOK']).toBe('META')
    expect(PRICE_LOOKUP['TESLA']).toBe('TSLA')
  })

  it('maps index aliases correctly', () => {
    expect(PRICE_LOOKUP['NASDAQ']).toBe('NQ=F')
    expect(PRICE_LOOKUP['SPX']).toBe('^GSPC')
    expect(PRICE_LOOKUP['DJIA']).toBe('^DJI')
    expect(PRICE_LOOKUP['DOW JONES']).toBe('^DJI')
  })

  it('maps commodity aliases correctly', () => {
    expect(PRICE_LOOKUP['ORO']).toBe('GC=F')
    expect(PRICE_LOOKUP['OIL']).toBe('CL=F')
    expect(PRICE_LOOKUP['PLATA']).toBe('SI=F')
  })
})
