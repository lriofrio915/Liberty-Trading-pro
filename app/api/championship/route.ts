import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const MENTOR_EMAIL = 'lriofrio915@gmail.com'

function calcMetrics(sessions: { resultado: string; pnlNeto: number; date: Date | string }[], name: string) {
  if (!sessions.length) return { name, trades: 0, winRate: 0, pnl: 0, profitFactor: 0, rrPromedio: 0, equityCurve: [] }

  const wins = sessions.filter(s => s.resultado === 'WIN')
  const losses = sessions.filter(s => s.resultado === 'LOSS')
  const pnl = sessions.reduce((sum, s) => sum + s.pnlNeto, 0)
  const pnlGan = wins.reduce((sum, s) => sum + s.pnlNeto, 0)
  const pnlPer = losses.reduce((sum, s) => sum + s.pnlNeto, 0)
  const pf = pnlPer !== 0 ? Math.abs(pnlGan / pnlPer) : pnlGan > 0 ? 99 : 0
  const avgWin = wins.length ? pnlGan / wins.length : 0
  const avgLoss = losses.length ? Math.abs(pnlPer / losses.length) : 0
  const rr = avgLoss > 0 ? avgWin / avgLoss : 0

  // Equity curve sorted by date
  const sorted = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  let cumPnl = 0
  const equityCurve = sorted.map(s => {
    cumPnl += s.pnlNeto
    return { date: String(s.date).slice(0, 10), pnl: cumPnl }
  })

  return {
    name,
    trades: sessions.length,
    winRate: (wins.length / sessions.length) * 100,
    pnl,
    profitFactor: pf,
    rrPromedio: rr,
    equityCurve,
  }
}

export async function GET() {
  try {
    // 1. Mentor
    const mentorUser = await prisma.user.findFirst({ where: { email: MENTOR_EMAIL } })
    let mentor = null
    if (mentorUser) {
      const mentorSessions = await prisma.tradingSession.findMany({
        where: { userId: mentorUser.id },
        select: { resultado: true, pnlNeto: true, date: true },
        orderBy: { date: 'asc' },
      })
      mentor = calcMetrics(mentorSessions, mentorUser.name || 'Luis Riofrio')
    }

    // 2. Top alumnos — aggregate sessions by userId
    const grouped = await prisma.tradingSession.groupBy({
      by: ['userId'],
      _count: { _all: true },
      _sum: { pnlNeto: true },
      where: mentorUser ? { userId: { not: mentorUser.id } } : undefined,
    })

    const eligible = grouped
      .filter(g => (g._count._all ?? 0) >= 10)
      .sort((a, b) => (b._sum.pnlNeto ?? 0) - (a._sum.pnlNeto ?? 0))
      .slice(0, 10)

    const userIds = eligible.map(g => g.userId)
    const [users, allSessions] = await Promise.all([
      prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } }),
      prisma.tradingSession.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, resultado: true, pnlNeto: true },
      }),
    ])

    const topAlumnos = eligible.map((g, idx) => {
      const user = users.find(u => u.id === g.userId)
      const sess = allSessions.filter(s => s.userId === g.userId)
      const wins = sess.filter(s => s.resultado === 'WIN')
      const losses = sess.filter(s => s.resultado === 'LOSS')
      const pnlGan = wins.reduce((s, t) => s + t.pnlNeto, 0)
      const pnlPer = losses.reduce((s, t) => s + t.pnlNeto, 0)
      const pf = pnlPer !== 0 ? Math.abs(pnlGan / pnlPer) : pnlGan > 0 ? 99 : 0
      return {
        rank: idx + 1,
        name: user?.name || 'Trader',
        trades: g._count._all,
        pnl: g._sum.pnlNeto ?? 0,
        winRate: sess.length ? (wins.length / sess.length) * 100 : 0,
        profitFactor: pf,
      }
    })

    return NextResponse.json({ mentor, topAlumnos })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
