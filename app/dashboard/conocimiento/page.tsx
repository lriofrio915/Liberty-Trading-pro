import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { getEffectiveAccess } from '@/lib/access'
import { redirect } from 'next/navigation'
import ConocimientoClient from './ConocimientoClient'

export default async function ConocimientoPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  const dbUser = await prisma.user.findUnique({
    where: { authId: user?.id },
    select: { id: true, plan: true, trialEndsAt: true, name: true },
  }).catch(() => null)

  const access = getEffectiveAccess({ plan: dbUser?.plan ?? 'FREE', trialEndsAt: dbUser?.trialEndsAt ?? null })
  if (!access.canAccessClub) redirect('/dashboard/upgrade')

  return <ConocimientoClient />
}
