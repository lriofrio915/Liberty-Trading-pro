import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

function normalizePnl(pnl: number, resultado: string): number {
  const abs = Math.abs(pnl)
  if (resultado === 'WIN') return abs
  if (resultado === 'LOSS') return -abs
  return pnl
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { id } = await params
    const body = await req.json()

    // Verify ownership
    const existing = await prisma.tradingSession.findUnique({ where: { id } })
    if (!existing || existing.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Parse date as noon UTC to avoid timezone shift in UTC-5
    const [y, m, d] = (body.date as string).split('-').map(Number)
    const dateUTC = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))

    const pnlNeto = normalizePnl(parseFloat(body.pnlNeto), body.resultado)
    const pnlBruto = normalizePnl(parseFloat(body.pnlBruto), body.resultado)

    const session = await prisma.tradingSession.update({
      where: { id },
      data: {
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { id } = await params

    // Verify ownership
    const existing = await prisma.tradingSession.findUnique({ where: { id } })
    if (!existing || existing.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.tradingSession.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
