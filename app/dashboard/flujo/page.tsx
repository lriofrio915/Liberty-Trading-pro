import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import FlujoDineroClient from './FlujoDineroClient'

export const metadata = { title: 'Flujo del Dinero — Liberty Trading Club' }

export default async function FlujoDineroPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { authId: session.user.id },
    select: { plan: true },
  }).catch(() => null)

  const plan = dbUser?.plan ?? 'FREE'
  const hasAccess = plan !== 'FREE'

  return <FlujoDineroClient hasAccess={hasAccess} />
}
