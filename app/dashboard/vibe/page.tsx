import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getEffectiveAccess } from '@/lib/access'
import VibeClient from './VibeClient'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export const dynamic = 'force-dynamic'

export default async function VibeTradingPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
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

  return <VibeClient userEmail={user.email ?? ''} />
}
