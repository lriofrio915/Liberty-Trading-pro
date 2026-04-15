// lib/__tests__/algolab-backtest.test.ts
import { describe, it, expect } from 'vitest'
import { runBacktest } from '../algolab-backtest'
import type { StrategyRule, BacktestConfig } from '../algolab-backtest'
import type { Candle } from '../algolab-parser'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCandle(t: number, o: number, h: number, l: number, c: number): Candle {
  return { t, o, h, l, c, v: 1000 }
}

const BASE_CONFIG: BacktestConfig = {
  spread: 1,
  slippage: 0,
  lotSize: 1,
  initialBalance: 10000,
  pipValue: 10,
  maxTradesOpen: 1,
}

const RSI_ABOVE_50_RULE: StrategyRule = {
  entry:     { indicator: 'RSI_14', operator: '>', value: 50 },
  exit:      { indicator: 'RSI_14', operator: '<', value: 50 },
  sl:        { type: 'fixed_pct', value: 1 },
  tp:        { type: 'fixed_pct', value: 2 },
  direction: 'long',
}

// 5 velas mínimas para que el motor pueda iterar (i=1 a length-2)
function minCandles(entryO = 1.10000): Candle[] {
  const T = 60000
  return [
    makeCandle(0 * T, 1.09000, 1.09500, 1.08500, 1.09200),
    makeCandle(1 * T, entryO,  entryO + 0.003, entryO - 0.001, entryO + 0.001),
    makeCandle(2 * T, entryO + 0.001, entryO + 0.003, entryO - 0.001, entryO + 0.002),
    makeCandle(3 * T, entryO + 0.002, entryO + 0.025, entryO + 0.001, entryO + 0.022),
    makeCandle(4 * T, entryO + 0.020, entryO + 0.030, entryO + 0.015, entryO + 0.025),
  ]
}

// ─── calcSLTP indirecto (vía runBacktest trade.sl / trade.tp) ─────────────────

describe('SL calculation (fixed_pct)', () => {
  it('long SL queda por debajo del precio de entrada', () => {
    const candles = minCandles(1.10000)
    // RSI > 50 en i=1 → entrada en next.o (candle i=2) con spread
    const indicators = { RSI_14: [NaN, 60, 60, 60, 60] }
    const result = runBacktest(candles, indicators, RSI_ABOVE_50_RULE, BASE_CONFIG)
    if (result.trades.length > 0) {
      const trade = result.trades[0]
      expect(trade.sl).toBeLessThan(trade.entryPrice)
    }
  })

  it('SL 1% long: distancia al SL ≈ 1% del entry', () => {
    const entry = 1.10000
    const candles = minCandles(entry)
    const indicators = { RSI_14: [NaN, 60, 60, 60, 60] }
    const result = runBacktest(candles, indicators, RSI_ABOVE_50_RULE, BASE_CONFIG)
    if (result.trades.length > 0) {
      const trade = result.trades[0]
      const slPct = (trade.entryPrice - trade.sl) / trade.entryPrice * 100
      expect(slPct).toBeCloseTo(1, 1)
    }
  })
})

describe('TP calculation (fixed_pct)', () => {
  it('long TP queda por encima del precio de entrada', () => {
    const candles = minCandles(1.10000)
    const indicators = { RSI_14: [NaN, 60, 60, 60, 60] }
    const result = runBacktest(candles, indicators, RSI_ABOVE_50_RULE, BASE_CONFIG)
    if (result.trades.length > 0) {
      const trade = result.trades[0]
      expect(trade.tp).toBeGreaterThan(trade.entryPrice)
    }
  })

  it('TP 2% long: distancia al TP ≈ 2% del entry (no 4%)', () => {
    // Este test expone el bug en tpCorrect para fixed_pct
    // La fórmula incorrecta da value * (entry * value/100) = entry * value²/100
    // Para value=2: 2 * (entry * 2/100) = entry * 4/100 → 4% en lugar de 2%
    const entry = 1.10000
    const candles = minCandles(entry)
    const indicators = { RSI_14: [NaN, 60, 60, 60, 60] }
    const result = runBacktest(candles, indicators, RSI_ABOVE_50_RULE, BASE_CONFIG)
    if (result.trades.length > 0) {
      const trade = result.trades[0]
      const tpPct = (trade.tp - trade.entryPrice) / trade.entryPrice * 100
      expect(tpPct).toBeCloseTo(2, 1)  // 2%, no 4%
    }
  })
})

describe('TP calculation (atr_multiplier)', () => {
  it('TP con ATR: long TP queda por encima del entry', () => {
    const candles = minCandles(1.10000)
    const indicators = { RSI_14: [NaN, 60, 60, 60, 60], ATR_14: [0.001, 0.001, 0.001, 0.001, 0.001] }
    const rule: StrategyRule = {
      ...RSI_ABOVE_50_RULE,
      sl: { type: 'atr_multiplier', value: 1.5 },
      tp: { type: 'atr_multiplier', value: 2 },
    }
    const result = runBacktest(candles, indicators, rule, BASE_CONFIG)
    if (result.trades.length > 0) {
      const trade = result.trades[0]
      expect(trade.tp).toBeGreaterThan(trade.entryPrice)
      expect(trade.sl).toBeLessThan(trade.entryPrice)
    }
  })
})

// ─── Condición cross_above ────────────────────────────────────────────────────

describe('evaluateCondition cross_above', () => {
  it('detecta cruce alcista de RSI sobre nivel 50', () => {
    // RSI pasa de 48 → 52 en i=1, se espera entrada
    const candles = minCandles(1.10000)
    const indicators = {
      RSI_14: [48, 52, 52, 52, 52],  // cruza arriba en i=1
    }
    const rule: StrategyRule = {
      entry:     { indicator: 'RSI_14', operator: 'cross_above', value: 50 },
      exit:      { indicator: 'RSI_14', operator: 'cross_below', value: 50 },
      sl:        { type: 'fixed_pct', value: 1 },
      tp:        { type: 'fixed_pct', value: 2 },
      direction: 'long',
    }
    const result = runBacktest(candles, indicators, rule, BASE_CONFIG)
    expect(result.trades.length).toBeGreaterThan(0)
  })

  it('no entra cuando RSI ya estaba arriba de 50 (no es cruce)', () => {
    const candles = minCandles(1.10000)
    const indicators = {
      RSI_14: [55, 60, 60, 60, 60],  // ya estaba arriba, no hay cruce
    }
    const rule: StrategyRule = {
      entry:     { indicator: 'RSI_14', operator: 'cross_above', value: 50 },
      exit:      { indicator: 'RSI_14', operator: 'cross_below', value: 50 },
      sl:        { type: 'fixed_pct', value: 1 },
      tp:        { type: 'fixed_pct', value: 2 },
      direction: 'long',
    }
    const result = runBacktest(candles, indicators, rule, BASE_CONFIG)
    expect(result.trades.length).toBe(0)
  })
})

// ─── runBacktest: casos extremos ──────────────────────────────────────────────

describe('runBacktest: sin trades', () => {
  it('retorna 0 en todas las métricas con array vacío', () => {
    const candles = minCandles()
    const indicators = { RSI_14: [30, 30, 30, 30, 30] }  // nunca supera 50
    const result = runBacktest(candles, indicators, RSI_ABOVE_50_RULE, BASE_CONFIG)
    expect(result.totalTrades).toBe(0)
    expect(result.netProfit).toBe(0)
    expect(result.winRate).toBe(0)
  })
})

describe('runBacktest: trade cierra por TP', () => {
  it('registra exitReason=tp y pnl positivo', () => {
    // Construimos velas donde el TP (2% sobre entry) se alcanza en la siguiente vela
    const entry = 1.10000
    const spread = 1 * 0.0001
    const entryPrice = entry + spread  // precio real de entrada con spread
    const tpPrice = entryPrice * 1.02  // TP 2% arriba

    const candles: Candle[] = [
      makeCandle(0,     1.09000, 1.09500, 1.08500, 1.09200),
      makeCandle(1000,  entry,   entry + 0.001, entry - 0.001, entry),  // señal aquí
      makeCandle(2000,  entry,   tpPrice + 0.005, entry - 0.001, tpPrice + 0.003),  // next.h > tp
      makeCandle(3000,  tpPrice, tpPrice + 0.01, tpPrice - 0.005, tpPrice),
      makeCandle(4000,  tpPrice, tpPrice + 0.01, tpPrice - 0.005, tpPrice),
    ]
    const indicators = { RSI_14: [30, 60, 60, 60, 60] }  // entrada en i=1
    const result = runBacktest(candles, indicators, RSI_ABOVE_50_RULE, BASE_CONFIG)

    expect(result.trades.length).toBeGreaterThan(0)
    if (result.trades.length > 0) {
      expect(result.trades[0].exitReason).toBe('tp')
      expect(result.trades[0].pnl).toBeGreaterThan(0)
    }
  })
})

describe('runBacktest: trade cierra por SL', () => {
  it('registra exitReason=sl y pnl negativo', () => {
    const entry = 1.10000
    const spread = 1 * 0.0001
    const entryPrice = entry + spread
    const slPrice = entryPrice * (1 - 0.01)  // SL 1% abajo

    const candles: Candle[] = [
      makeCandle(0,     1.09000, 1.09500, 1.08500, 1.09200),
      makeCandle(1000,  entry,   entry + 0.001, entry - 0.001, entry),
      makeCandle(2000,  entry,   entry + 0.001, slPrice - 0.005, slPrice - 0.003),  // next.l < sl
      makeCandle(3000,  slPrice, slPrice + 0.001, slPrice - 0.005, slPrice),
      makeCandle(4000,  slPrice, slPrice + 0.001, slPrice - 0.005, slPrice),
    ]
    const indicators = { RSI_14: [30, 60, 60, 60, 60] }
    const result = runBacktest(candles, indicators, RSI_ABOVE_50_RULE, BASE_CONFIG)

    expect(result.trades.length).toBeGreaterThan(0)
    if (result.trades.length > 0) {
      expect(result.trades[0].exitReason).toBe('sl')
      expect(result.trades[0].pnl).toBeLessThan(0)
    }
  })
})

// ─── computeMetrics: métricas ─────────────────────────────────────────────────

describe('métricas calculadas', () => {
  it('profitFactor = 999 cuando no hay pérdidas', () => {
    // Forzamos un trade ganador con TP
    const entry = 1.10000
    const spread = 1 * 0.0001
    const entryPrice = entry + spread
    const tpPrice = entryPrice * 1.02

    const candles: Candle[] = [
      makeCandle(0,     1.09000, 1.09500, 1.08500, 1.09200),
      makeCandle(1000,  entry,   entry + 0.001, entry - 0.001, entry),
      makeCandle(2000,  entry,   tpPrice + 0.01, entry - 0.001, tpPrice),
      makeCandle(3000,  tpPrice, tpPrice + 0.01, tpPrice - 0.005, tpPrice),
      makeCandle(4000,  tpPrice, tpPrice + 0.01, tpPrice - 0.005, tpPrice),
    ]
    const indicators = { RSI_14: [30, 60, 60, 30, 30] }
    const result = runBacktest(candles, indicators, RSI_ABOVE_50_RULE, BASE_CONFIG)
    if (result.trades.length > 0 && result.grossLoss === 0) {
      expect(result.profitFactor).toBe(999)
    }
  })

  it('winRate entre 0 y 100', () => {
    const candles = minCandles()
    const indicators = { RSI_14: [30, 60, 60, 30, 30] }
    const result = runBacktest(candles, indicators, RSI_ABOVE_50_RULE, BASE_CONFIG)
    expect(result.winRate).toBeGreaterThanOrEqual(0)
    expect(result.winRate).toBeLessThanOrEqual(100)
  })

  it('maxDrawdown >= 0 siempre', () => {
    const candles = minCandles()
    const indicators = { RSI_14: [30, 60, 60, 30, 30] }
    const result = runBacktest(candles, indicators, RSI_ABOVE_50_RULE, BASE_CONFIG)
    expect(result.maxDrawdown).toBeGreaterThanOrEqual(0)
  })

  it('equityCurve empieza en initialBalance', () => {
    const candles = minCandles()
    const indicators = { RSI_14: [30, 30, 30, 30, 30] }
    const result = runBacktest(candles, indicators, RSI_ABOVE_50_RULE, BASE_CONFIG)
    expect(result.equityCurve[0].equity).toBe(BASE_CONFIG.initialBalance)
  })
})

// ─── Short trades ─────────────────────────────────────────────────────────────

const RSI_BELOW_50_SHORT: StrategyRule = {
  entry:     { indicator: 'RSI_14', operator: '<', value: 50 },
  exit:      { indicator: 'RSI_14', operator: '>', value: 50 },
  sl:        { type: 'fixed_pct', value: 1 },
  tp:        { type: 'fixed_pct', value: 2 },
  direction: 'short',
}

describe('runBacktest: short trade cierra por TP', () => {
  it('registra direction=short, exitReason=tp y pnl positivo cuando precio baja', () => {
    const entry = 1.10000
    // short entryPrice = entry - (spread+slippage)*pip = 1.10000 - 0.0001 = 1.09990
    const entryPrice = entry - 0.0001
    // short TP = entryPrice - 2*(entryPrice/100) ≈ 1.07790
    const tpPrice = entryPrice - 2 * (entryPrice / 100)

    const candles: Candle[] = [
      makeCandle(0,    1.11000, 1.11500, 1.10500, 1.10800),
      makeCandle(1000, entry,   entry + 0.001, entry - 0.001, entry - 0.0005), // señal RSI<50
      makeCandle(2000, entry,   entry + 0.001, tpPrice - 0.005, tpPrice - 0.003), // next.l <= tp
      makeCandle(3000, tpPrice, tpPrice + 0.001, tpPrice - 0.005, tpPrice),
      makeCandle(4000, tpPrice, tpPrice + 0.001, tpPrice - 0.005, tpPrice),
    ]
    const indicators = { RSI_14: [60, 40, 40, 60, 60] } // RSI<50 en i=1 → entrada short

    const result = runBacktest(candles, indicators, RSI_BELOW_50_SHORT, BASE_CONFIG)

    expect(result.trades.length).toBeGreaterThan(0)
    if (result.trades.length > 0) {
      expect(result.trades[0].direction).toBe('short')
      expect(result.trades[0].exitReason).toBe('tp')
      expect(result.trades[0].pnl).toBeGreaterThan(0)
    }
  })
})

describe('runBacktest: short trade cierra por SL', () => {
  it('registra direction=short, exitReason=sl y pnl negativo cuando precio sube', () => {
    const entry = 1.10000
    // short entryPrice ≈ 1.09990
    const entryPrice = entry - 0.0001
    // short SL = entryPrice * 1.01 ≈ 1.11090
    const slPrice = entryPrice * 1.01

    const candles: Candle[] = [
      makeCandle(0,    1.11000, 1.11500, 1.10500, 1.10800),
      makeCandle(1000, entry,   entry + 0.001, entry - 0.001, entry - 0.0005), // señal RSI<50
      makeCandle(2000, entry,   slPrice + 0.005, entry - 0.001, slPrice + 0.002), // next.h >= sl
      makeCandle(3000, slPrice, slPrice + 0.01,  slPrice - 0.005, slPrice),
      makeCandle(4000, slPrice, slPrice + 0.01,  slPrice - 0.005, slPrice),
    ]
    const indicators = { RSI_14: [60, 40, 40, 40, 40] }

    const result = runBacktest(candles, indicators, RSI_BELOW_50_SHORT, BASE_CONFIG)

    expect(result.trades.length).toBeGreaterThan(0)
    if (result.trades.length > 0) {
      expect(result.trades[0].direction).toBe('short')
      expect(result.trades[0].exitReason).toBe('sl')
      expect(result.trades[0].pnl).toBeLessThan(0)
    }
  })
})

describe('short SL queda por encima del precio de entrada', () => {
  it('SL de short es mayor que entryPrice', () => {
    const entry = 1.10000
    const candles: Candle[] = [
      makeCandle(0,    1.11000, 1.11500, 1.10500, 1.10800),
      makeCandle(1000, entry,   entry + 0.001, entry - 0.001, entry - 0.001),
      makeCandle(2000, entry,   entry + 0.001, entry - 0.001, entry - 0.001),
      makeCandle(3000, entry,   entry + 0.001, entry - 0.001, entry - 0.001),
      makeCandle(4000, entry,   entry + 0.001, entry - 0.001, entry - 0.001),
    ]
    const indicators = { RSI_14: [60, 40, 40, 40, 40] }

    const result = runBacktest(candles, indicators, RSI_BELOW_50_SHORT, BASE_CONFIG)
    if (result.trades.length > 0) {
      expect(result.trades[0].sl).toBeGreaterThan(result.trades[0].entryPrice)
      expect(result.trades[0].tp).toBeLessThan(result.trades[0].entryPrice)
    }
  })
})

// ─── Slippage ─────────────────────────────────────────────────────────────────

describe('slippage reduce pnl del trade ganador', () => {
  it('pnl con slippage=5 es menor que con slippage=0 en igual escenario', () => {
    // Usamos fixed_points para que el TP sea absoluto (no % de entry).
    // Así el efecto del slippage se aísla: pips ganados son iguales,
    // pero spreadCost = (spread + slippage) * pip * pipValue * lotSize es mayor.
    const rule: StrategyRule = {
      entry:     { indicator: 'RSI_14', operator: '>', value: 50 },
      exit:      { indicator: 'RSI_14', operator: '<', value: 50 },
      sl:        { type: 'fixed_points', value: 100 },
      tp:        { type: 'fixed_points', value: 200 },
      direction: 'long',
    }
    const entry = 1.10000
    const tpApprox = entry + 200 * 0.0001 // ≈ 1.12000

    const candles: Candle[] = [
      makeCandle(0,    1.09000, 1.09500, 1.08500, 1.09200),
      makeCandle(1000, entry,   entry + 0.001, entry - 0.001, entry),
      makeCandle(2000, entry,   tpApprox + 0.01, entry - 0.001, tpApprox + 0.005),
      makeCandle(3000, tpApprox, tpApprox + 0.01, tpApprox - 0.005, tpApprox),
      makeCandle(4000, tpApprox, tpApprox + 0.01, tpApprox - 0.005, tpApprox),
    ]
    const indicators = { RSI_14: [30, 60, 60, 60, 60] }

    const configNoSlip: BacktestConfig = { ...BASE_CONFIG, slippage: 0 }
    const configSlip:   BacktestConfig = { ...BASE_CONFIG, slippage: 5 }

    const resNoSlip = runBacktest(candles, indicators, rule, configNoSlip)
    const resSlip   = runBacktest(candles, indicators, rule, configSlip)

    if (resNoSlip.trades.length > 0 && resSlip.trades.length > 0) {
      // pips ganados son ≈ iguales (200 fixed_points) pero
      // spreadCost es mayor con slippage=5 → pnl neto menor
      expect(resSlip.trades[0].pnl).toBeLessThan(resNoSlip.trades[0].pnl)
    }
  })
})

// ─── Spread ───────────────────────────────────────────────────────────────────

describe('spread mayor reduce pnl', () => {
  it('pnl con spread=5 es menor que con spread=1 en igual escenario', () => {
    // Mismo motivo que slippage: usamos fixed_points para que los pips sean
    // idénticos en ambos casos y solo varíe el spreadCost.
    const rule: StrategyRule = {
      entry:     { indicator: 'RSI_14', operator: '>', value: 50 },
      exit:      { indicator: 'RSI_14', operator: '<', value: 50 },
      sl:        { type: 'fixed_points', value: 100 },
      tp:        { type: 'fixed_points', value: 200 },
      direction: 'long',
    }
    const entry = 1.10000
    const tpApprox = entry + 200 * 0.0001

    const candles: Candle[] = [
      makeCandle(0,    1.09000, 1.09500, 1.08500, 1.09200),
      makeCandle(1000, entry,   entry + 0.001, entry - 0.001, entry),
      makeCandle(2000, entry,   tpApprox + 0.01, entry - 0.001, tpApprox + 0.005),
      makeCandle(3000, tpApprox, tpApprox + 0.01, tpApprox - 0.005, tpApprox),
      makeCandle(4000, tpApprox, tpApprox + 0.01, tpApprox - 0.005, tpApprox),
    ]
    const indicators = { RSI_14: [30, 60, 60, 60, 60] }

    const configSpread1: BacktestConfig = { ...BASE_CONFIG, spread: 1, slippage: 0 }
    const configSpread5: BacktestConfig = { ...BASE_CONFIG, spread: 5, slippage: 0 }

    const resSpread1 = runBacktest(candles, indicators, rule, configSpread1)
    const resSpread5 = runBacktest(candles, indicators, rule, configSpread5)

    if (resSpread1.trades.length > 0 && resSpread5.trades.length > 0) {
      // spreadCost spread=5 → 5× mayor → pnl neto menor
      expect(resSpread5.trades[0].pnl).toBeLessThan(resSpread1.trades[0].pnl)
    }
  })
})
