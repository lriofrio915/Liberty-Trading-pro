import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import AcademiaClient from './AcademiaClient'
import VideoSemanaWidget from '@/components/VideoSemana/VideoSemanaWidget'

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
  let videoSemana: any = null

  try {
    const [dbUser, video] = await Promise.all([
      prisma.user.findUnique({ where: { authId: user?.id } }),
      prisma.videoSemana.findFirst({
        where: isAdmin ? {} : { publicado: true },
        orderBy: { semana: 'desc' },
      }),
    ])

    videoSemana = video

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
    <div>
      <VideoSemanaWidget
        initialVideo={videoSemana ? {
          ...videoSemana,
          semana: videoSemana.semana.toISOString(),
          creadoEn: undefined,
        } : null}
        isAdmin={isAdmin}
        appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ''}
      />
      <AcademiaClient
        initialLecciones={lecciones}
        completados={completados}
        isAdmin={isAdmin}
        categorias={CATEGORIAS}
      />
    </div>
  )
}
