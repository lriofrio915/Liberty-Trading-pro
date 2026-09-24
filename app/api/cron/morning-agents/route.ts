import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { timesfmForecast } from '@/lib/timesfm'
import { tauricJSON } from '@/lib/tauric'
import { notifyMorningAgents, type MorningAgentResult } from '@/lib/notify-nexus'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'

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

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!validateCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  void (async () => {
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

      const [peter, smallCap] = await Promise.allSettled([
        runPeterAgent(lynchResults, today0),
        runSmallCapAgent(lynchResults, today0),
      ])

      const summaries: MorningAgentResult[] = [
        peter.status      === 'fulfilled' ? peter.value      : { agent: 'Peter',       picks: [] },
        smallCap.status   === 'fulfilled' ? smallCap.value   : { agent: 'SmallCap',    picks: [] },
      ]

      const total = summaries.reduce((sum, s) => sum + s.picks.length, 0)
      console.log(`[morning-agents] Done — total picks: ${total}`)
      void notifyMorningAgents(summaries)
    } catch (err) {
      console.error('[morning-agents] background error:', err)
    }
  })()

  return NextResponse.json({ ok: true, started: true })
}

export const GET = POST
