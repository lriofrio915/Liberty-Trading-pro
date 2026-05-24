import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getEffectiveAccess } from '@/lib/access'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import FuturosClient from './FuturosClient'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export default async function FuturosPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) redirect('/login')

  const isAdmin = user.email === ADMIN_EMAIL
  const access = getEffectiveAccess({ plan: 'CLUB', trialEndsAt: null })
  if (!isAdmin && !access.canAccessClub) redirect('/dashboard/upgrade')

  let dbUser = null
  let sessions: any[] = []
  let plans: any[] = []
  let fullPlans: any[] = []
  let retiros: any[] = []

  try {
    dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (dbUser) {
      ;[sessions, fullPlans, retiros] = await Promise.all([
        prisma.tradingSession.findMany({
          where: { userId: dbUser.id },
          orderBy: { date: 'desc' },
        }),
        prisma.tradingPlan.findMany({
          where: { userId: dbUser.id },
          orderBy: { createdAt: 'desc' },
          include: {
            sessions: {
              select: { id: true, date: true, resultado: true, pnlNeto: true, instrumento: true, direccion: true },
            },
          },
        }),
        prisma.retiro.findMany({
          where: { userId: dbUser.id },
          select: { planId: true, monto: true },
        }),
      ])
      plans = fullPlans.map((p: any) => ({
        id: p.id,
        name: p.name,
        capitalInicial: p.capitalInicial,
        createdAt: p.createdAt,
        dataFeedMensual: p.dataFeedMensual,
        comisionPorTrade: p.comisionPorTrade,
      }))
    }
  } catch {}

  const userId = dbUser?.slug || dbUser?.id || ''

  return (
    <FuturosClient
      isAdmin={isAdmin}
      sessions={sessions}
      plans={plans}
      fullPlans={fullPlans}
      retiros={retiros}
      userId={userId}
      userName={dbUser?.name || user.email || null}
      userPlan={dbUser?.plan || null}
    />
  )
}
