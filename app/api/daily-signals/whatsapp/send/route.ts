import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { notifyAccionesDailyScanner } from '@/lib/notify-nexus'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Signal {
  stock_code?: string
  symbol?: string
  operation_advice?: string
  sentiment_score?: number
  summary?: string
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as { signals?: Signal[]; stockList?: string }
  const signals = body.signals ?? []
  const tickers = (body.stockList ?? '').split(/[\s,]+/).filter(Boolean)

  if (signals.length === 0) return NextResponse.json({ ok: true, sent: false, reason: 'no_signals' })

  await notifyAccionesDailyScanner(signals, tickers, false)
  return NextResponse.json({ ok: true, sent: true, count: signals.length })
}
