// lib/algolab-pattern-backtest.ts
// Motor de backtest para patrones de velas: TP = 3×ATR, SL = 1×ATR
// Regla conservadora: si TP y SL se tocan en la misma barra, gana el SL

import type { Candle } from './algolab-parser'
import { PATTERN_CATALOG } from './algolab-patterns'

// ─── INTERFACES ───────────────────────────────────────────────────────────────

export interface PatternSignal {
  barIndex: number
  patternId: string
  direction: 'LONG' | 'SHORT'
  entryPrice: number    // cierre de la barra señal (entrada a apertura de siguiente)
  atrAtSignal: number
  tpPrice: number
  slPrice: number
}

export interface PatternTradeResult {
  win: boolean
  pnlPts: number           // puntos de precio ganados/perdidos
  exitReason: 'TP' | 'SL' | 'BOTH_SL' | 'TIMEOUT'
}

export interface PatternStats {
  patternId: string
  name: string
  direction: 'LONG' | 'SHORT'
  N: number             // señales válidas (>= 30 para incluir en resultados)
  wins: number
  winRate: number       // 0-1
  totalPnlPts: number
  expectancy: number    // (winRate * 3) - ((1 - winRate) * 1) en múltiplos de ATR
  equityCurve: number[] // PnL acumulado por señal (longitud = N)
}

// ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────

const TP_MULT = 3   // TP = 3 × ATR(14)
const SL_MULT = 1   // SL = 1 × ATR(14)
const MIN_SIGNALS = 30
const MAX_BARS_TIMEOUT = 20  // barras máximas de espera antes de cerrar trade

// ─── CORE ─────────────────────────────────────────────────────────────────────

/**
 * Evalúa una señal individual.
 * Entry: apertura de la barra siguiente a la señal (barIndex + 1)
 * Forward scan: hasta MAX_BARS_TIMEOUT barras hacia adelante
 */
export function backtestSignal(
  candles: Candle[],
  signalBarIndex: number,
  direction: 'LONG' | 'SHORT',
  atr: number,
): PatternTradeResult {
  const entryBarIdx = signalBarIndex + 1
  if (entryBarIdx >= candles.length) {
    return { win: false, pnlPts: -SL_MULT * atr, exitReason: 'TIMEOUT' }
  }

  const entryPrice = candles[entryBarIdx].o
  const tpPts = TP_MULT * atr
  const slPts = SL_MULT * atr

  const tpLevel = direction === 'LONG' ? entryPrice + tpPts : entryPrice - tpPts
  const slLevel = direction === 'LONG' ? entryPrice - slPts : entryPrice + slPts

  // Scan forward
  for (let j = entryBarIdx; j < Math.min(entryBarIdx + MAX_BARS_TIMEOUT, candles.length); j++) {
    const bar = candles[j]

    if (direction === 'LONG') {
      const tpHit = bar.h >= tpLevel
      const slHit = bar.l <= slLevel

      if (tpHit && slHit) {
        // Regla conservadora: si ambos en la misma barra, SL gana
        return { win: false, pnlPts: -slPts, exitReason: 'BOTH_SL' }
      }
      if (tpHit) return { win: true, pnlPts: tpPts, exitReason: 'TP' }
      if (slHit) return { win: false, pnlPts: -slPts, exitReason: 'SL' }
    } else {
      // SHORT
      const tpHit = bar.l <= tpLevel
      const slHit = bar.h >= slLevel

      if (tpHit && slHit) {
        return { win: false, pnlPts: -slPts, exitReason: 'BOTH_SL' }
      }
      if (tpHit) return { win: true, pnlPts: tpPts, exitReason: 'TP' }
      if (slHit) return { win: false, pnlPts: -slPts, exitReason: 'SL' }
    }
  }

  // Timeout: cerrar al precio de cierre de la última barra evaluada
  const lastBar = candles[Math.min(entryBarIdx + MAX_BARS_TIMEOUT - 1, candles.length - 1)]
  const pnlPts = direction === 'LONG'
    ? lastBar.c - entryPrice
    : entryPrice - lastBar.c

  return { win: pnlPts > 0, pnlPts, exitReason: 'TIMEOUT' }
}

/**
 * Calcula estadísticas para un patrón dado su array de señales.
 * Retorna null si no hay suficientes señales (< MIN_SIGNALS).
 */
export function backtestPattern(
  candles: Candle[],
  signals: PatternSignal[],
  patternId: string,
  patternName: string,
  direction: 'LONG' | 'SHORT',
): PatternStats | null {
  if (signals.length < MIN_SIGNALS) return null

  let wins = 0
  let totalPnl = 0
  const equityCurve: number[] = []

  for (const sig of signals) {
    const result = backtestSignal(candles, sig.barIndex, direction, sig.atrAtSignal)
    if (result.win) wins++
    totalPnl += result.pnlPts
    equityCurve.push(totalPnl)
  }

  const N = signals.length
  const winRate = wins / N
  // Expectancy en múltiplos de ATR — más legible e independiente del activo
  const expectancy = winRate * TP_MULT - (1 - winRate) * SL_MULT

  return {
    patternId,
    name: patternName,
    direction,
    N,
    wins,
    winRate,
    totalPnlPts: totalPnl,
    expectancy,
    equityCurve,
  }
}

// ─── SCANNER PRINCIPAL ────────────────────────────────────────────────────────

/**
 * Escanea todos los 57 patrones sobre los candles dados.
 *
 * - `atrArr`: array de ATR(14) pre-calculado (mismo índice que candles)
 * - `volumeWindowHours`: horas UTC donde se aplica el análisis (Fix v2)
 * - Retorna solo los patrones con N >= 30, ordenados por winRate desc
 */
export function runAllPatterns(
  candles: Candle[],
  atrArr: number[],
  volumeWindowHours: number[],
): PatternStats[] {
  const validHours = new Set(volumeWindowHours)
  const results: PatternStats[] = []

  for (const pattern of PATTERN_CATALOG) {
    const signals: PatternSignal[] = []
    const startIdx = pattern.minBars - 1

    for (let i = startIdx; i < candles.length - 1; i++) {
      // Fix v2: la barra señal Y la barra anterior deben estar en la ventana de volumen
      const signalHour = new Date(candles[i].t).getUTCHours()
      const prevHour = new Date(candles[i - Math.max(pattern.minBars - 1, 1)].t).getUTCHours()

      // Si volumeWindowHours cubre las 24 horas, no hay filtro
      if (validHours.size < 24 && (!validHours.has(signalHour) || !validHours.has(prevHour))) {
        continue
      }

      const atr = atrArr[i] ?? 0
      if (atr === 0) continue

      if (pattern.detect(candles, i, atr)) {
        signals.push({
          barIndex: i,
          patternId: pattern.id,
          direction: pattern.direction,
          entryPrice: candles[i + 1]?.o ?? candles[i].c,
          atrAtSignal: atr,
          tpPrice: pattern.direction === 'LONG'
            ? (candles[i + 1]?.o ?? candles[i].c) + TP_MULT * atr
            : (candles[i + 1]?.o ?? candles[i].c) - TP_MULT * atr,
          slPrice: pattern.direction === 'LONG'
            ? (candles[i + 1]?.o ?? candles[i].c) - SL_MULT * atr
            : (candles[i + 1]?.o ?? candles[i].c) + SL_MULT * atr,
        })
      }
    }

    const stats = backtestPattern(candles, signals, pattern.id, pattern.name, pattern.direction)
    if (stats) results.push(stats)
  }

  // Ordenar por winRate descendente por defecto
  results.sort((a, b) => b.winRate - a.winRate)
  return results
}
