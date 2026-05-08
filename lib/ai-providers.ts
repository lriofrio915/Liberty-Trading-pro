/**
 * ai-providers.ts — Centralized AI provider with automatic fallback.
 *
 * Primary: OpenRouter (OPENROUTER_API_KEY + OPENROUTER_MODEL)
 * Fallback: MiniMax (MINIMAX_API_KEY + MINIMAX_MODEL)
 *
 * When OpenRouter returns HTTP 402 (credit exhaustion), automatically
 * switches to MiniMax for the remainder of the request.
 *
 * Usage:
 *   import { callAI } from '@/lib/ai-providers'
 *   const reply = await callAI({ messages, maxTokens: 600, temperature: 0.7 })
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AICallOptions {
  messages: { role: string; content: string }[]
  maxTokens?: number
  temperature?: number
  signal?: AbortSignal
  /** Optional model override (uses env default if not set) */
  model?: string
  /** HTTP referer for OpenRouter ranking */
  httpReferer?: string
  /** X-Title for OpenRouter */
  xTitle?: string
}

export interface AICallResult {
  content: string
  provider: 'openrouter' | 'minimax' | 'fallback'
  model: string
}

// ── Provider configs ──────────────────────────────────────────────────────────

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || ''
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3-0324'

const MINIMAX_KEY = process.env.MINIMAX_API_KEY || ''
const MINIMAX_MODEL = process.env.MINIMAX_MODEL || 'MiniMax-Text-01'

// ── OpenRouter call ───────────────────────────────────────────────────────────

async function callOpenRouter(opts: AICallOptions): Promise<AICallResult> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.httpReferer ? { 'HTTP-Referer': opts.httpReferer } : {}),
      ...(opts.xTitle ? { 'X-Title': opts.xTitle } : {}),
    },
    body: JSON.stringify({
      model: opts.model || OPENROUTER_MODEL,
      messages: opts.messages,
      max_tokens: opts.maxTokens ?? 600,
      temperature: opts.temperature ?? 0.7,
    }),
    signal: opts.signal ?? AbortSignal.timeout(60_000),
  })

  if (res.status === 402) {
    // Credit exhaustion — let caller handle fallback
    throw new OpenRouterCreditError(`OpenRouter credit exhausted (402)`)
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`OpenRouter ${res.status}: ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  return {
    content: data.choices?.[0]?.message?.content ?? '',
    provider: 'openrouter',
    model: opts.model || OPENROUTER_MODEL,
  }
}

// ── MiniMax call (fallback) ───────────────────────────────────────────────────

async function callMiniMax(opts: AICallOptions): Promise<AICallResult> {
  if (!MINIMAX_KEY) {
    throw new Error('MINIMAX_API_KEY not configured')
  }

  // Format messages for MiniMax (roles: system, user, assistant)
  const minimaxMessages = opts.messages.map(m => ({
    role: m.role === 'system' ? 'system' : m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  }))

  const res = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MINIMAX_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MINIMAX_MODEL,
      messages: minimaxMessages,
      tokens_to_generate: opts.maxTokens ?? 600,
      temperature: opts.temperature ?? 0.7,
      top_p: 0.95,
    }),
    signal: opts.signal ?? AbortSignal.timeout(60_000),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`MiniMax ${res.status}: ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const reply = data.reply || data.choices?.[0]?.message?.content || ''
  return {
    content: reply,
    provider: 'minimax',
    model: MINIMAX_MODEL,
  }
}

// ── Custom error ──────────────────────────────────────────────────────────────

export class OpenRouterCreditError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OpenRouterCreditError'
  }
}

// ── Main callAI (with fallback) ───────────────────────────────────────────────

export async function callAI(opts: AICallOptions): Promise<AICallResult> {
  // Primary: OpenRouter
  try {
    return await callOpenRouter(opts)
  } catch (err) {
    // Auto-fallback to MiniMax on credit exhaustion
    if (err instanceof OpenRouterCreditError) {
      console.warn('[ai-providers] OpenRouter credit exhausted, falling back to MiniMax')
      try {
        const result = await callMiniMax(opts)
        console.log('[ai-providers] MiniMax fallback succeeded')
        return result
      } catch (fallbackErr: any) {
        console.error('[ai-providers] MiniMax fallback also failed:', fallbackErr?.message)
        throw new Error(`AI providers exhausted: OpenRouter (402) + MiniMax (${fallbackErr?.message})`)
      }
    }
    // Other errors propagate
    throw err
  }
}

// ── Convenience: simple text-in/text-out ──────────────────────────────────────

export async function callAIWithSystem(
  systemPrompt: string,
  userMessage: string,
  opts: Partial<AICallOptions> = {},
): Promise<string> {
  const result = await callAI({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    ...opts,
  })
  return result.content
}
