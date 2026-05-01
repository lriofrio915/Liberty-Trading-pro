import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

async function getUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  try {
    const lecciones = await prisma.leccion.findMany({
      where: { publicado: true },
      orderBy: [{ categoria: 'asc' }, { orden: 'asc' }],
    })
    return NextResponse.json({ lecciones })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const body = await req.json()
    const leccion = await prisma.leccion.create({
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
