import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { getEffectiveAccess } from '@/lib/access'
import { redirect } from 'next/navigation'
import AnalisisClient from './AnalisisClient'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export const metadata = {
  title: 'CFDs — Liberty Trading',
  description: 'Análisis de mercado en tiempo real con 7 agentes de IA: crypto, acciones, índices, divisas y materiales.',
}

export default async function AnalisisPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const isAdmin = user.email === ADMIN_EMAIL

  const dbUser = await prisma.user
    .findUnique({ where: { authId: user.id }, select: { plan: true, trialEndsAt: true } })
    .catch(() => null)

  const access = dbUser
    ? getEffectiveAccess({ plan: dbUser.plan, trialEndsAt: dbUser.trialEndsAt })
    : { canAccessClub: false, isOnTrial: false, trialDaysLeft: null, trialExpired: false, level: 'FREE' as const }

  if (!access.canAccessClub) redirect('/dashboard/upgrade')

  return <AnalisisClient isAdmin={isAdmin} />
}
