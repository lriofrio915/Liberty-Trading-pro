import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const ADMIN_EMAIL = 'lriofrio915@gmail.com'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
  const comment = await prisma.postComment.findUnique({ where: { id: params.commentId } })

  if (!comment) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (comment.userId !== dbUser?.id && user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  await prisma.postComment.delete({ where: { id: params.commentId } })
  return NextResponse.json({ ok: true })
}
