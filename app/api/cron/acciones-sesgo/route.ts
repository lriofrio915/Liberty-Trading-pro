import { NextRequest, NextResponse } from 'next/server'
import { runFullAnalysis } from '@/lib/analisis-engine'
import { prisma } from '@/lib/prisma'
import { notifyAccionesSesgo } from '@/lib/notify-nexus'

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
  const isForced = new URL(req.url).searchParams.get('force') === 'true'
  if (!isForced && (utcMinutes < 810 || utcMinutes >= 1200)) {
    return NextResponse.json({
      skipped: 'outside market hours',
      utc: `${now.getUTCHours()}:${now.getUTCMinutes().toString().padStart(2, '0')}`,
    })
  }

  try {
    // Run full MAIA analysis (6 agents via OpenRouter) and extract stocks
    const result = await runFullAnalysis()
    const allActivos = result.activos.filter(a => a.sector === 'Acciones')

    // Query DB: previous snapshot (30min ago ±15min) and morning baseline
    const prevCutoff = new Date(Date.now() - 45 * 60 * 1000)
    const prevFloor  = new Date(Date.now() - 20 * 60 * 1000)
    const today0 = new Date(); today0.setUTCHours(0, 0, 0, 0)
    const stockTickers = allActivos.map(a => a.simbolo)

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
