import { NextRequest, NextResponse } from 'next/server'
import {
  notifyFuturosSesgo,
  notifyMarketScan,
  notifyMorningAgents,
  notifyFuturosOpen,
  notifyFuturosClose,
  notifyMonitorSignals,
  notifyScanPricesClose,
  notifyAccionesDailyScanner,
} from '@/lib/notify-nexus'

const CRON_SECRET = process.env.CRON_SECRET || ''

function validateAdmin(req: NextRequest) {
  const auth = req.headers.get('authorization')?.replace('Bearer ', '') || ''
  const query = new URL(req.url).searchParams.get('secret') || ''
  return CRON_SECRET && (auth === CRON_SECRET || query === CRON_SECRET)
}

// GET /api/cron/test-notify?secret=XXX&event=all|futuros_sesgo|market_scan|...
export async function GET(req: NextRequest) {
  if (!validateAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const event = new URL(req.url).searchParams.get('event') || 'all'
  const sent: string[] = []

  if (event === 'futuros_sesgo' || event === 'all') {
    await notifyFuturosSesgo([
      { simbolo: 'NQ',      nombre: 'Micro Nasdaq',   precio: 21450.50, cambio24h: 0.85,  sesgo: 'COMPRA', confianza: 78, razon: 'Momentum alcista + gap up', riesgo: 'moderado' },
      { simbolo: 'SP500',   nombre: 'Micro S&P 500',  precio: 5820.25,  cambio24h: 0.42,  sesgo: 'COMPRA', confianza: 71, razon: 'Soporte en media móvil 20',  riesgo: 'moderado' },
      { simbolo: 'RUSSELL', nombre: 'Micro Russell',  precio: 2105.75,  cambio24h: -0.18, sesgo: 'VENTA',  confianza: 65, razon: 'Resistencia clave + volumen bajista', riesgo: 'alto' },
      { simbolo: 'VIX',     nombre: 'VIX',            precio: 14.32,    cambio24h: -3.10, sesgo: 'NEUTRAL', confianza: 0, razon: '', riesgo: 'bajo' },
    ], 2)
    sent.push('futuros_sesgo')
  }

  if (event === 'futuros_open' || event === 'all') {
    await notifyFuturosOpen(2)
    sent.push('futuros_open')
  }

  if (event === 'market_scan' || event === 'all') {
    await notifyMarketScan({
      sesgogeneral: 'COMPRA',
      autoSaved: 3,
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
      { agent: 'VanillaLong',  picks: [{ ticker: 'MSFT', direction: 'CALL',   precioEntrada: 415.20 }] },
      { agent: 'VanillaShort', picks: [] },
      { agent: 'Intraday',     picks: [{ ticker: 'TSLA', direction: 'COMPRA', precioEntrada: 248.75 }, { ticker: 'AMD', direction: 'VENTA', precioEntrada: 155.40 }] },
    ])
    sent.push('morning_agents')
  }

  if (event === 'monitor_signals' || event === 'all') {
    await notifyMonitorSignals(12, 2)
    sent.push('monitor_signals')
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

  if (event === 'futuros_close' || event === 'all') {
    await notifyFuturosClose([
      { id: 'sig-001', resultado: 'GANADA',  pnlUsd: 480 },
      { id: 'sig-002', resultado: 'PERDIDA', pnlUsd: -200 },
    ])
    sent.push('futuros_close')
  }

  return NextResponse.json({
    ok: true,
    sent,
    events_available: [
      'futuros_sesgo', 'futuros_open', 'market_scan', 'daily_scanner',
      'morning_agents', 'monitor_signals', 'scan_prices_close', 'futuros_close', 'all',
    ],
  })
}
