import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import BrokersClient from './BrokersClient'

export const metadata = { title: 'Brokers Conectados — Liberty' }

export default async function BrokersPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { id: true, plan: true },
  })
  if (!dbUser) redirect('/login')

  if (dbUser.plan === 'FREE') redirect('/dashboard/upgrade')

  const rawConns = await prisma.brokerConnection.findMany({
    where: { userId: dbUser.id },
    select: {
      id: true,
      brokerType: true,
      ibkrHost: true,
      ibkrPort: true,
      ibkrClientId: true,
      ibkrAccountId: true,
      isActive: true,
      lastConnectedAt: true,
      lastStatus: true,
      maxOrderValueUsd: true,
    },
  })

  const connections = rawConns.map(c => ({
    ...c,
    lastConnectedAt: c.lastConnectedAt ? c.lastConnectedAt.toISOString() : null,
  }))

  return <BrokersClient initialConnections={connections} />
}
