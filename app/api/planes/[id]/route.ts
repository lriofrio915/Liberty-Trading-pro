import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

async function resolveDbUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return prisma.user.findUnique({ where: { authId: user.id } })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dbUser = await resolveDbUser()
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    await prisma.tradingPlan.updateMany({
      where: { id: params.id, userId: dbUser.id },
      data: {
        name: body.name,
        broker: body.broker || '',
        accountName: body.accountName || '',
        capitalInicial: parseFloat(body.capitalInicial) || 0,
        riesgo: parseFloat(body.riesgo) || 1,
        rrRatio: parseFloat(body.rrRatio) || 2,
        riesgoPorTrade: parseFloat(body.riesgoPorTrade) || 0,
        gestionStop: body.gestionStop || '',
        reglas: body.reglas || '',
        horaInicio: body.horaInicio || '09:30',
        horaFin: body.horaFin || '11:30',
        instrumento: body.instrumento || 'NQ',
        dataFeedMensual: body.dataFeedMensual ? parseFloat(body.dataFeedMensual) : null,
        comisionPorTrade: body.comisionPorTrade ? parseFloat(body.comisionPorTrade) : null,
        active: body.active ?? true,
      },
    })

    const plan = await prisma.tradingPlan.findUnique({ where: { id: params.id } })
    return NextResponse.json({ plan })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dbUser = await resolveDbUser()
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.tradingPlan.deleteMany({
      where: { id: params.id, userId: dbUser.id },
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
