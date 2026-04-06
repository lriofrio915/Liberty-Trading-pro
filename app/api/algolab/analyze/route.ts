// POST /api/algolab/analyze
// Ejecuta el análisis de 57 patrones de velas sobre un dataset y guarda el resultado.
// Sin llamadas de IA — cálculo puro TypeScript. Tiempo esperado < 5s para 10k candles.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getEffectiveAccess } from '@/lib/access'
import { validateCandles } from '@/lib/algolab-parser'
import { analyzePatterns } from '@/lib/algolab-pattern-engine'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    // Auth
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const access = getEffectiveAccess({ plan: dbUser.plan, trialEndsAt: dbUser.trialEndsAt })
    if (!access.canAccessClub) {
      return NextResponse.json({ error: 'Se requiere plan Club' }, { status: 403 })
    }

    // Payload
    const body = await req.json()
    const { datasetId } = body as { datasetId: string }
    if (!datasetId) {
      return NextResponse.json({ error: 'datasetId es requerido' }, { status: 400 })
    }

    // Cargar dataset
    const dataset = await prisma.algoDataset.findFirst({
      where: { id: datasetId, userId: dbUser.id },
    })
    if (!dataset) return NextResponse.json({ error: 'Dataset no encontrado' }, { status: 404 })

    // Validar y limitar candles (cap 10k para consistencia con el route de generate)
    let candles
    try {
      const all = validateCandles(dataset.candles)
      candles = all.length > 10000 ? all.slice(-10000) : all
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error validando candles'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    if (candles.length < 50) {
      return NextResponse.json({ error: 'Dataset insuficiente (mínimo 50 velas)' }, { status: 400 })
    }

    // Ejecutar análisis — sincrónico, sin IA
    const result = analyzePatterns(candles, dataset.symbol, dataset.timeframe)

    // Guardar / actualizar en DB (upsert por datasetId)
    const saved = await prisma.algoPatternReport.upsert({
      where: { datasetId },
      create: {
        userId: dbUser.id,
        datasetId,
        meta: result.meta as never,
        stats: result.stats as never,
        totalScanned: result.totalScanned,
      },
      update: {
        meta: result.meta as never,
        stats: result.stats as never,
        totalScanned: result.totalScanned,
        updatedAt: new Date(),
      },
    })

    console.log(
      `[algolab/analyze] Dataset ${datasetId} — ${result.stats.length} patrones con N>=30 de ${result.totalScanned} analizados`,
    )

    return NextResponse.json({
      reportId: saved.id,
      result,
    })
  } catch (err) {
    console.error('[algolab/analyze POST]', err)
    return NextResponse.json({ error: 'Error interno al analizar patrones' }, { status: 500 })
  }
}
