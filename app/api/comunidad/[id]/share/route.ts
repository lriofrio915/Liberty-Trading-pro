// POST /api/comunidad/[id]/share
// Registra un share del post y crea una notificación para el dueño.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createNotification } from '@/lib/notifications'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const { platform } = await req.json() as { platform?: string }

    const post = await prisma.post.findUnique({
      where: { id: (await params).id },
      select: { userId: true },
    })
    if (!post) return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 })

    await prisma.postShare.create({
      data: { userId: dbUser.id, postId: (await params).id, platform: platform ?? 'UNKNOWN' },
    })

    await createNotification({
      recipientUserId: post.userId,
      actorUserId: dbUser.id,
      type: 'SHARE',
      postId: (await params).id,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/comunidad/[id]/share]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
