import { describe, expect, it } from 'vitest'
import {
  blackScholes,
  classifyPremium,
  midPrice,
  probabilityITM,
} from '@/lib/options/pricing'
import {
  scoreOptionContract,
  type OptionContractForScoring,
  type StrategyKind,
} from '@/lib/options/strategy-scoring'

describe('options pricing', () => {
  it('prices an at-the-money call and put near known Black-Scholes values', () => {
    const call = blackScholes({ type: 'call', spot: 100, strike: 100, timeToExpiryYears: 30 / 365, volatility: 0.2, riskFreeRate: 0.05 })
    const put = blackScholes({ type: 'put', spot: 100, strike: 100, timeToExpiryYears: 30 / 365, volatility: 0.2, riskFreeRate: 0.05 })

    expect(call.fairValue).toBeCloseTo(2.49, 1)
    expect(put.fairValue).toBeCloseTo(2.08, 1)
    expect(call.delta).toBeGreaterThan(0.5)
    expect(put.delta).toBeLessThan(-0.45)
    expect(call.gamma).toBeGreaterThan(0)
    expect(call.vega).toBeGreaterThan(0)
    expect(call.theta).toBeLessThan(0)
  })

  it('uses bid/ask midpoint when available and falls back to last price', () => {
    expect(midPrice({ bid: 1.2, ask: 1.4, lastPrice: 1.9 })).toBe(1.3)
    expect(midPrice({ bid: 0, ask: 0, lastPrice: 1.9 })).toBe(1.9)
    expect(midPrice({ bid: null, ask: null, lastPrice: null })).toBeNull()
  })

  it('classifies market premium against fair value', () => {
    expect(classifyPremium(1.6, 2)).toBe('barata')
    expect(classifyPremium(2.08, 2)).toBe('justa')
    expect(classifyPremium(2.6, 2)).toBe('cara')
    expect(classifyPremium(null, 2)).toBe('sin-datos')
  })

  it('approximates ITM probability from delta by option type', () => {
    expect(probabilityITM('call', 0.32)).toBe(32)
    expect(probabilityITM('put', -0.28)).toBe(28)
  })
})

describe('option strategy scoring', () => {
  const baseContract: OptionContractForScoring = {
    symbol: 'BAC260619P00038000',
    type: 'put',
    strike: 38,
    expiration: '2026-06-19',
    dte: 42,
    bid: 1.1,
    ask: 1.25,
    lastPrice: 1.18,
    impliedVolatility: 0.31,
    delta: -0.28,
    gamma: 0.05,
    theta: -0.02,
    vega: 0.08,
    openInterest: 1400,
    volume: 220,
    fairValue: 1.05,
    premiumStatus: 'cara',
  }

  it('recommends cash-secured puts near support with good liquidity and fair/costly premium', () => {
    const result = scoreOptionContract({
      strategy: 'sell-put',
      contract: baseContract,
      underlyingPrice: 40,
      nearestSupport: 37.8,
      nearestResistance: 44,
      fundamentalBias: 'bullish',
    })

    expect(result.score).toBeGreaterThanOrEqual(75)
    expect(result.label).toBe('IDEAL')
    expect(result.action).toBe('VENDER PUT')
    expect(result.warnings).not.toContain('Liquidez insuficiente')
  })

  it.each([
    ['buy-call', 'COMPRAR CALL'],
    ['buy-put', 'COMPRAR PUT'],
    ['covered-call', 'VENDER COVERED CALL'],
  ] as Array<[StrategyKind, string]>)('returns a direct action for %s', (strategy, action) => {
    const contract = {
      ...baseContract,
      type: strategy === 'buy-put' ? 'put' as const : 'call' as const,
      delta: strategy === 'buy-put' ? -0.55 : 0.55,
      premiumStatus: strategy.startsWith('buy') ? 'justa' as const : 'cara' as const,
    }

    const result = scoreOptionContract({
      strategy,
      contract,
      underlyingPrice: 40,
      nearestSupport: 39,
      nearestResistance: 41.5,
      fundamentalBias: strategy === 'buy-put' || strategy === 'covered-call' ? 'bearish' : 'bullish',
    })

    expect(result.action).toBe(action)
  })

  it('penalizes illiquid contracts and marks them as avoid', () => {
    const result = scoreOptionContract({
      strategy: 'sell-put',
      contract: { ...baseContract, bid: 0.05, ask: 0.5, openInterest: 3, volume: 0 },
      underlyingPrice: 40,
      nearestSupport: 37.8,
      nearestResistance: 44,
      fundamentalBias: 'bullish',
    })

    expect(result.score).toBeLessThan(45)
    expect(result.label).toBe('EVITAR')
    expect(result.warnings).toContain('Liquidez insuficiente')
  })
})
