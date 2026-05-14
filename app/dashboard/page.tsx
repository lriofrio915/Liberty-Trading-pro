import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  let dbUser = null
  try {
    dbUser = await prisma.user.findUnique({ where: { authId: user?.id } })
  } catch {}

  return (
    <DashboardClient
      userName={dbUser?.name || user?.email || null}
      userPlan={dbUser?.plan || null}
    />
  )
}
