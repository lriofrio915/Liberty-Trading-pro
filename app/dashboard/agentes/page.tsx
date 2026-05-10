import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { getEffectiveAccess } from '@/lib/access'
import { redirect } from 'next/navigation'
import AgentesClient from './AgentesClient'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export default async function AgentesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) redirect('/login')

  const isAdmin = user.email === ADMIN_EMAIL

  try {
    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    const access = getEffectiveAccess({ plan: dbUser?.plan ?? 'FREE', trialEndsAt: dbUser?.trialEndsAt ?? null })
    if (!isAdmin && !access.canAccessClub) redirect('/dashboard/upgrade')
  } catch {}

  return <AgentesClient isAdmin={isAdmin} />
}
