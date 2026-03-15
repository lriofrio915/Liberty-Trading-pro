import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const TIPOS_VALIDOS = ['OPERATIVA', 'TRACK_RECORD', 'EXITO', 'RETIRO', 'ANALISIS']

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')
  const limit = 15

  const posts = await prisma.post.findMany({
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { creadoEn: 'desc' },
    include: {
      user: { select: { id: true, name: true } },
      likes: { select: { userId: true } },
      _count: { select: { comentarios: true } },
    },
  })

  const hasMore = posts.length > limit
  const slice = hasMore ? posts.slice(0, limit) : posts
  const nextCursor = hasMore ? slice[slice.length - 1].id : null

  return NextResponse.json({
    posts: slice.map(p => ({
      ...p,
      likeCount: p.likes.length,
      commentCount: p._count.comentarios,
      likedByMe: dbUser ? p.likes.some(l => l.userId === dbUser.id) : false,
      likes: undefined,
      _count: undefined,
    })),
    nextCursor,
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const { tipo, contenido, imageUrl } = await req.json()
  if (!TIPOS_VALIDOS.includes(tipo)) return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  if (!contenido?.trim()) return NextResponse.json({ error: 'El contenido no puede estar vacío' }, { status: 400 })

  const post = await prisma.post.create({
    data: {
      userId: dbUser.id,
      tipo,
      contenido: contenido.trim(),
      imageUrl: imageUrl || null,
    },
    include: { user: { select: { id: true, name: true } } },
  })

  return NextResponse.json({
    post: { ...post, likeCount: 0, commentCount: 0, likedByMe: false },
  })
}
