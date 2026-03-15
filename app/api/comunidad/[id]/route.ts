import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const ADMIN_EMAIL = 'lriofrio915@gmail.com'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
  const post = await prisma.post.findUnique({ where: { id: params.id } })

  if (!post) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (post.userId !== dbUser?.id && user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  await prisma.post.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
