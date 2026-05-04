import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  let dbUser = null
  let sessions: any[] = []
  let plans: any[] = []

  try {
    dbUser = await prisma.user.findUnique({ where: { authId: user?.id } })
    if (dbUser) {
      ;[sessions, plans] = await Promise.all([
        prisma.tradingSession.findMany({
          where: { userId: dbUser.id },
          orderBy: { date: 'desc' },
        }),
        prisma.tradingPlan.findMany({
          where: { userId: dbUser.id },
          select: { id: true, name: true, capitalInicial: true, createdAt: true, dataFeedMensual: true, comisionPorTrade: true },
        }),
      ])
    }
  } catch {}

  return (
    <DashboardClient
      sessions={sessions}
      userName={dbUser?.name || user?.email || null}
      userPlan={dbUser?.plan || null}
      plans={plans}
    />
  )
}
