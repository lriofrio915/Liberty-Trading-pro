import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { dailySignalsJSON, DailySignalsError } from '@/lib/daily-signals'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { stocks?: string[] }
  const stock_codes = body.stocks ?? []

  try {
    // POST /api/v1/analysis/analyze — AnalyzeRequest: { stock_codes: string[] }
    const data = await dailySignalsJSON('/api/v1/analysis/analyze', {
      method: 'POST',
      body: JSON.stringify({ stock_codes }),
    }, 55_000)
    return NextResponse.json(data ?? { started: true })
  } catch (err) {
    if (err instanceof DailySignalsError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Daily Signals no disponible' }, { status: 502 })
  }
}
