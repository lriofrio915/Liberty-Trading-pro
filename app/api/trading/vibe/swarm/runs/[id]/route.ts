import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { vibeJSON, VibeTradingError } from '@/lib/vibe-trading'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const data = await vibeJSON(`/swarm/runs/${encodeURIComponent(id)}`)
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof VibeTradingError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Vibe-Trading unreachable' }, { status: 502 })
  }
}
