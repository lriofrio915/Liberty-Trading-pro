import QuantLanding from '@/components/QuantLanding/QuantLanding'
import { createSupabaseServerClient } from '@/lib/supabase-server'

/**
 * La home vende un solo producto: Liberty Trading Club. Exchange (/p2p) y la
 * asesoría de acciones siguen accesibles por sus rutas y por WhatsApp.
 */
export default async function LandingPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  return <QuantLanding initialUser={session?.user ?? null} />
}
