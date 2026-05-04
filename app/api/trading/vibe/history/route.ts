import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function getDbUser(authId: string) {
  return prisma.user.findUnique({
    where: { authId },
    select: { id: true },
  })
}

/** GET /api/trading/vibe/history — últimos 150 mensajes del usuario */
export async function GET(_req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await getDbUser(session.user.id)
  if (!dbUser) return NextResponse.json([], { status: 200 })

  const messages = await prisma.vibeMessage.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: 'asc' },
    take: 150,
    select: { id: true, role: true, text: true, createdAt: true },
  })

  return NextResponse.json(messages)
}

/** POST /api/trading/vibe/history — guardar un mensaje { role, text } */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const role = String(body.role ?? '')
  const text = String(body.text ?? '').trim()

  if (!['user', 'agent'].includes(role) || !text) {
    return NextResponse.json({ error: 'role y text requeridos' }, { status: 400 })
  }

  const dbUser = await getDbUser(session.user.id)
  if (!dbUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const message = await prisma.vibeMessage.create({
    data: { userId: dbUser.id, role, text },
    select: { id: true, role: true, text: true, createdAt: true },
  })

  return NextResponse.json(message, { status: 201 })
}

/** DELETE /api/trading/vibe/history — borrar historial (LIMPIAR CHAT) */
export async function DELETE(_req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await getDbUser(session.user.id)
  if (!dbUser) return NextResponse.json({ ok: true })

  await prisma.vibeMessage.deleteMany({ where: { userId: dbUser.id } })
  return NextResponse.json({ ok: true })
}
