import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { vibeJSON, VibeTradingError } from '@/lib/vibe-trading'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function requireUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

function fail(err: unknown) {
  if (err instanceof VibeTradingError) {
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
  const msg = err instanceof Error ? err.message : 'Vibe-Trading unreachable'
  return NextResponse.json({ error: msg }, { status: 502 })
}

export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const data = await vibeJSON('/swarm/presets')
    return NextResponse.json(data)
  } catch (err) {
    return fail(err)
  }
}

export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  try {
    const data = await vibeJSON('/swarm/runs', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return NextResponse.json(data)
  } catch (err) {
    return fail(err)
  }
}
