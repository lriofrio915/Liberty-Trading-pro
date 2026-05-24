import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runFullAnalysis } from '@/lib/analisis-engine'
import { calcSignal } from '@/lib/calc-signal'

export const runtime = 'nodejs'
export const maxDuration = 90

const CRON_SECRET = process.env.CRON_SECRET || ''

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '') || new URL(req.url).searchParams.get('secret') || ''
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runFullAnalysis('agresivo')

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
        hora: '10:00 ET',
        sesgogeneral,
        resumen,
        riskProfile: 'agresivo',
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

    // Auto-save high-probability signals (>=80%) as CfdSignal records
    const highConf = oportunidades.filter(a => a.confianza >= 80)
    let autoSaved = 0

    if (highConf.length > 0) {
      // Avoid duplicates: skip symbols that already have a PENDIENTE signal today
      const existing = await prisma.cfdSignal.findMany({
        where: {
          resultado: 'PENDIENTE',
          createdAt: { gte: today },
          simbolo: { in: highConf.map(a => a.simbolo) },
        },
        select: { simbolo: true },
      })
      const existingSymbols = new Set(existing.map(s => s.simbolo))

      const toCreate = highConf
        .filter(a => !existingSymbols.has(a.simbolo))
        .map(a => {
          const sig = calcSignal(
            { simbolo: a.simbolo, nombre: a.nombre, sector: a.sector, sesgo: a.sesgo, confianza: a.confianza, razon: a.razon, precio: a.precio },
            'agresivo',
          )
          return {
            simbolo:       sig.simbolo,
            nombre:        sig.nombre,
            sector:        sig.sector,
            sesgo:         sig.sesgo,
            confianza:     sig.confianza,
            razon:         `[Auto 10am ET] ${sig.razon}`,
            precioEntrada: sig.precioEntrada,
            stopLoss:      sig.stopLoss,
            takeProfit:    sig.takeProfit,
            lotaje:        sig.lotaje,
            riesgoUsd:     sig.riesgoUsd,
            rrRatio:       sig.rrRatio,
            riskProfile:   sig.riskProfile,
            resultado:     'PENDIENTE' as const,
          }
        })

      if (toCreate.length > 0) {
        await prisma.cfdSignal.createMany({ data: toCreate })
        autoSaved = toCreate.length
        console.log(`[market-scan] Auto-saved ${autoSaved} CfdSignal records (>=80% confidence)`)
      }
    }

    console.log(`[market-scan] Created scan ${scan.id} with ${scan.oportunidades.length} opportunities`)
    return NextResponse.json({
      ok: true,
      scanId: scan.id,
      sesgogeneral,
      oportunidades: scan.oportunidades.length,
      autoSavedSignals: autoSaved,
    })
  } catch (err) {
    console.error('[market-scan]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error en market scan' },
      { status: 500 },
    )
  }
}
