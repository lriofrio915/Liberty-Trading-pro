import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getEffectiveAccess } from '@/lib/access'
import { redirect } from 'next/navigation'
import AccionesClient from './AccionesClient'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''
const PLAN_ORDER: Record<string, number> = { FREE: 0, CLUB: 1, PRO: 2, PORTFOLIO: 3 }

export default async function AccionesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) redirect('/login')

  const isAdmin = user.email === ADMIN_EMAIL
  let opportunities: object[] = []
  let userPlan = 'FREE'

  try {
    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    const access = getEffectiveAccess({ plan: dbUser?.plan ?? 'FREE', trialEndsAt: dbUser?.trialEndsAt ?? null })
    if (!isAdmin && !access.canAccessClub) redirect('/dashboard/upgrade')
    userPlan = dbUser?.plan || 'FREE'
    const userLevel = PLAN_ORDER[userPlan] ?? 0

    const all = await prisma.opportunity.findMany({
      orderBy: { publishedAt: 'desc' },
      ...(isAdmin ? {} : { where: { active: true } }),
    })

    opportunities = isAdmin
      ? all
      : all.filter((o) => (PLAN_ORDER[o.minPlan] ?? 1) <= userLevel)
  } catch {}

  return (
    <AccionesClient
      initialOpportunities={opportunities as never}
      plan={userPlan}
      isAdmin={isAdmin}
    />
  )
}