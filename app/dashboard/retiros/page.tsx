import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getEffectiveAccess } from '@/lib/access'
import { redirect } from 'next/navigation'
import RetirosClient from './RetirosClient'

export default async function RetirosPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  let retiros: any[] = []
  let plans: any[] = []
  let sessions: any[] = []

  try {
    const dbUser = await prisma.user.findUnique({ where: { authId: user?.id } })
    const access = getEffectiveAccess({ plan: dbUser?.plan ?? 'FREE', trialEndsAt: dbUser?.trialEndsAt ?? null })
    if (!access.canAccessClub) redirect('/dashboard/upgrade')
    if (dbUser) {
      ;[retiros, plans, sessions] = await Promise.all([
        prisma.retiro.findMany({
          where: { userId: dbUser.id },
          orderBy: { fecha: 'desc' },
          include: { plan: { select: { id: true, name: true, capitalInicial: true } } },
        }),
        prisma.tradingPlan.findMany({
          where: { userId: dbUser.id },
          select: { id: true, name: true, capitalInicial: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.tradingSession.findMany({
          where: { userId: dbUser.id },
          select: { planId: true, pnlNeto: true, resultado: true },
        }),
      ])
    }
  } catch {}

  return <RetirosClient initialRetiros={retiros} initialPlans={plans} initialSessions={sessions} />
}
