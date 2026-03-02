import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import TrackRecordClient from '@/components/TrackRecord/TrackRecordClient'

export default async function TrackRecordPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  let sessions: any[] = []
  try {
    const dbUser = await prisma.user.findUnique({ where: { authId: user?.id } })
    if (dbUser) {
      sessions = await prisma.tradingSession.findMany({
        where: { userId: dbUser.id },
        orderBy: { date: 'desc' },
      })
    }
  } catch {}

  return <TrackRecordClient initialSessions={sessions} />
}
