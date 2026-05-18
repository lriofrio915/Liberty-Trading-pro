import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { dailySignalsJSON, DailySignalsError } from '@/lib/daily-signals'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // GET /api/v1/history — returns paginated history records
    const data = await dailySignalsJSON('/api/v1/history?page=1&page_size=100', {}, 10_000)
    return NextResponse.json(data ?? [])
  } catch (err) {
    if (err instanceof DailySignalsError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Daily Signals no disponible' }, { status: 502 })
  }
}
