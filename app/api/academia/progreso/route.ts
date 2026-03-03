import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

async function resolveDbUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return prisma.user.findUnique({ where: { authId: user.id } })
}

export async function POST(req: NextRequest) {
  try {
    const dbUser = await resolveDbUser()
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { leccionId } = await req.json()
    await prisma.leccionProgreso.upsert({
      where: { userId_leccionId: { userId: dbUser.id, leccionId } },
      create: { userId: dbUser.id, leccionId },
      update: {},
    })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const dbUser = await resolveDbUser()
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { leccionId } = await req.json()
    await prisma.leccionProgreso.deleteMany({
      where: { userId: dbUser.id, leccionId },
    })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
