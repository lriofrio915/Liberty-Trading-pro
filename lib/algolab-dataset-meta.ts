// lib/algolab-dataset-meta.ts
// Auto-detección de metadatos del dataset a partir de candles y símbolo

import type { Candle } from './algolab-parser'

export interface DatasetMeta {
  symbol: string
  timeframe: string
  dateFrom: number        // ms UTC
  dateTo: number          // ms UTC
  totalBars: number
  pipValueEstimate: number
  volumeWindowHours: number[]  // horas UTC del bloque de mayor volumen, e.g. [13, 14, 15]
}

// ─── PIP VALUE ESTIMADO ───────────────────────────────────────────────────────

/**
 * Estima el valor por punto (1 pip) según el símbolo del activo.
 * Los valores son aproximados para un lot estándar (100k unidades) en USD.
 */
export function estimatePipValue(symbol: string): number {
  const s = symbol.toUpperCase().replace(/[^A-Z]/g, '')

  // Forex majors cotizados vs USD (denominador USD) — 1 pip = $10 por lot
  if (/^(EURUSD|GBPUSD|AUDUSD|NZDUSD|USDCAD|USDCHF|USDJPY|EURGBP|EURJPY|GBPJPY)/.test(s))
    return 10

  // JPY pairs: pip = 0.01 price → ~$9-$10 per lot (aproximado)
  if (s.endsWith('JPY')) return 10

  // Oro (XAUUSD, GOLD): 1 pt = $1 (contrato estándar 100 oz)
  if (/^(XAUUSD|GOLD)/.test(s)) return 1

  // Plata (XAGUSD, SILVER): 1 pt ≈ $5 (contrato 5000 oz)
  if (/^(XAGUSD|SILVER)/.test(s)) return 5

  // Petróleo (USOIL, WTIUSD, BRENT): 1 pt = $10 (contrato 1000 barrels)
  if (/^(USOIL|WTI|BRENT|OIL)/.test(s)) return 10

  // Índices US (US30, US500, NAS100, SPX): 1 pt = $1-$5
  if (/^(US30|DOW|DJI)/.test(s)) return 1
  if (/^(US500|SPX|SP500)/.test(s)) return 5
  if (/^(NAS100|NDX|NASDAQ)/.test(s)) return 2
  if (/^(GER40|DAX|GER30)/.test(s)) return 1
  if (/^(UK100|FTSE)/.test(s)) return 1

  // Crypto: 1 pt = 1 USD (precio muy alto, fracciones de punto)
  if (/^(BTC|BITCOIN)/.test(s)) return 1
  if (/^(ETH|ETHEREUM)/.test(s)) return 1
  if (/^(SOL|XRP|ADA|DOGE)/.test(s)) return 1

  // Default: 10 (forex estándar)
  return 10
}

// ─── VENTANA DE VOLUMEN ───────────────────────────────────────────────────────

/**
 * Detecta el bloque horario UTC de mayor volumen promedio.
 * Devuelve un array de `windowSize` horas consecutivas (0-23).
 * Si el volumen es cero para todas las barras, retorna todas las horas (sin filtro).
 */
export function detectVolumeWindow(candles: Candle[], windowSize = 3): number[] {
  // Acumular volumen y conteo por hora UTC
  const volByHour = new Array(24).fill(0)
  const cntByHour = new Array(24).fill(0)

  for (const c of candles) {
    const hour = new Date(c.t).getUTCHours()
    volByHour[hour] += c.v
    cntByHour[hour]++
  }

  // Si todo el volumen es 0 (datos sin volumen), no aplicar filtro
  const totalVol = volByHour.reduce((s, v) => s + v, 0)
  if (totalVol === 0) {
    return Array.from({ length: 24 }, (_, i) => i)
  }

  // Promedio por hora
  const avgByHour = volByHour.map((v, i) => (cntByHour[i] > 0 ? v / cntByHour[i] : 0))

  // Suma deslizante circular para encontrar el bloque de windowSize horas con mayor promedio
  let bestStart = 0
  let bestSum = -Infinity

  for (let start = 0; start < 24; start++) {
    let sum = 0
    for (let j = 0; j < windowSize; j++) {
      sum += avgByHour[(start + j) % 24]
    }
    if (sum > bestSum) {
      bestSum = sum
      bestStart = start
    }
  }

  return Array.from({ length: windowSize }, (_, i) => (bestStart + i) % 24)
}

// ─── META PRINCIPAL ───────────────────────────────────────────────────────────

/**
 * Construye el objeto DatasetMeta a partir de los candles y el símbolo del dataset.
 * `timeframe` puede ser pasado desde el dataset (ya detectado por algolab-parser).
 */
export function buildDatasetMeta(
  candles: Candle[],
  symbol: string,
  timeframe: string,
): DatasetMeta {
  const sorted = [...candles].sort((a, b) => a.t - b.t)

  return {
    symbol,
    timeframe,
    dateFrom: sorted[0]?.t ?? 0,
    dateTo: sorted[sorted.length - 1]?.t ?? 0,
    totalBars: sorted.length,
    pipValueEstimate: estimatePipValue(symbol),
    volumeWindowHours: detectVolumeWindow(sorted, 3),
  }
}
