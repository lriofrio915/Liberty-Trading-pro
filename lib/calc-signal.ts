export const RISK_USD = 10
export const RR_RATIO = 2.0

export const SL_PCT: Record<string, number> = {
  Crypto:     0.020,
  Acciones:   0.020,
  'Índices':  0.005,
  Divisas:    0.003,
  Materiales: 0.010,
}

export const LOT_MULTIPLIER: Record<string, number> = {
  'EUR/USD': 100000, 'GBP/USD': 100000, 'USD/CAD': 100000, 'USD/JPY': 100000,
  'DXY': 10000,
  'ORO': 100, 'PLATA': 5000, 'WTI': 1000,
  'NQ': 2, 'SP500': 0.5, 'RUSSELL': 1, 'DOW': 1,
  'BTC': 1, 'ETH': 10, 'BNB': 10, 'XRP': 10000,
}

export interface SignalInput {
  simbolo: string
  nombre: string
  sector: string
  sesgo: string
  confianza: number
  razon: string
  precio: number
}

export interface SignalCalc {
  simbolo: string
  nombre: string
  sector: string
  sesgo: string
  confianza: number
  razon: string
  precioEntrada: number
  stopLoss: number
  takeProfit: number
  lotaje: number
  riesgoUsd: number
  rrRatio: number
  riskProfile: string
}

export function calcSignal(asset: SignalInput, riskProfile: string): SignalCalc {
  const entry = asset.precio
  const slPct = SL_PCT[asset.sector] ?? 0.010
  const slDist = entry * slPct
  const tpDist = slDist * RR_RATIO
  const isCompra = asset.sesgo === 'COMPRA'
  const stopLoss = parseFloat((isCompra ? entry - slDist : entry + slDist).toFixed(5))
  const takeProfit = parseFloat((isCompra ? entry + tpDist : entry - tpDist).toFixed(5))
  const mult = LOT_MULTIPLIER[asset.simbolo] ?? 1
  const rawLot = RISK_USD / (slDist * mult)
  const lotaje = parseFloat(Math.max(0.01, rawLot).toFixed(2))

  return {
    simbolo:       asset.simbolo,
    nombre:        asset.nombre,
    sector:        asset.sector,
    sesgo:         asset.sesgo,
    confianza:     asset.confianza,
    razon:         asset.razon,
    precioEntrada: entry,
    stopLoss,
    takeProfit,
    lotaje,
    riesgoUsd:     RISK_USD,
    rrRatio:       RR_RATIO,
    riskProfile,
  }
}
