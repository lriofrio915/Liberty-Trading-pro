import { NextResponse } from 'next/server'
import { fetchYahoo, buildAgents, runAgent, repairJSON, matchPrice, type AssetAnalysis } from '@/lib/analisis-engine'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [nq, sp, rut, dji, vix] = await Promise.all([
      fetchYahoo('NQ=F',   'NQ Futures'),
      fetchYahoo('ES=F',   'S&P 500 E-mini Futures'),
      fetchYahoo('RTY=F',  'Russell 2000 E-mini Futures'),
      fetchYahoo('^DJI',   'Dow Jones'),
      fetchYahoo('%5EVIX', 'VIX'),
    ])

    const prices = [nq, sp, rut, dji, vix].filter(Boolean) as NonNullable<typeof nq>[]
    const today = new Date().toLocaleDateString('es-MX', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
    const pricesCtx = prices
      .map(p => `${p.name} (${p.symbol}): $${p.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | 24h: ${p.changePct >= 0 ? '+' : ''}${p.changePct.toFixed(2)}% | ${p.up ? 'SUBIENDO' : 'BAJANDO'}`)
      .join('\n')

    const agents = buildAgents(pricesCtx, 'moderado', today, prices)
    const indicesAgent = agents.find(a => a.name === 'indices')!

    const raw = await runAgent(indicesAgent.system, indicesAgent.user, 800)
    const json = repairJSON(raw)
    const data = JSON.parse(json)

    const activos: AssetAnalysis[] = (data.activos ?? []) as AssetAnalysis[]
    for (const a of activos) {
      const real = matchPrice(a, prices)
      if (real) { a.precio = real.price; a.cambio24h = real.changePct }
    }

    const metodologia = 'Sistema MAIA — agente especializado en índices bursátiles. Datos en tiempo real vía Yahoo Finance. Factores evaluados: variación 24h, nivel VIX, momentum de precio y contexto macro.'

    return NextResponse.json({ activos, timestamp: new Date().toISOString(), metodologia })
  } catch (err) {
    console.error('[futures/analyze]', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
