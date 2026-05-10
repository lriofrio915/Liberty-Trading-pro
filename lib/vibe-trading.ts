/**
 * Cliente helper para Vibe-Trading (https://github.com/HKUDS/Vibe-Trading).
 * Proxy desde Next.js a un FastAPI Python que corre en puerto 8899
 * (o el host que se configure en VIBE_TRADING_BASE_URL).
 *
 * Levantar el backend:
 *   git clone https://github.com/HKUDS/Vibe-Trading.git
 *   cd Vibe-Trading && cp agent/.env.example agent/.env
 *   docker compose up --build   # API en :8899
 */

const RAW_BASE = process.env.VIBE_TRADING_BASE_URL || 'https://vibe-trading-liberty.fly.dev'
export const VIBE_BASE_URL = RAW_BASE.replace(/\/+$/, '')
export const VIBE_API_KEY = process.env.VIBE_TRADING_API_KEY || ''

export class VibeTradingError extends Error {
  status: number
  body: string
  constructor(status: number, body: string) {
    super(`Vibe-Trading ${status}: ${body.slice(0, 200)}`)
    this.status = status
    this.body = body
  }
}

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (VIBE_API_KEY) h['Authorization'] = `Bearer ${VIBE_API_KEY}`
  return h
}

export async function vibeJSON<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${VIBE_BASE_URL}${path}`
  const res = await fetch(url, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers as Record<string, string> | undefined) },
    cache: 'no-store',
  })
  const text = await res.text()
  if (!res.ok) throw new VibeTradingError(res.status, text)
  return text ? (JSON.parse(text) as T) : (undefined as T)
}

/**
 * Reenvía un endpoint SSE del backend Vibe-Trading al cliente.
 * El upstream entrega text/event-stream, lo pasamos tal cual.
 */
export async function vibeSSEProxy(path: string): Promise<Response> {
  const url = `${VIBE_BASE_URL}${path}`
  const upstream = await fetch(url, {
    headers: { ...authHeaders(), Accept: 'text/event-stream' },
    cache: 'no-store',
  })

  if (!upstream.ok || !upstream.body) {
    const body = await upstream.text().catch(() => '')
    return new Response(
      `event: error\ndata: ${JSON.stringify({ status: upstream.status, body })}\n\n`,
      {
        status: upstream.status || 502,
        headers: { 'Content-Type': 'text/event-stream' },
      },
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

export type SwarmPreset = {
  id: string
  name: string
  description?: string
  agents?: number
}

export type Session = { id: string; created_at?: string }
export type RunRef = { id: string; status?: string }
