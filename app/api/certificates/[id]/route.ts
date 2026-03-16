import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const cert = await (prisma as any).certificate.findUnique({ where: { id: params.id } })
    if (!cert || cert.userId !== dbUser.id) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    await (prisma as any).certificate.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const cert = await (prisma as any).certificate.findUnique({ where: { id: params.id } })
    if (!cert || cert.userId !== dbUser.id) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    const { public: isPublic } = await req.json()
    const updated = await (prisma as any).certificate.update({
      where: { id: params.id },
      data: { public: isPublic },
    })
    return NextResponse.json({ certificate: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
