import { NextRequest, NextResponse } from 'next/server'
import { fetchYahoo, repairJSON, PRICE_LOOKUP } from '@/lib/analisis-engine'
import { prisma } from '@/lib/prisma'
import { notifySesgoIntraday } from '@/lib/notify-nexus'

type Recomendacion = 'MANTENER' | 'AJUSTAR_STOP' | 'CERRAR'

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

  // Only run 8:15am–3:00pm Ecuador = 13:15–20:00 UTC
  const now = new Date()
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()
  if (utcMinutes < 795 || utcMinutes >= 1200) {
    return NextResponse.json({
      skipped: 'outside market hours',
      utc: `${now.getUTCHours()}:${now.getUTCMinutes().toString().padStart(2, '0')}`,
    })
  }

  try {
    const [nq, sp, rut, dow, vix] = await Promise.all([
      fetchYahoo('NQ=F',   'NQ Futures'),
      fetchYahoo('ES=F',   'S&P 500 E-mini Futures'),
      fetchYahoo('RTY=F',  'Russell 2000 E-mini Futures'),
      fetchYahoo('%5EDJI', 'Dow Jones Industrial'),
      fetchYahoo('%5EVIX', 'VIX'),
    ])

    const prices = [nq, sp, rut, dow, vix].filter(Boolean)
    const today = new Date().toLocaleDateString('es-MX', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
    const pricesCtx = prices
      .map(p => `${p!.name} (${p!.symbol}): $${p!.price.toFixed(2)} | 24h: ${p!.changePct >= 0 ? '+' : ''}${p!.changePct.toFixed(2)}% | ${p!.up ? 'SUBIENDO' : 'BAJANDO'}`)
      .join('\n')

    const system = `Eres analista de índices bursátiles para trading de futuros intradía (Micro Nasdaq MNQ, Micro S&P500 MES, Micro Russell M2K, Micro Dow MYM).
RESPONDE ÚNICAMENTE con JSON válido, sin texto extra ni markdown:
{"activos":[{"simbolo":"NQ","nombre":"Nasdaq 100 Futures","precio":0,"cambio24h":0,"sesgo":"COMPRA","confianza":75,"razon":"tendencia alcista fuerte","riesgo":"medio","sector":"Índices"},{"simbolo":"SP500","nombre":"S&P 500","precio":0,"cambio24h":0,"sesgo":"COMPRA","confianza":70,"razon":"soporte en medias móviles","riesgo":"medio","sector":"Índices"},{"simbolo":"RUSSELL","nombre":"Russell 2000","precio":0,"cambio24h":0,"sesgo":"NEUTRAL","confianza":58,"razon":"sin dirección clara","riesgo":"medio","sector":"Índices"},{"simbolo":"DOW","nombre":"Dow Jones Industrial","precio":0,"cambio24h":0,"sesgo":"COMPRA","confianza":65,"razon":"blue chips con momentum","riesgo":"bajo","sector":"Índices"},{"simbolo":"VIX","nombre":"VIX Volatilidad","precio":0,"cambio24h":0,"sesgo":"VENTA","confianza":65,"razon":"complacencia de mercado","riesgo":"bajo","sector":"Índices"}]}
Reglas ESTRICTAS: sesgo solo COMPRA, VENTA o NEUTRAL. confianza 55-92. razon máximo 8 palabras. sector siempre "Índices". Incluye EXACTAMENTE: NQ, SP500, RUSSELL, DOW, VIX.
VIX COMPRA = miedo (>25), VENTA = complacencia (<13).`

    const user_msg = `Fecha: ${today}. Precios actuales:\n${pricesCtx}\n\nActualización de monitoreo intradía. Analiza el sesgo actual de los índices en la sesión bursátil en curso.`

    const raw = await runSesgoAgent(system, user_msg)
    const json = repairJSON(raw)
    const data = JSON.parse(json)

    const priceMap: Record<string, typeof nq> = {
      'NQ=F': nq, 'ES=F': sp, 'RTY=F': rut, '^DJI': dow, '%5EDJI': dow, '%5EVIX': vix,
    }
    for (const a of (data.activos ?? []) as Array<{ simbolo: string; precio: number; cambio24h: number }>) {
      const lookup = PRICE_LOOKUP[a.simbolo.toUpperCase()]
      const real = lookup ? priceMap[lookup] : null
      if (real) { a.precio = real.price; a.cambio24h = real.changePct }
    }

    // Compare to morning signals (futuros-sesgo baseline) for change detection
    const today0 = new Date()
    today0.setUTCHours(0, 0, 0, 0)
    const morningSignals = await prisma.cfdSignal.findMany({
      where: { sector: 'Futuros', createdAt: { gte: today0 } },
      select: { simbolo: true, sesgo: true },
    })
    const morningMap = new Map(morningSignals.map(s => [s.simbolo.toUpperCase(), s.sesgo]))

    const activos = (data.activos ?? []) as Array<{
      simbolo: string; nombre: string; precio: number; cambio24h: number
      sesgo: string; confianza: number; razon: string; riesgo: string
    }>

    // Query previous intraday snapshot (30min ago, ±15min tolerance)
    const prevCutoff = new Date(Date.now() - 45 * 60 * 1000)
    const prevFloor  = new Date(Date.now() - 20 * 60 * 1000)
    const prevLogs = await prisma.sesgoIntradayLog.findMany({
      where: { timestamp: { gte: prevCutoff, lt: prevFloor } },
      orderBy: { timestamp: 'desc' },
    })
    const prevMap = new Map(prevLogs.map(l => [l.simbolo.toUpperCase(), l]))

    // Save current snapshot
    await prisma.sesgoIntradayLog.createMany({
      data: activos.map(a => ({
        simbolo: a.simbolo,
        sesgo: a.sesgo,
        confianza: a.confianza,
        cambio24h: a.cambio24h,
        precio: a.precio,
      })),
    })

    const changed = new Set<string>()
    for (const a of activos) {
      const sym = a.simbolo.toUpperCase()
      const prev = morningMap.get(sym)
      if (prev && prev !== a.sesgo) changed.add(sym)
    }

    // Compute per-index recommendation vs previous snapshot
    const recomendaciones = new Map<string, Recomendacion>()
    for (const a of activos) {
      if (a.simbolo === 'VIX') continue
      const sym = a.simbolo.toUpperCase()
      const prev = prevMap.get(sym)
      recomendaciones.set(sym, getRecomendacion(
        a.sesgo, a.confianza,
        prev ? { sesgo: prev.sesgo, confianza: prev.confianza } : undefined,
        morningMap.get(sym),
      ))
    }

    void notifySesgoIntraday(activos, changed, morningMap, prevMap, recomendaciones)

    return NextResponse.json({
      activos: data.activos,
      changed: [...changed],
      recomendaciones: Object.fromEntries(recomendaciones),
      isPreApertura: prevMap.size === 0,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[cron/sesgo-intraday]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export const GET = POST
