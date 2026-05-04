import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runFullAnalysis } from '@/lib/analisis-engine'

export const runtime = 'nodejs'
export const maxDuration = 90

const CRON_SECRET = process.env.CRON_SECRET || ''

export async function GET(req: NextRequest) {
  const secret = new URL(req.url).searchParams.get('secret') || ''
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runFullAnalysis('moderado')

    const sesgogeneral = result.estrategia?.sesgo_general ?? 'NEUTRAL'
    const resumen = result.estrategia?.resumen ?? null

    // Filter: confianza >= 70, sesgo direccional, never NEUTRAL
    const oportunidades = result.activos.filter(
      a => a.confianza >= 70 && (a.sesgo === 'COMPRA' || a.sesgo === 'VENTA'),
    )

    // Mark as today's scan date at midnight UTC
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const scan = await prisma.marketScan.create({
      data: {
        fecha: today,
        hora: '09:00 ET',
        sesgogeneral,
        resumen,
        riskProfile: 'moderado',
        oportunidades: {
          create: oportunidades.map(a => ({
            simbolo:   a.simbolo,
            nombre:    a.nombre,
            sesgo:     a.sesgo,
            confianza: a.confianza,
            precio9am: a.precio,
            razon:     a.razon,
            sector:    a.sector,
          })),
        },
      },
      include: { oportunidades: true },
    })

    console.log(`[market-scan] Created scan ${scan.id} with ${scan.oportunidades.length} opportunities`)
    return NextResponse.json({
      ok: true,
      scanId: scan.id,
      sesgogeneral,
      oportunidades: scan.oportunidades.length,
    })
  } catch (err) {
    console.error('[market-scan]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error en market scan' },
      { status: 500 },
    )
  }
}
