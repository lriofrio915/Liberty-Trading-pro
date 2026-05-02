import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''
const SECTIONS = ['futuros', 'acciones', 'cfds', 'quant']

export async function GET(req: NextRequest) {
  const section = new URL(req.url).searchParams.get('section') || ''
  if (!section) {
    const data = await prisma.sectionVideo.findMany()
    return NextResponse.json(data)
  }

  const row = await prisma.sectionVideo.findUnique({ where: { section } })
  if (!row) return NextResponse.json({ section, youtubeUrl: '', title: null })
  return NextResponse.json(row)
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { section, youtubeUrl, title } = await req.json()
  if (!section || !SECTIONS.includes(section) || !youtubeUrl) {
    return NextResponse.json({ error: 'Invalid section or missing youtubeUrl' }, { status: 400 })
  }

  const row = await prisma.sectionVideo.upsert({
    where: { section },
    create: { section, youtubeUrl, title: title || null },
    update: { youtubeUrl, title: title || null },
  })

  return NextResponse.json(row)
}
