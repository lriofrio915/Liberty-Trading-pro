import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getEffectiveAccess } from '@/lib/access'
import { redirect } from 'next/navigation'
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

  return <FuturosClient isAdmin={isAdmin} />
}