import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getEffectiveAccess } from '@/lib/access'
import { analyzeOptionsTicker } from '@/lib/options/analyzer'

export const maxDuration = 30

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { authId: user.id },
      select: { plan: true, trialEndsAt: true },
    })
    const access = getEffectiveAccess({ plan: dbUser?.plan ?? 'FREE', trialEndsAt: dbUser?.trialEndsAt ?? null })
    if (!access.canAccessClub) return NextResponse.json({ error: 'Club requerido' }, { status: 403 })

    const ticker = req.nextUrl.searchParams.get('ticker')?.trim().toUpperCase()
    if (!ticker) return NextResponse.json({ error: 'ticker es requerido' }, { status: 400 })
    if (!/^[A-Z0-9.-]{1,12}$/.test(ticker)) return NextResponse.json({ error: 'ticker invalido' }, { status: 400 })

    const data = await analyzeOptionsTicker(ticker)
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al analizar opciones'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
