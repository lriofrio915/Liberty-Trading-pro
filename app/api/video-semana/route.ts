import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export async function GET() {
  const video = await prisma.videoSemana.findFirst({
    where: { publicado: true },
    orderBy: { semana: 'desc' },
  })
  return NextResponse.json({ video })
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { titulo, descripcion, youtubeUrl, semana, publicado } = await req.json()
  if (!titulo || !youtubeUrl || !semana) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const video = await prisma.videoSemana.create({
    data: {
      titulo,
      descripcion: descripcion || null,
      youtubeUrl,
      semana: new Date(semana),
      publicado: publicado !== false,
    },
  })

  return NextResponse.json({ video })
}
