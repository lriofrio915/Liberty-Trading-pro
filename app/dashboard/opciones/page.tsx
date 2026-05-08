import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getEffectiveAccess } from '@/lib/access'
import OpcionesClient from './OpcionesClient'

export default async function OpcionesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { plan: true, trialEndsAt: true },
  }).catch(() => null)

  const access = getEffectiveAccess({ plan: dbUser?.plan ?? 'FREE', trialEndsAt: dbUser?.trialEndsAt ?? null })
  if (!access.canAccessClub) redirect('/dashboard/upgrade')

  return <OpcionesClient />
}
