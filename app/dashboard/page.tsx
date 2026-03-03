import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  let dbUser = null
  let sessions: any[] = []

  try {
    dbUser = await prisma.user.findUnique({ where: { authId: user?.id } })
    if (dbUser) {
      sessions = await prisma.tradingSession.findMany({
        where: { userId: dbUser.id },
        orderBy: { date: 'desc' },
      })
    }
  } catch {}

  return (
    <DashboardClient
      sessions={sessions}
      userName={dbUser?.name || user?.email || null}
      userPlan={dbUser?.plan || null}
    />
  )
}
