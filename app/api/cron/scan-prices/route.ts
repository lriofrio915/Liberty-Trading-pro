import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchYahoo } from '@/lib/analisis-engine'

export const runtime = 'nodejs'
export const maxDuration = 60

const CRON_SECRET = process.env.CRON_SECRET || ''

// Symbol → Yahoo Finance ticker mapping
const YAHOO_MAP: Record<string, string> = {
  BTC:    'BTC-USD',  ETH:    'ETH-USD',  BNB:    'BNB-USD',  XRP:    'XRP-USD',
  AAPL:   'AAPL',     MSFT:   'MSFT',     AMZN:   'AMZN',     NVDA:   'NVDA',
  META:   'META',     GOOGL:  'GOOGL',    TSLA:   'TSLA',
  NQ:     'NQ=F',     SP500:  '^GSPC',    RUSSELL: '^RUT',     DOW:    '^DJI',  VIX: '%5EVIX',
  DXY:    'DX=F',     'EUR/USD': 'EURUSD=X', 'USD/JPY': 'USDJPY=X',
  'USD/CAD': 'USDCAD=X', 'GBP/USD': 'GBPUSD=X',
  ORO:    'GC=F',     WTI:    'CL=F',     PLATA:  'SI=F',
}

function calcRendimiento(precio9am: number, precioNow: number, sesgo: string): number {
  if (precio9am === 0) return 0
  const pct = ((precioNow - precio9am) / precio9am) * 100
  // Positive = señal correcta: COMPRA + precio subió, or VENTA + precio bajó
  return sesgo === 'COMPRA' ? pct : -pct
}

export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams
  const secret = req.headers.get('authorization')?.replace('Bearer ', '') || params.get('secret') || ''
  const checkpoint = params.get('checkpoint') // '12pm' | '3pm'

  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (checkpoint !== '12pm' && checkpoint !== '3pm') {
    return NextResponse.json({ error: 'checkpoint must be 12pm or 3pm' }, { status: 400 })
  }

  try {
    // Get today's scan
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

    const scan = await prisma.marketScan.findFirst({
      where: { fecha: { gte: today, lt: tomorrow } },
      include: { oportunidades: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!scan) {
      return NextResponse.json({ ok: true, message: 'No scan found for today', updated: 0 })
    }

    // Filter: only those without this checkpoint price yet
    const pending = checkpoint === '12pm'
      ? scan.oportunidades.filter(o => o.precio12pm === null)
      : scan.oportunidades.filter(o => o.precio3pm === null)

    if (pending.length === 0) {
      return NextResponse.json({ ok: true, message: 'All prices already updated', updated: 0 })
    }

    // Fetch prices in parallel
    const prices = await Promise.allSettled(
      pending.map(o => {
        const ticker = YAHOO_MAP[o.simbolo] ?? o.simbolo
        return fetchYahoo(ticker, o.simbolo)
      }),
    )

    let updated = 0
    for (let i = 0; i < pending.length; i++) {
      const opp = pending[i]
      const priceResult = prices[i]
      if (priceResult.status !== 'fulfilled' || !priceResult.value) continue

      const precioNow = priceResult.value.price
      const rendimiento = calcRendimiento(opp.precio9am, precioNow, opp.sesgo)

      if (checkpoint === '12pm') {
        await prisma.scanOpportunity.update({
          where: { id: opp.id },
          data: { precio12pm: precioNow, rendimiento12pm: rendimiento },
        })
      } else {
        await prisma.scanOpportunity.update({
          where: { id: opp.id },
          data: { precio3pm: precioNow, rendimiento3pm: rendimiento },
        })
      }
      updated++
    }

    console.log(`[scan-prices-${checkpoint}] Updated ${updated}/${pending.length} opportunities`)
    return NextResponse.json({ ok: true, checkpoint, updated, total: pending.length })
  } catch (err) {
    console.error(`[scan-prices-${checkpoint}]`, err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error actualizando precios' },
      { status: 500 },
    )
  }
}
