// lib/faros-metrics.ts
// FAROS v7.0 — TAI-ACF Framework quantitative metrics engine
// Implements: Z-Score, Reynolds Financial Number, Shannon Entropy, αflow, Ψ Governance

export interface OHLCVData {
  symbol: string
  timestamps: number[]
  opens: number[]
  highs: number[]
  lows: number[]
  closes: number[]
  volumes: number[]
}

export type ThermodynamicState = 'SÓLIDO' | 'LÍQUIDO' | 'GAS' | 'PLASMA'
export type MarketRegime =
  | 'INSTITUTIONAL_ACCUMULATION'
  | 'HIGH_MOMENTUM'
  | 'CONSOLIDATION'
  | 'STRUCTURAL_BREAK'
  | 'DISTRIBUTION_BEAR'
export type GovernanceSignal = 'BUY' | 'BUY_CAUTION' | 'HOLD' | 'SELL' | 'CASH'

export interface FarosMetrics {
  symbol: string
  zScore: number
  thermodynamicState: ThermodynamicState
  reynoldsPercentile: number
  entropy: number
  alphaFlow: number
  psiScore: number
  marketRegime: MarketRegime
  governanceSignal: GovernanceSignal
  killSwitch: boolean
  trendStrength5d: number
}

// ── Math helpers ───────────────────────────────────────────────────────────────

function mean(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

function std(arr: number[]): number {
  if (arr.length < 2) return 0
  const m = mean(arr)
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length)
}

function sma(arr: number[], window: number): number[] {
  return arr.map((_, i) => {
    if (i < window - 1) return NaN
    return mean(arr.slice(i - window + 1, i + 1))
  })
}

function percentile(arr: number[], value: number): number {
  if (arr.length === 0) return 50
  const sorted = [...arr].sort((a, b) => a - b)
  const below = sorted.filter(v => v <= value).length
  return (below / sorted.length) * 100
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

// ── Z-Score & Thermodynamic State ─────────────────────────────────────────────

function computeZScore(closes: number[]): { zScore: number; state: ThermodynamicState } {
  const window = Math.min(20, closes.length)
  const slice = closes.slice(-window)
  const µ = mean(slice)
  const σ = std(slice)
  if (σ === 0) return { zScore: 0, state: 'SÓLIDO' }

  const last = closes[closes.length - 1]
  const z = (last - µ) / σ

  let state: ThermodynamicState
  if (Math.abs(z) < 0.5) state = 'SÓLIDO'
  else if (z < -1.5) state = 'PLASMA'          // burbuja bajista / iliquidez
  else if (Math.abs(z) > 3.0) state = 'GAS'    // caos/pánico
  else state = 'LÍQUIDO'                        // zona óptima

  return { zScore: parseFloat(z.toFixed(3)), state }
}

// ── Reynolds Financial Number (percentile-normalized) ─────────────────────────

function computeReynoldsPercentile(ohlcv: OHLCVData): number {
  const { closes, highs, lows, volumes } = ohlcv
  const n = closes.length
  if (n < 21) return 50

  const sma20_vol = sma(volumes, 20)
  const sma20_price = sma(closes, 20)

  const reynoldsSeries: number[] = []

  for (let i = 20; i < n; i++) {
    // ρ (density) = volume / SMA20_volume
    const vol_sma = sma20_vol[i]
    if (!vol_sma || vol_sma === 0) continue
    const ρ = volumes[i] / vol_sma

    // v (velocity) = 5-day absolute return
    const v5start = closes[Math.max(0, i - 5)]
    const v = v5start !== 0 ? Math.abs((closes[i] - v5start) / v5start) : 0

    // L (characteristic length) = 20-day normalized volatility
    const slice20 = closes.slice(i - 20, i)
    const σ20 = std(slice20)
    const µ20 = mean(slice20)
    const L = µ20 !== 0 ? σ20 / µ20 : 0

    // µ (viscosity) = composite: spread + Amihud
    const spread5 = (highs[i] - lows[i]) / (closes[i] || 1)
    const dailyReturn = closes[i - 1] !== 0 ? Math.abs((closes[i] - closes[i - 1]) / closes[i - 1]) : 0
    const amihudRaw = volumes[i] * closes[i] !== 0 ? dailyReturn / (volumes[i] * closes[i]) : 0
    // Amihud needs scaling — normalize against its own rolling mean
    const µ_spread = spread5
    const µ_amihud = amihudRaw * closes[i] * 1e6  // scale to comparable range
    const µ_composite = (µ_spread * 0.5) + (µ_amihud * 0.5)

    if (µ_composite === 0) continue

    const Ref = (ρ * v * L) / µ_composite
    reynoldsSeries.push(Ref)
  }

  if (reynoldsSeries.length === 0) return 50

  const currentRef = reynoldsSeries[reynoldsSeries.length - 1]
  return parseFloat(percentile(reynoldsSeries, currentRef).toFixed(1))
}

// ── Shannon Entropy on relative volume distribution ────────────────────────────

function computeShannonEntropy(volumes: number[]): number {
  const window = Math.min(20, volumes.length)
  const recent = volumes.slice(-window)
  if (recent.length === 0) return 0.5

  const µVol = mean(recent)
  if (µVol === 0) return 0.5

  // Relative volumes
  const relVol = volumes.slice(-Math.min(30, volumes.length)).map(v => v / µVol)

  // Bin into 10 buckets [0, 3) range
  const bins = 10
  const counts = new Array(bins).fill(1)  // Laplace smoothing: start at 1
  const binWidth = 3.0 / bins

  for (const rv of relVol) {
    const bin = clamp(Math.floor(rv / binWidth), 0, bins - 1)
    counts[bin]++
  }

  const total = counts.reduce((s, c) => s + c, 0)
  let H = 0
  for (const c of counts) {
    const p = c / total
    H -= p * Math.log2(p)
  }

  const Hmax = Math.log2(bins)
  return parseFloat(clamp(H / Hmax, 0, 1).toFixed(3))
}

// ── Authenticity Coefficient (αflow) ──────────────────────────────────────────

function computeAlphaFlow(Hnorm: number, reynoldsPct: number): number {
  const pArtificial = Math.max(0, ((reynoldsPct - 70) / 30)) * (1 - Hnorm)
  const alpha = Hnorm * (1 - pArtificial)
  return parseFloat(clamp(alpha, 0, 1).toFixed(3))
}

// ── Market Regime Classification ──────────────────────────────────────────────

function classifyRegime(
  reynoldsPct: number,
  trendStrength5d: number,
): { regime: MarketRegime; signal: GovernanceSignal; killSwitch: boolean } {
  if (reynoldsPct > 75 && trendStrength5d > 10) {
    return { regime: 'HIGH_MOMENTUM', signal: 'BUY_CAUTION', killSwitch: false }
  }
  if (reynoldsPct > 75) {
    return { regime: 'STRUCTURAL_BREAK', signal: 'CASH', killSwitch: true }
  }
  if (trendStrength5d > 2) {
    return { regime: 'INSTITUTIONAL_ACCUMULATION', signal: 'BUY', killSwitch: false }
  }
  if (trendStrength5d < -5) {
    return { regime: 'DISTRIBUTION_BEAR', signal: 'SELL', killSwitch: false }
  }
  return { regime: 'CONSOLIDATION', signal: 'HOLD', killSwitch: false }
}

// ── Topology Factor (from Z-score state) ─────────────────────────────────────

function topologyFactor(state: ThermodynamicState): number {
  switch (state) {
    case 'LÍQUIDO': return 1.0   // optimal zone
    case 'SÓLIDO':  return 0.4   // range-bound, wait
    case 'GAS':     return 0.0   // chaos veto
    case 'PLASMA':  return 0.0   // structural illiquidity veto
  }
}

// ── Ψ Governance Score ────────────────────────────────────────────────────────

function computePsi(
  trendStrength5d: number,
  reynoldsPct: number,
  alphaFlow: number,
  state: ThermodynamicState,
  killSwitch: boolean,
): number {
  if (killSwitch) return 0

  // CurrentScore: normalized trend momentum (0-1)
  const currentScore = clamp((trendStrength5d + 20) / 40, 0, 1)
  // FutureScore: penalized by high reynolds (uncertainty)
  const stabilityWeight = 1 - Math.max(0, (reynoldsPct - 70) / 100)
  const futureScore = currentScore * stabilityWeight

  const composite = (currentScore * 0.6 + futureScore * 0.4) * alphaFlow * topologyFactor(state)
  return parseFloat(clamp(composite, 0, 1).toFixed(3))
}

// ── Main Entry Point ──────────────────────────────────────────────────────────

export function computeFarosMetrics(ohlcv: OHLCVData): FarosMetrics {
  const { symbol, closes, volumes } = ohlcv

  // Trend strength: 5-day return %
  const c = closes
  const trendStrength5d =
    c.length >= 6 && c[c.length - 6] !== 0
      ? parseFloat((((c[c.length - 1] - c[c.length - 6]) / c[c.length - 6]) * 100).toFixed(2))
      : 0

  const { zScore, state } = computeZScore(closes)
  const reynoldsPercentile = computeReynoldsPercentile(ohlcv)
  const entropy = computeShannonEntropy(volumes)
  const alphaFlow = computeAlphaFlow(entropy, reynoldsPercentile)
  const { regime, signal, killSwitch } = classifyRegime(reynoldsPercentile, trendStrength5d)
  const psiScore = computePsi(trendStrength5d, reynoldsPercentile, alphaFlow, state, killSwitch)

  return {
    symbol,
    zScore,
    thermodynamicState: state,
    reynoldsPercentile,
    entropy,
    alphaFlow,
    psiScore,
    marketRegime: regime,
    governanceSignal: signal,
    killSwitch,
    trendStrength5d,
  }
}

// ── Format for LLM context ────────────────────────────────────────────────────

export function formatFarosContext(metrics: FarosMetrics[]): string {
  return metrics
    .map(m =>
      `${m.symbol}: Z=${m.zScore} [${m.thermodynamicState}] | Re%=${m.reynoldsPercentile}% | ` +
      `H=${m.entropy} | αflow=${m.alphaFlow} | Ψ=${m.psiScore} | ` +
      `Régimen=${m.marketRegime} | Señal=${m.governanceSignal}${m.killSwitch ? ' ⚠️ KILL_SWITCH' : ''} | ` +
      `Trend5d=${m.trendStrength5d > 0 ? '+' : ''}${m.trendStrength5d}%`,
    )
    .join('\n')
}
