import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

// ── Types ─────────────────────────────────────────────────────────────────────

interface PriceItem {
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

// ── Price fetching ─────────────────────────────────────────────────────────────

async function fetchYahoo(symbol: string, name: string): Promise<PriceItem | null> {
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

async function fetchBinance(symbol: string, name: string, display: string): Promise<PriceItem | null> {
  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, {
      signal: AbortSignal.timeout(6000),
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

async function fetchAllPrices(): Promise<PriceItem[]> {
  const results = await Promise.allSettled([
    fetchYahoo('NQ=F', 'NQ Futures'),
    fetchYahoo('GC=F', 'Oro'),
    fetchYahoo('CL=F', 'Petróleo WTI'),
    fetchYahoo('EURUSD=X', 'EUR/USD'),
    fetchYahoo('%5EVIX', 'VIX'),
    fetchYahoo('DX=F', 'DXY'),
    fetchYahoo('USDMXN=X', 'USD/MXN'),
    fetchYahoo('USDCOP=X', 'USD/COP'),
    fetchBinance('BTCUSDT', 'Bitcoin', 'BTC'),
    fetchBinance('ETHUSDT', 'Ethereum', 'ETH'),
    fetchBinance('SOLUSDT', 'Solana', 'SOL'),
  ])
  return results.flatMap(r => (r.status === 'fulfilled' && r.value ? [r.value] : []))
}

// ── OpenRouter agent call ──────────────────────────────────────────────────────

function extractJSON(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) return fence[1].trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1) return text.slice(start, end + 1)
  return text
}

async function runAgent(systemPrompt: string, userMessage: string): Promise<string> {
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
      max_tokens: 900,
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

function buildAgents(pricesCtx: string, riskProfile: string, today: string) {
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
      system: `Eres un agente analista especializado en criptomonedas. Analiza BTC, ETH y SOL.
RESPONDE ÚNICAMENTE con JSON válido, sin texto extra ni markdown:
{"activos":[{"simbolo":"BTC","nombre":"Bitcoin","precio":0,"cambio24h":0,"sesgo":"COMPRA","confianza":75,"razon":"momentum alcista sólido","riesgo":"alto","sector":"Crypto"}]}
Reglas: "sesgo" solo: COMPRA, VENTA o NEUTRAL. "confianza" entero 55-92. "riesgo" solo: bajo, medio, alto. Incluye exactamente BTC, ETH, SOL.`,
      user: `${base}\n\n${riskNote}\n\nAnaliza BTC, ETH y SOL con los precios en tiempo real proporcionados.`,
    },
    {
      name: 'acciones' as const,
      system: `Eres un agente analista de índices bursátiles. Analiza NQ Futures y VIX.
RESPONDE ÚNICAMENTE con JSON válido, sin texto extra ni markdown:
{"activos":[{"simbolo":"NQ","nombre":"Nasdaq 100 Futures","precio":0,"cambio24h":0,"sesgo":"COMPRA","confianza":70,"razon":"tendencia alcista confirmada","riesgo":"medio","sector":"Acciones"},{"simbolo":"VIX","nombre":"Índice VIX","precio":0,"cambio24h":0,"sesgo":"NEUTRAL","confianza":62,"razon":"volatilidad en rango normal","riesgo":"bajo","sector":"Acciones"}]}
Para VIX: COMPRA = miedo elevado (>25), VENTA = complacencia extrema (<13), NEUTRAL = rango normal.`,
      user: `${base}\n\n${riskNote}\n\nAnaliza NQ Futures y VIX con los datos proporcionados.`,
    },
    {
      name: 'divisas' as const,
      system: `Eres un agente analista de divisas (forex). Analiza DXY, EUR/USD, USD/MXN y USD/COP.
RESPONDE ÚNICAMENTE con JSON válido, sin texto extra ni markdown:
{"activos":[{"simbolo":"DXY","nombre":"Índice Dólar (DXY)","precio":0,"cambio24h":0,"sesgo":"COMPRA","confianza":68,"razon":"dólar fortalecido por datos macro","riesgo":"bajo","sector":"Divisas"}]}
Incluye los 4 activos: DXY, EUR/USD, USD/MXN, USD/COP. DXY COMPRA = dólar fuerte.`,
      user: `${base}\n\n${riskNote}\n\nAnaliza DXY, EUR/USD, USD/MXN y USD/COP con los datos proporcionados.`,
    },
    {
      name: 'materiales' as const,
      system: `Eres un agente analista de commodities. Analiza Oro (GC=F) y Petróleo WTI (CL=F).
RESPONDE ÚNICAMENTE con JSON válido, sin texto extra ni markdown:
{"activos":[{"simbolo":"GC=F","nombre":"Oro","precio":0,"cambio24h":0,"sesgo":"COMPRA","confianza":72,"razon":"activo refugio con demanda sostenida","riesgo":"bajo","sector":"Materiales"},{"simbolo":"CL=F","nombre":"Petróleo WTI","precio":0,"cambio24h":0,"sesgo":"NEUTRAL","confianza":60,"razon":"oferta y demanda equilibradas","riesgo":"medio","sector":"Materiales"}]}
Oro es refugio seguro. Petróleo refleja demanda global y geopolítica.`,
      user: `${base}\n\n${riskNote}\n\nAnaliza Oro y Petróleo WTI con los datos proporcionados.`,
    },
    {
      name: 'estrategia' as const,
      system: `Eres el agente de estrategia global. Combina el análisis de todos los sectores y recomienda una distribución de portafolio.
RESPONDE ÚNICAMENTE con JSON válido, sin texto extra ni markdown:
{"sesgo_general":"ALCISTA","resumen":"Los mercados muestran fortaleza con el dólar consolidando y el oro como refugio.","distribucion":[{"sector":"Crypto","porcentaje":20,"color":"#F7931A"},{"sector":"Acciones","porcentaje":35,"color":"#00D4AA"},{"sector":"Divisas","porcentaje":25,"color":"#2196F3"},{"sector":"Materiales","porcentaje":20,"color":"#C9A84C"}],"oportunidad_destacada":"Descripción de la mejor oportunidad del día.","alerta_riesgo":"Principal riesgo a vigilar hoy."}
"sesgo_general" solo: ALCISTA, BAJISTA o NEUTRAL. Los porcentajes DEBEN sumar 100.`,
      user: `${base}\n\n${riskNote === 'Prioriza estabilidad. Usa NEUTRAL si hay duda. Evita activos de alta volatilidad.'
        ? 'Perfil CONSERVADOR: asigna más peso a Materiales (30%) y Divisas (30%), menos a Crypto (10%) y Acciones (30%).'
        : riskNote.includes('mayor retorno')
        ? 'Perfil AGRESIVO: asigna más peso a Crypto (35%) y Acciones (40%), menos a Divisas (15%) y Materiales (10%).'
        : 'Perfil MODERADO: distribución equilibrada entre todos los sectores.'
      }\n\nCrea la estrategia de portafolio global con los datos de mercado proporcionados.`,
    },
  ]
}

// ── Symbol matching for price injection ───────────────────────────────────────

// Maps every possible symbol the AI might return → the exact symbol in our prices array
const PRICE_LOOKUP: Record<string, string> = {
  // Crypto
  BTC: 'BTC', BITCOIN: 'BTC',
  ETH: 'ETH', ETHEREUM: 'ETH', ETHER: 'ETH',
  SOL: 'SOL', SOLANA: 'SOL',
  // Acciones
  NQ: 'NQ=F', 'NQ=F': 'NQ=F', 'NQ FUTURES': 'NQ=F', 'NASDAQ': 'NQ=F', 'NASDAQ 100': 'NQ=F',
  VIX: '%5EVIX', '%5EVIX': '%5EVIX', 'ÍNDICE VIX': '%5EVIX',
  // Divisas
  DXY: 'DX=F', 'DX=F': 'DX=F', 'DOLLAR INDEX': 'DX=F', 'ÍNDICE DÓLAR': 'DX=F', 'DOLAR INDEX': 'DX=F',
  'EUR/USD': 'EURUSD=X', EURUSD: 'EURUSD=X', 'EURUSD=X': 'EURUSD=X',
  'USD/MXN': 'USDMXN=X', USDMXN: 'USDMXN=X', 'USDMXN=X': 'USDMXN=X', MXN: 'USDMXN=X',
  'USD/COP': 'USDCOP=X', USDCOP: 'USDCOP=X', 'USDCOP=X': 'USDCOP=X', COP: 'USDCOP=X',
  // Materiales
  'GC=F': 'GC=F', ORO: 'GC=F', GOLD: 'GC=F', 'GOLD FUTURES': 'GC=F',
  'CL=F': 'CL=F', WTI: 'CL=F', 'PETRÓLEO': 'CL=F', PETROLEO: 'CL=F', OIL: 'CL=F', 'PETRÓLEO WTI': 'CL=F', 'PETROLEO WTI': 'CL=F',
}

function matchPrice(asset: AssetAnalysis, prices: PriceItem[]): PriceItem | undefined {
  const sym = asset.simbolo.toUpperCase().trim()

  // 1. Direct lookup via explicit map
  const mapped = PRICE_LOOKUP[sym]
  if (mapped) return prices.find(p => p.symbol === mapped)

  // 2. Fallback: try exact symbol or name contains
  return prices.find(p => {
    const ps = p.symbol.toUpperCase().replace(/=F|=X|%5E/g, '')
    return ps === sym || p.symbol.toUpperCase() === sym || p.name.toUpperCase().includes(sym)
  })
}

// ── Main handler ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { riskProfile = 'moderado' } = await req.json()

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

    // Run all 5 agents in parallel
    const rawResults = await Promise.allSettled(agents.map(a => runAgent(a.system, a.user)))

    const activos: AssetAnalysis[] = []
    let estrategia: EstrategiaResult | null = null

    rawResults.forEach((result, i) => {
      if (result.status !== 'fulfilled') return
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
      } catch {
        // Agent failed or returned invalid JSON — skip gracefully
      }
    })

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      riskProfile,
      activos,
      estrategia,
      precios: prices,
    })
  } catch (err) {
    console.error('[/api/analisis] error:', err)
    return NextResponse.json({ error: 'Error al ejecutar el análisis' }, { status: 500 })
  }
}
