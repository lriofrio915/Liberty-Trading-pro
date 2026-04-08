// GET /api/notifications
// Devuelve el conteo de no leídas + lista de las últimas 20 notificaciones del usuario autenticado.

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const [unreadCount, rawNotifs] = await Promise.all([
      prisma.notification.count({
        where: { userId: dbUser.id, read: false },
      }),
      prisma.notification.findMany({
        where: { userId: dbUser.id },
        orderBy: { creadoEn: 'desc' },
        take: 20,
        include: {
          actor: { select: { name: true } },
          post:  { select: { contenido: true } },
        },
      }),
    ])

    const notifications = rawNotifs.map(n => ({
      id:          n.id,
      type:        n.type,
      read:        n.read,
      creadoEn:    n.creadoEn.toISOString(),
      postId:      n.postId,
      postSnippet: n.post.contenido.slice(0, 60),
      // Ocultar emails — si el nombre contiene '@' mostrar 'Trader'
      actorName:   n.actor.name.includes('@') ? 'Trader' : n.actor.name,
    }))

    return NextResponse.json({ unreadCount, notifications })
  } catch (err) {
    console.error('[GET /api/notifications]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
