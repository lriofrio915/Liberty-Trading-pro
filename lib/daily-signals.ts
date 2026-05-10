const RAW_BASE = process.env.DAILY_SIGNALS_BASE_URL || 'https://daily-signals-liberty.fly.dev'
export const DAILY_SIGNALS_BASE_URL = RAW_BASE.replace(/\/+$/, '')
export const DAILY_SIGNALS_API_KEY  = process.env.DAILY_SIGNALS_API_KEY || ''

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (DAILY_SIGNALS_API_KEY) h['Authorization'] = `Bearer ${DAILY_SIGNALS_API_KEY}`
  return h
}

export class DailySignalsError extends Error {
  status: number
  body: string
  constructor(status: number, body: string) {
    super(`DailySignals ${status}: ${body.slice(0, 200)}`)
    this.status = status
    this.body = body
  }
}

export async function dailySignalsJSON<T = unknown>(
  path: string,
  init: RequestInit = {},
  timeoutMs = 15_000,
): Promise<T> {
  const url = `${DAILY_SIGNALS_BASE_URL}${path}`
  const res = await fetch(url, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers as Record<string, string> | undefined) },
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  })
  const text = await res.text()
  if (!res.ok) throw new DailySignalsError(res.status, text)
  return text ? (JSON.parse(text) as T) : (undefined as T)
}
