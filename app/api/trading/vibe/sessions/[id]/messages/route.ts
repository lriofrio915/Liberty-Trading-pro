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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

type SessionResponse = { session_id?: string; id?: string; session?: { id?: string } }

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  // Vibe-Trading sólo acepta { content: string } (1-5000 chars).
  const content = String(body.content ?? body.message ?? '').slice(0, 5000)
  if (!content) return NextResponse.json({ error: 'content required' }, { status: 400 })

  try {
    const data = await vibeJSON(
      `/sessions/${encodeURIComponent(params.id)}/messages`,
      { method: 'POST', body: JSON.stringify({ content }) },
    )
    return NextResponse.json(data)
  } catch (err) {
    // Sesión expirada en el backend — crear una nueva y reintentar de forma transparente
    if (err instanceof VibeTradingError && err.status === 404) {
      try {
        const sessionData = await vibeJSON<SessionResponse>('/sessions', {
          method: 'POST',
          body: JSON.stringify({}),
        })
        const newSessionId =
          sessionData?.session_id ?? sessionData?.id ?? sessionData?.session?.id
        if (!newSessionId) {
          return NextResponse.json(
            { error: 'No se pudo renovar la sesión con el agente' },
            { status: 503 },
          )
        }
        // Pequeño delay para que el FastAPI inicialice la sesión nueva
        await sleep(300)
        const retryData = await vibeJSON(
          `/sessions/${encodeURIComponent(String(newSessionId))}/messages`,
          { method: 'POST', body: JSON.stringify({ content }) },
        )
        return NextResponse.json(retryData, {
          headers: { 'X-New-Session-Id': String(newSessionId) },
        })
      } catch (retryErr) {
        return fail(retryErr)
      }
    }
    return fail(err)
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await vibeJSON(
      `/sessions/${encodeURIComponent(params.id)}/messages`,
    )
    return NextResponse.json(data)
  } catch (err) {
    return fail(err)
  }
}
