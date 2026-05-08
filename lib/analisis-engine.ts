// lib/analisis-engine.ts
// Shared analysis engine — used by /api/analisis and all cron jobs

// FAROS (TAI-ACF Framework) removed — using 6 MAIA agents only

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PriceItem {
  symbol: string
  name: string
  price: number
  change: number
  changePct: number
  up: boolean
}

export interface AssetAnalysis {
  simbolo: string
  nombre: string
  precio: number
  cambio24h: number
  sesgo: 'COMPRA' | 'VENTA' | 'NEUTRAL'
  confianza: number
  razon: string
  riesgo: 'bajo' | 'medio' | 'alto'
  sector: string
}

export interface DistribucionItem {
  sector: string
  porcentaje: number
  color: string
}

export interface EstrategiaResult {
  sesgo_general: 'ALCISTA' | 'BAJISTA' | 'NEUTRAL'
  resumen: string
  distribucion: DistribucionItem[]
  oportunidad_destacada: string
  alerta_riesgo: string
}

export interface AnalysisResult {
  timestamp: string
  riskProfile: string
  activos: AssetAnalysis[]
  estrategia: EstrategiaResult | null
  precios: PriceItem[]
}

// ── Price fetching ─────────────────────────────────────────────────────────────

export async function fetchYahoo(symbol: string, name: string): Promise<PriceItem | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const meta = data?.chart?.result?.[0]?.meta
    if (!meta) return null
    const price = meta.regularMarketPrice ?? 0
    const prev = meta.chartPreviousClose ?? meta.previousClose ?? price
    const change = price - prev
    const changePct = prev !== 0 ? (change / prev) * 100 : 0
    return { symbol, name, price, change, changePct, up: change >= 0 }
  } catch {
    return null
  }
}

// DXY: tries spot index first (DX-Y.NYB), then futures (DX=F) as fallback
async function fetchDXY(): Promise<PriceItem | null> {
  const spot = await fetchYahoo('DX-Y.NYB', 'DXY')
  if (spot) return { ...spot, symbol: 'DX=F' }
  const fut = await fetchYahoo('DX=F', 'DXY')
  if (fut) return fut
  return null
}

export async function fetchAllPrices(): Promise<PriceItem[]> {
  const results = await Promise.allSettled([
    // Crypto
    fetchYahoo('BTC-USD',  'Bitcoin'),
    fetchYahoo('ETH-USD',  'Ethereum'),
    fetchYahoo('BNB-USD',  'BNB'),
    fetchYahoo('XRP-USD',  'XRP'),
    // 7 Magnificas
    fetchYahoo('AAPL',     'Apple'),
    fetchYahoo('MSFT',     'Microsoft'),
    fetchYahoo('AMZN',     'Amazon'),
    fetchYahoo('NVDA',     'Nvidia'),
    fetchYahoo('META',     'Meta'),
    fetchYahoo('GOOGL',    'Alphabet'),
    fetchYahoo('TSLA',     'Tesla'),
    // Índices
    fetchYahoo('NQ=F',     'NQ Futures'),
    fetchYahoo('^GSPC',    'S&P 500'),
    fetchYahoo('^RUT',     'Russell 2000'),
    fetchYahoo('^DJI',     'Dow Jones'),
    fetchYahoo('%5EVIX',   'VIX'),
    // Divisas
    fetchDXY(),
    fetchYahoo('EURUSD=X', 'EUR/USD'),
    fetchYahoo('USDJPY=X', 'USD/JPY'),
    fetchYahoo('USDCAD=X', 'USD/CAD'),
    fetchYahoo('GBPUSD=X', 'GBP/USD'),
    // Materias primas
    fetchYahoo('GC=F',     'Oro'),
    fetchYahoo('CL=F',     'Petróleo WTI'),
    fetchYahoo('SI=F',     'Plata'),
  ])
  const items = results.flatMap(r => (r.status === 'fulfilled' && r.value ? [r.value] : []))
  return items.map(item => {
    if (item.symbol === 'BTC-USD') return { ...item, symbol: 'BTC' }
    if (item.symbol === 'ETH-USD') return { ...item, symbol: 'ETH' }
    if (item.symbol === 'BNB-USD') return { ...item, symbol: 'BNB' }
    if (item.symbol === 'XRP-USD') return { ...item, symbol: 'XRP' }
    return item
  })
}



// ── OpenRouter agent call ──────────────────────────────────────────────────────

export function extractJSON(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) return fence[1].trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1) return text.slice(start, end + 1)
  return text
}

export async function runAgent(systemPrompt: string, userMessage: string): Promise<string> {
  const { callAI } = await import('@/lib/ai-providers')
  const result = await callAI({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    maxTokens: 1100,
    temperature: 0.2,
    httpReferer: 'https://liberty-trading.pro',
    signal: AbortSignal.timeout(50000),
  })
  return result.content
}

// ── OHLCV fetch utility (used by /api/flujo — NOT part of MAIA analysis) ──────

export interface OHLCVData {
  symbol: string
  timestamps: number[]
  opens: number[]
  highs: number[]
  lows: number[]
  closes: number[]
  volumes: number[]
}

export async function fetchYahooOHLCV(symbol: string, label: string): Promise<OHLCVData | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2mo`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const result = data?.chart?.result?.[0]
    if (!result) return null
    const timestamps: number[] = result.timestamp ?? []
    const quote = result.indicators?.quote?.[0]
    if (!quote || timestamps.length === 0) return null
    const filter = (arr: (number | null)[] | undefined) =>
      (arr ?? []).map(v => (v == null || isNaN(v) ? 0 : v))
    return {
      symbol: label,
      timestamps,
      opens:   filter(quote.open),
      highs:   filter(quote.high),
      lows:    filter(quote.low),
      closes:  filter(quote.close),
      volumes: filter(quote.volume),
    }
  } catch {
    return null
  }
}

// ── Agent definitions ──────────────────────────────────────────────────────────

export function buildAgents(pricesCtx: string, riskProfile: string, today: string) {
  const base = `Fecha: ${today}. Perfil de riesgo del usuario: ${riskProfile}. Datos de mercado en tiempo real:\n${pricesCtx}`

  const riskNote =
    riskProfile === 'conservador'
      ? 'Prioriza estabilidad. Usa NEUTRAL si hay duda. Evita activos de alta volatilidad.'
      : riskProfile === 'agresivo'
      ? 'Busca mayor retorno aunque implique más riesgo. Sé más decisivo en COMPRA o VENTA.'
      : 'Balance entre seguridad y oportunidad. Usa tu mejor juicio.'

  return [
    {
      name: 'crypto' as const,
      system: `Eres un agente analista especializado en criptomonedas. Analiza BTC, ETH, BNB y XRP.
RESPONDE ÚNICAMENTE con JSON válido, sin texto extra ni markdown:
{"activos":[{"simbolo":"BTC","nombre":"Bitcoin","precio":0,"cambio24h":0,"sesgo":"COMPRA","confianza":75,"razon":"momentum alcista sólido","riesgo":"alto","sector":"Crypto"}]}
Reglas: "sesgo" solo: COMPRA, VENTA o NEUTRAL. "confianza" entero 55-92. "riesgo" solo: bajo, medio, alto. "sector" siempre "Crypto". Incluye exactamente BTC, ETH, BNB, XRP.`,
      user: `${base}\n\n${riskNote}\n\nAnaliza BTC, ETH, BNB y XRP con los precios en tiempo real proporcionados.`,
    },
    {
      name: 'acciones' as const,
      system: `Eres un agente analista de acciones tecnológicas. Analiza las 7 Magnificas: Apple (AAPL), Microsoft (MSFT), Amazon (AMZN), Nvidia (NVDA), Meta (META), Alphabet (GOOGL) y Tesla (TSLA).
RESPONDE ÚNICAMENTE con JSON válido, sin texto extra ni markdown:
{"activos":[{"simbolo":"AAPL","nombre":"Apple","precio":0,"cambio24h":0,"sesgo":"COMPRA","confianza":72,"razon":"momentum alcista con soporte en medias móviles","riesgo":"medio","sector":"Acciones"}]}
Reglas: "sesgo" solo: COMPRA, VENTA o NEUTRAL. "confianza" entero 55-92. "riesgo" solo: bajo, medio, alto. "sector" siempre "Acciones". Incluye exactamente los 7 activos: AAPL, MSFT, AMZN, NVDA, META, GOOGL, TSLA.`,
      user: `${base}\n\n${riskNote}\n\nAnaliza las 7 Magnificas (AAPL, MSFT, AMZN, NVDA, META, GOOGL, TSLA) con los precios en tiempo real proporcionados.`,
    },
    {
      name: 'indices' as const,
      system: `Eres un agente analista de índices bursátiles. Analiza Nasdaq (NQ Futures), S&P 500, Russell 2000, Dow Jones y VIX.
RESPONDE ÚNICAMENTE con JSON válido, sin texto extra ni markdown:
{"activos":[{"simbolo":"NQ","nombre":"Nasdaq 100 Futures","precio":0,"cambio24h":0,"sesgo":"COMPRA","confianza":70,"razon":"tendencia alcista confirmada","riesgo":"medio","sector":"Índices"},{"simbolo":"SP500","nombre":"S&P 500","precio":0,"cambio24h":0,"sesgo":"COMPRA","confianza":68,"razon":"mercado broad alcista","riesgo":"medio","sector":"Índices"},{"simbolo":"RUSSELL","nombre":"Russell 2000","precio":0,"cambio24h":0,"sesgo":"NEUTRAL","confianza":58,"razon":"small caps sin dirección clara","riesgo":"medio","sector":"Índices"},{"simbolo":"DOW","nombre":"Dow Jones","precio":0,"cambio24h":0,"sesgo":"COMPRA","confianza":65,"razon":"blue chips con momentum positivo","riesgo":"bajo","sector":"Índices"},{"simbolo":"VIX","nombre":"Índice VIX","precio":0,"cambio24h":0,"sesgo":"NEUTRAL","confianza":62,"razon":"volatilidad en rango normal","riesgo":"bajo","sector":"Índices"}]}
Para VIX: COMPRA = miedo elevado (>25), VENTA = complacencia extrema (<13), NEUTRAL = rango normal.
Russell 2000: indicador de apetito de riesgo. COMPRA = risk-on, VENTA = risk-off.
"sector" siempre "Índices". Incluye exactamente: NQ, SP500, RUSSELL, DOW, VIX.`,
      user: `${base}\n\n${riskNote}\n\nAnaliza Nasdaq (NQ Futures), S&P 500, Russell 2000, Dow Jones y VIX con los datos proporcionados.`,
    },
    {
      name: 'divisas' as const,
      system: `Eres un agente analista de divisas (forex). Analiza DXY, EUR/USD, USD/JPY, USD/CAD y GBP/USD.
RESPONDE ÚNICAMENTE con JSON válido, sin texto extra ni markdown:
{"activos":[{"simbolo":"DXY","nombre":"Índice Dólar (DXY)","precio":0,"cambio24h":0,"sesgo":"COMPRA","confianza":68,"razon":"dólar fortalecido por datos macro","riesgo":"bajo","sector":"Divisas"}]}
DXY COMPRA = dólar fuerte. EUR/USD COMPRA = euro sube vs dólar. GBP/USD COMPRA = libra sube vs dólar. USD/JPY COMPRA = dólar sube vs yen. USD/CAD COMPRA = dólar sube vs CAD.
"sector" siempre "Divisas". Incluye exactamente los 5 activos: DXY, EUR/USD, USD/JPY, USD/CAD, GBP/USD.`,
      user: `${base}\n\n${riskNote}\n\nAnaliza DXY, EUR/USD, USD/JPY, USD/CAD y GBP/USD con los datos proporcionados.`,
    },
    {
      name: 'materiales' as const,
      system: `Eres un agente analista de commodities. Analiza Oro, Petróleo WTI y Plata.
RESPONDE ÚNICAMENTE con JSON válido, sin texto extra ni markdown.
Los campos "simbolo" DEBEN ser exactamente "ORO" para el oro, "WTI" para el petróleo y "PLATA" para la plata:
{"activos":[{"simbolo":"ORO","nombre":"Oro","precio":0,"cambio24h":0,"sesgo":"COMPRA","confianza":72,"razon":"activo refugio con demanda sostenida","riesgo":"bajo","sector":"Materiales"},{"simbolo":"WTI","nombre":"Petróleo WTI","precio":0,"cambio24h":0,"sesgo":"NEUTRAL","confianza":60,"razon":"oferta y demanda equilibradas","riesgo":"medio","sector":"Materiales"},{"simbolo":"PLATA","nombre":"Plata","precio":0,"cambio24h":0,"sesgo":"COMPRA","confianza":65,"razon":"demanda industrial y refugio secundario","riesgo":"medio","sector":"Materiales"}]}
Oro es refugio seguro. Plata tiene componente industrial + refugio. Petróleo refleja demanda global y geopolítica. NUNCA uses GC=F, CL=F ni SI=F como simbolo.`,
      user: `${base}\n\n${riskNote}\n\nAnaliza Oro, Petróleo WTI y Plata con los datos proporcionados.`,
    },
    {
      name: 'estrategia' as const,
      system: `Eres el agente de estrategia global. Combina el análisis de todos los sectores y recomienda una distribución de portafolio.
RESPONDE ÚNICAMENTE con JSON válido, sin texto extra ni markdown:
{"sesgo_general":"ALCISTA","resumen":"Los mercados muestran fortaleza con el dólar consolidando y el oro como refugio.","distribucion":[{"sector":"Crypto","porcentaje":15,"color":"#F7931A"},{"sector":"Acciones","porcentaje":30,"color":"#00D4AA"},{"sector":"Índices","porcentaje":20,"color":"#8B5CF6"},{"sector":"Divisas","porcentaje":20,"color":"#2196F3"},{"sector":"Materiales","porcentaje":15,"color":"#C9A84C"}],"oportunidad_destacada":"Descripción de la mejor oportunidad del día.","alerta_riesgo":"Principal riesgo a vigilar hoy."}
"sesgo_general" solo: ALCISTA, BAJISTA o NEUTRAL. Sectores disponibles: Crypto, Acciones, Índices, Divisas, Materiales. Los porcentajes DEBEN sumar 100.`,
      user: `${base}\n\n${riskNote === 'Prioriza estabilidad. Usa NEUTRAL si hay duda. Evita activos de alta volatilidad.'
        ? 'Perfil CONSERVADOR: Materiales (25%), Divisas (30%), Índices (20%), Acciones (15%), Crypto (10%).'
        : riskNote.includes('mayor retorno')
        ? 'Perfil AGRESIVO: Crypto (25%), Acciones (35%), Índices (20%), Divisas (10%), Materiales (10%).'
        : 'Perfil MODERADO: Acciones (25%), Índices (20%), Divisas (20%), Crypto (15%), Materiales (20%).'
      }\n\nCrea la estrategia de portafolio global con los datos de mercado proporcionados.`,
    },
  ]
}

// ── Symbol matching for price injection ───────────────────────────────────────

// Maps every possible symbol the AI might return → the exact symbol in our prices array
export const PRICE_LOOKUP: Record<string, string> = {
  // Crypto
  BTC: 'BTC', BITCOIN: 'BTC',
  ETH: 'ETH', ETHEREUM: 'ETH', ETHER: 'ETH',
  BNB: 'BNB', 'BINANCE COIN': 'BNB',
  XRP: 'XRP', RIPPLE: 'XRP',
  // 7 Magnificas
  AAPL: 'AAPL', APPLE: 'AAPL',
  MSFT: 'MSFT', MICROSOFT: 'MSFT',
  AMZN: 'AMZN', AMAZON: 'AMZN',
  NVDA: 'NVDA', NVIDIA: 'NVDA',
  META: 'META', FACEBOOK: 'META',
  GOOGL: 'GOOGL', ALPHABET: 'GOOGL', GOOGLE: 'GOOGL',
  TSLA: 'TSLA', TESLA: 'TSLA',
  // Índices
  NQ: 'NQ=F', 'NQ=F': 'NQ=F', 'NQ FUTURES': 'NQ=F', NASDAQ: 'NQ=F', 'NASDAQ 100': 'NQ=F',
  VIX: '%5EVIX', '%5EVIX': '%5EVIX', 'ÍNDICE VIX': '%5EVIX',
  SP500: '^GSPC', '^GSPC': '^GSPC', 'S&P 500': '^GSPC', 'S&P500': '^GSPC', SPX: '^GSPC',
  RUSSELL: '^RUT', 'RUSSELL 2000': '^RUT', '^RUT': '^RUT', RUT: '^RUT', RUSSELL2000: '^RUT',
  DOW: '^DJI', '^DJI': '^DJI', 'DOW JONES': '^DJI', DJIA: '^DJI', 'DOW JONES INDUSTRIAL': '^DJI',
  // Divisas
  DXY: 'DX=F', 'DX=F': 'DX=F', 'DOLLAR INDEX': 'DX=F', 'ÍNDICE DÓLAR': 'DX=F', 'DOLAR INDEX': 'DX=F',
  'EUR/USD': 'EURUSD=X', EURUSD: 'EURUSD=X', 'EURUSD=X': 'EURUSD=X',
  'USD/JPY': 'USDJPY=X', USDJPY: 'USDJPY=X', 'USDJPY=X': 'USDJPY=X',
  'USD/CAD': 'USDCAD=X', USDCAD: 'USDCAD=X', 'USDCAD=X': 'USDCAD=X',
  'GBP/USD': 'GBPUSD=X', GBPUSD: 'GBPUSD=X', 'GBPUSD=X': 'GBPUSD=X',
  // Materiales
  'GC=F': 'GC=F', ORO: 'GC=F', GOLD: 'GC=F', 'GOLD FUTURES': 'GC=F',
  'CL=F': 'CL=F', WTI: 'CL=F', 'PETRÓLEO': 'CL=F', PETROLEO: 'CL=F', OIL: 'CL=F', 'PETRÓLEO WTI': 'CL=F', 'PETROLEO WTI': 'CL=F',
  'SI=F': 'SI=F', PLATA: 'SI=F', SILVER: 'SI=F', 'SILVER FUTURES': 'SI=F',
}

export function matchPrice(asset: AssetAnalysis, prices: PriceItem[]): PriceItem | undefined {
  const sym = asset.simbolo.toUpperCase().trim()

  // 1. Direct lookup via explicit map
  const mapped = PRICE_LOOKUP[sym]
  if (mapped) return prices.find(p => p.symbol === mapped)

  // 2. Fallback: try exact symbol or name contains
  return prices.find(p => {
    const ps = p.symbol.toUpperCase().replace(/=F|=X|%5E|\^/g, '')
    return ps === sym || p.symbol.toUpperCase() === sym || p.name.toUpperCase().includes(sym)
  })
}

// ── Main analysis runner (shared entry point) ─────────────────────────────────

export async function runFullAnalysis(riskProfile: string = 'moderado'): Promise<AnalysisResult> {
  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const prices = await fetchAllPrices()

  const pricesCtx = prices
    .map(
      p =>
        `${p.name} (${p.symbol}): $${p.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} | 24h: ${p.changePct >= 0 ? '+' : ''}${p.changePct.toFixed(2)}% | ${p.up ? 'SUBIENDO' : 'BAJANDO'}`,
    )
    .join('\n')

  const agents = buildAgents(pricesCtx, riskProfile, today)

  // Run all 6 MAIA agents in parallel
  const rawResults = await Promise.allSettled(agents.map(a => runAgent(a.system, a.user)))

  const activos: AssetAnalysis[] = []
  let estrategia: EstrategiaResult | null = null

  rawResults.forEach((result, i) => {
    if (result.status !== 'fulfilled') {
      console.error(`[analisis] Agent ${agents[i].name} failed:`, result.reason)
      return
    }
    try {
      const json = extractJSON(result.value)
      const data = JSON.parse(json)
      if (agents[i].name === 'estrategia') {
        estrategia = data as EstrategiaResult
      } else if (Array.isArray(data.activos)) {
        for (const asset of data.activos as AssetAnalysis[]) {
          const real = matchPrice(asset, prices)
          if (real) {
            asset.precio = real.price
            asset.cambio24h = real.changePct
          }
          activos.push(asset)
        }
      }
    } catch (err) {
      console.error(`[analisis] Agent ${agents[i].name} JSON parse failed:`, err)
    }
  })

  return {
    timestamp: new Date().toISOString(),
    riskProfile,
    activos,
    estrategia,
    precios: prices,
  }
}
