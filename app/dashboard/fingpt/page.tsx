import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { getEffectiveAccess } from '@/lib/access'
import { redirect } from 'next/navigation'
import FinGPTClient from './FinGPTClient'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export const metadata = {
  title: 'FinGPT — Liberty Trading',
  description: 'Análisis financiero con IA: sentimiento de noticias, Q&A y señales por sentimiento.',
}

export default async function FinGPTPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) redirect('/auth/login')

  const isAdmin = user.email === ADMIN_EMAIL

  const dbUser = await prisma.user
    .findUnique({ where: { authId: user.id }, select: { plan: true, trialEndsAt: true } })
    .catch(() => null)

  const access = dbUser
    ? getEffectiveAccess({ plan: dbUser.plan, trialEndsAt: dbUser.trialEndsAt })
    : { canAccessClub: false, isOnTrial: false, trialDaysLeft: null, trialExpired: false, level: 'FREE' as const }

  if (!access.canAccessClub) redirect('/dashboard/upgrade')

  return <FinGPTClient isAdmin={isAdmin} />
}
