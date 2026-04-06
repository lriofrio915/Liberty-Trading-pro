// lib/algolab-pattern-engine.ts
// Orquestador principal: detecta metadatos, calcula ATR y ejecuta el scan de 57 patrones

import type { Candle } from './algolab-parser'
import { calcATR } from './algolab-indicators'
import { buildDatasetMeta } from './algolab-dataset-meta'
import { runAllPatterns } from './algolab-pattern-backtest'
import type { DatasetMeta } from './algolab-dataset-meta'
import type { PatternStats } from './algolab-pattern-backtest'
import { PATTERN_CATALOG } from './algolab-patterns'

// ─── INTERFACES ───────────────────────────────────────────────────────────────

export interface PatternAnalysisResult {
  meta: DatasetMeta
  stats: PatternStats[]   // filtrados: solo N >= 30, ordenados por WR desc
  totalScanned: number    // siempre 57 (total del catálogo)
  generatedAt: number     // timestamp ms
}

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────

/**
 * Analiza un array de candles contra los 57 patrones del catálogo.
 * Retorna el resultado completo: metadatos + estadísticas de patrones.
 *
 * Sincrónico — sin llamadas externas. Tiempo esperado: < 2s para 10k candles.
 */
export function analyzePatterns(
  candles: Candle[],
  symbol: string,
  timeframe: string,
): PatternAnalysisResult {
  // 1. Metadatos del dataset (pip value, ventana de volumen, etc.)
  const meta = buildDatasetMeta(candles, symbol, timeframe)

  // 2. ATR(14) — requerido para TP/SL y algunos detectores de patrones
  const atrArr = calcATR(candles, 14)

  // 3. Scan de todos los patrones en la ventana de volumen
  const stats = runAllPatterns(candles, atrArr, meta.volumeWindowHours)

  return {
    meta,
    stats,
    totalScanned: PATTERN_CATALOG.length,
    generatedAt: Date.now(),
  }
}

// Re-export tipos útiles para los consumidores
export type { DatasetMeta, PatternStats }
