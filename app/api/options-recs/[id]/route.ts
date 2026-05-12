import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

async function requireAdmin(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return null
  return user
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin(req)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const { status, precioSalida, active, resultado, pnlPct, pnlUsd, closedAt } = body

  const updated = await prisma.optionRecommendation.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(precioSalida !== undefined && { precioSalida }),
      ...(active !== undefined && { active }),
      ...(resultado !== undefined && { resultado }),
      ...(pnlPct !== undefined && { pnlPct }),
      ...(pnlUsd !== undefined && { pnlUsd }),
      ...(closedAt !== undefined && { closedAt: closedAt ? new Date(closedAt) : null }),
    },
  })
  return NextResponse.json({ recommendation: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin(req)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await prisma.optionRecommendation.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
