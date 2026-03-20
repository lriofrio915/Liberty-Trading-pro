import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAIL = 'lriofrio915@gmail.com'

async function checkAdmin() {
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
        id: true,
        name: true,
        email: true,
        plan: true,
        active: true,
        createdAt: true,
        country: true,
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

  const progresos = alumnoIds.length > 0
    ? await prisma.leccionProgreso.groupBy({
        by: ['userId'],
        where: { userId: { in: alumnoIds } },
        _count: { userId: true },
      })
    : []

  const progresoMap = new Map(progresos.map(p => [p.userId, p._count.userId]))

  const totalActivos = alumnos.filter(a => a.active).length
  const totalInactivos = alumnos.filter(a => !a.active).length
  const newThisMonth = alumnos.filter(a => new Date(a.createdAt) >= startOfMonth).length
  const newThisWeek = alumnos.filter(a => new Date(a.createdAt) >= startOfWeek).length
  const churnRate = alumnos.length > 0
    ? ((totalInactivos / alumnos.length) * 100).toFixed(1)
    : '0'

  const alumnosData = alumnos.map(a => ({
    id: a.id,
    name: a.name,
    email: a.email,
    plan: a.plan,
    active: a.active,
    createdAt: a.createdAt,
    country: a.country,
    lastActivity: a.sessions[0]?.date ?? null,
    leccionesCompletadas: progresoMap.get(a.id) ?? 0,
    progreso: totalLecciones > 0
      ? Math.round(((progresoMap.get(a.id) ?? 0) / totalLecciones) * 100)
      : 0,
  }))

  return NextResponse.json({
    alumnos: alumnosData,
    totalLecciones,
    stats: {
      totalActivos,
      totalInactivos,
      newThisMonth,
      newThisWeek,
      churnRate,
    },
  })
}
