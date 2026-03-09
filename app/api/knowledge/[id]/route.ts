import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// ── GET /api/knowledge/[id] — get full doc with content ──────────────────────
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    const userId = dbUser?.id ?? user.id

    const doc = await prisma.knowledgeDoc.findFirst({
      where: { id: params.id, userId },
    })
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ doc })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── PATCH /api/knowledge/[id] ─────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    const userId = dbUser?.id ?? user.id

    const body = await req.json()
    const { title, description, content, tags, source } = body

    const doc = await prisma.knowledgeDoc.updateMany({
      where: { id: params.id, userId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(content !== undefined && { content }),
        ...(tags !== undefined && { tags }),
        ...(source !== undefined && { source }),
      },
    })

    return NextResponse.json({ ok: true, count: doc.count })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── DELETE /api/knowledge/[id] ────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    const userId = dbUser?.id ?? user.id

    await prisma.knowledgeDoc.deleteMany({
      where: { id: params.id, userId },
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
