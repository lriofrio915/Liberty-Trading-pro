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
    const data = await dailySignalsJSON<{ status: string }>('/api/health', {}, 5_000)
    return NextResponse.json({ online: data?.status === 'ok' })
  } catch (err) {
    if (err instanceof DailySignalsError) {
      return NextResponse.json({ online: false, reason: err.message })
    }
    return NextResponse.json({ online: false, reason: 'timeout' })
  }
}
