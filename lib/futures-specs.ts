// Micro futures contract specs: MNQ, MES, M2K
// pointValue = USD per index point for 1 micro contract
// SL/TP in USD fixed for now — will be tuned per asset later
export const FUTURES_SPECS = {
  NQ:      { contract: 'MNQ', yahoo: 'NQ=F',  pointValue: 2, slUsd: 1000, tpUsd: 300 },
  SP500:   { contract: 'MES', yahoo: 'ES=F',  pointValue: 5, slUsd: 1000, tpUsd: 300 },
  RUSSELL: { contract: 'M2K', yahoo: 'RTY=F', pointValue: 5, slUsd: 1000, tpUsd: 300 },
} as const

export type FuturesSymbol = keyof typeof FUTURES_SPECS

export function getFuturesSpec(simbolo: string) {
  const key = simbolo.toUpperCase() as FuturesSymbol
  return FUTURES_SPECS[key] ?? FUTURES_SPECS.NQ
}

export function computeFuturesLevels(
  sesgo: 'COMPRA' | 'VENTA',
  entryPrice: number,
  simbolo: string,
) {
  const spec = getFuturesSpec(simbolo)
  const slPts = spec.slUsd / spec.pointValue
  const tpPts = spec.tpUsd / spec.pointValue
  const sl = parseFloat((sesgo === 'COMPRA' ? entryPrice - slPts : entryPrice + slPts).toFixed(2))
  const tp = parseFloat((sesgo === 'COMPRA' ? entryPrice + tpPts : entryPrice - tpPts).toFixed(2))
  return {
    stopLoss:  sl,
    takeProfit: tp,
    riesgoUsd: spec.slUsd,
    rrRatio:   +(spec.tpUsd / spec.slUsd).toFixed(2),
    lotaje:    1,
  }
}
