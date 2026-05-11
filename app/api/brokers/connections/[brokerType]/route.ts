import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ brokerType: string }> }
) {
  try {
    const { brokerType } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    await prisma.brokerConnection.updateMany({
      where: { userId: dbUser.id, brokerType },
      data: { isActive: false, lastStatus: 'disconnected' },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/brokers/connections/:brokerType]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
