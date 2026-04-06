// lib/algolab-indicators.ts
// Indicadores técnicos en TypeScript puro, sin dependencias externas

import type { Candle } from './algolab-parser'

// ─── UTILIDADES ───────────────────────────────────────────────────────────────

function mean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

function std(arr: number[]): number {
  const m = mean(arr)
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length)
}

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1)
  const result: number[] = new Array(values.length).fill(NaN)
  let seed = values.slice(0, period).reduce((s, v) => s + v, 0) / period
  result[period - 1] = seed
  for (let i = period; i < values.length; i++) {
    seed = values[i] * k + seed * (1 - k)
    result[i] = seed
  }
  return result
}

function sma(values: number[], period: number): number[] {
  const result: number[] = new Array(values.length).fill(NaN)
  for (let i = period - 1; i < values.length; i++) {
    result[i] = values.slice(i - period + 1, i + 1).reduce((s, v) => s + v, 0) / period
  }
  return result
}

// ─── TENDENCIA ────────────────────────────────────────────────────────────────

export function calcSMA(candles: Candle[], period = 20): number[] {
  return sma(candles.map(c => c.c), period)
}

export function calcEMA(candles: Candle[], period = 20): number[] {
  return ema(candles.map(c => c.c), period)
}

export function calcWMA(candles: Candle[], period = 20): number[] {
  const closes = candles.map(c => c.c)
  const result: number[] = new Array(closes.length).fill(NaN)
  const weight = (period * (period + 1)) / 2
  for (let i = period - 1; i < closes.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) sum += closes[i - j] * (period - j)
    result[i] = sum / weight
  }
  return result
}

export interface MACDResult {
  macd: number[]
  signal: number[]
  histogram: number[]
}

export function calcMACD(candles: Candle[], fast = 12, slow = 26, signal = 9): MACDResult {
  const closes = candles.map(c => c.c)
  const fastEMA = ema(closes, fast)
  const slowEMA = ema(closes, slow)
  const macdLine = fastEMA.map((v, i) => (isNaN(v) || isNaN(slowEMA[i]) ? NaN : v - slowEMA[i]))
  const validMacd = macdLine.filter(v => !isNaN(v))
  const signalRaw = ema(validMacd, signal)
  const signalLine: number[] = new Array(macdLine.length).fill(NaN)
  let si = 0
  for (let i = 0; i < macdLine.length; i++) {
    if (!isNaN(macdLine[i])) {
      signalLine[i] = signalRaw[si++] ?? NaN
    }
  }
  const histogram = macdLine.map((v, i) => (isNaN(v) || isNaN(signalLine[i]) ? NaN : v - signalLine[i]))
  return { macd: macdLine, signal: signalLine, histogram }
}

export interface ADXResult {
  adx: number[]
  plusDI: number[]
  minusDI: number[]
}

export function calcADX(candles: Candle[], period = 14): ADXResult {
  const n = candles.length
  const adx: number[] = new Array(n).fill(NaN)
  const plusDI: number[] = new Array(n).fill(NaN)
  const minusDI: number[] = new Array(n).fill(NaN)

  const tr: number[] = new Array(n).fill(0)
  const plusDM: number[] = new Array(n).fill(0)
  const minusDM: number[] = new Array(n).fill(0)

  for (let i = 1; i < n; i++) {
    const hi = candles[i].h, lo = candles[i].l, prevHi = candles[i - 1].h
    const prevLo = candles[i - 1].l, prevC = candles[i - 1].c
    tr[i] = Math.max(hi - lo, Math.abs(hi - prevC), Math.abs(lo - prevC))
    const upMove = hi - prevHi
    const downMove = prevLo - lo
    plusDM[i] = upMove > downMove && upMove > 0 ? upMove : 0
    minusDM[i] = downMove > upMove && downMove > 0 ? downMove : 0
  }

  let sTR = tr.slice(1, period + 1).reduce((s, v) => s + v, 0)
  let sPDM = plusDM.slice(1, period + 1).reduce((s, v) => s + v, 0)
  let sMDM = minusDM.slice(1, period + 1).reduce((s, v) => s + v, 0)
  const dxArr: number[] = []

  for (let i = period; i < n; i++) {
    if (i > period) {
      sTR = sTR - sTR / period + tr[i]
      sPDM = sPDM - sPDM / period + plusDM[i]
      sMDM = sMDM - sMDM / period + minusDM[i]
    }
    const pdi = sTR === 0 ? 0 : (100 * sPDM) / sTR
    const mdi = sTR === 0 ? 0 : (100 * sMDM) / sTR
    plusDI[i] = pdi
    minusDI[i] = mdi
    const sum = pdi + mdi
    const dx = sum === 0 ? 0 : (100 * Math.abs(pdi - mdi)) / sum
    dxArr.push(dx)
    if (dxArr.length >= period) {
      adx[i] = dxArr.slice(-period).reduce((s, v) => s + v, 0) / period
    }
  }

  return { adx, plusDI, minusDI }
}

export function calcParabolicSAR(candles: Candle[], step = 0.02, max = 0.2): number[] {
  const n = candles.length
  const sar: number[] = new Array(n).fill(NaN)
  if (n < 2) return sar

  let bull = true
  let af = step
  let ep = candles[0].h
  sar[0] = candles[0].l

  for (let i = 1; i < n; i++) {
    const prev = sar[i - 1]
    let s = prev + af * (ep - prev)
    if (bull) {
      s = Math.min(s, candles[i - 1].l, i >= 2 ? candles[i - 2].l : candles[i - 1].l)
      if (candles[i].l < s) {
        bull = false; af = step; ep = candles[i].l; s = ep
      } else {
        if (candles[i].h > ep) { ep = candles[i].h; af = Math.min(af + step, max) }
      }
    } else {
      s = Math.max(s, candles[i - 1].h, i >= 2 ? candles[i - 2].h : candles[i - 1].h)
      if (candles[i].h > s) {
        bull = true; af = step; ep = candles[i].h; s = ep
      } else {
        if (candles[i].l < ep) { ep = candles[i].l; af = Math.min(af + step, max) }
      }
    }
    sar[i] = s
  }
  return sar
}

export interface SupertrendResult {
  supertrend: number[]
  trend: number[]  // 1 = alcista, -1 = bajista
}

export function calcSupertrend(candles: Candle[], period = 10, multiplier = 3): SupertrendResult {
  const n = candles.length
  const atr = calcATR(candles, period)
  const supertrend: number[] = new Array(n).fill(NaN)
  const trend: number[] = new Array(n).fill(1)

  let upperBand = 0, lowerBand = 0

  for (let i = period; i < n; i++) {
    const hl2 = (candles[i].h + candles[i].l) / 2
    const newUpper = hl2 + multiplier * atr[i]
    const newLower = hl2 - multiplier * atr[i]

    upperBand = (newUpper < upperBand || candles[i - 1].c > upperBand) ? newUpper : upperBand
    lowerBand = (newLower > lowerBand || candles[i - 1].c < lowerBand) ? newLower : lowerBand

    if (candles[i].c > upperBand) { trend[i] = 1; supertrend[i] = lowerBand }
    else if (candles[i].c < lowerBand) { trend[i] = -1; supertrend[i] = upperBand }
    else { trend[i] = trend[i - 1]; supertrend[i] = trend[i] === 1 ? lowerBand : upperBand }
  }
  return { supertrend, trend }
}

// ─── MOMENTUM ─────────────────────────────────────────────────────────────────

export function calcRSI(candles: Candle[], period = 14): number[] {
  const closes = candles.map(c => c.c)
  const result: number[] = new Array(closes.length).fill(NaN)
  let gains = 0, losses = 0

  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1]
    if (d >= 0) gains += d; else losses -= d
  }

  let avgGain = gains / period
  let avgLoss = losses / period
  result[period] = 100 - 100 / (1 + (avgLoss === 0 ? Infinity : avgGain / avgLoss))

  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1]
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period
    result[i] = 100 - 100 / (1 + (avgLoss === 0 ? Infinity : avgGain / avgLoss))
  }
  return result
}

export interface StochasticResult {
  k: number[]
  d: number[]
}

export function calcStochastic(candles: Candle[], kPeriod = 14, dPeriod = 3): StochasticResult {
  const n = candles.length
  const rawK: number[] = new Array(n).fill(NaN)

  for (let i = kPeriod - 1; i < n; i++) {
    const slice = candles.slice(i - kPeriod + 1, i + 1)
    const highest = Math.max(...slice.map(c => c.h))
    const lowest = Math.min(...slice.map(c => c.l))
    rawK[i] = highest === lowest ? 50 : ((candles[i].c - lowest) / (highest - lowest)) * 100
  }

  const k = sma(rawK.map(v => isNaN(v) ? 0 : v), dPeriod)
  const d = sma(k.map(v => isNaN(v) ? 0 : v), dPeriod)
  return { k, d }
}

export function calcCCI(candles: Candle[], period = 20): number[] {
  const n = candles.length
  const result: number[] = new Array(n).fill(NaN)
  for (let i = period - 1; i < n; i++) {
    const slice = candles.slice(i - period + 1, i + 1)
    const typical = slice.map(c => (c.h + c.l + c.c) / 3)
    const m = mean(typical)
    const d = mean(typical.map(v => Math.abs(v - m)))
    result[i] = d === 0 ? 0 : (typical[typical.length - 1] - m) / (0.015 * d)
  }
  return result
}

export function calcWilliamsR(candles: Candle[], period = 14): number[] {
  const n = candles.length
  const result: number[] = new Array(n).fill(NaN)
  for (let i = period - 1; i < n; i++) {
    const slice = candles.slice(i - period + 1, i + 1)
    const highest = Math.max(...slice.map(c => c.h))
    const lowest = Math.min(...slice.map(c => c.l))
    result[i] = highest === lowest ? -50 : ((highest - candles[i].c) / (highest - lowest)) * -100
  }
  return result
}

export function calcROC(candles: Candle[], period = 12): number[] {
  const closes = candles.map(c => c.c)
  return closes.map((v, i) => i < period || closes[i - period] === 0 ? NaN : ((v - closes[i - period]) / closes[i - period]) * 100)
}

// ─── VOLATILIDAD ──────────────────────────────────────────────────────────────

export interface BollingerResult {
  upper: number[]
  middle: number[]
  lower: number[]
  pctB: number[]
  widthPercent: number[]
}

export function calcBollinger(candles: Candle[], period = 20, stdDev = 2): BollingerResult {
  const closes = candles.map(c => c.c)
  const middle = sma(closes, period)
  const upper: number[] = new Array(closes.length).fill(NaN)
  const lower: number[] = new Array(closes.length).fill(NaN)
  const pctB: number[] = new Array(closes.length).fill(NaN)
  const widthPercent: number[] = new Array(closes.length).fill(NaN)

  for (let i = period - 1; i < closes.length; i++) {
    const s = std(closes.slice(i - period + 1, i + 1))
    upper[i] = middle[i] + stdDev * s
    lower[i] = middle[i] - stdDev * s
    const bw = upper[i] - lower[i]
    pctB[i] = bw === 0 ? 0.5 : (closes[i] - lower[i]) / bw
    widthPercent[i] = middle[i] === 0 ? 0 : bw / middle[i]
  }
  return { upper, middle, lower, pctB, widthPercent }
}

export function calcATR(candles: Candle[], period = 14): number[] {
  const n = candles.length
  const tr: number[] = new Array(n).fill(0)
  const result: number[] = new Array(n).fill(NaN)

  for (let i = 1; i < n; i++) {
    tr[i] = Math.max(
      candles[i].h - candles[i].l,
      Math.abs(candles[i].h - candles[i - 1].c),
      Math.abs(candles[i].l - candles[i - 1].c)
    )
  }

  const sum = tr.slice(1, period + 1).reduce((s, v) => s + v, 0)
  result[period] = sum / period
  for (let i = period + 1; i < n; i++) {
    result[i] = (result[i - 1] * (period - 1) + tr[i]) / period
  }
  return result
}

export interface KeltnerResult {
  upper: number[]
  middle: number[]
  lower: number[]
}

export function calcKeltner(candles: Candle[], period = 20, multiplier = 2): KeltnerResult {
  const closes = candles.map(c => c.c)
  const middle = ema(closes, period)
  const atr = calcATR(candles, period)
  return {
    upper: middle.map((v, i) => isNaN(v) || isNaN(atr[i]) ? NaN : v + multiplier * atr[i]),
    middle,
    lower: middle.map((v, i) => isNaN(v) || isNaN(atr[i]) ? NaN : v - multiplier * atr[i]),
  }
}

// ─── VOLUMEN ──────────────────────────────────────────────────────────────────

export function calcOBV(candles: Candle[]): number[] {
  const result: number[] = new Array(candles.length).fill(0)
  result[0] = candles[0].v
  for (let i = 1; i < candles.length; i++) {
    result[i] = result[i - 1] + (candles[i].c > candles[i - 1].c ? candles[i].v : candles[i].c < candles[i - 1].c ? -candles[i].v : 0)
  }
  return result
}

export function calcMFI(candles: Candle[], period = 14): number[] {
  const n = candles.length
  const result: number[] = new Array(n).fill(NaN)
  for (let i = period; i < n; i++) {
    let posFlow = 0, negFlow = 0
    for (let j = i - period + 1; j <= i; j++) {
      const tp = (candles[j].h + candles[j].l + candles[j].c) / 3
      const prevTp = (candles[j - 1].h + candles[j - 1].l + candles[j - 1].c) / 3
      const mf = tp * candles[j].v
      if (tp > prevTp) posFlow += mf; else negFlow += mf
    }
    result[i] = negFlow === 0 ? 100 : 100 - 100 / (1 + posFlow / negFlow)
  }
  return result
}

export function calcCMF(candles: Candle[], period = 20): number[] {
  const n = candles.length
  const result: number[] = new Array(n).fill(NaN)
  for (let i = period - 1; i < n; i++) {
    let mfvSum = 0, volSum = 0
    for (let j = i - period + 1; j <= i; j++) {
      const range = candles[j].h - candles[j].l
      const mfm = range === 0 ? 0 : ((candles[j].c - candles[j].l) - (candles[j].h - candles[j].c)) / range
      mfvSum += mfm * candles[j].v
      volSum += candles[j].v
    }
    result[i] = volSum === 0 ? 0 : mfvSum / volSum
  }
  return result
}

// ─── CATÁLOGO DE INDICADORES ──────────────────────────────────────────────────

export const INDICATOR_CATALOG = {
  tendencia: [
    { id: 'SMA',         label: 'SMA',           params: { period: 20 } },
    { id: 'EMA',         label: 'EMA',            params: { period: 20 } },
    { id: 'WMA',         label: 'WMA',            params: { period: 20 } },
    { id: 'MACD',        label: 'MACD',           params: { fast: 12, slow: 26, signal: 9 } },
    { id: 'ADX',         label: 'ADX',            params: { period: 14 } },
    { id: 'SAR',         label: 'Parabolic SAR',  params: { step: 0.02, max: 0.2 } },
    { id: 'SUPERTREND',  label: 'Supertrend',     params: { period: 10, multiplier: 3 } },
    { id: 'DONCHIAN',    label: 'Donchian',       params: { period: 20 } },
  ],
  momentum: [
    { id: 'RSI',         label: 'RSI',            params: { period: 14 } },
    { id: 'STOCH',       label: 'Stochastic',     params: { k: 14, d: 3 } },
    { id: 'CCI',         label: 'CCI',            params: { period: 20 } },
    { id: 'WILLIAMS_R',  label: 'Williams %R',    params: { period: 14 } },
    { id: 'ROC',         label: 'ROC',            params: { period: 12 } },
  ],
  volatilidad: [
    { id: 'BB',          label: 'Bollinger Bands',params: { period: 20, stdDev: 2 } },
    { id: 'ATR',         label: 'ATR',            params: { period: 14 } },
    { id: 'KELTNER',     label: 'Keltner Channel',params: { period: 20, multiplier: 2 } },
  ],
  volumen: [
    { id: 'OBV',         label: 'OBV',            params: {} },
    { id: 'MFI',         label: 'MFI',            params: { period: 14 } },
    { id: 'CMF',         label: 'CMF',            params: { period: 20 } },
  ],
}

export type IndicatorId = string

/**
 * Calcula todos los indicadores seleccionados y los retorna como objeto.
 */
export function computeIndicators(candles: Candle[], indicatorIds: IndicatorId[]): Record<string, number[] | object> {
  const result: Record<string, number[] | object> = {}
  for (const id of indicatorIds) {
    switch (id) {
      case 'SMA':        result['SMA_20'] = calcSMA(candles); break
      case 'EMA':        result['EMA_20'] = calcEMA(candles); break
      case 'WMA':        result['WMA_20'] = calcWMA(candles); break
      case 'MACD':       result['MACD'] = calcMACD(candles); break
      case 'ADX':        result['ADX'] = calcADX(candles); break
      case 'SAR':        result['SAR'] = calcParabolicSAR(candles); break
      case 'SUPERTREND': result['SUPERTREND'] = calcSupertrend(candles); break
      case 'RSI':        result['RSI_14'] = calcRSI(candles); break
      case 'STOCH':      result['STOCH'] = calcStochastic(candles); break
      case 'CCI':        result['CCI_20'] = calcCCI(candles); break
      case 'WILLIAMS_R': result['WILLIAMS_R_14'] = calcWilliamsR(candles); break
      case 'ROC':        result['ROC_12'] = calcROC(candles); break
      case 'BB':         result['BB'] = calcBollinger(candles); break
      case 'ATR':        result['ATR_14'] = calcATR(candles); break
      case 'KELTNER':    result['KELTNER'] = calcKeltner(candles); break
      case 'OBV':        result['OBV'] = calcOBV(candles); break
      case 'MFI':        result['MFI_14'] = calcMFI(candles); break
      case 'CMF':        result['CMF_20'] = calcCMF(candles); break
    }
  }
  return result
}
