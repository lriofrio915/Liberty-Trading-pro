import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public endpoint — no auth required
// Returns Luis Riofrio's real trading metrics for the landing page

const LUIS_USER_ID = 'cmmjkgdt800004kjq1zep8qc9'
const CAPITAL_INICIAL = 51000

export async function GET() {
  try {
    const now = new Date()
    const ytdStart = new Date(now.getFullYear(), 0, 1) // Jan 1 current year

    const sessions = await prisma.tradingSession.findMany({
      where: {
        userId: LUIS_USER_ID,
        date: { gte: ytdStart },
      },
      orderBy: { date: 'desc' },
    })

    const totalTrades = sessions.length
    const wins = sessions.filter((s) => s.resultado === 'WIN')
    const losses = sessions.filter((s) => s.resultado === 'LOSS')

    const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0

    const grossWins = wins.reduce((sum, s) => sum + Math.abs(s.pnlNeto), 0)
    const grossLosses = losses.reduce((sum, s) => sum + Math.abs(s.pnlNeto), 0)
    const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? 999 : 0

    const totalNetPnl = sessions.reduce((sum, s) => sum + s.pnlNeto, 0)
    const rendimientoYTD = (totalNetPnl / CAPITAL_INICIAL) * 100

    const recentSessions = sessions.slice(0, 5).map((s) => ({
      date: s.date,
      instrumento: s.instrumento,
      direccion: s.direccion,
      resultado: s.resultado,
      pnlNeto: s.pnlNeto,
    }))

    return NextResponse.json(
      {
        totalTrades,
        wins: wins.length,
        losses: losses.length,
        winRate: Math.round(winRate * 10) / 10,
        profitFactor: Math.round(profitFactor * 100) / 100,
        totalNetPnl: Math.round(totalNetPnl * 100) / 100,
        rendimientoYTD: Math.round(rendimientoYTD * 100) / 100,
        recentSessions,
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    )
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
