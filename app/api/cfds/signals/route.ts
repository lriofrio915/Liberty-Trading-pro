import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET /api/cfds/signals?sector=Futuros — señales guardadas, filtradas por sector */
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const sector = url.searchParams.get('sector') ?? null
  const openEntryOnly = url.searchParams.get('openEntry') === 'true'
  const isAdmin = session.user.email === ADMIN_EMAIL

  const signals = await prisma.cfdSignal.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    where: {
      ...(isAdmin ? {} : { active: true }),
      ...(sector ? { sector } : {}),
      ...(openEntryOnly ? { openEntry: true } : {}),
    },
  })

  return NextResponse.json(signals)
}

/** POST /api/cfds/signals — guardar batch de señales del análisis */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const signals: unknown[] = Array.isArray(body.signals) ? body.signals : []
  const forceRefresh: boolean = body.forceRefresh === true

  if (signals.length === 0) {
    return NextResponse.json({ error: 'No hay señales para guardar' }, { status: 400 })
  }

  const simbolosList = signals.map((s: any) => String(s.simbolo ?? ''))

  // forceRefresh: desactivar señales PENDIENTE anteriores de estos símbolos
  if (forceRefresh && simbolosList.length > 0) {
    await prisma.cfdSignal.updateMany({
      where: { simbolo: { in: simbolosList }, resultado: 'PENDIENTE', active: true },
      data: { active: false },
    })
  }

  // Guard 1: skip Futuros symbols already generated TODAY (max 1 per index per day)
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const hasFuturos = !forceRefresh && signals.some((s: any) => String(s.sector ?? '') === 'Futuros')
  let todaySet = new Set<string>()
  if (hasFuturos) {
    const todaySignals = await prisma.cfdSignal.findMany({
      where: { sector: 'Futuros', createdAt: { gte: today } },
      select: { simbolo: true },
    })
    todaySet = new Set(todaySignals.map(s => s.simbolo))
  }

  // Guard 2: skip symbols that already have a PENDIENTE signal (no duplicate open positions)
  const pendientes = forceRefresh ? [] : await prisma.cfdSignal.findMany({
    where: { simbolo: { in: simbolosList }, resultado: 'PENDIENTE' },
    select: { simbolo: true },
  })
  const blockedSet = new Set(pendientes.map((p: { simbolo: string }) => p.simbolo))
  const toSave = signals.filter((s: any) => {
    const sym = String(s.simbolo ?? '')
    if (!forceRefresh && String(s.sector ?? '') === 'Futuros' && todaySet.has(sym)) return false
    return forceRefresh || !blockedSet.has(sym)
  })
  const skipped = simbolosList.filter(sym => blockedSet.has(sym))

  if (toSave.length === 0) {
    return NextResponse.json({
      saved: 0,
      skipped: skipped.length,
      skippedSymbols: skipped,
      reason: 'pending signal exists for all symbols',
    }, { status: 200 })
  }

  const created = await prisma.cfdSignal.createMany({
    data: toSave.map((s: any) => ({
      simbolo:       String(s.simbolo ?? ''),
      nombre:        String(s.nombre ?? ''),
      sector:        String(s.sector ?? ''),
      sesgo:         String(s.sesgo ?? 'COMPRA'),
      confianza:     Number(s.confianza ?? 70),
      razon:         String(s.razon ?? ''),
      active:        true,
      precioEntrada: Number(s.precioEntrada ?? 0),
      stopLoss:      Number(s.stopLoss ?? 0),
      takeProfit:    Number(s.takeProfit ?? 0),
      lotaje:        Number(s.lotaje ?? 0.01),
      riesgoUsd:     Number(s.riesgoUsd ?? 10),
      rrRatio:       Number(s.rrRatio ?? 2),
      riskProfile:   String(s.riskProfile ?? 'moderado'),
    })),
    skipDuplicates: false,
  })

  return NextResponse.json({
    saved: created.count,
    skipped: skipped.length,
    skippedSymbols: skipped,
  }, { status: 201 })
}

/** DELETE /api/cfds/signals — borrar por IDs o todos (solo admin) */
export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_EMAIL || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const ids: string[] | undefined = Array.isArray(body.ids) && body.ids.length > 0
    ? body.ids
    : undefined

  const { count } = ids
    ? await prisma.cfdSignal.deleteMany({ where: { id: { in: ids } } })
    : await prisma.cfdSignal.deleteMany({})

  return NextResponse.json({ deleted: count })
}
