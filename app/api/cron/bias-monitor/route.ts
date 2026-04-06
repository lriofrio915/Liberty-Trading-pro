// Cron: cada 30 minutos en horario de mercado (13:00-19:00 UTC EDT, lunes a viernes)
// Detecta si el sesgo de un activo cambió respecto al registrado a las 9am
// Cuando detecta un flip, registra el precio y rendimiento del cierre por cambio de sesgo

import { NextRequest, NextResponse } from 'next/server'
import { runFullAnalysis, fetchYahoo, PRICE_LOOKUP } from '@/lib/analisis-engine'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const maxDuration = 60

function resolveYahooSymbol(simbolo: string): string | null {
  const sym = simbolo.toUpperCase().trim()
  const mapped = PRICE_LOOKUP[sym]
  if (!mapped) return null
  if (mapped === 'BTC') return 'BTC-USD'
  if (mapped === 'ETH') return 'ETH-USD'
  if (mapped === 'SOL') return 'SOL-USD'
  return mapped
}

function calcRendimiento(sesgo: string, precioEntrada: number, precioSalida: number): number {
  if (sesgo === 'COMPRA') {
    return ((precioSalida - precioEntrada) / precioEntrada) * 100
  }
  return ((precioEntrada - precioSalida) / precioEntrada) * 100
}

function getCurrentETTime(): string {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }) + ' ET'
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Skip weekends
  const now = new Date()
  const dayOfWeek = now.getUTCDay()
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return NextResponse.json({ ok: true, skipped: 'weekend' })
  }

  // Find today's scan with pending flip detection (precioSesgoFlip is null)
  const todayStart = new Date(now)
  todayStart.setUTCHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setUTCHours(23, 59, 59, 999)

  const scan = await prisma.marketScan.findFirst({
    where: { fecha: { gte: todayStart, lte: todayEnd } },
    include: {
      oportunidades: {
        where: { precioSesgoFlip: null },
      },
    },
  })

  if (!scan) {
    return NextResponse.json({ ok: true, skipped: 'no_scan_today' })
  }

  if (scan.oportunidades.length === 0) {
    return NextResponse.json({ ok: true, skipped: 'all_flips_detected' })
  }

  // Run fresh analysis to get current biases
  const freshResult = await runFullAnalysis('moderado')

  // Build a map of simbolo → current sesgo from fresh analysis
  const currentBiasMap = new Map<string, string>()
  for (const activo of freshResult.activos) {
    currentBiasMap.set(activo.simbolo.toUpperCase(), activo.sesgo)
  }

  const flips: { simbolo: string; sesgoOriginal: string; sesgoNuevo: string; precio: number; rendimiento: number }[] = []
  const updates: Array<{
    id: string
    precioSesgoFlip: number
    horaSesgoFlip: string
    rendimientoFlip: number
  }> = []

  const horaActual = getCurrentETTime()

  await Promise.allSettled(
    scan.oportunidades.map(async opp => {
      const currentSesgo = currentBiasMap.get(opp.simbolo.toUpperCase())
      if (!currentSesgo) return

      // Flip detected: sesgo changed from original (COMPRA→VENTA, COMPRA→NEUTRAL, VENTA→COMPRA, etc.)
      if (currentSesgo !== opp.sesgo) {
        // Fetch current price for this asset
        const ticker = resolveYahooSymbol(opp.simbolo)
        if (!ticker) return

        const priceItem = await fetchYahoo(ticker, opp.nombre)
        if (!priceItem) return

        const rendimiento = calcRendimiento(opp.sesgo, opp.precio9am, priceItem.price)

        flips.push({
          simbolo: opp.simbolo,
          sesgoOriginal: opp.sesgo,
          sesgoNuevo: currentSesgo,
          precio: priceItem.price,
          rendimiento,
        })

        updates.push({
          id: opp.id,
          precioSesgoFlip: priceItem.price,
          horaSesgoFlip: horaActual,
          rendimientoFlip: rendimiento,
        })
      }
    }),
  )

  // Persist flip detections
  if (updates.length > 0) {
    await Promise.allSettled(
      updates.map(u =>
        prisma.scanOpportunity.update({
          where: { id: u.id },
          data: {
            precioSesgoFlip: u.precioSesgoFlip,
            horaSesgoFlip: u.horaSesgoFlip,
            rendimientoFlip: u.rendimientoFlip,
          },
        }),
      ),
    )
  }

  console.log(`[bias-monitor] Checked ${scan.oportunidades.length} assets — ${flips.length} flips detected`)

  return NextResponse.json({
    ok: true,
    scanId: scan.id,
    checked: scan.oportunidades.length,
    flipsDetected: flips.length,
    flips: flips.map(f => `${f.simbolo}: ${f.sesgoOriginal}→${f.sesgoNuevo} @ ${f.precio} (${f.rendimiento.toFixed(2)}%)`),
  })
}
