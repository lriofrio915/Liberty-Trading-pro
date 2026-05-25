import { NextRequest, NextResponse } from 'next/server'
import { fetchOHLC, VOLATILITY_UNIVERSE } from '@/app/api/intraday/screen/route'
import { runAgent, repairJSON } from '@/lib/analisis-engine'
import { prisma } from '@/lib/prisma'
import { notifyMorningAgents, type MorningAgentResult } from '@/lib/notify-nexus'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'

function validateCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization') ?? ''
  const query = new URL(req.url).searchParams.get('secret') ?? ''
  return auth === `Bearer ${secret}` || query === secret
}

interface CachedLynchEntry {
  ticker: string
  empresa: string
  precioActual: number
  precioObjetivoMedio: number | null
  marketCap: number
  score: number
}

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

export async function POST(req: NextRequest) {
  if (!validateCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today0 = new Date()
  today0.setUTCHours(0, 0, 0, 0)

  const summaries: MorningAgentResult[] = []

  // ── 1. Cargar Lynch screener cache ────────────────────────────────
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

  // ── 2. Agente Peter (Lynch score === 6) ───────────────────────────
  const peterUniverse = lynchResults.filter(r => r.score === 6)
  if (peterUniverse.length > 0) {
    await prisma.opportunity.deleteMany({
      where: { category: 'OPERATOR', active: true, publishedAt: { gte: today0 } },
    })
    const peterPicks: MorningAgentResult['picks'] = []
    for (const r of peterUniverse) {
      const entry = r.precioActual
      const target = r.precioObjetivoMedio && r.precioObjetivoMedio > entry
        ? parseFloat(r.precioObjetivoMedio.toFixed(2))
        : parseFloat((entry * 1.15).toFixed(2))
      const sl = parseFloat((entry * 0.92).toFixed(2))
      try {
        await prisma.opportunity.create({
          data: {
            title: r.empresa || r.ticker,
            ticker: r.ticker,
            instrumento: 'ACCION',
            tipo: 'ACCION',
            direction: 'COMPRA',
            precioEntrada: entry,
            precioObjetivo: target,
            stopLoss: sl,
            timeframe: 'MEDIANO',
            riesgo: 'MEDIO',
            description: `Lynch 6/6 — Agente Peter. ${r.empresa || r.ticker}.`,
            aiReport: null,
            minPlan: 'CLUB',
            category: 'OPERATOR',
            active: true,
            status: 'COMPRAR',
          },
        })
        peterPicks.push({ ticker: r.ticker, direction: 'COMPRA', precioEntrada: entry })
      } catch (e) {
        console.error(`[morning-agents] Peter pick error ${r.ticker}:`, e)
      }
    }
    summaries.push({ agent: 'Peter', picks: peterPicks })
    console.log(`[morning-agents] Peter: ${peterPicks.length} picks`)
  }

  // ── 3. Agente SmallCap (score >= 5, marketCap < $2B) ─────────────
  const smallCapUniverse = lynchResults.filter(r => r.score >= 5 && r.marketCap > 0 && r.marketCap < 2_000_000_000)
  if (smallCapUniverse.length > 0) {
    await prisma.opportunity.deleteMany({
      where: { category: 'SMALLCAP', active: true, publishedAt: { gte: today0 } },
    })
    const scPicks: MorningAgentResult['picks'] = []
    for (const r of smallCapUniverse) {
      const entry = r.precioActual
      const target = r.precioObjetivoMedio && r.precioObjetivoMedio > entry
        ? parseFloat(r.precioObjetivoMedio.toFixed(2))
        : parseFloat((entry * 1.20).toFixed(2))
      const sl = parseFloat((entry * 0.92).toFixed(2))
      try {
        await prisma.opportunity.create({
          data: {
            title: r.empresa || r.ticker,
            ticker: r.ticker,
            instrumento: 'ACCION',
            tipo: 'ACCION',
            direction: 'COMPRA',
            precioEntrada: entry,
            precioObjetivo: target,
            stopLoss: sl,
            timeframe: 'MEDIANO',
            riesgo: 'ALTO',
            description: `Lynch ${r.score}/6 SmallCap <$2B — Agente SmallCap. ${r.empresa || r.ticker}.`,
            aiReport: null,
            minPlan: 'CLUB',
            category: 'SMALLCAP',
            active: true,
            status: 'COMPRAR',
          },
        })
        scPicks.push({ ticker: r.ticker, direction: 'COMPRA', precioEntrada: entry })
      } catch (e) {
        console.error(`[morning-agents] SmallCap pick error ${r.ticker}:`, e)
      }
    }
    summaries.push({ agent: 'SmallCap', picks: scPicks })
    console.log(`[morning-agents] SmallCap: ${scPicks.length} picks`)
  }

  // ── 4. Agente Intraday (Lynch universe → ADR ≥2% → MAIA bias) ────
  // Usa el universo dinámico del Lynch screener; fallback al universo estático si sin cache
  const intradayUniverse = lynchResults.length > 0
    ? lynchResults.slice(0, 50).map(r => r.ticker)
    : VOLATILITY_UNIVERSE

  console.log(`[morning-agents] Intraday universe: ${intradayUniverse.length} tickers`)

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

  await prisma.opportunity.deleteMany({
    where: { category: 'INTRADAY', active: true, publishedAt: { gte: today0 } },
  })

  const intradayPicks: MorningAgentResult['picks'] = []
  for (const c of adrCandidates) {
    try {
      const { sesgo, razon } = await getMaiaBias(c.ticker, c.lastPrice, c.adrPct, c.change24hPct, c.recentCloses)
      if (sesgo === 'NEUTRAL') continue

      const slPct = Math.max(1.0, Math.min(3.0, parseFloat((0.4 * c.adrPct).toFixed(2))))
      const tpPct = Math.max(2.0, Math.min(6.0, parseFloat((0.8 * c.adrPct).toFixed(2))))
      const entry = c.lastPrice
      const isLong = sesgo === 'COMPRA'
      const target = parseFloat((isLong ? entry * (1 + tpPct / 100) : entry * (1 - tpPct / 100)).toFixed(2))
      const sl = parseFloat((isLong ? entry * (1 - slPct / 100) : entry * (1 + slPct / 100)).toFixed(2))

      await prisma.opportunity.create({
        data: {
          title: c.ticker,
          ticker: c.ticker,
          instrumento: 'ACCION',
          tipo: 'ACCION',
          direction: sesgo,
          precioEntrada: entry,
          precioObjetivo: target,
          stopLoss: sl,
          timeframe: 'CORTO',
          riesgo: 'ALTO',
          description: `MAIA intraday — ADR ${c.adrPct.toFixed(1)}%. ${razon}`,
          aiReport: null,
          minPlan: 'CLUB',
          category: 'INTRADAY',
          active: true,
          status: 'COMPRAR',
        },
      })
      intradayPicks.push({ ticker: c.ticker, direction: sesgo, precioEntrada: entry })
    } catch (e) {
      console.error(`[morning-agents] Intraday pick error ${c.ticker}:`, e)
    }
  }
  summaries.push({ agent: 'Intraday', picks: intradayPicks })
  console.log(`[morning-agents] Intraday: ${intradayPicks.length} picks`)

  // ── 5. WhatsApp via nexus_claw ─────────────────────────────────────
  void notifyMorningAgents(summaries)

  const totalSaved = summaries.reduce((sum, s) => sum + s.picks.length, 0)
  return NextResponse.json({
    saved: totalSaved,
    agents: summaries.map(s => ({ agent: s.agent, count: s.picks.length })),
    timestamp: new Date().toISOString(),
  })
}

export const GET = POST
