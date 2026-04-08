// POST /api/notifications/mark-read
// Marca notificaciones como leídas.
// Body: { ids?: string[] }  — sin ids = marcar todas las del usuario como leídas.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const body = await req.json().catch(() => ({})) as { ids?: string[] }
    const ids = Array.isArray(body.ids) && body.ids.length > 0 ? body.ids : null

    await prisma.notification.updateMany({
      where: ids
        ? { id: { in: ids }, userId: dbUser.id }   // siempre escopado al usuario por seguridad
        : { userId: dbUser.id, read: false },
      data: { read: true },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/notifications/mark-read]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
