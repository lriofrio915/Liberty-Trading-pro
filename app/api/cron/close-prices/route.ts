// Cron: 3pm ET (19:00 UTC EDT) — lunes a viernes
// Captura el precio de cierre del mercado (3pm ET) y calcula rendimiento final

import { NextRequest, NextResponse } from 'next/server'
import { fetchYahoo, PRICE_LOOKUP } from '@/lib/analisis-engine'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const maxDuration = 30

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

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setUTCHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setUTCHours(23, 59, 59, 999)

  const scan = await prisma.marketScan.findFirst({
    where: { fecha: { gte: todayStart, lte: todayEnd } },
    include: {
      oportunidades: {
        where: { precio3pm: null },
      },
    },
  })

  if (!scan) {
    return NextResponse.json({ ok: true, skipped: 'no_scan_today' })
  }

  if (scan.oportunidades.length === 0) {
    return NextResponse.json({ ok: true, skipped: 'already_updated' })
  }

  const updates: { id: string; precio3pm: number; rendimiento3pm: number }[] = []

  await Promise.allSettled(
    scan.oportunidades.map(async opp => {
      const ticker = resolveYahooSymbol(opp.simbolo)
      if (!ticker) return

      const priceItem = await fetchYahoo(ticker, opp.nombre)
      if (!priceItem) return

      const rendimiento = calcRendimiento(opp.sesgo, opp.precio9am, priceItem.price)
      updates.push({ id: opp.id, precio3pm: priceItem.price, rendimiento3pm: rendimiento })
    }),
  )

  await Promise.allSettled(
    updates.map(u =>
      prisma.scanOpportunity.update({
        where: { id: u.id },
        data: { precio3pm: u.precio3pm, rendimiento3pm: u.rendimiento3pm },
      }),
    ),
  )

  console.log(`[close-prices] Updated ${updates.length} opportunities for scan ${scan.id}`)

  return NextResponse.json({
    ok: true,
    scanId: scan.id,
    updated: updates.length,
    results: updates.map(u => `${u.id}: ${u.precio3pm} (${u.rendimiento3pm.toFixed(2)}%)`),
  })
}
