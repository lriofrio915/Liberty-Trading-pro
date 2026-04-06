// Cron: 9am ET (13:00 UTC EDT) — lunes a viernes
// Ejecuta el análisis completo de mercados y guarda las oportunidades con confianza >= 70%

import { NextRequest, NextResponse } from 'next/server'
import { runFullAnalysis } from '@/lib/analisis-engine'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Guard: skip weekends
  const now = new Date()
  const dayOfWeek = now.getUTCDay() // 0=Sun, 6=Sat
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return NextResponse.json({ ok: true, skipped: 'weekend' })
  }

  // Guard: idempotency — only one scan per day
  const todayStart = new Date(now)
  todayStart.setUTCHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setUTCHours(23, 59, 59, 999)

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

  // Save to DB
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
