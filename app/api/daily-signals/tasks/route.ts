import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { dailySignalsJSON, DailySignalsError } from '@/lib/daily-signals'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET ?task_id=xxx → poll single task status
// GET           → list all tasks
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const taskId = req.nextUrl.searchParams.get('task_id')

  try {
    if (taskId) {
      const data = await dailySignalsJSON(`/api/v1/analysis/status/${encodeURIComponent(taskId)}`, {}, 8_000)
      return NextResponse.json(data)
    }
    const data = await dailySignalsJSON('/api/v1/analysis/tasks', {}, 8_000)
    return NextResponse.json(data ?? [])
  } catch (err) {
    if (err instanceof DailySignalsError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Daily Signals no disponible' }, { status: 502 })
  }
}
