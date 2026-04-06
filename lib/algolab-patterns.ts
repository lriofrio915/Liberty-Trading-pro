// lib/algolab-patterns.ts
// Detectores de 57 patrones de velas japonesas
// Todos son funciones puras: reciben Candle[], índice i (barra señal) y ATR en ese punto

import type { Candle } from './algolab-parser'

// ─── INTERFACES ───────────────────────────────────────────────────────────────

export interface PatternDef {
  id: string
  name: string
  direction: 'LONG' | 'SHORT'
  minBars: 1 | 2 | 3 | 4
  detect(candles: Candle[], i: number, atr: number): boolean
}

// ─── HELPERS PRIMITIVOS ───────────────────────────────────────────────────────

export function bodySize(c: Candle): number {
  return Math.abs(c.c - c.o)
}

export function totalRange(c: Candle): number {
  return c.h - c.l
}

export function upperWick(c: Candle): number {
  return c.h - Math.max(c.o, c.c)
}

export function lowerWick(c: Candle): number {
  return Math.min(c.o, c.c) - c.l
}

export function bodyRatio(c: Candle): number {
  const r = totalRange(c)
  return r === 0 ? 0 : bodySize(c) / r
}

export function isBull(c: Candle): boolean {
  return c.c > c.o
}

export function isBear(c: Candle): boolean {
  return c.c < c.o
}

export function isDoji(c: Candle): boolean {
  return bodyRatio(c) < 0.1
}

export function midpoint(c: Candle): number {
  return (c.o + c.c) / 2
}

// ─── 1 VELA — 20 PATRONES ─────────────────────────────────────────────────────

function detectDoji(cc: Candle[], i: number): boolean {
  const c = cc[i]
  return totalRange(c) > 0 && isDoji(c)
}

function detectGravestoneDoji(cc: Candle[], i: number): boolean {
  const c = cc[i]
  return isDoji(c) && upperWick(c) > totalRange(c) * 0.6 && lowerWick(c) < totalRange(c) * 0.1
}

function detectDragonflyDoji(cc: Candle[], i: number): boolean {
  const c = cc[i]
  return isDoji(c) && lowerWick(c) > totalRange(c) * 0.6 && upperWick(c) < totalRange(c) * 0.1
}

function detectLongLeggedDoji(cc: Candle[], i: number): boolean {
  const c = cc[i]
  return isDoji(c) && upperWick(c) > bodySize(c) * 1.5 && lowerWick(c) > bodySize(c) * 1.5
}

function detectHammer(cc: Candle[], i: number): boolean {
  const c = cc[i]
  if (totalRange(c) === 0) return false
  const lw = lowerWick(c)
  const uw = upperWick(c)
  const bs = bodySize(c)
  return lw > bs * 2 && uw < bs * 0.5 && bodyRatio(c) > 0.05
}

function detectHangingMan(cc: Candle[], i: number): boolean {
  // Misma forma que el martillo pero alcista → señal bajista
  return detectHammer(cc, i)
}

function detectShootingStar(cc: Candle[], i: number): boolean {
  const c = cc[i]
  if (totalRange(c) === 0) return false
  const uw = upperWick(c)
  const lw = lowerWick(c)
  const bs = bodySize(c)
  return uw > bs * 2 && lw < bs * 0.5 && bodyRatio(c) > 0.05
}

function detectInvertedHammer(cc: Candle[], i: number): boolean {
  return detectShootingStar(cc, i)
}

function detectMarubozuBull(cc: Candle[], i: number): boolean {
  const c = cc[i]
  return isBull(c) && bodyRatio(c) > 0.9
}

function detectMarubozuBear(cc: Candle[], i: number): boolean {
  const c = cc[i]
  return isBear(c) && bodyRatio(c) > 0.9
}

function detectSpinningTopBull(cc: Candle[], i: number): boolean {
  const c = cc[i]
  const br = bodyRatio(c)
  const uw = upperWick(c)
  const lw = lowerWick(c)
  return isBull(c) && br > 0.1 && br < 0.4 && uw > bodySize(c) && lw > bodySize(c)
}

function detectSpinningTopBear(cc: Candle[], i: number): boolean {
  const c = cc[i]
  const br = bodyRatio(c)
  const uw = upperWick(c)
  const lw = lowerWick(c)
  return isBear(c) && br > 0.1 && br < 0.4 && uw > bodySize(c) && lw > bodySize(c)
}

function detectCloseNearHigh(cc: Candle[], i: number): boolean {
  const c = cc[i]
  if (totalRange(c) === 0) return false
  return (c.h - c.c) / totalRange(c) < 0.1 && bodyRatio(c) > 0.3
}

function detectCloseNearLow(cc: Candle[], i: number): boolean {
  const c = cc[i]
  if (totalRange(c) === 0) return false
  return (c.c - c.l) / totalRange(c) < 0.1 && bodyRatio(c) > 0.3
}

function detectStrongBull(cc: Candle[], i: number): boolean {
  const c = cc[i]
  return isBull(c) && bodyRatio(c) > 0.7
}

function detectStrongBear(cc: Candle[], i: number): boolean {
  const c = cc[i]
  return isBear(c) && bodyRatio(c) > 0.7
}

function detectUpperWickDominant(cc: Candle[], i: number): boolean {
  const c = cc[i]
  if (totalRange(c) === 0) return false
  return upperWick(c) / totalRange(c) > 0.5 && bodyRatio(c) < 0.35
}

function detectLowerWickDominant(cc: Candle[], i: number): boolean {
  const c = cc[i]
  if (totalRange(c) === 0) return false
  return lowerWick(c) / totalRange(c) > 0.5 && bodyRatio(c) < 0.35
}

function detectGapUp(cc: Candle[], i: number): boolean {
  if (i < 1) return false
  return cc[i].o > cc[i - 1].h
}

function detectGapDown(cc: Candle[], i: number): boolean {
  if (i < 1) return false
  return cc[i].o < cc[i - 1].l
}

// ─── 2 VELAS — 18 PATRONES ────────────────────────────────────────────────────

function detectEngulfingBull(cc: Candle[], i: number): boolean {
  if (i < 1) return false
  const p = cc[i - 1]; const c = cc[i]
  return isBear(p) && isBull(c) && c.o < p.c && c.c > p.o
}

function detectEngulfingBear(cc: Candle[], i: number): boolean {
  if (i < 1) return false
  const p = cc[i - 1]; const c = cc[i]
  return isBull(p) && isBear(c) && c.o > p.c && c.c < p.o
}

function detectHaramiBull(cc: Candle[], i: number): boolean {
  if (i < 1) return false
  const p = cc[i - 1]; const c = cc[i]
  return isBear(p) && bodySize(p) > 0 && isBull(c) &&
    c.o > Math.min(p.o, p.c) && c.c < Math.max(p.o, p.c) &&
    bodySize(c) < bodySize(p) * 0.6
}

function detectHaramiBear(cc: Candle[], i: number): boolean {
  if (i < 1) return false
  const p = cc[i - 1]; const c = cc[i]
  return isBull(p) && bodySize(p) > 0 && isBear(c) &&
    c.o < Math.max(p.o, p.c) && c.c > Math.min(p.o, p.c) &&
    bodySize(c) < bodySize(p) * 0.6
}

function detectInsideBarLong(cc: Candle[], i: number): boolean {
  if (i < 1) return false
  const p = cc[i - 1]; const c = cc[i]
  return c.h < p.h && c.l > p.l && isBull(c)
}

function detectInsideBarShort(cc: Candle[], i: number): boolean {
  if (i < 1) return false
  const p = cc[i - 1]; const c = cc[i]
  return c.h < p.h && c.l > p.l && isBear(c)
}

function detectKickerBull(cc: Candle[], i: number): boolean {
  if (i < 1) return false
  const p = cc[i - 1]; const c = cc[i]
  return isBear(p) && isBull(c) && c.o > p.o && bodyRatio(c) > 0.6 && bodyRatio(p) > 0.6
}

function detectKickerBear(cc: Candle[], i: number): boolean {
  if (i < 1) return false
  const p = cc[i - 1]; const c = cc[i]
  return isBull(p) && isBear(c) && c.o < p.o && bodyRatio(c) > 0.6 && bodyRatio(p) > 0.6
}

function detectTweezerBottom(cc: Candle[], i: number, atr: number): boolean {
  if (i < 1) return false
  const p = cc[i - 1]; const c = cc[i]
  return isBear(p) && isBull(c) && Math.abs(c.l - p.l) < atr * 0.1
}

function detectTweezerTop(cc: Candle[], i: number, atr: number): boolean {
  if (i < 1) return false
  const p = cc[i - 1]; const c = cc[i]
  return isBull(p) && isBear(c) && Math.abs(c.h - p.h) < atr * 0.1
}

function detectRejectionLong(cc: Candle[], i: number): boolean {
  // Vela con mecha inferior larga que cierra alcista — rechazo de soportes
  if (i < 1) return false
  const c = cc[i]
  return isBull(c) && lowerWick(c) > bodySize(c) * 2 && c.l < cc[i - 1].l
}

function detectRejectionShort(cc: Candle[], i: number): boolean {
  // Vela con mecha superior larga que cierra bajista — rechazo de resistencias
  if (i < 1) return false
  const c = cc[i]
  return isBear(c) && upperWick(c) > bodySize(c) * 2 && c.h > cc[i - 1].h
}

function detectFailedBreakDown(cc: Candle[], i: number): boolean {
  // Rompe por debajo del mínimo anterior pero cierra por encima
  if (i < 1) return false
  const p = cc[i - 1]; const c = cc[i]
  return c.l < p.l && c.c > p.l && isBull(c)
}

function detectFailedBreakUp(cc: Candle[], i: number): boolean {
  // Rompe por encima del máximo anterior pero cierra por debajo
  if (i < 1) return false
  const p = cc[i - 1]; const c = cc[i]
  return c.h > p.h && c.c < p.h && isBear(c)
}

function detectLowerLowBull(cc: Candle[], i: number): boolean {
  // Mínimo más bajo pero cierre alcista (reversal potencial)
  if (i < 1) return false
  const p = cc[i - 1]; const c = cc[i]
  return c.l < p.l && isBull(c) && c.c > p.c
}

function detectHigherHighBear(cc: Candle[], i: number): boolean {
  // Máximo más alto pero cierre bajista (reversal potencial)
  if (i < 1) return false
  const p = cc[i - 1]; const c = cc[i]
  return c.h > p.h && isBear(c) && c.c < p.c
}

function detectOnNeck(cc: Candle[], i: number, atr: number): boolean {
  // Vela bajista seguida de alcista que cierra cerca del mínimo de la anterior
  if (i < 1) return false
  const p = cc[i - 1]; const c = cc[i]
  return isBear(p) && isBull(c) && Math.abs(c.c - p.l) < atr * 0.15
}

function detectOnNeckBear(cc: Candle[], i: number, atr: number): boolean {
  // Vela alcista seguida de bajista que cierra cerca del máximo de la anterior
  if (i < 1) return false
  const p = cc[i - 1]; const c = cc[i]
  return isBull(p) && isBear(c) && Math.abs(c.c - p.h) < atr * 0.15
}

// ─── 3 VELAS — 15 PATRONES ────────────────────────────────────────────────────

function detect3WhiteSoldiers(cc: Candle[], i: number): boolean {
  if (i < 2) return false
  const [a, b, c] = [cc[i - 2], cc[i - 1], cc[i]]
  return isBull(a) && isBull(b) && isBull(c) &&
    b.c > a.c && c.c > b.c &&
    b.o > a.o && b.o < a.c &&
    c.o > b.o && c.o < b.c &&
    bodyRatio(a) > 0.5 && bodyRatio(b) > 0.5 && bodyRatio(c) > 0.5
}

function detect3BlackCrows(cc: Candle[], i: number): boolean {
  if (i < 2) return false
  const [a, b, c] = [cc[i - 2], cc[i - 1], cc[i]]
  return isBear(a) && isBear(b) && isBear(c) &&
    b.c < a.c && c.c < b.c &&
    b.o < a.o && b.o > a.c &&
    c.o < b.o && c.o > b.c &&
    bodyRatio(a) > 0.5 && bodyRatio(b) > 0.5 && bodyRatio(c) > 0.5
}

function detect3BullConsec(cc: Candle[], i: number): boolean {
  if (i < 2) return false
  const [a, b, c] = [cc[i - 2], cc[i - 1], cc[i]]
  return isBull(a) && isBull(b) && isBull(c) && b.c > a.c && c.c > b.c
}

function detect3BearConsec(cc: Candle[], i: number): boolean {
  if (i < 2) return false
  const [a, b, c] = [cc[i - 2], cc[i - 1], cc[i]]
  return isBear(a) && isBear(b) && isBear(c) && b.c < a.c && c.c < b.c
}

function detectMorningStar(cc: Candle[], i: number): boolean {
  if (i < 2) return false
  const [a, b, c] = [cc[i - 2], cc[i - 1], cc[i]]
  return isBear(a) && bodyRatio(a) > 0.5 &&
    bodySize(b) < bodySize(a) * 0.4 &&
    isBull(c) && bodyRatio(c) > 0.5 &&
    c.c > midpoint(a)
}

function detectEveningStar(cc: Candle[], i: number): boolean {
  if (i < 2) return false
  const [a, b, c] = [cc[i - 2], cc[i - 1], cc[i]]
  return isBull(a) && bodyRatio(a) > 0.5 &&
    bodySize(b) < bodySize(a) * 0.4 &&
    isBear(c) && bodyRatio(c) > 0.5 &&
    c.c < midpoint(a)
}

function detect3InsideUp(cc: Candle[], i: number): boolean {
  if (i < 2) return false
  const [a, b, c] = [cc[i - 2], cc[i - 1], cc[i]]
  // Harami Bull + confirmación alcista
  return isBear(a) && bodySize(a) > 0 &&
    isBull(b) && b.o > a.c && b.c < a.o &&
    isBull(c) && c.c > a.o
}

function detect3InsideDown(cc: Candle[], i: number): boolean {
  if (i < 2) return false
  const [a, b, c] = [cc[i - 2], cc[i - 1], cc[i]]
  // Harami Bear + confirmación bajista
  return isBull(a) && bodySize(a) > 0 &&
    isBear(b) && b.o < a.c && b.c > a.o &&
    isBear(c) && c.c < a.o
}

function detectHLHigherLow(cc: Candle[], i: number): boolean {
  // Mínimo más alto que el anterior y cierre alcista (estructura alcista)
  if (i < 2) return false
  const [a, b, c] = [cc[i - 2], cc[i - 1], cc[i]]
  return b.l > a.l && c.l > b.l && isBull(c) && c.c > b.h
}

function detectLHLowerHigh(cc: Candle[], i: number): boolean {
  // Máximo más bajo que el anterior y cierre bajista (estructura bajista)
  if (i < 2) return false
  const [a, b, c] = [cc[i - 2], cc[i - 1], cc[i]]
  return b.h < a.h && c.h < b.h && isBear(c) && c.c < b.l
}

function detectOutsideBarBull(cc: Candle[], i: number): boolean {
  // Barra externa alcista: engloba completamente el rango de la anterior
  if (i < 2) return false
  const [a, b, c] = [cc[i - 2], cc[i - 1], cc[i]]
  return b.h < a.h && b.l > a.l && // b es inside bar de a
    c.h > a.h && c.l < a.l && isBull(c) // c es outside bar alcista
}

function detectOutsideBarBear(cc: Candle[], i: number): boolean {
  if (i < 2) return false
  const [a, b, c] = [cc[i - 2], cc[i - 1], cc[i]]
  return b.h < a.h && b.l > a.l &&
    c.h > a.h && c.l < a.l && isBear(c)
}

function detect2HighsBull(cc: Candle[], i: number, atr: number): boolean {
  // Dos máximos similares seguidos de vela alcista de ruptura
  if (i < 2) return false
  const [a, b, c] = [cc[i - 2], cc[i - 1], cc[i]]
  return Math.abs(a.h - b.h) < atr * 0.2 && isBull(c) && c.c > Math.max(a.h, b.h)
}

function detect2LowsBear(cc: Candle[], i: number, atr: number): boolean {
  // Dos mínimos similares seguidos de vela bajista de ruptura
  if (i < 2) return false
  const [a, b, c] = [cc[i - 2], cc[i - 1], cc[i]]
  return Math.abs(a.l - b.l) < atr * 0.2 && isBear(c) && c.c < Math.min(a.l, b.l)
}

// ─── 4 VELAS — 4 PATRONES ─────────────────────────────────────────────────────

function detectBullFlag(cc: Candle[], i: number): boolean {
  // 3 velas alcistas (asta) + pullback bajista (bandera) + cierre alcista
  if (i < 3) return false
  const [a, b, c, d] = [cc[i - 3], cc[i - 2], cc[i - 1], cc[i]]
  const mast = isBull(a) && isBull(b) && isBull(c) && b.c > a.c && c.c > b.c
  const flag = isBear(d) && d.l > a.c && d.c > c.o // pullback dentro del asta
  return mast && flag && isBull(d)
}

function detectBearFlag(cc: Candle[], i: number): boolean {
  // 3 velas bajistas (asta) + pullback alcista (bandera) + cierre bajista
  if (i < 3) return false
  const [a, b, c, d] = [cc[i - 3], cc[i - 2], cc[i - 1], cc[i]]
  const mast = isBear(a) && isBear(b) && isBear(c) && b.c < a.c && c.c < b.c
  const flag = isBull(d) && d.h < a.c && d.c < c.o
  return mast && flag && isBear(d)
}

function detect3BullPullback(cc: Candle[], i: number): boolean {
  // 3 velas alcistas seguidas de pullback (mínimo más alto) → entrada LONG
  if (i < 3) return false
  const [a, b, c, d] = [cc[i - 3], cc[i - 2], cc[i - 1], cc[i]]
  return isBull(a) && isBull(b) && isBull(c) &&
    b.c > a.c && c.c > b.c &&
    isBear(d) && d.l > b.l && // pullback sin romper soporte
    d.c > a.c // cierra por encima del inicio
}

function detect3BearPullback(cc: Candle[], i: number): boolean {
  // 3 velas bajistas seguidas de pullback (máximo más bajo) → entrada SHORT
  if (i < 3) return false
  const [a, b, c, d] = [cc[i - 3], cc[i - 2], cc[i - 1], cc[i]]
  return isBear(a) && isBear(b) && isBear(c) &&
    b.c < a.c && c.c < b.c &&
    isBull(d) && d.h < b.h &&
    d.c < a.c
}

// ─── CATÁLOGO COMPLETO — 57 PATRONES ─────────────────────────────────────────

export const PATTERN_CATALOG: PatternDef[] = [
  // ── 1 VELA ──────────────────────────────────────────────────────────────────
  {
    id: 'DOJI', name: 'Doji', direction: 'LONG', minBars: 1,
    detect: (cc, i) => detectDoji(cc, i),
  },
  {
    id: 'GRAVESTONE_DOJI', name: 'Gravestone Doji', direction: 'SHORT', minBars: 1,
    detect: (cc, i) => detectGravestoneDoji(cc, i),
  },
  {
    id: 'DRAGONFLY_DOJI', name: 'Dragonfly Doji', direction: 'LONG', minBars: 1,
    detect: (cc, i) => detectDragonflyDoji(cc, i),
  },
  {
    id: 'DOJI_LONG_LEGGED', name: 'Doji Long Legged', direction: 'LONG', minBars: 1,
    detect: (cc, i) => detectLongLeggedDoji(cc, i),
  },
  {
    id: 'HAMMER', name: 'Hammer', direction: 'LONG', minBars: 1,
    detect: (cc, i) => detectHammer(cc, i),
  },
  {
    id: 'HANGING_MAN', name: 'Hanging Man', direction: 'SHORT', minBars: 1,
    detect: (cc, i) => detectHangingMan(cc, i),
  },
  {
    id: 'SHOOTING_STAR', name: 'Shooting Star', direction: 'SHORT', minBars: 1,
    detect: (cc, i) => detectShootingStar(cc, i),
  },
  {
    id: 'INVERTED_HAMMER', name: 'Inverted Hammer', direction: 'LONG', minBars: 1,
    detect: (cc, i) => detectInvertedHammer(cc, i),
  },
  {
    id: 'MARUBOZU_BULL', name: 'Marubozu Bull', direction: 'LONG', minBars: 1,
    detect: (cc, i) => detectMarubozuBull(cc, i),
  },
  {
    id: 'MARUBOZU_BEAR', name: 'Marubozu Bear', direction: 'SHORT', minBars: 1,
    detect: (cc, i) => detectMarubozuBear(cc, i),
  },
  {
    id: 'SPINNING_TOP_BULL', name: 'Spinning Top Bull', direction: 'LONG', minBars: 1,
    detect: (cc, i) => detectSpinningTopBull(cc, i),
  },
  {
    id: 'SPINNING_TOP_BEAR', name: 'Spinning Top Bear', direction: 'SHORT', minBars: 1,
    detect: (cc, i) => detectSpinningTopBear(cc, i),
  },
  {
    id: 'CLOSE_NEAR_HIGH', name: 'Close Near High', direction: 'LONG', minBars: 1,
    detect: (cc, i) => detectCloseNearHigh(cc, i),
  },
  {
    id: 'CLOSE_NEAR_LOW', name: 'Close Near Low', direction: 'SHORT', minBars: 1,
    detect: (cc, i) => detectCloseNearLow(cc, i),
  },
  {
    id: 'STRONG_BULL', name: 'Strong Bull', direction: 'LONG', minBars: 1,
    detect: (cc, i) => detectStrongBull(cc, i),
  },
  {
    id: 'STRONG_BEAR', name: 'Strong Bear', direction: 'SHORT', minBars: 1,
    detect: (cc, i) => detectStrongBear(cc, i),
  },
  {
    id: 'UPPER_WICK_DOMINANT', name: 'Upper Wick Dominant', direction: 'SHORT', minBars: 1,
    detect: (cc, i) => detectUpperWickDominant(cc, i),
  },
  {
    id: 'LOWER_WICK_DOMINANT', name: 'Lower Wick Dominant', direction: 'LONG', minBars: 1,
    detect: (cc, i) => detectLowerWickDominant(cc, i),
  },
  {
    id: 'GAP_UP', name: 'Gap Up', direction: 'LONG', minBars: 1,
    detect: (cc, i) => detectGapUp(cc, i),
  },
  {
    id: 'GAP_DOWN', name: 'Gap Down', direction: 'SHORT', minBars: 1,
    detect: (cc, i) => detectGapDown(cc, i),
  },

  // ── 2 VELAS ─────────────────────────────────────────────────────────────────
  {
    id: 'ENGULFING_BULL', name: 'Engulfing Bull', direction: 'LONG', minBars: 2,
    detect: (cc, i) => detectEngulfingBull(cc, i),
  },
  {
    id: 'ENGULFING_BEAR', name: 'Engulfing Bear', direction: 'SHORT', minBars: 2,
    detect: (cc, i) => detectEngulfingBear(cc, i),
  },
  {
    id: 'HARAMI_BULL', name: 'Harami Bull', direction: 'LONG', minBars: 2,
    detect: (cc, i) => detectHaramiBull(cc, i),
  },
  {
    id: 'HARAMI_BEAR', name: 'Harami Bear', direction: 'SHORT', minBars: 2,
    detect: (cc, i) => detectHaramiBear(cc, i),
  },
  {
    id: 'INSIDE_BAR_LONG', name: 'Inside Bar Long', direction: 'LONG', minBars: 2,
    detect: (cc, i) => detectInsideBarLong(cc, i),
  },
  {
    id: 'INSIDE_BAR_SHORT', name: 'Inside Bar Short', direction: 'SHORT', minBars: 2,
    detect: (cc, i) => detectInsideBarShort(cc, i),
  },
  {
    id: 'KICKER_BULL', name: 'Kicker Bull', direction: 'LONG', minBars: 2,
    detect: (cc, i) => detectKickerBull(cc, i),
  },
  {
    id: 'KICKER_BEAR', name: 'Kicker Bear', direction: 'SHORT', minBars: 2,
    detect: (cc, i) => detectKickerBear(cc, i),
  },
  {
    id: 'TWEEZER_BOTTOM', name: 'Tweezer Bottom', direction: 'LONG', minBars: 2,
    detect: (cc, i, atr) => detectTweezerBottom(cc, i, atr),
  },
  {
    id: 'TWEEZER_TOP', name: 'Tweezer Top', direction: 'SHORT', minBars: 2,
    detect: (cc, i, atr) => detectTweezerTop(cc, i, atr),
  },
  {
    id: 'REJECTION_LONG', name: 'Rejection Long', direction: 'LONG', minBars: 2,
    detect: (cc, i) => detectRejectionLong(cc, i),
  },
  {
    id: 'REJECTION_SHORT', name: 'Rejection Short', direction: 'SHORT', minBars: 2,
    detect: (cc, i) => detectRejectionShort(cc, i),
  },
  {
    id: 'FAILED_BREAK_DOWN', name: 'Failed Break Down', direction: 'LONG', minBars: 2,
    detect: (cc, i) => detectFailedBreakDown(cc, i),
  },
  {
    id: 'FAILED_BREAK_UP', name: 'Failed Break Up', direction: 'SHORT', minBars: 2,
    detect: (cc, i) => detectFailedBreakUp(cc, i),
  },
  {
    id: 'LOWER_LOW_BULL', name: 'Lower Low Bull', direction: 'LONG', minBars: 2,
    detect: (cc, i) => detectLowerLowBull(cc, i),
  },
  {
    id: 'HIGHER_HIGH_BEAR', name: 'Higher High Bear', direction: 'SHORT', minBars: 2,
    detect: (cc, i) => detectHigherHighBear(cc, i),
  },
  {
    id: 'ON_NECK', name: 'On Neck', direction: 'LONG', minBars: 2,
    detect: (cc, i, atr) => detectOnNeck(cc, i, atr),
  },
  {
    id: 'ON_NECK_BEAR', name: 'On Neck Bear', direction: 'SHORT', minBars: 2,
    detect: (cc, i, atr) => detectOnNeckBear(cc, i, atr),
  },

  // ── 3 VELAS ─────────────────────────────────────────────────────────────────
  {
    id: '3_WHITE_SOLDIERS', name: '3 White Soldiers', direction: 'LONG', minBars: 3,
    detect: (cc, i) => detect3WhiteSoldiers(cc, i),
  },
  {
    id: '3_BLACK_CROWS', name: '3 Black Crows', direction: 'SHORT', minBars: 3,
    detect: (cc, i) => detect3BlackCrows(cc, i),
  },
  {
    id: '3_BULL_CONSEC', name: '3 Bull Consec', direction: 'LONG', minBars: 3,
    detect: (cc, i) => detect3BullConsec(cc, i),
  },
  {
    id: '3_BEAR_CONSEC', name: '3 Bear Consec', direction: 'SHORT', minBars: 3,
    detect: (cc, i) => detect3BearConsec(cc, i),
  },
  {
    id: 'MORNING_STAR', name: 'Morning Star', direction: 'LONG', minBars: 3,
    detect: (cc, i) => detectMorningStar(cc, i),
  },
  {
    id: 'EVENING_STAR', name: 'Evening Star', direction: 'SHORT', minBars: 3,
    detect: (cc, i) => detectEveningStar(cc, i),
  },
  {
    id: '3_INSIDE_UP', name: '3 Inside Up', direction: 'LONG', minBars: 3,
    detect: (cc, i) => detect3InsideUp(cc, i),
  },
  {
    id: '3_INSIDE_DOWN', name: '3 Inside Down', direction: 'SHORT', minBars: 3,
    detect: (cc, i) => detect3InsideDown(cc, i),
  },
  {
    id: 'HL_HIGHER_LOW', name: 'HL Higher Low', direction: 'LONG', minBars: 3,
    detect: (cc, i) => detectHLHigherLow(cc, i),
  },
  {
    id: 'LH_LOWER_HIGH', name: 'LH Lower High', direction: 'SHORT', minBars: 3,
    detect: (cc, i) => detectLHLowerHigh(cc, i),
  },
  {
    id: 'OUTSIDE_BAR_BULL', name: 'Outside Bar Bull', direction: 'LONG', minBars: 3,
    detect: (cc, i) => detectOutsideBarBull(cc, i),
  },
  {
    id: 'OUTSIDE_BAR_BEAR', name: 'Outside Bar Bear', direction: 'SHORT', minBars: 3,
    detect: (cc, i) => detectOutsideBarBear(cc, i),
  },
  {
    id: '2_HIGHS_BULL', name: '2 Highs Bull', direction: 'LONG', minBars: 3,
    detect: (cc, i, atr) => detect2HighsBull(cc, i, atr),
  },
  {
    id: '2_LOWS_BEAR', name: '2 Lows Bear', direction: 'SHORT', minBars: 3,
    detect: (cc, i, atr) => detect2LowsBear(cc, i, atr),
  },
  // Patrón 57: Spinning Top Reversal (3 velas: tendencia + spinning top + confirmación)
  {
    id: 'SPINNING_REVERSAL_BULL', name: 'Spinning Top Reversal Bull', direction: 'LONG', minBars: 3,
    detect: (cc, i) => {
      if (i < 2) return false
      const [a, b, c] = [cc[i - 2], cc[i - 1], cc[i]]
      return isBear(a) && detectSpinningTopBull(cc, i - 1) && isBull(c) && c.c > midpoint(a) &&
        b.l < a.l // spinning top hace mínimo en zona de soporte
    },
  },
  {
    id: 'SPINNING_REVERSAL_BEAR', name: 'Spinning Top Reversal Bear', direction: 'SHORT', minBars: 3,
    detect: (cc, i) => {
      if (i < 2) return false
      const [a, b, c] = [cc[i - 2], cc[i - 1], cc[i]]
      return isBull(a) && detectSpinningTopBear(cc, i - 1) && isBear(c) && c.c < midpoint(a) &&
        b.h > a.h
    },
  },

  // ── 4 VELAS ─────────────────────────────────────────────────────────────────
  {
    id: 'BULL_FLAG', name: 'Bull Flag', direction: 'LONG', minBars: 4,
    detect: (cc, i) => detectBullFlag(cc, i),
  },
  {
    id: 'BEAR_FLAG', name: 'Bear Flag', direction: 'SHORT', minBars: 4,
    detect: (cc, i) => detectBearFlag(cc, i),
  },
  {
    id: '3_BULL_PULLBACK', name: '3 Bull + Pullback', direction: 'LONG', minBars: 4,
    detect: (cc, i) => detect3BullPullback(cc, i),
  },
  {
    id: '3_BEAR_PULLBACK', name: '3 Bear + Pullback', direction: 'SHORT', minBars: 4,
    detect: (cc, i) => detect3BearPullback(cc, i),
  },
]
