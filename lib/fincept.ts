// lib/fincept.ts
// Fincept API client for quantitative finance

const FINCEPT_BASE_URL = 'https://api.fincept.in'

// Use environment variable for API key - user provided their key
const getApiKey = () => process.env.FINCEPT_API_KEY || 'fk_user_NrTr5aPzJ4W2M0kqlQWc8FDo5cYnSR3TzsW9yBwfsnk'

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
  try {
    const res = await fetch(`${FINCEPT_BASE_URL}/quantlib/pricing/black-scholes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': getApiKey(),
      },
      body: JSON.stringify({
        spot: params.spot,
        strike: params.strike,
        rate: params.rate,
        volatility: params.volatility,
        time_to_maturity: params.timeToMaturity,
        option_type: params.optionType,
      }),
    })
    const json: FinceptResponse<BlackScholesResult> = await res.json()
    return json.success && json.data ? json.data : null
  } catch (error) {
    console.error('Fincept Black-Scholes error:', error)
    return null
  }
}

// Bond Pricing (Standard tier - 2 credits)
export async function calculateBondPrice(params: {
  faceValue: number
  couponRate: number
  yield: number
  yearsToMaturity: number
  frequency: number
}): Promise<BondPriceResult | null> {
  try {
    const res = await fetch(`${FINCEPT_BASE_URL}/quantlib/pricing/bond-price`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': getApiKey(),
      },
      body: JSON.stringify({
        face_value: params.faceValue,
        coupon_rate: params.couponRate,
        yield: params.yield,
        years_to_maturity: params.yearsToMaturity,
        frequency: params.frequency,
      }),
    })
    const json: FinceptResponse<BondPriceResult> = await res.json()
    return json.success && json.data ? json.data : null
  } catch (error) {
    console.error('Fincept Bond Pricing error:', error)
    return null
  }
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
  try {
    const res = await fetch(`${FINCEPT_BASE_URL}/quantlib/solver/implied-volatility`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': getApiKey(),
      },
      body: JSON.stringify({
        spot: params.spot,
        strike: params.strike,
        rate: params.rate,
        price: params.price,
        time_to_maturity: params.timeToMaturity,
        option_type: params.optionType,
      }),
    })
    const json: FinceptResponse<{ implied_volatility: number }> = await res.json()
    return json.success && json.data ? json.data.implied_volatility : null
  } catch (error) {
    console.error('Fincept Implied Volatility error:', error)
    return null
  }
}

// Yield Curve Construction (Standard tier - 2 credits)
export async function buildYieldCurve(dates: string[], rates: number[]): Promise<YieldCurvePoint[] | null> {
  try {
    const res = await fetch(`${FINCEPT_BASE_URL}/quantlib/curves/zero-curve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': getApiKey(),
      },
      body: JSON.stringify({
        dates,
        rates,
        interpolation: 'cubic_spline',
      }),
    })
    const json: FinceptResponse<{ curve: YieldCurvePoint[] }> = await res.json()
    return json.success && json.data ? json.data.curve : null
  } catch (error) {
    console.error('Fincept Yield Curve error:', error)
    return null
  }
}

// Portfolio VaR (Pro tier - 5 credits)
export async function calculateVaR(returns: number[], confidenceLevel: number = 0.95): Promise<VaRResult | null> {
  try {
    const res = await fetch(`${FINCEPT_BASE_URL}/quantlib/risk/var`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': getApiKey(),
      },
      body: JSON.stringify({
        returns,
        confidence_level: confidenceLevel,
      }),
    })
    const json: FinceptResponse<VaRResult> = await res.json()
    return json.success && json.data ? json.data : null
  } catch (error) {
    console.error('Fincept VaR error:', error)
    return null
  }
}

// Get User Profile & Credits (Free - 0 credits)
export async function getUserProfile() {
  try {
    const res = await fetch(`${FINCEPT_BASE_URL}/user/profile`, {
      headers: {
        'X-API-Key': getApiKey(),
      },
    })
    const json = await res.json()
    return json.success ? json.data : null
  } catch (error) {
    console.error('Fincept Profile error:', error)
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
  try {
    const res = await fetch(`${FINCEPT_BASE_URL}/quantlib/solver/bond-yield`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': getApiKey(),
      },
      body: JSON.stringify({
        face_value: params.faceValue,
        price: params.price,
        coupon_rate: params.couponRate,
        years_to_maturity: params.yearsToMaturity,
        frequency: params.frequency,
      }),
    })
    const json: FinceptResponse<{ yield: number }> = await res.json()
    return json.success && json.data ? json.data.yield : null
  } catch (error) {
    console.error('Fincept Bond Yield error:', error)
    return null
  }
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
  try {
    const res = await fetch(`${FINCEPT_BASE_URL}/quantlib/pricing/binomial-tree`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': getApiKey(),
      },
      body: JSON.stringify({
        spot: params.spot,
        strike: params.strike,
        rate: params.rate,
        volatility: params.volatility,
        time_to_maturity: params.timeToMaturity,
        option_type: params.optionType,
        steps: params.steps || 100,
      }),
    })
    const json: FinceptResponse<{ price: number; delta: number }> = await res.json()
    return json.success && json.data ? json.data : null
  } catch (error) {
    console.error('Fincept Binomial Tree error:', error)
    return null
  }
}