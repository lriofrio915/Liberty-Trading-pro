import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import TrackRecordClient from '@/components/TrackRecord/TrackRecordClient'

export default async function TrackRecordPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  let sessions: any[] = []
  let plans: { id: string; name: string }[] = []

  try {
    const dbUser = await prisma.user.findUnique({ where: { authId: user?.id } })
    if (dbUser) {
      ;[sessions, plans] = await Promise.all([
        prisma.tradingSession.findMany({
          where: { userId: dbUser.id },
          orderBy: { date: 'desc' },
        }),
        prisma.tradingPlan.findMany({
          where: { userId: dbUser.id },
          select: { id: true, name: true },
          orderBy: { createdAt: 'desc' },
        }),
      ])
    }
  } catch {}

  return <TrackRecordClient initialSessions={sessions} initialPlans={plans} />
}
