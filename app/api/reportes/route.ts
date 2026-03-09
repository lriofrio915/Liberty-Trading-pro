import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export interface ReportStats {
  total: number
  wins: number
  losses: number
  breakevens: number
  winRate: number
  pnlNeto: number
  pnlBruto: number
  comisiones: number
  profitFactor: number
  rrPromedio: number
  maxDrawdown: number
  mejorTrade: number
  peorTrade: number
  disciplina: number
}

function computeStats(sessions: any[]): ReportStats {
  const wins = sessions.filter(s => s.resultado === 'WIN')
  const losses = sessions.filter(s => s.resultado === 'LOSS')
  const breakevens = sessions.filter(s => !['WIN', 'LOSS'].includes(s.resultado))

  const pnlNeto = sessions.reduce((sum, s) => sum + (s.pnlNeto || 0), 0)
  const pnlBruto = sessions.reduce((sum, s) => sum + (s.pnlBruto || 0), 0)
  const comisiones = sessions.reduce((sum, s) => sum + (s.comisiones || 0), 0)

  const winPnl = wins.reduce((sum, s) => sum + Math.abs(s.pnlNeto || 0), 0)
  const lossPnl = losses.reduce((sum, s) => sum + Math.abs(s.pnlNeto || 0), 0)
  const profitFactor = lossPnl > 0 ? winPnl / lossPnl : wins.length > 0 ? 99 : 0

  const winRate = sessions.length > 0 ? (wins.length / sessions.length) * 100 : 0

  const rrValues = sessions.filter(s => s.rrReal !== null).map(s => s.rrReal as number)
  const rrPromedio = rrValues.length > 0 ? rrValues.reduce((a, b) => a + b, 0) / rrValues.length : 0

  const sorted = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  let peak = 0, maxDD = 0, balance = 0
  sorted.forEach(s => {
    balance += s.pnlNeto || 0
    if (balance > peak) peak = balance
    const dd = peak - balance
    if (dd > maxDD) maxDD = dd
  })

  const pnlValues = sessions.map(s => s.pnlNeto || 0)
  const mejorTrade = pnlValues.length > 0 ? Math.max(...pnlValues) : 0
  const peorTrade = pnlValues.length > 0 ? Math.min(...pnlValues) : 0

  const disciplina = sessions.length > 0
    ? (sessions.filter(s => s.siguioPlan).length / sessions.length) * 100
    : 0

  return {
    total: sessions.length,
    wins: wins.length,
    losses: losses.length,
    breakevens: breakevens.length,
    winRate,
    pnlNeto,
    pnlBruto,
    comisiones,
    profitFactor,
    rrPromedio,
    maxDrawdown: maxDD,
    mejorTrade,
    peorTrade,
    disciplina,
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ sessions: [], stats: computeStats([]) })

    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const planId = searchParams.get('planId')

    const where: any = { userId: dbUser.id }
    if (from && to) {
      where.date = {
        gte: new Date(`${from}T00:00:00.000Z`),
        lte: new Date(`${to}T23:59:59.999Z`),
      }
    }
    if (planId && planId !== 'all') {
      where.planId = planId === 'none' ? null : planId
    }

    const [sessions, plans] = await Promise.all([
      prisma.tradingSession.findMany({ where, orderBy: { date: 'desc' } }),
      prisma.tradingPlan.findMany({ where: { userId: dbUser.id }, select: { id: true, name: true, accountName: true, active: true } }),
    ])

    const stats = computeStats(sessions)

    return NextResponse.json({ sessions, stats, plans })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
