import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bot_token, chat_id } = await req.json().catch(() => ({})) as {
    bot_token?: string
    chat_id?: string
  }

  if (!bot_token || !chat_id) {
    return NextResponse.json({ ok: false, error: 'bot_token y chat_id requeridos' }, { status: 400 })
  }

  try {
    const tgUrl = `https://api.telegram.org/bot${bot_token}/sendMessage`
    const res = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id,
        text: '✅ *Liberty Trading Pro* — Conexión Telegram verificada correctamente.',
        parse_mode: 'Markdown',
      }),
      signal: AbortSignal.timeout(10_000),
    })
    const data = await res.json() as { ok: boolean; description?: string }
    if (!data.ok) return NextResponse.json({ ok: false, error: data.description ?? 'Error de Telegram' })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error de red'
    return NextResponse.json({ ok: false, error: msg }, { status: 502 })
  }
}
