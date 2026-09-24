import { NextRequest, NextResponse } from 'next/server'
import {
  notifyMarketScan,
  notifyMorningAgents,
  notifyScanPricesClose,
  notifyAccionesDailyScanner,
} from '@/lib/notify-nexus'

const CRON_SECRET = process.env.CRON_SECRET || ''

function validateAdmin(req: NextRequest) {
  const auth = req.headers.get('authorization')?.replace('Bearer ', '') || ''
  const query = new URL(req.url).searchParams.get('secret') || ''
  return CRON_SECRET && (auth === CRON_SECRET || query === CRON_SECRET)
}

// GET /api/cron/test-notify?secret=XXX&event=all|market_scan|daily_scanner|...
export async function GET(req: NextRequest) {
  if (!validateAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const event = new URL(req.url).searchParams.get('event') || 'all'
  const sent: string[] = []

  if (event === 'market_scan' || event === 'all') {
    await notifyMarketScan({
      sesgogeneral: 'COMPRA',
      oportunidades: [
        { simbolo: 'AAPL',  nombre: 'Apple Inc',    sesgo: 'COMPRA', confianza: 88, precio9am: 189.50, razon: 'Breakout sobre resistencia semanal', sector: 'Acciones' },
        { simbolo: 'NVDA',  nombre: 'NVIDIA Corp',  sesgo: 'COMPRA', confianza: 85, precio9am: 875.30, razon: 'Momentum AI + volumen institucional',  sector: 'Acciones' },
        { simbolo: 'MSFT',  nombre: 'Microsoft',    sesgo: 'COMPRA', confianza: 82, precio9am: 415.20, razon: 'Soporte en EMA50 + rebote técnico',    sector: 'Acciones' },
        { simbolo: 'BTC',   nombre: 'Bitcoin',      sesgo: 'COMPRA', confianza: 79, precio9am: 68500,  razon: 'Consolidación sobre soporte clave',    sector: 'Crypto'   },
        { simbolo: 'NQ',    nombre: 'Micro Nasdaq',  sesgo: 'COMPRA', confianza: 75, precio9am: 21450,  razon: 'Gap up + apertura alcista',           sector: 'Índices'  },
        { simbolo: 'ORO',   nombre: 'Oro',           sesgo: 'VENTA',  confianza: 70, precio9am: 2315,   razon: 'Resistencia en máximos + DXY fuerte', sector: 'Materiales' },
      ],
    })
    sent.push('market_scan')
  }

  if (event === 'daily_scanner' || event === 'all') {
    await notifyAccionesDailyScanner([
      { stock_code: 'AAPL', operation_advice: 'BUY',  sentiment_score: 82 },
      { stock_code: 'TSLA', operation_advice: 'SELL', sentiment_score: 61 },
      { stock_code: 'AMZN', operation_advice: 'BUY',  sentiment_score: 77 },
      { stock_code: 'META', operation_advice: 'BUY',  sentiment_score: 74 },
    ], ['AAPL', 'TSLA', 'AMZN', 'META'], true)
    sent.push('daily_scanner')
  }

  if (event === 'morning_agents' || event === 'all') {
    await notifyMorningAgents([
      { agent: 'Peter',        picks: [{ ticker: 'AAPL', direction: 'COMPRA', precioEntrada: 189.50 }, { ticker: 'NVDA', direction: 'COMPRA', precioEntrada: 875.30 }] },
      { agent: 'SmallCap',     picks: [{ ticker: 'MARA', direction: 'COMPRA', precioEntrada: 22.10 }] },
    ])
    sent.push('morning_agents')
  }

  if (event === 'scan_prices_close' || event === 'all') {
    await notifyScanPricesClose([
      { simbolo: 'AAPL', sesgo: 'COMPRA', confianza: 88, precio9am: 189.50, rendimiento12pm: 1.2,  rendimientoFlip: null, horaSesgoFlip: null,       rendimiento3pm: 2.4  },
      { simbolo: 'NVDA', sesgo: 'COMPRA', confianza: 85, precio9am: 875.30, rendimiento12pm: 0.8,  rendimientoFlip: null, horaSesgoFlip: null,       rendimiento3pm: 1.9  },
      { simbolo: 'BTC',  sesgo: 'COMPRA', confianza: 79, precio9am: 68500,  rendimiento12pm: -0.4, rendimientoFlip: -1.2, horaSesgoFlip: '11:45 ET', rendimiento3pm: -0.8 },
      { simbolo: 'ORO',  sesgo: 'VENTA',  confianza: 70, precio9am: 2315,   rendimiento12pm: 0.5,  rendimientoFlip: null, horaSesgoFlip: null,       rendimiento3pm: 1.1  },
    ])
    sent.push('scan_prices_close')
  }

  return NextResponse.json({
    ok: true,
    sent,
    events_available: [
      'market_scan', 'daily_scanner', 'morning_agents', 'scan_prices_close', 'all',
    ],
  })
}
