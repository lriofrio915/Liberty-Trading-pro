import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

async function assertAdmin() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === ADMIN_EMAIL
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await assertAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const video = await prisma.videoSemana.update({
    where: { id: (await params).id },
    data: {
      ...(body.titulo !== undefined && { titulo: body.titulo }),
      ...(body.descripcion !== undefined && { descripcion: body.descripcion }),
      ...(body.youtubeUrl !== undefined && { youtubeUrl: body.youtubeUrl }),
      ...(body.semana !== undefined && { semana: new Date(body.semana) }),
      ...(body.publicado !== undefined && { publicado: body.publicado }),
    },
  })
  return NextResponse.json({ video })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await assertAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.videoSemana.delete({ where: { id: (await params).id } })
  return NextResponse.json({ ok: true })
}
