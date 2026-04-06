// Cron: 9am ET — lunes a viernes
// Ejecuta el análisis completo de mercados y guarda las oportunidades con confianza >= 70%
//
// Se dispara dos veces (EDT y EST schedules en GitHub Actions) para cubrir DST.
// El guard isInNYWindow(9) rechaza el disparo que llega fuera de la ventana ±45 min.

import { NextRequest, NextResponse } from 'next/server'
import { runFullAnalysis } from '@/lib/analisis-engine'
import { prisma } from '@/lib/prisma'
import { getNYDayBoundaries, isInNYWindow, isNYWeekend } from '@/lib/cron-utils'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Guard: skip weekends (NY calendar day)
  if (isNYWeekend()) {
    return NextResponse.json({ ok: true, skipped: 'weekend' })
  }

  // Guard: only run within ±45 min of 9:00 am NY
  // Rejects the off-hour cron that fires during the opposite DST period
  if (!isInNYWindow(9)) {
    return NextResponse.json({ ok: true, skipped: 'outside_ny_window' })
  }

  // Guard: idempotency — only one scan per NY calendar day
  const { todayStart, todayEnd } = getNYDayBoundaries()

  const existing = await prisma.marketScan.findFirst({
    where: { fecha: { gte: todayStart, lte: todayEnd } },
  })
  if (existing) {
    return NextResponse.json({ ok: true, skipped: 'already_scanned', scanId: existing.id })
  }

  // Run analysis
  const result = await runFullAnalysis('moderado')

  const sesgogeneral = result.estrategia?.sesgo_general ?? 'NEUTRAL'
  const resumen = result.estrategia?.resumen ?? null

  // Filter opportunities: confianza >= 70 and sesgo is actionable (not NEUTRAL)
  const oportunidades = result.activos.filter(
    a => a.confianza >= 70 && a.sesgo !== 'NEUTRAL',
  )

  // Save to DB — use NY-day midnight as canonical fecha
  const scan = await prisma.marketScan.create({
    data: {
      fecha: todayStart,
      hora: '09:00 ET',
      sesgogeneral,
      resumen,
      riskProfile: 'moderado',
      oportunidades: {
        create: oportunidades.map(a => ({
          simbolo: a.simbolo,
          nombre: a.nombre,
          sesgo: a.sesgo,
          confianza: a.confianza,
          precio9am: a.precio,
          razon: a.razon ?? null,
          sector: a.sector,
        })),
      },
    },
    include: { oportunidades: true },
  })

  console.log(`[morning-scan] Scan ${scan.id} — ${oportunidades.length} oportunidades`)

  return NextResponse.json({
    ok: true,
    scanId: scan.id,
    sesgogeneral,
    oportunidades: oportunidades.length,
    activos: oportunidades.map(a => `${a.simbolo} (${a.sesgo} ${a.confianza}%)`),
  })
}
