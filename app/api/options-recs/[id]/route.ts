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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAdmin(req)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { status, precioSalida, active } = body

  const updated = await prisma.optionRecommendation.update({
    where: { id: params.id },
    data: {
      ...(status !== undefined && { status }),
      ...(precioSalida !== undefined && { precioSalida }),
      ...(active !== undefined && { active }),
    },
  })
  return NextResponse.json({ recommendation: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAdmin(req)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.optionRecommendation.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
