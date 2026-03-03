import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ planes: [] })

    const planes = await prisma.tradingPlan.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ planes })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json()

    const plan = await prisma.tradingPlan.create({
      data: {
        userId: dbUser.id,
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

    return NextResponse.json({ plan })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
