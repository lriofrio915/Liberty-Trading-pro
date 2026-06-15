import { NextRequest, NextResponse } from 'next/server'
import { runFullAnalysis } from '@/lib/analisis-engine'
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
  const isForced = new URL(req.url).searchParams.get('force') === 'true'
  if (!isForced && (utcMinutes < 795 || utcMinutes >= 1200)) {
    return NextResponse.json({
      skipped: 'outside market hours',
      utc: `${now.getUTCHours()}:${now.getUTCMinutes().toString().padStart(2, '0')}`,
    })
  }

  try {
    // Run full MAIA analysis (6 agents via OpenRouter) and extract indices
    const result = await runFullAnalysis()
    const activos = result.activos.filter(a => a.sector === 'Índices')

    // Compare to morning signals (futuros-sesgo baseline) for change detection
    const today0 = new Date()
    today0.setUTCHours(0, 0, 0, 0)
    const morningSignals = await prisma.cfdSignal.findMany({
      where: { sector: 'Futuros', createdAt: { gte: today0 } },
      select: { simbolo: true, sesgo: true },
    })
    const morningMap = new Map(morningSignals.map(s => [s.simbolo.toUpperCase(), s.sesgo]))

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
      activos,
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
