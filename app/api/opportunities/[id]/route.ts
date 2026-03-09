import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAIL = 'lriofrio915@gmail.com'

// ── PATCH /api/opportunities/[id] — update status, active, or any field ────────
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { status, active, title, description, precioObjetivo, stopLoss } = body

    const updated = await prisma.opportunity.update({
      where: { id: params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(active !== undefined && { active }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(precioObjetivo !== undefined && { precioObjetivo: parseFloat(precioObjetivo) }),
        ...(stopLoss !== undefined && { stopLoss: parseFloat(stopLoss) }),
      },
    })

    return NextResponse.json({ opportunity: updated })
  } catch (err) {
    console.error('PATCH /api/opportunities/[id]:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ── DELETE /api/opportunities/[id] ─────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.opportunity.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/opportunities/[id]:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
