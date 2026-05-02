import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const sessions = await prisma.tradingSession.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        date: true,
        instrumento: true,
        direccion: true,
        resultado: true,
        pnlNeto: true,
        contratos: true,
      },
    })

    if (sessions.length === 0) {
      return NextResponse.json({
        user: { name: user.name },
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        profitFactor: 0,
        totalNetPnl: 0,
        sessions: [],
        firstTrade: null,
        lastTrade: null,
      })
    }

    const wins = sessions.filter((s) => s.resultado === 'WIN')
    const losses = sessions.filter((s) => s.resultado === 'LOSS')
    const winRate = (wins.length / sessions.length) * 100
    const grossWins = wins.reduce((sum, s) => sum + Math.abs(s.pnlNeto), 0)
    const grossLosses = losses.reduce((sum, s) => sum + Math.abs(s.pnlNeto), 0)
    const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? 999 : 0
    const totalNetPnl = sessions.reduce((sum, s) => sum + s.pnlNeto, 0)

    // Sessions are ordered desc, so last is oldest
    const firstTrade = sessions[sessions.length - 1].date
    const lastTrade = sessions[0].date

    return NextResponse.json(
      {
        user: { name: user.name },
        totalTrades: sessions.length,
        wins: wins.length,
        losses: losses.length,
        winRate: Math.round(winRate * 10) / 10,
        profitFactor: Math.round(profitFactor * 100) / 100,
        totalNetPnl: Math.round(totalNetPnl * 100) / 100,
        firstTrade,
        lastTrade,
        sessions,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        },
      }
    )
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
