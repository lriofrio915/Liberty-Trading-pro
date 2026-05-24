import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { callAIWithSystem } from '@/lib/ai-providers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SYSTEM = `Eres analista financiero. Tu tarea es formatear resultados de análisis bursátil en UN SOLO mensaje de Telegram en español.

Usa este formato exacto (Markdown de Telegram):
━━━━━━━━━━━━━━━
📊 *DAILY SCANNER — Liberty Trading*
━━━━━━━━━━━━━━━
[para cada acción:]
🔹 *{TICKER}* — {Nombre}
  Señal: *{COMPRAR/VENDER/MANTENER/REDUCIR/ACUMULAR}*
  Score: {N}/100
  {1 oración corta en español con el contexto de la señal}

[al final:]
━━━━━━━━━━━━━━━
🤖 _Liberty Trading Club_

Reglas:
- Traducir señales al español: 买入→COMPRAR, 卖出→VENDER, 持有→MANTENER, 增持→ACUMULAR, 减持→REDUCIR
- 1 oración por acción, máximo 120 caracteres
- Solo usar *bold*, _italic_ de Telegram Markdown
- No inventar precios específicos`

type SignalInput = {
  stock_code?: string
  stock_name?: string
  operation_advice?: string
  sentiment_score?: number
  recommendation?: string
  signal?: string
  score?: number
}

function signalLabel(sig?: string): string {
  const up = (sig ?? '').toUpperCase()
  if (up.includes('买入') || up.includes('BUY') || up.includes('OVERWEIGHT')) return 'COMPRAR'
  if (up.includes('卖出') || up.includes('SELL')) return 'VENDER'
  if (up.includes('减持') || up.includes('UNDERWEIGHT') || up.includes('REDUCE')) return 'REDUCIR'
  if (up.includes('增持') || up.includes('ACCUMULATE')) return 'ACUMULAR'
  return 'MANTENER'
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as {
    signals: SignalInput[]
    bot_token: string
    chat_id: string
  }

  const { signals, bot_token, chat_id } = body
  if (!signals?.length || !bot_token || !chat_id) {
    return NextResponse.json({ error: 'signals, bot_token y chat_id requeridos' }, { status: 400 })
  }

  // Build data summary for LLM
  const summary = signals.map(s => {
    const ticker = s.stock_code ?? '??'
    const name   = s.stock_name ?? ticker
    const sig    = s.operation_advice ?? s.recommendation ?? s.signal ?? ''
    const label  = signalLabel(sig)
    const score  = s.sentiment_score ?? s.score ?? null
    return `${ticker} (${name}): señal=${label}, score=${score ?? 'N/A'}/100, raw="${sig}"`
  }).join('\n')

  let message: string
  try {
    message = await callAIWithSystem(SYSTEM, `Señales del día:\n${summary}`, {
      maxTokens: 600,
      temperature: 0.3,
    })
  } catch {
    // Fallback: plain formatted message without LLM
    const lines = signals.map(s => {
      const ticker = s.stock_code ?? '??'
      const name   = s.stock_name ?? ticker
      const sig    = s.operation_advice ?? s.recommendation ?? s.signal ?? ''
      const label  = signalLabel(sig)
      const score  = s.sentiment_score ?? s.score
      return `🔹 *${ticker}* — ${name}\n  Señal: *${label}*${score != null ? `\n  Score: ${score}/100` : ''}`
    }).join('\n\n')
    message = `━━━━━━━━━━━━━━━\n📊 *DAILY SCANNER — Liberty Trading*\n━━━━━━━━━━━━━━━\n\n${lines}\n\n━━━━━━━━━━━━━━━\n🤖 _Liberty Trading Club_`
  }

  // Send to Telegram
  try {
    const tgUrl = `https://api.telegram.org/bot${bot_token}/sendMessage`
    const res = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text: message, parse_mode: 'Markdown' }),
      signal: AbortSignal.timeout(10_000),
    })
    const data = await res.json() as { ok: boolean; description?: string }
    if (!data.ok) {
      // Retry without markdown if parse error
      const res2 = await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id, text: message.replace(/[*_]/g, ''), parse_mode: '' }),
        signal: AbortSignal.timeout(10_000),
      })
      const data2 = await res2.json() as { ok: boolean; description?: string }
      if (!data2.ok) return NextResponse.json({ ok: false, error: data2.description })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'Error de red' }, { status: 502 })
  }
}
