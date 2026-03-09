import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// ── GET /api/knowledge — list user's docs ─────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    const userId = dbUser?.id ?? user.id

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()

    const where: any = { userId }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
        { tags: { contains: q, mode: 'insensitive' } },
        { source: { contains: q, mode: 'insensitive' } },
      ]
    }

    const docs = await prisma.knowledgeDoc.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        fileUrl: true,
        fileType: true,
        tags: true,
        source: true,
        createdAt: true,
        content: false, // don't send full content in list
      },
    })

    return NextResponse.json({ docs })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── POST /api/knowledge — create doc ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    const userId = dbUser?.id ?? user.id

    const body = await req.json()
    const { title, description, content, fileUrl, fileType, tags, source } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'El título es requerido' }, { status: 400 })
    }

    const doc = await prisma.knowledgeDoc.create({
      data: {
        userId,
        title: title.trim(),
        description: description?.trim() || null,
        content: content?.trim() || null,
        fileUrl: fileUrl || null,
        fileType: fileType || 'text',
        tags: tags?.trim() || null,
        source: source?.trim() || null,
      },
    })

    return NextResponse.json({ doc }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
