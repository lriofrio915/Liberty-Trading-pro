import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

async function resolveDbUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return prisma.user.findUnique({ where: { authId: user.id } })
}

export async function GET() {
  try {
    const dbUser = await resolveDbUser()
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const retiros = await prisma.retiro.findMany({
      where: { userId: dbUser.id },
      orderBy: { fecha: 'desc' },
      include: { plan: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ retiros })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const dbUser = await resolveDbUser()
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    const retiro = await prisma.retiro.create({
      data: {
        userId: dbUser.id,
        planId: body.planId || null,
        monto: parseFloat(body.monto),
        fecha: new Date(body.fecha),
        nota: body.nota || null,
      },
      include: { plan: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ retiro })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
