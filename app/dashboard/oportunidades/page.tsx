import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import OportunidadesClient from './OportunidadesClient'

const ADMIN_EMAIL = 'lriofrio915@gmail.com'
const PLAN_ORDER: Record<string, number> = { FREE: 0, CLUB: 1, PRO: 2, PORTFOLIO: 3 }

export default async function OportunidadesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isAdmin = user?.email === ADMIN_EMAIL

  let opportunities: object[] = []
  let userPlan = 'FREE'

  try {
    const dbUser = await prisma.user.findUnique({ where: { authId: user?.id } })
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
    <OportunidadesClient
      initialOpportunities={opportunities as never}
      plan={userPlan}
      isAdmin={isAdmin}
    />
  )
}
