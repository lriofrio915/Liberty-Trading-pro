import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getEffectiveAccess } from '@/lib/access'
import { redirect } from 'next/navigation'
import AcademiaClient from './AcademiaClient'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''
// Módulos del temario de trading algorítmico cuantitativo.
// Mantener sincronizado con prisma/academia/lecciones.py (MODULOS).
const CATEGORIAS = [
  '01 · Infraestructura del negocio',
  '02 · Tu panel de negocio de trading',
  '03 · NinjaTrader 8 y el portafolio comunitario',
  '04 · Obsidian: tu laboratorio quant',
  '05 · Fundamentos cuantitativos',
  '06 · De la idea al código',
  '07 · Los 4 Mandamientos',
  '08 · Optimización, Walk-Forward y Montecarlo',
  '09 · Gestión de portafolio',
  '10 · Proyecto final',
]

export default async function AcademiaPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  const isAdmin = user?.email === ADMIN_EMAIL

  let lecciones: any[] = []
  let completados: string[] = []

  try {
    const dbUser = await prisma.user.findUnique({ where: { authId: user?.id } })

    const access = getEffectiveAccess({ plan: dbUser?.plan ?? 'FREE', trialEndsAt: dbUser?.trialEndsAt ?? null })
    if (!isAdmin && !access.canAccessClub) redirect('/dashboard/upgrade')

    lecciones = await prisma.leccion.findMany({
      // Solo lecciones del temario actual; las del curso anterior quedan fuera.
      where: isAdmin ? { categoria: { in: CATEGORIAS } } : { publicado: true, categoria: { in: CATEGORIAS } },
      orderBy: [{ categoria: 'asc' }, { orden: 'asc' }],
    })

    if (dbUser) {
      const progresos = await prisma.leccionProgreso.findMany({
        where: { userId: dbUser.id },
        select: { leccionId: true },
      })
      const vigentes = new Set(lecciones.map(l => l.id))
      completados = progresos.map(p => p.leccionId).filter(id => vigentes.has(id))
    }
  } catch {}

  return (
    <div>
      <AcademiaClient
        initialLecciones={lecciones}
        completados={completados}
        isAdmin={isAdmin}
        categorias={CATEGORIAS}
      />
    </div>
  )
}
