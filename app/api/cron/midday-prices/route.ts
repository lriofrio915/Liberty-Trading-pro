// Cron: 12pm ET (16:00 UTC EDT) — lunes a viernes
// Captura el precio de las 12pm para las oportunidades del scan de las 9am y calcula rendimiento

import { NextRequest, NextResponse } from 'next/server'
import { fetchYahoo, PRICE_LOOKUP } from '@/lib/analisis-engine'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const maxDuration = 30

// Maps the simbolo stored in DB back to a Yahoo Finance ticker
function resolveYahooSymbol(simbolo: string): string | null {
  const sym = simbolo.toUpperCase().trim()
  const mapped = PRICE_LOOKUP[sym]
  if (!mapped) return null
  // Some symbols in PRICE_LOOKUP are internal keys (BTC, ETH, SOL) — map to Yahoo
  if (mapped === 'BTC') return 'BTC-USD'
  if (mapped === 'ETH') return 'ETH-USD'
  if (mapped === 'SOL') return 'SOL-USD'
  return mapped
}

function calcRendimiento(sesgo: string, precioEntrada: number, precioSalida: number): number {
  if (sesgo === 'COMPRA') {
    return ((precioSalida - precioEntrada) / precioEntrada) * 100
  }
  // VENTA: ganamos cuando baja
  return ((precioEntrada - precioSalida) / precioEntrada) * 100
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find today's scan
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setUTCHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setUTCHours(23, 59, 59, 999)

  const scan = await prisma.marketScan.findFirst({
    where: { fecha: { gte: todayStart, lte: todayEnd } },
    include: {
      oportunidades: {
        where: { precio12pm: null },
      },
    },
  })

  if (!scan) {
    return NextResponse.json({ ok: true, skipped: 'no_scan_today' })
  }

  if (scan.oportunidades.length === 0) {
    return NextResponse.json({ ok: true, skipped: 'already_updated' })
  }

  // Fetch current prices for each pending opportunity
  const updates: { id: string; precio12pm: number; rendimiento12pm: number }[] = []

  await Promise.allSettled(
    scan.oportunidades.map(async opp => {
      const ticker = resolveYahooSymbol(opp.simbolo)
      if (!ticker) return

      const priceItem = await fetchYahoo(ticker, opp.nombre)
      if (!priceItem) return

      const rendimiento = calcRendimiento(opp.sesgo, opp.precio9am, priceItem.price)
      updates.push({ id: opp.id, precio12pm: priceItem.price, rendimiento12pm: rendimiento })
    }),
  )

  // Batch update
  await Promise.allSettled(
    updates.map(u =>
      prisma.scanOpportunity.update({
        where: { id: u.id },
        data: { precio12pm: u.precio12pm, rendimiento12pm: u.rendimiento12pm },
      }),
    ),
  )

  console.log(`[midday-prices] Updated ${updates.length} opportunities for scan ${scan.id}`)

  return NextResponse.json({
    ok: true,
    scanId: scan.id,
    updated: updates.length,
    results: updates.map(u => `${u.id}: ${u.precio12pm} (${u.rendimiento12pm.toFixed(2)}%)`),
  })
}
