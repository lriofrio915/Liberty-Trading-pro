import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import AcademiaClient from './AcademiaClient'

const ADMIN_EMAIL = 'lriofrio915@gmail.com'
const CATEGORIAS = [
  'Plataforma NT8',
  'Configuracion de Graficas',
  'Estrategia Intradia NQ',
  'Gestion de Riesgo',
  'Psicologia del Trader',
]

export default async function AcademiaPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isAdmin = user?.email === ADMIN_EMAIL

  let lecciones: any[] = []
  let completados: string[] = []
  let dbUserId: string | null = null

  try {
    const dbUser = await prisma.user.findUnique({ where: { authId: user?.id } })
    dbUserId = dbUser?.id ?? null

    // Admin sees all (published + unpublished), students only see published
    lecciones = await prisma.leccion.findMany({
      where: isAdmin ? {} : { publicado: true },
      orderBy: [{ categoria: 'asc' }, { orden: 'asc' }],
    })

    if (dbUser) {
      const progresos = await prisma.leccionProgreso.findMany({
        where: { userId: dbUser.id },
        select: { leccionId: true },
      })
      completados = progresos.map(p => p.leccionId)
    }
  } catch {}

  return (
    <AcademiaClient
      initialLecciones={lecciones}
      completados={completados}
      isAdmin={isAdmin}
      categorias={CATEGORIAS}
    />
  )
}
