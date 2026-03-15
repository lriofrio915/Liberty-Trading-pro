import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const existing = await prisma.postLike.findUnique({
    where: { userId_postId: { userId: dbUser.id, postId: params.id } },
  })

  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } })
    const count = await prisma.postLike.count({ where: { postId: params.id } })
    return NextResponse.json({ liked: false, likeCount: count })
  } else {
    await prisma.postLike.create({ data: { userId: dbUser.id, postId: params.id } })
    const count = await prisma.postLike.count({ where: { postId: params.id } })
    return NextResponse.json({ liked: true, likeCount: count })
  }
}
