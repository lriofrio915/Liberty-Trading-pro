import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { fetchTickerFinancials } from '@/lib/yahoo-financials'

const ADMIN_EMAIL = 'lriofrio915@gmail.com'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const ticker = req.nextUrl.searchParams.get('ticker')?.toUpperCase().trim()
    if (!ticker) return NextResponse.json({ error: 'ticker requerido' }, { status: 400 })

    const data = await fetchTickerFinancials(ticker)
    return NextResponse.json({ data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al obtener datos'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
