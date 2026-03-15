import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getEffectiveAccess } from '@/lib/access'
import { redirect } from 'next/navigation'
import TrackRecordClient from '@/components/TrackRecord/TrackRecordClient'

export default async function TrackRecordPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  let sessions: any[] = []
  let plans: { id: string; name: string }[] = []
  let userId = ''

  try {
    if (user) {
      const dbUser = await prisma.user.upsert({
        where: { authId: user.id },
        update: {},
        create: {
          authId: user.id,
          email: user.email ?? user.id,
          name: (user.user_metadata?.name as string) || user.email?.split('@')[0] || 'Trader',
        },
      })
      const access = getEffectiveAccess({ plan: dbUser?.plan ?? 'FREE', trialEndsAt: dbUser?.trialEndsAt ?? null })
      if (!access.canAccessClub) redirect('/dashboard/upgrade')
      userId = dbUser.id
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

  return <TrackRecordClient initialSessions={sessions} initialPlans={plans} userId={userId} />
}
