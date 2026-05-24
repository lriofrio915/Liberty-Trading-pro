import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://libertytrading.pro'

const TIPO_LABELS: Record<string, string> = {
  OPERATIVA:    'Operativa',
  TRACK_RECORD: 'Track Record',
  EXITO:        'Éxito',
  RETIRO:       'Retiro',
  ANALISIS:     'Análisis',
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const post = await prisma.post.findUnique({
    where: { id },
    include: { user: { select: { name: true } } },
  })

  if (!post) return { title: 'Post — Liberty Trading Club' }

  const authorName = post.user.name.includes('@') ? 'Trader' : post.user.name
  const tipoLabel = TIPO_LABELS[post.tipo] ?? post.tipo
  const title = `${tipoLabel} de ${authorName} — Liberty Trading Club`
  const description = post.contenido.slice(0, 160)
  const ogImage = post.imageUrl ?? `${APP_URL}/p/${id}/opengraph-image`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${APP_URL}/p/${id}`,
      siteName: 'Liberty Trading Club',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function PublicPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await prisma.post.findUnique({
    where: { id },
    include: { user: { select: { name: true } } },
  })

  if (!post) notFound()

  redirect(`${APP_URL}/dashboard/comunidad#post-${id}`)
}
