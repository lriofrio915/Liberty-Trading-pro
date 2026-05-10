const RAW_BASE = process.env.TIMESFM_BASE_URL || 'https://timesfm-liberty.fly.dev'
export const TIMESFM_BASE_URL = RAW_BASE.replace(/\/+$/, '')

export class TimesFMError extends Error {
  status: number
  constructor(status: number, body: string) {
    super(`TimesFM ${status}: ${body.slice(0, 200)}`)
    this.status = status
  }
}

export interface ForecastResult {
  forecast: number[]
  quantile_p10: number[]
  quantile_p90: number[]
  horizon: number
}

export async function timesfmForecast(
  prices: number[],
  horizon: number,
  freq = 0,
  timeoutMs = 60_000,
): Promise<ForecastResult> {
  const res = await fetch(`${TIMESFM_BASE_URL}/forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prices, horizon, freq }),
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  })
  const text = await res.text()
  if (!res.ok) throw new TimesFMError(res.status, text)
  return JSON.parse(text) as ForecastResult
}

export async function timesfmHealth(timeoutMs = 5_000): Promise<boolean> {
  try {
    const res = await fetch(`${TIMESFM_BASE_URL}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) return false
    const d = await res.json() as { status: string; model_loaded: boolean }
    return d.status === 'ok' && d.model_loaded === true
  } catch {
    return false
  }
}
