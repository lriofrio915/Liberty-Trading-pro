import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createNotification } from '@/lib/notifications'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const existing = await prisma.postLike.findUnique({
    where: { userId_postId: { userId: dbUser.id, postId: (await params).id } },
  })

  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } })
    const count = await prisma.postLike.count({ where: { postId: (await params).id } })
    return NextResponse.json({ liked: false, likeCount: count })
  } else {
    try {
      await prisma.postLike.create({ data: { userId: dbUser.id, postId: (await params).id } })
    } catch (e: any) {
      // P2002 = unique constraint — race condition, like already exists
      if (e?.code !== 'P2002') throw e
    }
    const count = await prisma.postLike.count({ where: { postId: (await params).id } })

    // Notificar al dueño del post (skip si es su propio like)
    const post = await prisma.post.findUnique({ where: { id: (await params).id }, select: { userId: true } })
    if (post) await createNotification({ recipientUserId: post.userId, actorUserId: dbUser.id, type: 'LIKE', postId: (await params).id })

    return NextResponse.json({ liked: true, likeCount: count })
  }
}
