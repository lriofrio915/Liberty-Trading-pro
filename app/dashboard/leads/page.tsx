import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import LeadsClient from './LeadsClient'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export default async function LeadsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) redirect('/dashboard')

  return <LeadsClient />
}
