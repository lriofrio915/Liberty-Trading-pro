import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import PlanesClient from './PlanesClient'

export default async function PlanesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  let plans: any[] = []

  try {
    const dbUser = await prisma.user.findUnique({ where: { authId: user?.id } })
    if (dbUser) {
      plans = await prisma.tradingPlan.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: 'desc' },
        include: {
          sessions: {
            select: {
              id: true,
              date: true,
              resultado: true,
              pnlNeto: true,
              instrumento: true,
              direccion: true,
            },
          },
        },
      })
    }
  } catch {}

  return <PlanesClient initialPlans={plans} />
}
