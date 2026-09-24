import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AgentesClient from './AgentesClient'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export default async function AgentesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) redirect('/login')

  // Agentes es una herramienta interna: el alumno ve el resultado en Acciones.
  if (user.email !== ADMIN_EMAIL) redirect('/dashboard/acciones')

  return <AgentesClient isAdmin />
}
