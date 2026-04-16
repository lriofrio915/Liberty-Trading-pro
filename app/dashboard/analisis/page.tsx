import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { getEffectiveAccess } from '@/lib/access'
import { redirect } from 'next/navigation'
import AnalisisClient from './AnalisisClient'

export const metadata = {
  title: 'Análisis de Activos — Liberty Trading',
  description: '5 agentes de IA analizan en paralelo crypto, acciones, divisas y materiales para darte un sesgo claro y recomendación de compra/venta.',
}

export default async function AnalisisPage() {
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

  return <AnalisisClient />
}
