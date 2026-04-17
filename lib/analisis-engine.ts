// lib/analisis-engine.ts
// Shared analysis engine — used by /api/analisis and all cron jobs

import { computeFarosMetrics, formatFarosContext, type FarosMetrics, type OHLCVData } from './faros-metrics'

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

export interface FarosAssetItem {
  symbol: string
  zScore: number
  thermodynamicState: string
  reynoldsPercentile: number
  entropy: number
  alphaFlow: number
  psiScore: number
  marketRegime: string
  governanceSignal: string
  killSwitch: boolean
  trendStrength5d: number
}

export interface FarosAgentResult {
  sesgo_faros: 'ALCISTA' | 'BAJISTA' | 'NEUTRAL' | 'KILL_SWITCH'
  regimen_dominante: string
  activos_faros: FarosAssetItem[]
  resumen_faros: string
  kill_switch_activos: string[]
  oportunidades_faros: string
  advertencias_faros: string
}

export interface AnalysisResult {
  timestamp: string
  riskProfile: string
  activos: AssetAnalysis[]
  estrategia: EstrategiaResult | null
  precios: PriceItem[]
  faros?: FarosAgentResult
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

// ── OHLCV fetch for FAROS metrics ─────────────────────────────────────────────

const FAROS_SYMBOLS: { yahoo: string; label: string }[] = [
  { yahoo: 'BTC-USD',   label: 'BTC' },
  { yahoo: 'ETH-USD',   label: 'ETH' },
  { yahoo: 'NVDA',      label: 'NVDA' },
  { yahoo: 'AAPL',      label: 'AAPL' },
  { yahoo: 'MSFT',      label: 'MSFT' },
  { yahoo: 'TSLA',      label: 'TSLA' },
  { yahoo: '^GSPC',     label: 'SP500' },
  { yahoo: 'NQ=F',      label: 'NQ' },
  { yahoo: '%5EVIX',    label: 'VIX' },
  { yahoo: 'DX=F',      label: 'DXY' },
  { yahoo: 'EURUSD=X',  label: 'EURUSD' },
  { yahoo: 'GC=F',      label: 'ORO' },
  { yahoo: 'CL=F',      label: 'WTI' },
  { yahoo: 'SI=F',      label: 'PLATA' },
]

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

export async function fetchAllOHLCV(): Promise<FarosMetrics[]> {
  const results = await Promise.allSettled(
    FAROS_SYMBOLS.map(s => fetchYahooOHLCV(s.yahoo, s.label))
  )
  const metrics: FarosMetrics[] = []
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value && r.value.closes.length >= 10) {
      try {
        metrics.push(computeFarosMetrics(r.value))
      } catch {
        // skip if computation fails
      }
    }
  }
  return metrics
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
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set')

  const model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3-0324'

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://liberty-trading.pro',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.2,
      max_tokens: 1100,
    }),
    signal: AbortSignal.timeout(50000),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter ${res.status}: ${err}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? '{}'
}

// ── Agent definitions ──────────────────────────────────────────────────────────

export function buildAgents(pricesCtx: string, riskProfile: string, today: string, farosMetrics?: FarosMetrics[]) {
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
    ...(farosMetrics && farosMetrics.length > 0
      ? [
          {
            name: 'faros' as const,
            system: `Eres el Agente FAROS v7.0 — TAI-ACF Framework (Future-Oriented Actor-Critic System).
Recibes métricas cuantitativas pre-calculadas con física de fluidos financieros (Navier-Stokes).
Tu misión: interpretar los regímenes de mercado, identificar Kill Switches activos y generar un sesgo de gobernanza Ψ consolidado.

METODOLOGÍA FAROS (resumen operativo):
- Z-Score: estado termodinámico del capital. LÍQUIDO (0.5<Z<2) = zona óptima. GAS/PLASMA = veto.
- Reynolds%: turbulencia. <50% = laminar (alta exposición permitida). 50-75% = transición. >75% = turbulento. >95% = colapso entrópico.
- αflow: autenticidad del flujo. Cerca de 0 = liquidez sintética/manipulación. Cerca de 1 = demanda orgánica.
- Ψ score (0-1): gobernanza de capital. 0 = Kill Switch activo. >0.6 = señal fuerte.
- Regímenes: INSTITUTIONAL_ACCUMULATION=BUY, HIGH_MOMENTUM=BUY_CAUTION, CONSOLIDATION=HOLD, STRUCTURAL_BREAK=CASH/Kill Switch, DISTRIBUTION_BEAR=SELL.

RESPONDE ÚNICAMENTE con JSON válido, sin texto extra ni markdown:
{"sesgo_faros":"ALCISTA","regimen_dominante":"INSTITUTIONAL_ACCUMULATION","activos_faros":[{"symbol":"BTC","zScore":1.2,"thermodynamicState":"LÍQUIDO","reynoldsPercentile":45,"entropy":0.78,"alphaFlow":0.72,"psiScore":0.65,"marketRegime":"INSTITUTIONAL_ACCUMULATION","governanceSignal":"BUY","killSwitch":false,"trendStrength5d":3.5}],"resumen_faros":"Resumen del estado hidrodinámico del mercado.","kill_switch_activos":[],"oportunidades_faros":"Activos con mayor Ψ score y régimen laminar.","advertencias_faros":"Activos con Kill Switch o turbulencia elevada."}

"sesgo_faros" solo: ALCISTA, BAJISTA, NEUTRAL o KILL_SWITCH. Incluye TODOS los activos recibidos en "activos_faros". "kill_switch_activos" es lista de símbolos con killSwitch=true.`,
            user: `${base}\n\nMÉTRICAS FAROS v7.0 PRE-CALCULADAS (30 días OHLCV):\n${formatFarosContext(farosMetrics)}\n\nGenera el análisis FAROS consolidado con todos los activos proporcionados.`,
          },
        ]
      : []),
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

  // Fetch spot prices and OHLCV history in parallel
  const [prices, farosMetrics] = await Promise.all([
    fetchAllPrices(),
    fetchAllOHLCV(),
  ])

  const pricesCtx = prices
    .map(
      p =>
        `${p.name} (${p.symbol}): $${p.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} | 24h: ${p.changePct >= 0 ? '+' : ''}${p.changePct.toFixed(2)}% | ${p.up ? 'SUBIENDO' : 'BAJANDO'}`,
    )
    .join('\n')

  const agents = buildAgents(pricesCtx, riskProfile, today, farosMetrics)

  // Run all agents in parallel (6 standard + 1 FAROS if metrics available)
  const rawResults = await Promise.allSettled(agents.map(a => runAgent(a.system, a.user)))

  const activos: AssetAnalysis[] = []
  let estrategia: EstrategiaResult | null = null
  let faros: FarosAgentResult | undefined

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
      } else if (agents[i].name === 'faros') {
        // Merge pre-computed metrics into agent result to guarantee accuracy
        const agentResult = data as FarosAgentResult
        agentResult.activos_faros = farosMetrics.map(m => ({
          symbol: m.symbol,
          zScore: m.zScore,
          thermodynamicState: m.thermodynamicState,
          reynoldsPercentile: m.reynoldsPercentile,
          entropy: m.entropy,
          alphaFlow: m.alphaFlow,
          psiScore: m.psiScore,
          marketRegime: m.marketRegime,
          governanceSignal: m.governanceSignal,
          killSwitch: m.killSwitch,
          trendStrength5d: m.trendStrength5d,
        }))
        agentResult.kill_switch_activos = farosMetrics
          .filter(m => m.killSwitch)
          .map(m => m.symbol)
        faros = agentResult
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
    faros,
  }
}
