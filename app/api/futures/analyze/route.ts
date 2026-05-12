import { NextResponse } from 'next/server'
import { fetchYahoo, runAgent, repairJSON, PRICE_LOOKUP } from '@/lib/analisis-engine'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [nq, sp, rut, vix] = await Promise.all([
      fetchYahoo('NQ=F',   'NQ Futures'),
      fetchYahoo('^GSPC',  'S&P 500'),
      fetchYahoo('^RUT',   'Russell 2000'),
      fetchYahoo('%5EVIX', 'VIX'),
    ])

    const prices = [nq, sp, rut, vix].filter(Boolean)
    const today = new Date().toLocaleDateString('es-MX', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
    const pricesCtx = prices
      .map(p => `${p!.name} (${p!.symbol}): $${p!.price.toFixed(2)} | 24h: ${p!.changePct >= 0 ? '+' : ''}${p!.changePct.toFixed(2)}% | ${p!.up ? 'SUBIENDO' : 'BAJANDO'}`)
      .join('\n')

    const system = `Eres analista de índices bursátiles para trading de futuros intradía (Micro Nasdaq MNQ, Micro S&P500 MES, Micro Russell M2K).
RESPONDE ÚNICAMENTE con JSON válido, sin texto extra ni markdown:
{"activos":[{"simbolo":"NQ","nombre":"Nasdaq 100 Futures","precio":0,"cambio24h":0,"sesgo":"COMPRA","confianza":75,"razon":"tendencia alcista fuerte","riesgo":"medio","sector":"Índices"},{"simbolo":"SP500","nombre":"S&P 500","precio":0,"cambio24h":0,"sesgo":"COMPRA","confianza":70,"razon":"soporte en medias móviles","riesgo":"medio","sector":"Índices"},{"simbolo":"RUSSELL","nombre":"Russell 2000","precio":0,"cambio24h":0,"sesgo":"NEUTRAL","confianza":58,"razon":"sin dirección clara","riesgo":"medio","sector":"Índices"},{"simbolo":"VIX","nombre":"VIX Volatilidad","precio":0,"cambio24h":0,"sesgo":"VENTA","confianza":65,"razon":"complacencia de mercado","riesgo":"bajo","sector":"Índices"}]}
Reglas ESTRICTAS: sesgo solo COMPRA, VENTA o NEUTRAL. confianza 55-92. razon máximo 8 palabras. sector siempre "Índices". Incluye EXACTAMENTE: NQ, SP500, RUSSELL, VIX.
VIX COMPRA = miedo (>25), VENTA = complacencia (<13).`

    const user_msg = `Fecha: ${today}. Precios actuales:\n${pricesCtx}\n\nAnaliza el sesgo intradía para operar futuros de índices.`

    const raw = await runAgent(system, user_msg, 600)
    const json = repairJSON(raw)
    const data = JSON.parse(json)

    const priceMap: Record<string, typeof nq> = {
      'NQ=F': nq, '^GSPC': sp, '^RUT': rut, '%5EVIX': vix,
    }
    for (const a of (data.activos ?? []) as Array<{ simbolo: string; precio: number; cambio24h: number }>) {
      const lookup = PRICE_LOOKUP[a.simbolo.toUpperCase()]
      const real = lookup ? priceMap[lookup] : null
      if (real) { a.precio = real.price; a.cambio24h = real.changePct }
    }

    return NextResponse.json({ activos: data.activos ?? [], timestamp: new Date().toISOString() })
  } catch (err) {
    console.error('[futures/analyze]', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
