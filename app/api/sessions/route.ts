import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ sessions: [] })

    const sessions = await prisma.tradingSession.findMany({
      where: { userId: dbUser.id },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ sessions })
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

    const session = await prisma.tradingSession.create({
      data: {
        userId: dbUser.id,
        date: new Date(body.date),
        instrumento: body.instrumento,
        direccion: body.direccion,
        resultado: body.resultado,
        pnlBruto: parseFloat(body.pnlBruto),
        comisiones: parseFloat(body.comisiones || 0),
        pnlNeto: parseFloat(body.pnlNeto),
        contratos: parseInt(body.contratos || 1),
        entryPrice: body.entryPrice ? parseFloat(body.entryPrice) : null,
        exitPrice: body.exitPrice ? parseFloat(body.exitPrice) : null,
        stopLoss: body.stopLoss ? parseFloat(body.stopLoss) : null,
        takeProfit: body.takeProfit ? parseFloat(body.takeProfit) : null,
        rrReal: body.rrReal ? parseFloat(body.rrReal) : null,
        siguioPlan: body.siguioPlan !== false,
        sentimiento: body.sentimiento || null,
        notas: body.notas || null,
        screenshotUrl: body.screenshotUrl || null,
        planId: body.planId || null,
      },
    })

    return NextResponse.json({ session })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
