import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { getEffectiveAccess } from '@/lib/access'
import { redirect } from 'next/navigation'
import AlgolabClient from './AlgolabClient'

export const metadata = {
  title: 'AlgoLab — Liberty Trading',
  description: 'Laboratorio de estrategias cuantitativas. Sube datos de MT5, selecciona indicadores y genera EAs optimizados con IA.',
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())

export default async function AlgolabPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const dbUser = await prisma.user
    .findUnique({ where: { authId: user.id }, select: { plan: true, trialEndsAt: true } })
    .catch(() => null)

  const access = dbUser
    ? getEffectiveAccess({ plan: dbUser.plan, trialEndsAt: dbUser.trialEndsAt })
    : { canAccessClub: false, isOnTrial: false, trialDaysLeft: null, trialExpired: false, level: 'FREE' as const }

  if (!access.canAccessClub) redirect('/dashboard/upgrade')

  const isAdmin = ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes((user.email ?? '').toLowerCase())

  return <AlgolabClient isAdmin={isAdmin} />
}
