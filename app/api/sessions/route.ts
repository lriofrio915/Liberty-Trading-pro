import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

function normalizePnl(pnl: number, resultado: string): number {
  const abs = Math.abs(pnl)
  if (resultado === 'WIN') return abs
  if (resultado === 'LOSS') return -abs
  return pnl
}

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

    const dbUser = await prisma.user.upsert({
      where: { authId: user.id },
      update: {},
      create: {
        authId: user.id,
        email: user.email ?? user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Trader',
      },
    })

    const body = await req.json()

    // Client sends ISO string already set to local noon — store directly
    const dateUTC = new Date(body.date as string)

    const pnlNeto = normalizePnl(parseFloat(body.pnlNeto), body.resultado)
    const pnlBruto = normalizePnl(parseFloat(body.pnlBruto), body.resultado)

    const session = await prisma.tradingSession.create({
      data: {
        userId: dbUser.id,
        date: dateUTC,
        instrumento: body.instrumento,
        direccion: body.direccion,
        resultado: body.resultado,
        pnlBruto,
        comisiones: parseFloat(body.comisiones || 0),
        pnlNeto,
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
