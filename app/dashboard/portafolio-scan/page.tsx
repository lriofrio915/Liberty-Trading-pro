import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import PortafolioScanClient from './PortafolioScanClient'

export const metadata = { title: 'Portafolio Scan — Liberty Trading Pro' }

export default async function PortafolioScanPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/login')

  return <PortafolioScanClient />
}
