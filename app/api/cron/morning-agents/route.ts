import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { fetchOHLC, VOLATILITY_UNIVERSE } from '@/app/api/intraday/screen/route'
import { runAgent, repairJSON } from '@/lib/analisis-engine'
import { prisma } from '@/lib/prisma'
import { timesfmForecast } from '@/lib/timesfm'
import { tauricJSON } from '@/lib/tauric'
import { analyzeOptionsTicker } from '@/lib/options/analyzer'
import { notifyMorningAgents, type MorningAgentResult } from '@/lib/notify-nexus'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'

// ── Universe ─────────────────────────────────────────────────────────────────

const THETA_UNIVERSE = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX',
  'AMD', 'INTC', 'ORCL', 'CSCO', 'QCOM', 'CRM', 'PYPL', 'UBER',
  'BA', 'CAT', 'GS', 'JPM', 'BAC', 'WFC', 'XOM', 'CVX',
  'DIS', 'SBUX', 'KO', 'PEP', 'MCD', 'WMT', 'TGT', 'NKE',
  'V', 'MA', 'COIN', 'MU',
]

// ── Types ─────────────────────────────────────────────────────────────────────

interface CachedLynchEntry {
  ticker: string
  empresa: string
  precioActual: number
  precioObjetivoMedio: number | null
  marketCap: number
  score: number
}

type ForecastDir = 'ALCISTA' | 'BAJISTA' | 'LATERAL'

interface ForecastResult {
  direction: ForecastDir
  lastPrice: number
  forecastPrice: number
}

// ── Auth ──────────────────────────────────────────────────────────────────────

function validateCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization') ?? ''
  const query = new URL(req.url).searchParams.get('secret') ?? ''
  return auth === `Bearer ${secret}` || query === secret
}

// ── MAIA Intraday bias ────────────────────────────────────────────────────────

const MAIA_SYSTEM = `Eres MAIA, analista experto de trading intradia con 20 años de experiencia en acciones de alta volatilidad del NYSE y NASDAQ.
Tu objetivo es determinar el sesgo direccional para operar intradia basándote exclusivamente en el momentum de precio reciente.
Responde ÚNICAMENTE con un JSON válido. Sin texto adicional. Sin bloques markdown.`

async function getMaiaBias(
  ticker: string,
  lastPrice: number,
  adrPct: number,
  change24hPct: number,
  recentCloses: number[],
): Promise<{ sesgo: 'COMPRA' | 'VENTA' | 'NEUTRAL'; razon: string }> {
  const trendPct = recentCloses.length >= 2
    ? ((recentCloses[recentCloses.length - 1] - recentCloses[0]) / recentCloses[0] * 100).toFixed(2)
    : '0.00'
  const closesStr = recentCloses.map(p => `$${p.toFixed(2)}`).join(' → ')

  const userMessage = `Analiza ${ticker} para trading intradia de hoy:

DATOS DE PRECIO:
- Precio actual: $${lastPrice.toFixed(2)}
- Cambio 24h: ${change24hPct >= 0 ? '+' : ''}${change24hPct.toFixed(2)}%
- ADR promedio (rango diario): ${adrPct.toFixed(2)}%
- Tendencia 5 días: ${Number(trendPct) >= 0 ? '+' : ''}${trendPct}%
- Últimos 5 cierres: ${closesStr}

Responde con este JSON exacto (sin más texto):
{"sesgo":"COMPRA","razon":"momentum alcista sostenido","confianza":72}

Valores permitidos para "sesgo": "COMPRA" | "VENTA" | "NEUTRAL"
"confianza": número entero 0-100
"razon": string máximo 100 caracteres`

  const raw = await runAgent(MAIA_SYSTEM, userMessage, 200)
  const parsed = JSON.parse(repairJSON(raw)) as { sesgo?: string; razon?: string }
  const sesgo = (['COMPRA', 'VENTA', 'NEUTRAL'] as const).includes(parsed.sesgo as 'COMPRA' | 'VENTA' | 'NEUTRAL')
    ? (parsed.sesgo as 'COMPRA' | 'VENTA' | 'NEUTRAL')
    : 'NEUTRAL'
  return { sesgo, razon: String(parsed.razon ?? '').slice(0, 120) }
}

// ── Forecast (TimesFM) ────────────────────────────────────────────────────────

async function fetchYahooCloses(ticker: string): Promise<{ closes: number[]; lastPrice: number }> {
  const period2 = Math.floor(Date.now() / 1000)
  const period1 = period2 - 90 * 24 * 3600
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&period1=${period1}&period2=${period2}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    cache: 'no-store',
    signal: AbortSignal.timeout(12_000),
  })
  if (!res.ok) throw new Error(`Yahoo ${res.status} for ${ticker}`)
  const json = await res.json()
  const result = json?.chart?.result?.[0]
  if (!result) throw new Error(`No chart data for ${ticker}`)
  const closes = (result.indicators?.quote?.[0]?.close ?? []).filter(
    (c: unknown): c is number => typeof c === 'number' && !isNaN(c)
  )
  return { closes, lastPrice: closes[closes.length - 1] ?? 0 }
}

async function runForecast(ticker: string): Promise<ForecastResult> {
  const { closes, lastPrice } = await fetchYahooCloses(ticker)
  if (closes.length < 10) throw new Error(`Insufficient price history for ${ticker}`)
  const result = await timesfmForecast(closes, 30)
  const forecastPrice = result.forecast[result.forecast.length - 1] ?? lastPrice
  const direction: ForecastDir = forecastPrice > lastPrice * 1.001 ? 'ALCISTA'
    : forecastPrice < lastPrice * 0.999 ? 'BAJISTA'
    : 'LATERAL'
  return { direction, lastPrice, forecastPrice }
}

// ── Tauric confirmation ───────────────────────────────────────────────────────

async function runTauric(ticker: string): Promise<boolean> {
  type AnalyzeResp = { run_id?: string; id?: string }
  type RunResp = { status: string; result?: string; signal?: string }

  const today = new Date().toISOString().split('T')[0]
  let aData: AnalyzeResp
  try {
    aData = await tauricJSON<AnalyzeResp>('/analyze', {
      method: 'POST',
      body: JSON.stringify({ ticker, date: today, depth: 'moderate' }),
    })
  } catch (e) {
    console.warn(`[morning-agents] Tauric analyze failed for ${ticker}:`, (e as Error).message)
    return false
  }
  const runId = aData.run_id ?? aData.id
  if (!runId) { console.warn(`[morning-agents] No run_id from Tauric for ${ticker}`); return false }

  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 8_000))
    try {
      const pData = await tauricJSON<RunResp>(`/runs/${runId}`)
      if (pData.status === 'completed') {
        const text = pData.result ?? pData.signal ?? ''
        return /\b(BUY|COMPRAR|ALCISTA|BULLISH|OVERWEIGHT)\b/i.test(text)
      }
      if (pData.status === 'failed') return false
    } catch { /* continue polling */ }
  }
  console.warn(`[morning-agents] Tauric timeout for ${ticker}`)
  return false
}

// ── Agente Peter — Lynch 6/6 + Forecast ALCISTA + Tauric ─────────────────────

async function runPeterAgent(lynch: CachedLynchEntry[], today0: Date): Promise<MorningAgentResult> {
  const universe = lynch.filter(r => r.score === 6)
  if (!universe.length) return { agent: 'Peter', picks: [] }

  const forecasts = await Promise.allSettled(universe.map(r => runForecast(r.ticker)))
  const alcistas = universe.filter((_, i) => {
    const f = forecasts[i]
    return f.status === 'fulfilled' && f.value.direction === 'ALCISTA'
  })
  console.log(`[peter] ${alcistas.length}/${universe.length} alcistas after forecast`)
  if (!alcistas.length) return { agent: 'Peter', picks: [] }

  const taurics = await Promise.allSettled(alcistas.map(r => runTauric(r.ticker)))
  const confirmed = alcistas.filter((_, i) => taurics[i].status === 'fulfilled' && (taurics[i] as PromiseFulfilledResult<boolean>).value)
  console.log(`[peter] ${confirmed.length}/${alcistas.length} confirmed by Tauric`)

  await prisma.opportunity.deleteMany({ where: { category: 'OPERATOR', active: true, publishedAt: { gte: today0 } } })
  const picks: MorningAgentResult['picks'] = []

  for (const r of confirmed) {
    const fi = universe.findIndex(u => u.ticker === r.ticker)
    const f = forecasts[fi]
    const fVal = f.status === 'fulfilled' ? f.value : null
    const entry = r.precioActual
    const target = fVal && fVal.forecastPrice > entry * 1.001
      ? parseFloat(fVal.forecastPrice.toFixed(2))
      : r.precioObjetivoMedio && r.precioObjetivoMedio > entry
        ? parseFloat(r.precioObjetivoMedio.toFixed(2))
        : parseFloat((entry * 1.15).toFixed(2))
    const sl = parseFloat((entry * 0.92).toFixed(2))
    try {
      await prisma.opportunity.create({
        data: {
          title: r.empresa || r.ticker, ticker: r.ticker,
          instrumento: 'ACCION', tipo: 'ACCION', direction: 'COMPRA',
          precioEntrada: entry, precioObjetivo: target, stopLoss: sl,
          timeframe: 'MEDIANO', riesgo: 'MEDIO',
          description: `Lynch 6/6 + Forecast ALCISTA + Tauric ✓ — Agente Peter. ${r.empresa || r.ticker}.`,
          aiReport: null, minPlan: 'CLUB', category: 'OPERATOR', active: true, status: 'COMPRAR',
        },
      })
      picks.push({ ticker: r.ticker, direction: 'COMPRA', precioEntrada: entry })
    } catch (e) { console.error(`[peter] ${r.ticker} save error:`, (e as Error).message) }
  }
  return { agent: 'Peter', picks }
}

// ── Agente SmallCap — Lynch ≥5/6 + <$2B + Forecast ALCISTA + Tauric ──────────

async function runSmallCapAgent(lynch: CachedLynchEntry[], today0: Date): Promise<MorningAgentResult> {
  const universe = lynch.filter(r => r.score >= 5 && r.marketCap > 0 && r.marketCap < 2_000_000_000)
  if (!universe.length) return { agent: 'SmallCap', picks: [] }

  const forecasts = await Promise.allSettled(universe.map(r => runForecast(r.ticker)))
  const alcistas = universe.filter((_, i) => {
    const f = forecasts[i]
    return f.status === 'fulfilled' && f.value.direction === 'ALCISTA'
  })
  console.log(`[smallcap] ${alcistas.length}/${universe.length} alcistas after forecast`)
  if (!alcistas.length) return { agent: 'SmallCap', picks: [] }

  const taurics = await Promise.allSettled(alcistas.map(r => runTauric(r.ticker)))
  const confirmed = alcistas.filter((_, i) => taurics[i].status === 'fulfilled' && (taurics[i] as PromiseFulfilledResult<boolean>).value)
  console.log(`[smallcap] ${confirmed.length}/${alcistas.length} confirmed by Tauric`)

  await prisma.opportunity.deleteMany({ where: { category: 'SMALLCAP', active: true, publishedAt: { gte: today0 } } })
  const picks: MorningAgentResult['picks'] = []

  for (const r of confirmed) {
    const fi = universe.findIndex(u => u.ticker === r.ticker)
    const f = forecasts[fi]
    const fVal = f.status === 'fulfilled' ? f.value : null
    const entry = r.precioActual
    const target = fVal && fVal.forecastPrice > entry * 1.001
      ? parseFloat(fVal.forecastPrice.toFixed(2))
      : r.precioObjetivoMedio && r.precioObjetivoMedio > entry
        ? parseFloat(r.precioObjetivoMedio.toFixed(2))
        : parseFloat((entry * 1.15).toFixed(2))
    const sl = parseFloat((entry * 0.93).toFixed(2))
    try {
      await prisma.opportunity.create({
        data: {
          title: r.empresa || r.ticker, ticker: r.ticker,
          instrumento: 'ACCION', tipo: 'ACCION', direction: 'COMPRA',
          precioEntrada: entry, precioObjetivo: target, stopLoss: sl,
          timeframe: 'MEDIANO', riesgo: 'ALTO',
          description: `Lynch ${r.score}/6 SmallCap <$2B + Forecast ALCISTA + Tauric ✓. ${r.empresa || r.ticker}.`,
          aiReport: null, minPlan: 'CLUB', category: 'SMALLCAP', active: true, status: 'COMPRAR',
        },
      })
      picks.push({ ticker: r.ticker, direction: 'COMPRA', precioEntrada: entry })
    } catch (e) { console.error(`[smallcap] ${r.ticker} save error:`, (e as Error).message) }
  }
  return { agent: 'SmallCap', picks }
}

// ── Agente VanillaLong — Lynch universe + Forecast + Options (buy-call/put) + Tauric ──

async function runVanillaLongAgent(lynch: CachedLynchEntry[]): Promise<MorningAgentResult> {
  const peter = lynch.filter(r => r.score === 6).map(r => r.ticker)
  const small = lynch.filter(r => r.score >= 5 && r.marketCap < 2_000_000_000).map(r => r.ticker)
  const universe = [...new Set([...peter, ...small])]
  if (!universe.length) return { agent: 'VanillaLong', picks: [] }

  const forecasts = await Promise.allSettled(universe.map(t => runForecast(t)))
  type Directional = { ticker: string; strategy: 'buy-call' | 'buy-put'; lastPrice: number }
  const directional: Directional[] = universe.map((ticker, i) => {
    const f = forecasts[i]
    if (f.status !== 'fulfilled') return null
    const { direction, lastPrice } = f.value
    const strategy = direction === 'ALCISTA' ? 'buy-call' : direction === 'BAJISTA' ? 'buy-put' : null
    if (!strategy) return null
    return { ticker, strategy, lastPrice }
  }).filter((x): x is Directional => x !== null)

  if (!directional.length) return { agent: 'VanillaLong', picks: [] }

  type OptionPick = Directional & { chosen: { contract: { symbol: string; type: string; strike: number; expiration: string; dte: number; bid?: number | null; ask?: number | null; mid?: number | null; impliedVolatility?: number | null; delta?: number | null }; score: number; label: string; action: string; breakeven: number; maxLossHint: string; maxProfitHint: string }; company: string }
  const optionResults = await Promise.allSettled(
    directional.map(async d => {
      const optData = await analyzeOptionsTicker(d.ticker)
      const picks = (optData.strategies[d.strategy] ?? [])
        .filter(p => {
          const delta = Math.abs(p.contract.delta ?? 0)
          return delta >= 0.30 && delta <= 0.65
            && p.contract.dte >= 21 && p.contract.dte <= 90
            && p.score >= 50 && p.label !== 'EVITAR'
        })
        .sort((a, b) => b.score - a.score)
      const chosen = picks[0]
      if (!chosen) throw new Error(`No valid ${d.strategy} for ${d.ticker}`)
      return { ...d, chosen, company: optData.underlying?.company ?? '' } as OptionPick
    })
  )

  const withOptions = optionResults
    .map(r => r.status === 'fulfilled' ? r.value : null)
    .filter((x): x is OptionPick => x !== null)
    .sort((a, b) => b.chosen.score - a.chosen.score)
    .slice(0, 5) // top 5 before Tauric

  if (!withOptions.length) return { agent: 'VanillaLong', picks: [] }

  const taurics = await Promise.allSettled(withOptions.map(d => runTauric(d.ticker)))
  const confirmed = withOptions.filter((_, i) => taurics[i].status === 'fulfilled' && (taurics[i] as PromiseFulfilledResult<boolean>).value)

  const picks: MorningAgentResult['picks'] = []
  for (const d of confirmed) {
    const existing = await prisma.optionRecommendation.findFirst({
      where: { ticker: d.ticker, strategy: d.strategy, status: 'ACTIVA', active: true },
    })
    if (existing) continue
    try {
      const c = d.chosen
      await prisma.optionRecommendation.create({
        data: {
          ticker: d.ticker, company: d.company,
          direction: d.strategy === 'buy-call' ? 'ALCISTA' : 'BAJISTA',
          strategy: d.strategy, action: c.action,
          contractSymbol: c.contract.symbol, contractType: c.contract.type,
          strike: c.contract.strike, expiration: c.contract.expiration,
          dte: c.contract.dte, score: c.score, label: c.label,
          underlyingPrice: d.lastPrice,
          bid: c.contract.bid ?? null, ask: c.contract.ask ?? null,
          mid: c.contract.mid ?? null, impliedVolatility: c.contract.impliedVolatility ?? null,
          delta: c.contract.delta ?? null, breakeven: c.breakeven,
          maxLossHint: c.maxLossHint, maxProfitHint: c.maxProfitHint,
        },
      })
      picks.push({ ticker: d.ticker, direction: d.strategy === 'buy-call' ? 'CALL' : 'PUT', precioEntrada: d.lastPrice })
    } catch (e) { console.error(`[vanilla-long] ${d.ticker} save error:`, (e as Error).message) }
  }
  return { agent: 'VanillaLong', picks }
}

// ── Agente VanillaShort — THETA_UNIVERSE + Forecast + Options (sell) + Tauric ─

async function runVanillaShortAgent(): Promise<MorningAgentResult> {
  const forecasts = await Promise.allSettled(THETA_UNIVERSE.map(t => runForecast(t)))
  type Candidate = { ticker: string; strategy: 'sell-put' | 'covered-call'; lastPrice: number }
  const candidates: Candidate[] = THETA_UNIVERSE.map((ticker, i) => {
    const f = forecasts[i]
    if (f.status !== 'fulfilled') return null
    const { direction, lastPrice } = f.value
    const strategy: 'sell-put' | 'covered-call' = direction === 'BAJISTA' ? 'covered-call' : 'sell-put'
    return { ticker, strategy, lastPrice }
  }).filter((x): x is Candidate => x !== null)

  if (!candidates.length) return { agent: 'VanillaShort', picks: [] }

  type OptionPick = Candidate & { chosen: { contract: { symbol: string; type: string; strike: number; expiration: string; dte: number; bid?: number | null; ask?: number | null; mid?: number | null; impliedVolatility?: number | null; delta?: number | null }; score: number; label: string; action: string; breakeven?: number | null; maxLossHint: string; maxProfitHint: string }; company: string }
  const optionResults = await Promise.allSettled(
    candidates.map(async d => {
      const optData = await analyzeOptionsTicker(d.ticker)
      const picks = (optData.strategies[d.strategy] ?? [])
        .filter(p => p.score >= 50 && p.label !== 'EVITAR')
        .sort((a, b) => b.score - a.score)
      const chosen = picks[0]
      if (!chosen) throw new Error(`No valid ${d.strategy} for ${d.ticker}`)
      return { ...d, chosen, company: optData.underlying?.company ?? '' } as OptionPick
    })
  )

  const withOptions = optionResults
    .map(r => r.status === 'fulfilled' ? r.value : null)
    .filter((x): x is OptionPick => x !== null)
    .sort((a, b) => b.chosen.score - a.chosen.score)
    .slice(0, 5) // top 5 before Tauric

  if (!withOptions.length) return { agent: 'VanillaShort', picks: [] }

  const taurics = await Promise.allSettled(withOptions.map(d => runTauric(d.ticker)))
  const confirmed = withOptions.filter((_, i) => taurics[i].status === 'fulfilled' && (taurics[i] as PromiseFulfilledResult<boolean>).value)

  const picks: MorningAgentResult['picks'] = []
  for (const d of confirmed) {
    const existing = await prisma.optionRecommendation.findFirst({
      where: { ticker: d.ticker, strategy: d.strategy, status: 'ACTIVA', active: true },
    })
    if (existing) continue
    try {
      const c = d.chosen
      await prisma.optionRecommendation.create({
        data: {
          ticker: d.ticker, company: d.company,
          direction: d.strategy === 'sell-put' ? 'ALCISTA' : 'BAJISTA',
          strategy: d.strategy, action: c.action,
          contractSymbol: c.contract.symbol, contractType: c.contract.type,
          strike: c.contract.strike, expiration: c.contract.expiration,
          dte: c.contract.dte, score: c.score, label: c.label,
          underlyingPrice: d.lastPrice,
          bid: c.contract.bid ?? null, ask: c.contract.ask ?? null,
          mid: c.contract.mid ?? null, impliedVolatility: c.contract.impliedVolatility ?? null,
          delta: c.contract.delta ?? null, breakeven: c.breakeven ?? null,
          maxLossHint: c.maxLossHint, maxProfitHint: c.maxProfitHint,
        },
      })
      picks.push({ ticker: d.ticker, direction: d.strategy === 'sell-put' ? 'SELL-PUT' : 'COVERED-CALL', precioEntrada: d.lastPrice })
    } catch (e) { console.error(`[vanilla-short] ${d.ticker} save error:`, (e as Error).message) }
  }
  return { agent: 'VanillaShort', picks }
}

// ── Agente Intraday — Lynch universe + ADR ≥2% + MAIA bias ───────────────────

async function runIntradayAgent(lynch: CachedLynchEntry[], today0: Date): Promise<MorningAgentResult> {
  const intradayUniverse = lynch.length > 0
    ? lynch.slice(0, 50).map(r => r.ticker)
    : VOLATILITY_UNIVERSE

  const screenResults: NonNullable<Awaited<ReturnType<typeof fetchOHLC>>>[] = []
  for (let i = 0; i < intradayUniverse.length; i += 8) {
    const batch = intradayUniverse.slice(i, i + 8)
    const settled = await Promise.allSettled(batch.map(t => fetchOHLC(t)))
    for (const r of settled) {
      if (r.status === 'fulfilled' && r.value) screenResults.push(r.value)
    }
    if (i + 8 < intradayUniverse.length) await new Promise(r => setTimeout(r, 300))
  }

  const adrCandidates = screenResults.filter(r => r.adrPct >= 2.0)
  console.log(`[morning-agents] Intraday ADR candidates: ${adrCandidates.length}`)

  await prisma.opportunity.deleteMany({ where: { category: 'INTRADAY', active: true, publishedAt: { gte: today0 } } })

  const intradayPicks: MorningAgentResult['picks'] = []
  for (const c of adrCandidates) {
    try {
      const { sesgo, razon } = await getMaiaBias(c.ticker, c.lastPrice, c.adrPct, c.change24hPct, c.recentCloses)
      if (sesgo === 'NEUTRAL') continue

      const slPct  = Math.max(1.0, Math.min(3.0, parseFloat((0.4 * c.adrPct).toFixed(2))))
      const tpPct  = Math.max(2.0, Math.min(6.0, parseFloat((0.8 * c.adrPct).toFixed(2))))
      const entry  = c.lastPrice
      const isLong = sesgo === 'COMPRA'
      const target = parseFloat((isLong ? entry * (1 + tpPct / 100) : entry * (1 - tpPct / 100)).toFixed(2))
      const sl     = parseFloat((isLong ? entry * (1 - slPct / 100) : entry * (1 + slPct / 100)).toFixed(2))

      await prisma.opportunity.create({
        data: {
          title: c.ticker, ticker: c.ticker,
          instrumento: 'ACCION', tipo: 'ACCION', direction: sesgo,
          precioEntrada: entry, precioObjetivo: target, stopLoss: sl,
          timeframe: 'CORTO', riesgo: 'ALTO',
          description: `MAIA intraday — ADR ${c.adrPct.toFixed(1)}%. ${razon}`,
          aiReport: null, minPlan: 'CLUB', category: 'INTRADAY', active: true, status: 'COMPRAR',
        },
      })
      intradayPicks.push({ ticker: c.ticker, direction: sesgo, precioEntrada: entry })
    } catch (e) { console.error(`[morning-agents] Intraday pick error ${c.ticker}:`, e) }
  }
  return { agent: 'Intraday', picks: intradayPicks }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!validateCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  after(async () => {
    try {
      const today0 = new Date()
      today0.setUTCHours(0, 0, 0, 0)

      const screenerCache = await prisma.screenerCache.findFirst({
        where: { type: 'lynch' },
        orderBy: { updatedAt: 'desc' },
      })
      const lynchResults: CachedLynchEntry[] = screenerCache?.data
        ? (screenerCache.data as unknown as CachedLynchEntry[]).filter(
            r => r.ticker && typeof r.precioActual === 'number' && r.precioActual > 0
          )
        : []
      console.log(`[morning-agents] Lynch cache: ${lynchResults.length} tickers`)

      const [peter, smallCap, vanillaLong, vanillaShort, intraday] = await Promise.allSettled([
        runPeterAgent(lynchResults, today0),
        runSmallCapAgent(lynchResults, today0),
        runVanillaLongAgent(lynchResults),
        runVanillaShortAgent(),
        runIntradayAgent(lynchResults, today0),
      ])

      const summaries: MorningAgentResult[] = [
        peter.status      === 'fulfilled' ? peter.value      : { agent: 'Peter',       picks: [] },
        smallCap.status   === 'fulfilled' ? smallCap.value   : { agent: 'SmallCap',    picks: [] },
        vanillaLong.status === 'fulfilled' ? vanillaLong.value : { agent: 'VanillaLong', picks: [] },
        vanillaShort.status === 'fulfilled' ? vanillaShort.value : { agent: 'VanillaShort', picks: [] },
        intraday.status   === 'fulfilled' ? intraday.value   : { agent: 'Intraday',    picks: [] },
      ]

      const total = summaries.reduce((sum, s) => sum + s.picks.length, 0)
      console.log(`[morning-agents] Done — total picks: ${total}`)
      void notifyMorningAgents(summaries)
    } catch (err) {
      console.error('[morning-agents] background error:', err)
    }
  })

  return NextResponse.json({ ok: true, started: true })
}

export const GET = POST
