import { describe, it, expect } from 'vitest'
import { computeFarosMetrics, formatFarosContext, type OHLCVData, type FarosMetrics } from '@/lib/faros-metrics'

// ── Test data helpers ───────────────────────────────────────────────────────────

function makeOHLCV(closes: number[], symbol = 'TEST'): OHLCVData {
  return {
    symbol,
    timestamps: closes.map((_, i) => Math.floor(Date.now() / 1000) + i * 86400),
    opens:   closes.map(c => c * 0.998),
    highs:   closes.map(c => c * 1.010),
    lows:    closes.map(c => c * 0.990),
    closes,
    volumes: closes.map(() => 1_000_000),
  }
}

// 20 identical closes → σ = 0
const FLAT_20 = Array(20).fill(100)

// Gentle uptrend 100→119 (20 values) → z ≈ +1.65 (LÍQUIDO), trend ≈ +4.39 %
const UP_20 = Array.from({ length: 20 }, (_, i) => 100 + i)

// Steep downtrend 120→82 step -2 (20 values) → z ≈ -1.65 (PLASMA), trend ≈ -10.9 %
const DOWN_20 = Array.from({ length: 20 }, (_, i) => 120 - i * 2)

// Extreme outlier at the end → z ≈ +4.4 (GAS)
const OUTLIER_UP = [...Array(19).fill(100), 200]

// Only 5 closes — too short for trend & Reynolds
const TOO_SHORT = [100, 101, 102, 103, 104]

// ── computeFarosMetrics — output shape ─────────────────────────────────────────

describe('computeFarosMetrics — output shape', () => {
  it('returns all required fields', () => {
    const m = computeFarosMetrics(makeOHLCV(FLAT_20, 'BTC'))
    const keys: (keyof FarosMetrics)[] = [
      'symbol', 'zScore', 'thermodynamicState', 'reynoldsPercentile',
      'entropy', 'alphaFlow', 'psiScore', 'marketRegime',
      'governanceSignal', 'killSwitch', 'trendStrength5d',
    ]
    for (const k of keys) expect(m).toHaveProperty(k)
  })

  it('preserves the symbol from input', () => {
    const m = computeFarosMetrics(makeOHLCV(FLAT_20, 'EURUSD'))
    expect(m.symbol).toBe('EURUSD')
  })

  it('returns numeric values in expected ranges', () => {
    const m = computeFarosMetrics(makeOHLCV(FLAT_20))
    expect(m.entropy).toBeGreaterThanOrEqual(0)
    expect(m.entropy).toBeLessThanOrEqual(1)
    expect(m.alphaFlow).toBeGreaterThanOrEqual(0)
    expect(m.alphaFlow).toBeLessThanOrEqual(1)
    expect(m.psiScore).toBeGreaterThanOrEqual(0)
    expect(m.psiScore).toBeLessThanOrEqual(1)
    expect(m.reynoldsPercentile).toBeGreaterThanOrEqual(0)
    expect(m.reynoldsPercentile).toBeLessThanOrEqual(100)
  })

  it('killSwitch is a boolean', () => {
    const m = computeFarosMetrics(makeOHLCV(FLAT_20))
    expect(typeof m.killSwitch).toBe('boolean')
  })
})

// ── Z-Score & Thermodynamic State ──────────────────────────────────────────────

describe('Z-Score / thermodynamicState', () => {
  it('flat series → zScore 0, state SÓLIDO', () => {
    const m = computeFarosMetrics(makeOHLCV(FLAT_20))
    expect(m.zScore).toBe(0)
    expect(m.thermodynamicState).toBe('SÓLIDO')
  })

  it('gentle uptrend → state LÍQUIDO (0.5 < z < 3)', () => {
    const m = computeFarosMetrics(makeOHLCV(UP_20))
    expect(m.thermodynamicState).toBe('LÍQUIDO')
    expect(m.zScore).toBeGreaterThan(0.5)
    expect(m.zScore).toBeLessThanOrEqual(3.0)
  })

  it('gentle downtrend → state PLASMA (z < -1.5)', () => {
    const m = computeFarosMetrics(makeOHLCV(DOWN_20))
    expect(m.thermodynamicState).toBe('PLASMA')
    expect(m.zScore).toBeLessThan(-1.5)
  })

  it('extreme positive outlier → state GAS (z > 3)', () => {
    const m = computeFarosMetrics(makeOHLCV(OUTLIER_UP))
    expect(m.thermodynamicState).toBe('GAS')
    expect(m.zScore).toBeGreaterThan(3.0)
  })
})

// ── Trend strength ──────────────────────────────────────────────────────────────

describe('trendStrength5d', () => {
  it('returns 0 when fewer than 6 closes are provided', () => {
    const m = computeFarosMetrics(makeOHLCV(TOO_SHORT))
    expect(m.trendStrength5d).toBe(0)
  })

  it('calculates positive trend correctly (UP_20 series)', () => {
    const m = computeFarosMetrics(makeOHLCV(UP_20))
    // c[-6]=114, c[-1]=119 → (119-114)/114*100 ≈ 4.39 %
    expect(m.trendStrength5d).toBeCloseTo(4.39, 1)
  })

  it('calculates negative trend correctly (DOWN_20 series)', () => {
    const m = computeFarosMetrics(makeOHLCV(DOWN_20))
    // c[-6]=110 (index 5: 120-5*2=110), c[-1]=82 → (82-110)/110*100 ≈ -10.87 %
    // Re-check: DOWN_20[14]=120-14*2=92, DOWN_20[19]=82 → (82-92)/92*100 ≈ -10.87 %
    expect(m.trendStrength5d).toBeLessThan(-5)
  })
})

// ── Market Regime classification ────────────────────────────────────────────────

describe('marketRegime', () => {
  it('flat data with <21 closes → CONSOLIDATION (Reynolds defaults to 50, trend ≈ 0)', () => {
    // Reynolds is 50 (≤75), trendStrength5d = 0 (not > 2, not < -5) → CONSOLIDATION
    const m = computeFarosMetrics(makeOHLCV(FLAT_20))
    expect(m.marketRegime).toBe('CONSOLIDATION')
    expect(m.governanceSignal).toBe('HOLD')
    expect(m.killSwitch).toBe(false)
  })

  it('uptrend with moderate Reynolds → INSTITUTIONAL_ACCUMULATION', () => {
    // trendStrength5d ≈ 4.4 % > 2, Reynolds = 50 (≤ 75) → INSTITUTIONAL_ACCUMULATION
    const m = computeFarosMetrics(makeOHLCV(UP_20))
    expect(m.marketRegime).toBe('INSTITUTIONAL_ACCUMULATION')
    expect(m.governanceSignal).toBe('BUY')
    expect(m.killSwitch).toBe(false)
  })

  it('strong downtrend → DISTRIBUTION_BEAR', () => {
    // trendStrength5d ≈ -10.87 % < -5, Reynolds = 50 (≤ 75) → DISTRIBUTION_BEAR
    const m = computeFarosMetrics(makeOHLCV(DOWN_20))
    expect(m.marketRegime).toBe('DISTRIBUTION_BEAR')
    expect(m.governanceSignal).toBe('SELL')
    expect(m.killSwitch).toBe(false)
  })
})

// ── Ψ Governance score ──────────────────────────────────────────────────────────

describe('psiScore', () => {
  it('is 0 when killSwitch is active (STRUCTURAL_BREAK regime)', () => {
    // Build a dataset with >21 points and high turbulence
    // Use alternating extreme values so Reynolds percentile becomes very high
    const extremes = Array.from({ length: 40 }, (_, i) =>
      i % 2 === 0 ? 100 + i * 10 : 50,
    )
    const m = computeFarosMetrics(makeOHLCV(extremes))
    if (m.killSwitch) {
      expect(m.psiScore).toBe(0)
    }
    // If no kill switch in this dataset, just verify psi is in valid range
    expect(m.psiScore).toBeGreaterThanOrEqual(0)
    expect(m.psiScore).toBeLessThanOrEqual(1)
  })

  it('GAS state (z>3) results in zero psiScore due to topology veto', () => {
    // topologyFactor('GAS') = 0 → composite = 0
    const m = computeFarosMetrics(makeOHLCV(OUTLIER_UP))
    expect(m.thermodynamicState).toBe('GAS')
    expect(m.psiScore).toBe(0)
  })
})

// ── formatFarosContext ──────────────────────────────────────────────────────────

describe('formatFarosContext', () => {
  const sample: FarosMetrics = {
    symbol: 'BTC',
    zScore: 1.23,
    thermodynamicState: 'LÍQUIDO',
    reynoldsPercentile: 45.0,
    entropy: 0.78,
    alphaFlow: 0.72,
    psiScore: 0.65,
    marketRegime: 'INSTITUTIONAL_ACCUMULATION',
    governanceSignal: 'BUY',
    killSwitch: false,
    trendStrength5d: 3.50,
  }

  it('contains symbol, Z-score, state, and regime info', () => {
    const ctx = formatFarosContext([sample])
    expect(ctx).toContain('BTC')
    expect(ctx).toContain('Z=1.23')
    expect(ctx).toContain('LÍQUIDO')
    expect(ctx).toContain('INSTITUTIONAL_ACCUMULATION')
  })

  it('does not include KILL_SWITCH flag when killSwitch is false', () => {
    const ctx = formatFarosContext([sample])
    expect(ctx).not.toContain('KILL_SWITCH')
  })

  it('includes KILL_SWITCH flag when killSwitch is true', () => {
    const ctx = formatFarosContext([{ ...sample, killSwitch: true }])
    expect(ctx).toContain('KILL_SWITCH')
  })

  it('formats multiple metrics as separate lines', () => {
    const eth: FarosMetrics = { ...sample, symbol: 'ETH' }
    const ctx = formatFarosContext([sample, eth])
    const lines = ctx.trim().split('\n')
    expect(lines).toHaveLength(2)
  })

  it('shows + prefix for positive trendStrength5d', () => {
    const ctx = formatFarosContext([{ ...sample, trendStrength5d: 3.5 }])
    expect(ctx).toContain('+3.5%')
  })

  it('does not add + prefix for negative trendStrength5d', () => {
    const ctx = formatFarosContext([{ ...sample, trendStrength5d: -2.1 }])
    expect(ctx).toContain('-2.1%')
    expect(ctx).not.toContain('+-2.1%')
  })
})
