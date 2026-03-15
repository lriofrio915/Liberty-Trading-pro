import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const comments = await prisma.postComment.findMany({
    where: { postId: params.id },
    orderBy: { creadoEn: 'asc' },
    include: { user: { select: { id: true, name: true } } },
  })
  return NextResponse.json({ comments })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const { contenido } = await req.json()
  if (!contenido?.trim()) return NextResponse.json({ error: 'Comentario vacío' }, { status: 400 })

  const comment = await prisma.postComment.create({
    data: { userId: dbUser.id, postId: params.id, contenido: contenido.trim() },
    include: { user: { select: { id: true, name: true } } },
  })
  return NextResponse.json({ comment })
}
