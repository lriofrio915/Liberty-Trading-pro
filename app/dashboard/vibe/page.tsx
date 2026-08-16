import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getEffectiveAccess } from '@/lib/access'
import VibeClient from './VibeClient'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Laboratorio Quant — Liberty Trading',
  description: 'Diseña estrategias algorítmicas, backtesting y genera código para Ninja Trader 8 con IA.',
}

export default async function LaboratorioQuantPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) redirect('/login')

  const isAdmin = user.email === ADMIN_EMAIL

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { plan: true, trialEndsAt: true },
  }).catch(() => null)

  const access = getEffectiveAccess({
    plan: dbUser?.plan ?? 'FREE',
    trialEndsAt: dbUser?.trialEndsAt ?? null,
  })

  if (!isAdmin && !access.canAccessClub) redirect('/dashboard/upgrade')

  return <VibeClient isAdmin={isAdmin} />
}
