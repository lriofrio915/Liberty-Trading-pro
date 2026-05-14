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

  try {
    dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
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
    <FuturosClient
      isAdmin={isAdmin}
      sessions={sessions}
      plans={plans}
      userName={dbUser?.name || user.email || null}
      userPlan={dbUser?.plan || null}
    />
  )
}
