/**
 * rate-limit.ts — Dual-mode rate limiter.
 *
 * If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, uses
 * Upstash Redis sliding-window (survives Vercel cold starts / multi-instance).
 * Otherwise falls back to in-memory Map (single-instance, resets on cold start).
 *
 * Usage:
 *   import { checkRateLimit } from '@/lib/rate-limit'
 *   const allowed = await checkRateLimit(ip, { max: 30, windowMs: 60_000 })
 *   if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 */

export interface RateLimitOptions {
  max: number
  windowMs: number
}

// ── In-memory fallback ────────────────────────────────────────────────────────

const memStore = new Map<string, { count: number; resetAt: number }>()

function checkMemory(key: string, opts: RateLimitOptions): boolean {
  const now = Date.now()
  const record = memStore.get(key)
  if (!record || now > record.resetAt) {
    memStore.set(key, { count: 1, resetAt: now + opts.windowMs })
    return true
  }
  if (record.count >= opts.max) return false
  record.count++
  return true
}

// ── Upstash Redis (optional) ──────────────────────────────────────────────────

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || ''
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || ''
const USE_UPSTASH = Boolean(UPSTASH_URL && UPSTASH_TOKEN)

async function checkUpstash(key: string, opts: RateLimitOptions): Promise<boolean> {
  const windowSec = Math.ceil(opts.windowMs / 1000)
  // Sliding window using INCR + EXPIRE
  const incrUrl = `${UPSTASH_URL}/pipeline`
  const body = JSON.stringify([
    ['INCR', key],
    ['EXPIRE', key, windowSec, 'NX'],
  ])
  const res = await fetch(incrUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body,
    signal: AbortSignal.timeout(3000),
  })
  if (!res.ok) {
    // Upstash error — fall back to allow (fail open)
    console.warn('[rate-limit] Upstash request failed, failing open')
    return true
  }
  const data = await res.json() as [{ result: number }, unknown]
  const count = data[0]?.result ?? 1
  return count <= opts.max
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function checkRateLimit(
  key: string,
  opts: RateLimitOptions,
): Promise<boolean> {
  if (USE_UPSTASH) {
    return checkUpstash(key, opts).catch(() => true) // fail open on network error
  }
  return checkMemory(key, opts)
}
