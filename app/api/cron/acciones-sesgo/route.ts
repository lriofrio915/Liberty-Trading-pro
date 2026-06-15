import { NextRequest, NextResponse } from 'next/server'
import { fetchYahoo, repairJSON } from '@/lib/analisis-engine'
import { prisma } from '@/lib/prisma'
import { notifyAccionesSesgo } from '@/lib/notify-nexus'

type Recomendacion = 'MANTENER' | 'AJUSTAR_STOP' | 'CERRAR'

// MAIA Stocks universe: core 12 (analisis-engine) + 6 high-volatility intraday
const STOCKS = [
  { ticker: 'AAPL',  nombre: 'Apple' },
  { ticker: 'MSFT',  nombre: 'Microsoft' },
  { ticker: 'AMZN',  nombre: 'Amazon' },
  { ticker: 'NVDA',  nombre: 'Nvidia' },
  { ticker: 'META',  nombre: 'Meta' },
  { ticker: 'GOOGL', nombre: 'Alphabet' },
  { ticker: 'TSLA',  nombre: 'Tesla' },
  { ticker: 'AMD',   nombre: 'AMD' },
  { ticker: 'JPM',   nombre: 'JPMorgan' },
  { ticker: 'V',     nombre: 'Visa' },
  { ticker: 'NFLX',  nombre: 'Netflix' },
  { ticker: 'XOM',   nombre: 'ExxonMobil' },
  { ticker: 'COIN',  nombre: 'Coinbase' },
  { ticker: 'MSTR',  nombre: 'MicroStrategy' },
  { ticker: 'PLTR',  nombre: 'Palantir' },
  { ticker: 'HOOD',  nombre: 'Robinhood' },
  { ticker: 'CRWD',  nombre: 'CrowdStrike' },
  { ticker: 'SOFI',  nombre: 'SoFi' },
]

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

function getRecomendacion(
  currentSesgo: string,
  currentConf: number,
  prev: { sesgo: string; confianza: number } | undefined,
  morningSesgo: string | undefined,
): Recomendacion {
  if (!prev) return 'MANTENER'
  if (morningSesgo && currentSesgo !== 'NEUTRAL' && currentSesgo !== morningSesgo) return 'CERRAR'
  if (prev.sesgo !== currentSesgo) return 'AJUSTAR_STOP'
  if (prev.confianza - currentConf >= 8) return 'AJUSTAR_STOP'
  return 'MANTENER'
}

async function runSesgoAgent(system: string, user: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not configured')
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      temperature: 0.2,
      max_tokens: 700,
    }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`Groq error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

export const runtime = 'nodejs'
export const maxDuration = 90
export const dynamic = 'force-dynamic'

function validateCron(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization') ?? ''
  const query = new URL(req.url).searchParams.get('secret') ?? ''
  return auth === `Bearer ${secret}` || query === secret
}

export async function POST(req: NextRequest) {
  if (!validateCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only run 8:30am–3:00pm Ecuador = 13:30–20:00 UTC
  const now = new Date()
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()
  if (utcMinutes < 810 || utcMinutes >= 1200) {
    return NextResponse.json({
      skipped: 'outside market hours',
      utc: `${now.getUTCHours()}:${now.getUTCMinutes().toString().padStart(2, '0')}`,
    })
  }

  try {
    // Fetch macro context for LLM user message
    const [nq, sp, vix] = await Promise.all([
      fetchYahoo('NQ=F',   'NQ Futures'),
      fetchYahoo('ES=F',   'S&P 500'),
      fetchYahoo('%5EVIX', 'VIX'),
    ])

    // Fetch all stock prices in parallel
    const priceResults = await Promise.allSettled(
      STOCKS.map(s => fetchYahoo(s.ticker, s.nombre))
    )
    const priceMap = new Map<string, { price: number; changePct: number; up: boolean }>()
    priceResults.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value) {
        priceMap.set(STOCKS[i].ticker, r.value)
      }
    })

    const today = new Date().toLocaleDateString('es-MX', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
    const macroCtx = [
      nq  ? `NQ: $${nq.price.toFixed(0)} (${nq.changePct >= 0 ? '+' : ''}${nq.changePct.toFixed(2)}%)`   : '',
      sp  ? `SP500: $${sp.price.toFixed(0)} (${sp.changePct >= 0 ? '+' : ''}${sp.changePct.toFixed(2)}%)` : '',
      vix ? `VIX: $${vix.price.toFixed(2)} (${vix.changePct >= 0 ? '+' : ''}${vix.changePct.toFixed(2)}%)` : '',
    ].filter(Boolean).join(' | ')

    const SYSTEM = `Eres un agente analista de acciones (MAIA). Analiza exactamente las acciones indicadas para sesgo intradía.
RESPONDE ÚNICAMENTE con JSON válido, sin texto extra ni markdown:
{"activos":[{"simbolo":"NVDA","nombre":"Nvidia","precio":0,"cambio24h":0,"sesgo":"COMPRA","confianza":80,"razon":"momentum alcista fuerte","riesgo":"alto","sector":"Acciones"}]}
Reglas ESTRICTAS: "sesgo" solo COMPRA, VENTA o NEUTRAL. "confianza" entero 55-92. "riesgo" solo bajo, medio o alto. "sector" SIEMPRE "Acciones". "razon" máximo 8 palabras. Sé selectivo para trading intradía.`

    // Run LLM analysis in batches of 6 (keeps prompt within 700 tokens)
    const batches = chunk(STOCKS, 6)
    const batchResults = await Promise.allSettled(
      batches.map(batch => {
        const stocksCtx = batch
          .map(s => {
            const p = priceMap.get(s.ticker)
            if (!p) return `${s.nombre} (${s.ticker}): precio no disponible`
            return `${s.nombre} (${s.ticker}): $${p.price.toFixed(2)} | 24h: ${p.changePct >= 0 ? '+' : ''}${p.changePct.toFixed(2)}% | ${p.up ? 'SUBIENDO' : 'BAJANDO'}`
          })
          .join('\n')
        const user_msg = `Fecha: ${today}
Contexto macro: ${macroCtx}

${stocksCtx}

Analiza el sesgo intradía. Incluye EXACTAMENTE: ${batch.map(s => s.ticker).join(', ')}.`
        return runSesgoAgent(SYSTEM, user_msg)
      })
    )

    // Merge all batch results
    const allActivos: Array<{
      simbolo: string; nombre: string; precio: number; cambio24h: number
      sesgo: string; confianza: number; razon: string; riesgo: string
    }> = []
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        try {
          const json = repairJSON(result.value)
          const parsed = JSON.parse(json)
          if (Array.isArray(parsed.activos)) allActivos.push(...parsed.activos)
        } catch { /* skip malformed batch */ }
      }
    }

    // Inject real prices
    for (const a of allActivos) {
      const real = priceMap.get(a.simbolo.toUpperCase())
      if (real) { a.precio = real.price; a.cambio24h = real.changePct }
    }

    // Query DB: previous snapshot (30min ago ±15min) and morning baseline
    const prevCutoff = new Date(Date.now() - 45 * 60 * 1000)
    const prevFloor  = new Date(Date.now() - 20 * 60 * 1000)
    const today0 = new Date(); today0.setUTCHours(0, 0, 0, 0)
    const stockTickers = STOCKS.map(s => s.ticker)

    const [prevLogs, morningLogs] = await Promise.all([
      prisma.sesgoIntradayLog.findMany({
        where: { simbolo: { in: stockTickers }, timestamp: { gte: prevCutoff, lt: prevFloor } },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.sesgoIntradayLog.findMany({
        where: { simbolo: { in: stockTickers }, timestamp: { gte: today0 } },
        orderBy: { timestamp: 'asc' },
      }),
    ])

    const prevMap = new Map(prevLogs.map(l => [l.simbolo.toUpperCase(), l]))

    // Morning baseline: first snapshot per stock today
    const morningMap = new Map<string, string>()
    for (const log of morningLogs) {
      const sym = log.simbolo.toUpperCase()
      if (!morningMap.has(sym)) morningMap.set(sym, log.sesgo)
    }

    // Save current snapshot
    if (allActivos.length > 0) {
      await prisma.sesgoIntradayLog.createMany({
        data: allActivos.map(a => ({
          simbolo: a.simbolo,
          sesgo: a.sesgo,
          confianza: a.confianza,
          cambio24h: a.cambio24h,
          precio: a.precio,
        })),
      })
    }

    // Detect sesgo changes vs morning baseline
    const changed = new Set<string>()
    for (const a of allActivos) {
      const sym = a.simbolo.toUpperCase()
      const morning = morningMap.get(sym)
      if (morning && morning !== 'NEUTRAL' && morning !== a.sesgo && a.sesgo !== 'NEUTRAL') {
        changed.add(sym)
      }
    }

    // Per-stock recommendations
    const recomendaciones = new Map<string, Recomendacion>()
    for (const a of allActivos) {
      const sym = a.simbolo.toUpperCase()
      const prev = prevMap.get(sym)
      recomendaciones.set(sym, getRecomendacion(
        a.sesgo, a.confianza,
        prev ? { sesgo: prev.sesgo, confianza: prev.confianza } : undefined,
        morningMap.get(sym),
      ))
    }

    const isPreApertura = prevMap.size === 0

    void notifyAccionesSesgo(allActivos, changed, morningMap, prevMap, recomendaciones, isPreApertura)

    return NextResponse.json({
      activos: allActivos,
      changed: [...changed],
      recomendaciones: Object.fromEntries(recomendaciones),
      isPreApertura,
      total: allActivos.length,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[cron/acciones-sesgo]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export const GET = POST
