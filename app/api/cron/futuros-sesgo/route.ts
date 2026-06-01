import { NextRequest, NextResponse } from 'next/server'
import { fetchYahoo, repairJSON, PRICE_LOOKUP } from '@/lib/analisis-engine'
import { computeFuturesLevels, FUTURES_SPECS } from '@/lib/futures-specs'
import { prisma } from '@/lib/prisma'
import { notifyFuturosSesgo } from '@/lib/notify-nexus'

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

    const user_msg = `Fecha: ${today}. Precios actuales:\n${pricesCtx}\n\nAnaliza el sesgo intradía para operar futuros de índices (velas de 1 minuto, apertura 9:30 AM ET).`

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

    // Build signals for the 3 trading indices (skip VIX and NEUTRAL)
    const activos = (data.activos ?? []) as Array<{
      simbolo: string; nombre: string; precio: number; cambio24h: number
      sesgo: string; confianza: number; razon: string; riesgo: string
    }>

    const toSave = activos.filter(a =>
      a.simbolo !== 'VIX' &&
      (a.sesgo === 'COMPRA' || a.sesgo === 'VENTA') &&
      a.confianza >= 55 &&
      (Object.keys(FUTURES_SPECS) as string[]).includes(a.simbolo.toUpperCase())
    )

    if (toSave.length === 0) {
      void notifyFuturosSesgo(data.activos ?? [], 0)
      return NextResponse.json({ saved: 0, activos: data.activos, message: 'No hay señales direccionales hoy' })
    }

    // Remove today's existing Futuros PENDIENTE signals for these symbols before inserting
    const today0 = new Date()
    today0.setUTCHours(0, 0, 0, 0)
    const simbolos = toSave.map(a => a.simbolo)
    await prisma.cfdSignal.deleteMany({
      where: {
        sector: 'Futuros',
        simbolo: { in: simbolos },
        resultado: 'PENDIENTE',
        createdAt: { gte: today0 },
      },
    })

    const INDEX_NAMES: Record<string, string> = {
      NQ:      'Micro Nasdaq (MNQ)',
      SP500:   'Micro S&P 500 (MES)',
      RUSSELL: 'Micro Russell (M2K)',
    }

    const created: string[] = []
    const savedLevels: { simbolo: string; sesgo: string; precioEntrada: number; stopLoss: number; takeProfit: number; rrRatio: number }[] = []
    for (const a of toSave) {
      const sesgo = a.sesgo as 'COMPRA' | 'VENTA'
      const levels = computeFuturesLevels(sesgo, a.precio, a.simbolo)
      const signal = await prisma.cfdSignal.create({
        data: {
          simbolo:       a.simbolo,
          nombre:        INDEX_NAMES[a.simbolo] ?? a.nombre,
          sector:        'Futuros',
          sesgo,
          confianza:     a.confianza,
          razon:         a.razon,
          active:        true,
          precioEntrada: a.precio,  // placeholder — updated at 9:30am by futuros-open cron
          stopLoss:      levels.stopLoss,
          takeProfit:    levels.takeProfit,
          lotaje:        levels.lotaje,
          riesgoUsd:     levels.riesgoUsd,
          rrRatio:       levels.rrRatio,
          riskProfile:   'moderado',
          resultado:     'PENDIENTE',
        },
      })
      created.push(signal.id)
      savedLevels.push({ simbolo: a.simbolo, sesgo, precioEntrada: a.precio, stopLoss: levels.stopLoss, takeProfit: levels.takeProfit, rrRatio: levels.rrRatio })
    }

    void notifyFuturosSesgo(data.activos ?? [], created.length, savedLevels)

    return NextResponse.json({
      saved: created.length,
      ids: created,
      activos: data.activos,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[cron/futuros-sesgo]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export const GET = POST
