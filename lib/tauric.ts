const RAW_BASE = process.env.TAURIC_BASE_URL || 'https://tauric-liberty.fly.dev'
export const TAURIC_BASE_URL = RAW_BASE.replace(/\/+$/, '')
export const TAURIC_API_KEY  = process.env.TAURIC_API_KEY || ''

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (TAURIC_API_KEY) h['Authorization'] = `Bearer ${TAURIC_API_KEY}`
  return h
}

export class TauricError extends Error {
  status: number
  body: string
  constructor(status: number, body: string) {
    super(`Tauric ${status}: ${body.slice(0, 200)}`)
    this.status = status
    this.body = body
  }
}

export async function tauricJSON<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${TAURIC_BASE_URL}${path}`
  const res = await fetch(url, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers as Record<string, string> | undefined) },
    cache: 'no-store',
  })
  const text = await res.text()
  if (!res.ok) throw new TauricError(res.status, text)
  return text ? (JSON.parse(text) as T) : (undefined as T)
}

export async function tauricSSEProxy(path: string): Promise<Response> {
  const url = `${TAURIC_BASE_URL}${path}`
  const upstream = await fetch(url, {
    headers: { ...authHeaders(), Accept: 'text/event-stream' },
    cache: 'no-store',
  })

  if (!upstream.ok || !upstream.body) {
    const body = await upstream.text().catch(() => '')
    return new Response(
      `event: error\ndata: ${JSON.stringify({ status: upstream.status, body })}\n\n`,
      { status: upstream.status || 502, headers: { 'Content-Type': 'text/event-stream' } },
    )
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
