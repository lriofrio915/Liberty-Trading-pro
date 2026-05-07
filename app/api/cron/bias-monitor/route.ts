import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchYahoo } from '@/lib/analisis-engine'

export const runtime = 'nodejs'
export const maxDuration = 30

const CRON_SECRET = process.env.CRON_SECRET || ''

const YAHOO_MAP: Record<string, string> = {
  BTC: 'BTC-USD', ETH: 'ETH-USD', BNB: 'BNB-USD', XRP: 'XRP-USD',
  AAPL: 'AAPL', MSFT: 'MSFT', AMZN: 'AMZN', NVDA: 'NVDA',
  META: 'META', GOOGL: 'GOOGL', TSLA: 'TSLA',
  NQ: 'NQ=F', SP500: '^GSPC', RUSSELL: '^RUT', DOW: '^DJI', VIX: '%5EVIX',
  DXY: 'DX=F', 'EUR/USD': 'EURUSD=X', 'USD/JPY': 'USDJPY=X',
  'USD/CAD': 'USDCAD=X', 'GBP/USD': 'GBPUSD=X',
  ORO: 'GC=F', WTI: 'CL=F', PLATA: 'SI=F',
}

// % move against sesgo that triggers a flip detection
const FLIP_THRESHOLD: Record<string, number> = {
  Crypto:    3.0,
  Acciones:  2.0,
  'Índices': 1.0,
  Divisas:   0.5,
  Materiales: 1.5,
}

function nowET(): string {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }) + ' ET'
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '') || new URL(req.url).searchParams.get('secret') || ''
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

    const scan = await prisma.marketScan.findFirst({
      where: { fecha: { gte: today, lt: tomorrow } },
      include: {
        oportunidades: {
          where: { precioSesgoFlip: null }, // only those not already flipped
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!scan || scan.oportunidades.length === 0) {
      return NextResponse.json({ ok: true, message: 'Nothing to monitor', flips: 0 })
    }

    const prices = await Promise.allSettled(
      scan.oportunidades.map(o => {
        const ticker = YAHOO_MAP[o.simbolo] ?? o.simbolo
        return fetchYahoo(ticker, o.simbolo)
      }),
    )

    let flips = 0
    for (let i = 0; i < scan.oportunidades.length; i++) {
      const opp = scan.oportunidades[i]
      const priceResult = prices[i]
      if (priceResult.status !== 'fulfilled' || !priceResult.value) continue

      const precioNow = priceResult.value.price
      const threshold = FLIP_THRESHOLD[opp.sector] ?? 1.5
      const movePct = ((precioNow - opp.precio9am) / opp.precio9am) * 100

      // Flip detected: COMPRA but price dropped past threshold
      //                VENTA  but price rose  past threshold
      const isFlip =
        (opp.sesgo === 'COMPRA' && movePct <= -threshold) ||
        (opp.sesgo === 'VENTA'  && movePct >= threshold)

      if (isFlip) {
        const rendimientoFlip = opp.sesgo === 'COMPRA' ? movePct : -movePct
        await prisma.scanOpportunity.update({
          where: { id: opp.id },
          data: {
            precioSesgoFlip: precioNow,
            horaSesgoFlip:   nowET(),
            rendimientoFlip,
          },
        })
        flips++
        console.log(`[bias-monitor] Flip: ${opp.simbolo} ${opp.sesgo} → ${movePct.toFixed(2)}% move at ${nowET()}`)
      }
    }

    return NextResponse.json({
      ok: true,
      monitored: scan.oportunidades.length,
      flips,
      hora: nowET(),
    })
  } catch (err) {
    console.error('[bias-monitor]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error en bias monitor' },
      { status: 500 },
    )
  }
}
