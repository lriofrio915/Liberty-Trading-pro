import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

async function isAdmin() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === ADMIN_EMAIL
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await isAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const body = await req.json()
    const leccion = await prisma.leccion.update({
      where: { id: params.id },
      data: {
        titulo: body.titulo,
        descripcion: body.descripcion || '',
        contenido: body.contenido || '',
        videoUrl: body.videoUrl || null,
        orden: parseInt(body.orden) || 0,
        categoria: body.categoria,
        publicado: body.publicado ?? false,
      },
    })
    return NextResponse.json({ leccion })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!await isAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    await prisma.leccion.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
