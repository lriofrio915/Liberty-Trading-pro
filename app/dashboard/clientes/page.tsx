import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import ClientesClient from './ClientesClient'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export default async function ClientesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect('/dashboard')
  }

  const clientes = await (prisma as any).kycClient.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const [porStatus, aumRaw] = await Promise.all([
    (prisma as any).kycClient.groupBy({ by: ['status'], _count: { status: true } }),
    (prisma as any).kycClient.aggregate({
      where: { status: 'APROBADO' },
      _sum: { capitalAsignado: true },
    }),
  ])

  return (
    <ClientesClient
      initialClientes={clientes}
      porStatus={porStatus}
      aum={aumRaw._sum?.capitalAsignado || 0}
    />
  )
}
