import { describe, it, expect } from 'vitest'

// Validation logic extracted from /api/mt5/trade/route.ts
function validateTradeInput(body: {
  symbol?: unknown
  type?: unknown
  volume?: unknown
  sl?: unknown
  tp?: unknown
}): { valid: boolean; error?: string } {
  const { symbol, type, volume } = body
  if (!symbol || !type || volume === undefined || volume === null) {
    return { valid: false, error: 'symbol, type y volume son requeridos' }
  }
  if (!['BUY', 'SELL'].includes(type as string)) {
    return { valid: false, error: 'type debe ser BUY o SELL' }
  }
  const vol = Number(volume)
  if (isNaN(vol) || vol <= 0 || vol > 100) {
    return { valid: false, error: 'volume debe ser entre 0.01 y 100' }
  }
  return { valid: true }
}

describe('MT5 trade input validation', () => {
  it('accepts valid BUY trade', () => {
    const result = validateTradeInput({ symbol: 'BTCUSD', type: 'BUY', volume: 0.01 })
    expect(result.valid).toBe(true)
  })

  it('accepts valid SELL trade', () => {
    const result = validateTradeInput({ symbol: 'EURUSD', type: 'SELL', volume: 1.5 })
    expect(result.valid).toBe(true)
  })

  it('rejects missing symbol', () => {
    const result = validateTradeInput({ type: 'BUY', volume: 0.01 })
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/requeridos/)
  })

  it('rejects missing volume', () => {
    const result = validateTradeInput({ symbol: 'BTCUSD', type: 'BUY' })
    expect(result.valid).toBe(false)
  })

  it('rejects invalid direction', () => {
    const result = validateTradeInput({ symbol: 'BTCUSD', type: 'HOLD', volume: 0.01 })
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/BUY o SELL/)
  })

  it('rejects zero volume', () => {
    const result = validateTradeInput({ symbol: 'BTCUSD', type: 'BUY', volume: 0 })
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/0.01 y 100/)
  })

  it('rejects volume above 100', () => {
    const result = validateTradeInput({ symbol: 'BTCUSD', type: 'BUY', volume: 101 })
    expect(result.valid).toBe(false)
  })

  it('rejects negative volume', () => {
    const result = validateTradeInput({ symbol: 'EURUSD', type: 'SELL', volume: -1 })
    expect(result.valid).toBe(false)
  })
})

// MetaAPI payload construction
function buildMetaPayload(type: 'BUY' | 'SELL', symbol: string, volume: number, sl?: number, tp?: number, comment?: string) {
  return {
    actionType: type === 'BUY' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL',
    symbol,
    volume,
    ...(sl ? { stopLoss: sl } : {}),
    ...(tp ? { takeProfit: tp } : {}),
    comment: comment ?? `Liberty AI — ${type} ${symbol}`,
  }
}

describe('MetaAPI payload construction', () => {
  it('maps BUY to ORDER_TYPE_BUY', () => {
    const payload = buildMetaPayload('BUY', 'BTCUSD', 0.01)
    expect(payload.actionType).toBe('ORDER_TYPE_BUY')
  })

  it('maps SELL to ORDER_TYPE_SELL', () => {
    const payload = buildMetaPayload('SELL', 'EURUSD', 0.1)
    expect(payload.actionType).toBe('ORDER_TYPE_SELL')
  })

  it('omits stopLoss when not provided', () => {
    const payload = buildMetaPayload('BUY', 'BTCUSD', 0.01)
    expect('stopLoss' in payload).toBe(false)
  })

  it('includes stopLoss when provided', () => {
    const payload = buildMetaPayload('BUY', 'BTCUSD', 0.01, 40000)
    expect(payload.stopLoss).toBe(40000)
  })

  it('includes takeProfit when provided', () => {
    const payload = buildMetaPayload('SELL', 'EURUSD', 0.1, undefined, 1.05)
    expect(payload.takeProfit).toBe(1.05)
  })

  it('generates default comment with symbol and direction', () => {
    const payload = buildMetaPayload('BUY', 'XAUUSD', 0.01)
    expect(payload.comment).toContain('BUY')
    expect(payload.comment).toContain('XAUUSD')
  })

  it('uses custom comment when provided', () => {
    const payload = buildMetaPayload('SELL', 'EURUSD', 0.1, undefined, undefined, 'Mi señal')
    expect(payload.comment).toBe('Mi señal')
  })
})
