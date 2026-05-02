import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const cert = await (prisma as any).certificate.findUnique({ where: { id: (await params).id } })
    if (!cert || cert.userId !== dbUser.id) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    await (prisma as any).certificate.delete({ where: { id: (await params).id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const cert = await (prisma as any).certificate.findUnique({ where: { id: (await params).id } })
    if (!cert || cert.userId !== dbUser.id) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    const body = await req.json()
    const data: Record<string, unknown> = {}
    if (body.public !== undefined) data.public = body.public
    if (body.title !== undefined) data.title = body.title
    if (body.category !== undefined) data.category = body.category
    if (body.issuedBy !== undefined) data.issuedBy = body.issuedBy
    if (body.issuedDate !== undefined) data.issuedDate = body.issuedDate
    if (body.fileUrl !== undefined) data.fileUrl = body.fileUrl
    if (body.fileType !== undefined) data.fileType = body.fileType
    const updated = await (prisma as any).certificate.update({
      where: { id: (await params).id },
      data,
    })
    return NextResponse.json({ certificate: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
