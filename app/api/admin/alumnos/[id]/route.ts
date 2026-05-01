import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

async function checkAdmin() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return null
  return user
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const [alumno, sessions, metricasPeriodo, planes] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, plan: true, active: true, createdAt: true, country: true, tradingStyle: true },
    }),
    prisma.tradingSession.findMany({
      where: { userId: id },
      orderBy: { date: 'desc' },
      take: 20,
      select: {
        id: true, date: true, instrumento: true, direccion: true,
        resultado: true, pnlNeto: true, pnlBruto: true, comisiones: true,
        contratos: true, rrReal: true, sentimiento: true, notas: true,
        siguioPlan: true,
      },
    }),
    prisma.metricasPeriodo.findMany({
      where: { userId: id },
      orderBy: { calculadoAt: 'desc' },
      take: 6,
      select: {
        periodo: true, totalOperaciones: true, ganadoras: true, perdedoras: true,
        winRate: true, pnlNeto: true, profitFactor: true, maxDrawdown: true,
        maxDrawdownPct: true, rrPromedio: true, rendimiento: true, calculadoAt: true,
      },
    }),
    prisma.tradingPlan.findMany({
      where: { userId: id, active: true },
      select: { name: true, broker: true, instrumento: true, capitalInicial: true, riesgo: true, rrRatio: true },
    }),
  ])

  if (!alumno) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Compute overall stats from all sessions
  const allSessions = await prisma.tradingSession.findMany({
    where: { userId: id },
    select: { resultado: true, pnlNeto: true },
  })

  const totalOps = allSessions.length
  const wins = allSessions.filter(s => s.resultado === 'WIN').length
  const losses = allSessions.filter(s => s.resultado === 'LOSS').length
  const totalPnl = allSessions.reduce((acc, s) => acc + s.pnlNeto, 0)
  const winRate = totalOps > 0 ? (wins / totalOps) * 100 : 0
  const avgWin = wins > 0
    ? allSessions.filter(s => s.resultado === 'WIN').reduce((a, s) => a + s.pnlNeto, 0) / wins
    : 0
  const avgLoss = losses > 0
    ? allSessions.filter(s => s.resultado === 'LOSS').reduce((a, s) => a + s.pnlNeto, 0) / losses
    : 0
  const bestTrade = totalOps > 0 ? Math.max(...allSessions.map(s => s.pnlNeto)) : 0
  const worstTrade = totalOps > 0 ? Math.min(...allSessions.map(s => s.pnlNeto)) : 0

  return NextResponse.json({
    alumno,
    planes,
    resumen: { totalOps, wins, losses, winRate, totalPnl, avgWin, avgLoss, bestTrade, worstTrade },
    sessions,
    metricasPeriodo,
  })
}
