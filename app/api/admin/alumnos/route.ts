import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

async function checkAdmin() {
  if (!ADMIN_EMAIL) {
    console.error('[checkAdmin] ADMIN_EMAIL no está configurado en las variables de entorno')
    return null
  }
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return null
  return user
}

export async function GET() {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const [alumnos, totalLecciones] = await Promise.all([
    prisma.user.findMany({
      where: { plan: { not: 'FREE' } },
      select: {
        id: true, name: true, email: true, plan: true,
        active: true, createdAt: true, country: true,
        sessions: {
          orderBy: { date: 'desc' },
          take: 1,
          select: { date: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.leccion.count({ where: { publicado: true } }),
  ])

  const alumnoIds = alumnos.map(a => a.id)

  // Lesson progress and session stats in parallel
  const [progresos, sessionStats] = await Promise.all([
    alumnoIds.length > 0
      ? prisma.leccionProgreso.groupBy({
          by: ['userId'],
          where: { userId: { in: alumnoIds } },
          _count: { userId: true },
        })
      : Promise.resolve([]),
    alumnoIds.length > 0
      ? prisma.tradingSession.groupBy({
          by: ['userId', 'resultado'],
          where: { userId: { in: alumnoIds } },
          _count: { id: true },
          _sum: { pnlNeto: true },
        })
      : Promise.resolve([]),
  ])

  const progresoMap = new Map(progresos.map(p => [p.userId, p._count.userId]))

  // Build session stats map per userId
  type SessionRow = { userId: string; resultado: string; _count: { id: number }; _sum: { pnlNeto: number | null } }
  const sessMap = new Map<string, { total: number; wins: number; pnl: number }>()
  for (const row of sessionStats as SessionRow[]) {
    const cur = sessMap.get(row.userId) ?? { total: 0, wins: 0, pnl: 0 }
    cur.total += row._count.id
    cur.pnl += row._sum.pnlNeto ?? 0
    if (row.resultado === 'WIN') cur.wins += row._count.id
    sessMap.set(row.userId, cur)
  }

  const totalActivos = alumnos.filter(a => a.active).length
  const totalInactivos = alumnos.filter(a => !a.active).length
  const newThisMonth = alumnos.filter(a => new Date(a.createdAt) >= startOfMonth).length
  const newThisWeek = alumnos.filter(a => new Date(a.createdAt) >= startOfWeek).length
  const churnRate = alumnos.length > 0
    ? ((totalInactivos / alumnos.length) * 100).toFixed(1)
    : '0'

  const alumnosData = alumnos.map(a => {
    const sess = sessMap.get(a.id) ?? { total: 0, wins: 0, pnl: 0 }
    const leccionesCompletadas = progresoMap.get(a.id) ?? 0
    return {
      id: a.id,
      name: a.name,
      email: a.email,
      plan: a.plan,
      active: a.active,
      createdAt: a.createdAt,
      country: a.country,
      lastActivity: a.sessions[0]?.date ?? null,
      leccionesCompletadas,
      progreso: totalLecciones > 0 ? Math.round((leccionesCompletadas / totalLecciones) * 100) : 0,
      totalSesiones: sess.total,
      winRate: sess.total > 0 ? Math.round((sess.wins / sess.total) * 100) : null,
      totalPnl: sess.total > 0 ? sess.pnl : null,
    }
  })

  return NextResponse.json({
    alumnos: alumnosData,
    totalLecciones,
    stats: { totalActivos, totalInactivos, newThisMonth, newThisWeek, churnRate },
  })
}
