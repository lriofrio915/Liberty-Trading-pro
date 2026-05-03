// lib/fincept.ts
// Fincept API client for quantitative finance
// Uses server-side proxy to avoid CORS issues from browser

const PROXY_URL = '/api/fincept'

export interface FinceptResponse<T> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export interface BlackScholesResult {
  price: number
  delta: number
  gamma: number
  vega: number
  theta: number
  rho: number
}

export interface BondPriceResult {
  price: number
  duration: number
  convexity: number
  yieldToMaturity: number
}

export interface OptionGreeks {
  delta: number
  gamma: number
  theta: number
  rho: number
  vega: number
}

export interface YieldCurvePoint {
  date: string
  rate: number
}

export interface VaRResult {
  var: number
  cvar: number
  confidenceLevel: number
  percentile: number
}

// ── Private fetch function ──────────────────────────────────────────────────────

async function callFinceptProxy<T>(endpoint: string, body: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(`${PROXY_URL}?endpoint=${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      console.error('Fincept proxy error:', res.status, await res.text())
      return null
    }

    const json: FinceptResponse<T> = await res.json()
    return json.success && json.data ? json.data : null
  } catch (error) {
    console.error('Fincept proxy fetch error:', error)
    return null
  }
}

async function callFinceptProxyGet(path: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${PROXY_URL}?path=${encodeURIComponent(path)}`, {
      method: 'GET',
    })

    if (!res.ok) {
      console.error('Fincept proxy GET error:', res.status)
      return null
    }

    return await res.json()
  } catch (error) {
    console.error('Fincept proxy GET fetch error:', error)
    return null
  }
}

// ── API Calls ───────────────────────────────────────────────────────────────────

// Black-Scholes Option Pricing (Standard tier - 2 credits)
export async function calculateBlackScholes(params: {
  spot: number
  strike: number
  rate: number
  volatility: number
  timeToMaturity: number
  optionType: 'call' | 'put'
}): Promise<BlackScholesResult | null> {
  return callFinceptProxy<BlackScholesResult>('pricing/black-scholes', {
    spot: params.spot,
    strike: params.strike,
    rate: params.rate,
    volatility: params.volatility,
    time_to_maturity: params.timeToMaturity,
    option_type: params.optionType,
  })
}

// Bond Pricing (Standard tier - 2 credits)
export async function calculateBondPrice(params: {
  faceValue: number
  couponRate: number
  yield: number
  yearsToMaturity: number
  frequency: number
}): Promise<BondPriceResult | null> {
  return callFinceptProxy<BondPriceResult>('pricing/bond-price', {
    face_value: params.faceValue,
    coupon_rate: params.couponRate,
    yield: params.yield,
    years_to_maturity: params.yearsToMaturity,
    frequency: params.frequency,
  })
}

// Calculate Implied Volatility (Basic tier - 1 credit)
export async function calculateImpliedVolatility(params: {
  spot: number
  strike: number
  rate: number
  price: number
  timeToMaturity: number
  optionType: 'call' | 'put'
}): Promise<number | null> {
  const result = await callFinceptProxy<{ implied_volatility: number }>('solver/implied-volatility', {
    spot: params.spot,
    strike: params.strike,
    rate: params.rate,
    price: params.price,
    time_to_maturity: params.timeToMaturity,
    option_type: params.optionType,
  })
  return result?.implied_volatility ?? null
}

// Yield Curve Construction (Standard tier - 2 credits)
export async function buildYieldCurve(dates: string[], rates: number[]): Promise<YieldCurvePoint[] | null> {
  return callFinceptProxy<{ curve: YieldCurvePoint[] }>('curves/zero-curve', {
    dates,
    rates,
    interpolation: 'cubic_spline',
  })?.then(r => r?.curve ?? null)
}

// Portfolio VaR (Pro tier - 5 credits)
export async function calculateVaR(returns: number[], confidenceLevel: number = 0.95): Promise<VaRResult | null> {
  return callFinceptProxy<VaRResult>('risk/var', {
    returns,
    confidence_level: confidenceLevel,
  })
}

// Get User Profile & Credits (Free - 0 credits)
export interface FinceptUserProfile {
  email: string
  credits: number
  plan: string
}

export async function getUserProfile(): Promise<FinceptUserProfile | null> {
  try {
    const result = await callFinceptProxyGet('user/profile')
    if (result && typeof result === 'object') {
      const r = result as Record<string, unknown>
      if (r.success === true && r.data && typeof r.data === 'object') {
        const data = r.data as FinceptUserProfile
        return data
      }
    }
    return null
  } catch {
    return null
  }
}

// Calculate Bond Yield (Basic tier - 1 credit)
export async function calculateBondYield(params: {
  faceValue: number
  price: number
  couponRate: number
  yearsToMaturity: number
  frequency: number
}): Promise<number | null> {
  const result = await callFinceptProxy<{ yield: number }>('solver/bond-yield', {
    face_value: params.faceValue,
    price: params.price,
    coupon_rate: params.couponRate,
    years_to_maturity: params.yearsToMaturity,
    frequency: params.frequency,
  })
  return result?.yield ?? null
}

// Binomial Tree Option Pricing (Standard tier - 2 credits)
export async function calculateBinomialTree(params: {
  spot: number
  strike: number
  rate: number
  volatility: number
  timeToMaturity: number
  optionType: 'call' | 'put'
  steps?: number
}): Promise<{ price: number; delta: number } | null> {
  return callFinceptProxy<{ price: number; delta: number }>('pricing/binomial-tree', {
    spot: params.spot,
    strike: params.strike,
    rate: params.rate,
    volatility: params.volatility,
    time_to_maturity: params.timeToMaturity,
    option_type: params.optionType,
    steps: params.steps || 100,
  })
}