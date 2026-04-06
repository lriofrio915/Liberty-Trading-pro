// lib/algolab-backtest.ts
// Motor de backtesting puro TypeScript

import type { Candle } from './algolab-parser'

export interface StrategyRule {
  // Condición de entrada: indicador, comparador, valor/indicador2
  entry: ConditionGroup
  exit: ConditionGroup
  sl: SLTPRule  // Stop Loss
  tp: SLTPRule  // Take Profit
  direction: 'long' | 'short' | 'both'
}

export interface ConditionGroup {
  indicator: string   // e.g. "RSI_14", "EMA_20", "MACD.histogram"
  operator: '>' | '<' | '>=' | '<=' | 'cross_above' | 'cross_below'
  value: number | string  // número o nombre de otro indicador
  andConditions?: ConditionGroup[]
}

export interface SLTPRule {
  type: 'fixed_pct' | 'atr_multiplier' | 'fixed_points'
  value: number
}

export interface BacktestConfig {
  spread: number         // en pips
  slippage: number       // en pips
  lotSize: number        // lotes (1 = 100,000 unidades para forex)
  initialBalance: number // USD
  pipValue: number       // USD por pip por lote (default 10)
  maxTradesOpen: number  // máximo de operaciones simultáneas (default 1)
}

export interface Trade {
  index: number        // índice de la vela de entrada
  entryTime: number    // timestamp
  exitTime: number     // timestamp
  direction: 'long' | 'short'
  entryPrice: number
  exitPrice: number
  sl: number
  tp: number
  pnl: number          // en USD
  pips: number
  duration: number     // en minutos
  exitReason: 'tp' | 'sl' | 'signal'
}

export interface BacktestResult {
  // Rendimiento
  netProfit: number
  grossProfit: number
  grossLoss: number
  profitFactor: number

  // Ratios
  sharpeRatio: number
  sortinoRatio: number
  calmarRatio: number
  recoveryFactor: number
  expectancy: number

  // Drawdown
  maxDrawdown: number
  maxDrawdownPct: number

  // Operativas
  totalTrades: number
  winRate: number
  avgWin: number
  avgLoss: number
  avgTradeDuration: number
  consecutiveWins: number
  consecutiveLosses: number

  // Curvas
  equityCurve: { date: number; equity: number }[]
  trades: Trade[]
}

// ─── EVALUADOR DE CONDICIONES ─────────────────────────────────────────────────

function getIndicatorValue(
  indicators: Record<string, number[] | Record<string, number[]>>,
  key: string,
  index: number
): number {
  // Soporte para "MACD.histogram", "BB.upper", etc.
  const [base, prop] = key.split('.')
  const ind = indicators[base]
  if (!ind) return NaN
  if (prop && typeof ind === 'object' && !Array.isArray(ind)) {
    const arr = (ind as Record<string, number[]>)[prop]
    return arr ? (arr[index] ?? NaN) : NaN
  }
  return Array.isArray(ind) ? (ind[index] ?? NaN) : NaN
}

function evaluateCondition(
  cond: ConditionGroup,
  indicators: Record<string, number[] | Record<string, number[]>>,
  i: number
): boolean {
  const val = getIndicatorValue(indicators, cond.indicator, i)
  if (isNaN(val)) return false

  let threshold: number
  if (typeof cond.value === 'string') {
    threshold = getIndicatorValue(indicators, cond.value, i)
    if (isNaN(threshold)) return false
  } else {
    threshold = cond.value
  }

  let result = false
  switch (cond.operator) {
    case '>':           result = val > threshold; break
    case '<':           result = val < threshold; break
    case '>=':          result = val >= threshold; break
    case '<=':          result = val <= threshold; break
    case 'cross_above': {
      const prevVal = getIndicatorValue(indicators, cond.indicator, i - 1)
      const prevThr = typeof cond.value === 'string'
        ? getIndicatorValue(indicators, cond.value, i - 1)
        : threshold
      result = !isNaN(prevVal) && prevVal < prevThr && val >= threshold
      break
    }
    case 'cross_below': {
      const prevVal = getIndicatorValue(indicators, cond.indicator, i - 1)
      const prevThr = typeof cond.value === 'string'
        ? getIndicatorValue(indicators, cond.value, i - 1)
        : threshold
      result = !isNaN(prevVal) && prevVal > prevThr && val <= threshold
      break
    }
  }

  if (!result) return false
  if (cond.andConditions) {
    return cond.andConditions.every(c => evaluateCondition(c, indicators, i))
  }
  return true
}

// ─── CÁLCULO DE SL/TP ────────────────────────────────────────────────────────

function calcSLTP(
  entryPrice: number,
  direction: 'long' | 'short',
  rule: SLTPRule,
  atr: number
): number {
  const sign = direction === 'long' ? 1 : -1
  switch (rule.type) {
    case 'fixed_pct':        return entryPrice * (1 - sign * rule.value / 100)
    case 'atr_multiplier':   return entryPrice - sign * rule.value * (isNaN(atr) ? entryPrice * 0.001 : atr)
    case 'fixed_points':     return entryPrice - sign * rule.value * 0.0001
    default: return entryPrice * (1 - sign * 0.01)
  }
}

// ─── MOTOR DE BACKTEST ────────────────────────────────────────────────────────

export function runBacktest(
  candles: Candle[],
  indicators: Record<string, number[] | Record<string, number[]>>,
  rule: StrategyRule,
  config: BacktestConfig
): BacktestResult {
  const { spread, slippage, initialBalance, pipValue, lotSize } = config
  const pip = 0.0001
  const spreadCost = (spread + slippage) * pip * pipValue * lotSize

  let equity = initialBalance
  const equityCurve: { date: number; equity: number }[] = [{ date: candles[0]?.t ?? 0, equity }]
  const trades: Trade[] = []

  const atrArr = (indicators['ATR_14'] as number[]) ?? []
  let openTrade: null | { direction: 'long' | 'short'; entry: number; sl: number; tp: number; index: number; time: number } = null

  for (let i = 1; i < candles.length - 1; i++) {
    const c = candles[i]
    const next = candles[i + 1]

    // Chequear cierre de trade abierto
    if (openTrade) {
      const { direction, entry, sl, tp } = openTrade
      let exitPrice: number | null = null
      let exitReason: 'tp' | 'sl' | 'signal' = 'signal'

      if (direction === 'long') {
        if (next.l <= sl)  { exitPrice = sl;  exitReason = 'sl' }
        else if (next.h >= tp) { exitPrice = tp; exitReason = 'tp' }
      } else {
        if (next.h >= sl)  { exitPrice = sl;  exitReason = 'sl' }
        else if (next.l <= tp) { exitPrice = tp; exitReason = 'tp' }
      }

      // Señal de salida inversa
      if (!exitPrice) {
        const exitSignal = evaluateCondition(rule.exit, indicators, i)
        if (exitSignal) { exitPrice = next.o; exitReason = 'signal' }
      }

      if (exitPrice !== null) {
        const priceDiff = direction === 'long' ? exitPrice - entry : entry - exitPrice
        const pips = priceDiff / pip
        const pnl = pips * pipValue * lotSize - spreadCost
        equity += pnl

        trades.push({
          index: openTrade.index,
          entryTime: openTrade.time,
          exitTime: next.t,
          direction,
          entryPrice: entry,
          exitPrice,
          sl, tp, pnl, pips,
          duration: Math.round((next.t - openTrade.time) / 60000),
          exitReason,
        })
        equityCurve.push({ date: next.t, equity })
        openTrade = null
      }
    }

    // Buscar nueva entrada si no hay trade abierto
    if (!openTrade) {
      const entryLong = (rule.direction === 'long' || rule.direction === 'both')
        && evaluateCondition(rule.entry, indicators, i)
      const entryShort = (rule.direction === 'short' || rule.direction === 'both')
        && !entryLong
        && evaluateCondition({ ...rule.entry, operator: rule.entry.operator === 'cross_above' ? 'cross_below' : rule.entry.operator }, indicators, i)

      if (entryLong || entryShort) {
        const direction: 'long' | 'short' = entryLong ? 'long' : 'short'
        const entryPrice = next.o + (direction === 'long' ? 1 : -1) * (spread + slippage) * pip
        const atr = atrArr[i] ?? NaN
        const sl = calcSLTP(entryPrice, direction, rule.sl, atr)
        const tp = calcSLTP(entryPrice, direction === 'long' ? 'short' : 'long', rule.tp, atr) // tp en dirección contraria
        // Recalcular tp en dirección correcta
        const tpCorrect = direction === 'long'
          ? entryPrice + rule.tp.value * (rule.tp.type === 'atr_multiplier' ? (isNaN(atr) ? entryPrice * 0.002 : atr) : rule.tp.type === 'fixed_pct' ? entryPrice * rule.tp.value / 100 : rule.tp.value * 0.0001)
          : entryPrice - rule.tp.value * (rule.tp.type === 'atr_multiplier' ? (isNaN(atr) ? entryPrice * 0.002 : atr) : rule.tp.type === 'fixed_pct' ? entryPrice * rule.tp.value / 100 : rule.tp.value * 0.0001)

        openTrade = { direction, entry: entryPrice, sl, tp: tpCorrect, index: i, time: next.t }
      }
    }
  }

  return computeMetrics(trades, equityCurve, initialBalance)
}

// ─── MÉTRICAS ─────────────────────────────────────────────────────────────────

function computeMetrics(
  trades: Trade[],
  equityCurve: { date: number; equity: number }[],
  initialBalance: number
): BacktestResult {
  if (trades.length === 0) {
    return {
      netProfit: 0, grossProfit: 0, grossLoss: 0, profitFactor: 0,
      sharpeRatio: 0, sortinoRatio: 0, calmarRatio: 0, recoveryFactor: 0, expectancy: 0,
      maxDrawdown: 0, maxDrawdownPct: 0,
      totalTrades: 0, winRate: 0, avgWin: 0, avgLoss: 0, avgTradeDuration: 0,
      consecutiveWins: 0, consecutiveLosses: 0,
      equityCurve, trades,
    }
  }

  const wins = trades.filter(t => t.pnl > 0)
  const losses = trades.filter(t => t.pnl <= 0)
  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0)
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0))
  const netProfit = grossProfit - grossLoss
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 999 : 0) : grossProfit / grossLoss
  const winRate = (wins.length / trades.length) * 100
  const avgWin = wins.length ? grossProfit / wins.length : 0
  const avgLoss = losses.length ? grossLoss / losses.length : 0
  const expectancy = (winRate / 100) * avgWin - (1 - winRate / 100) * avgLoss
  const avgTradeDuration = trades.reduce((s, t) => s + t.duration, 0) / trades.length

  // Drawdown
  let peak = initialBalance, maxDD = 0, maxDDPct = 0
  for (const { equity } of equityCurve) {
    if (equity > peak) peak = equity
    const dd = peak - equity
    const ddPct = peak > 0 ? (dd / peak) * 100 : 0
    if (dd > maxDD) { maxDD = dd; maxDDPct = ddPct }
  }

  // Consecutive wins/losses
  let maxConsecWins = 0, maxConsecLosses = 0, curW = 0, curL = 0
  for (const t of trades) {
    if (t.pnl > 0) { curW++; curL = 0; maxConsecWins = Math.max(maxConsecWins, curW) }
    else { curL++; curW = 0; maxConsecLosses = Math.max(maxConsecLosses, curL) }
  }

  // Sharpe (diario simplificado)
  const pnls = trades.map(t => t.pnl)
  const avgPnl = pnls.reduce((s, v) => s + v, 0) / pnls.length
  const stdPnl = Math.sqrt(pnls.reduce((s, v) => s + (v - avgPnl) ** 2, 0) / pnls.length)
  const sharpeRatio = stdPnl === 0 ? 0 : (avgPnl / stdPnl) * Math.sqrt(252)

  // Sortino
  const negPnls = pnls.filter(v => v < 0)
  const downDev = negPnls.length
    ? Math.sqrt(negPnls.reduce((s, v) => s + v ** 2, 0) / negPnls.length)
    : 0
  const sortinoRatio = downDev === 0 ? (netProfit > 0 ? 999 : 0) : (avgPnl / downDev) * Math.sqrt(252)

  // Calmar (netProfit anualizado / maxDD)
  const calmarRatio = maxDD === 0 ? (netProfit > 0 ? 999 : 0) : netProfit / maxDD

  // Recovery factor
  const recoveryFactor = maxDD === 0 ? (netProfit > 0 ? 999 : 0) : netProfit / maxDD

  return {
    netProfit, grossProfit, grossLoss, profitFactor,
    sharpeRatio, sortinoRatio, calmarRatio, recoveryFactor, expectancy,
    maxDrawdown: maxDD, maxDrawdownPct: maxDDPct,
    totalTrades: trades.length, winRate, avgWin, avgLoss, avgTradeDuration,
    consecutiveWins: maxConsecWins, consecutiveLosses: maxConsecLosses,
    equityCurve, trades,
  }
}
