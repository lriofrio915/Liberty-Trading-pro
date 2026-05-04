import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getEffectiveAccess } from '@/lib/access'
import ComunidadClient from './ComunidadClient'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export default async function ComunidadPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  const dbUser = user
    ? await prisma.user.findUnique({ where: { authId: user.id }, select: { id: true, name: true, plan: true, trialEndsAt: true } })
    : null

  const isAdmin = user?.email === ADMIN_EMAIL

  const access = getEffectiveAccess({ plan: dbUser?.plan ?? 'FREE', trialEndsAt: dbUser?.trialEndsAt ?? null })
  const canPublish = isAdmin || access.canAccessClub

  // Fetch first page SSR
  const rawPosts = await prisma.post.findMany({
    take: 15,
    orderBy: { creadoEn: 'desc' },
    include: {
      user: { select: { id: true, name: true } },
      likes: { select: { userId: true } },
      _count: { select: { comentarios: true } },
    },
  })

  const posts = rawPosts.map(p => ({
    id: p.id,
    userId: p.userId,
    tipo: p.tipo,
    contenido: p.contenido,
    imageUrl: p.imageUrl,
    creadoEn: p.creadoEn.toISOString(),
    user: p.user,
    likeCount: p.likes.length,
    commentCount: p._count.comentarios,
    likedByMe: dbUser ? p.likes.some(l => l.userId === dbUser.id) : false,
  }))

  return (
    <ComunidadClient
      initialPosts={posts}
      currentUserId={dbUser?.id ?? null}
      currentUserName={dbUser?.name ?? null}
      isAdmin={isAdmin}
      canPublish={canPublish}
    />
  )
}
