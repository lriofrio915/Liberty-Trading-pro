import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** PATCH /api/cfds/signals/[id] — actualizar resultado de forward testing */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))

  const resultado = String(body.resultado ?? '')
  if (!['GANADA', 'PERDIDA', 'BREAKEVEN', 'PENDIENTE'].includes(resultado)) {
    return NextResponse.json({ error: 'resultado inválido' }, { status: 400 })
  }

  const updated = await prisma.cfdSignal.update({
    where: { id },
    data: {
      resultado,
      pnlUsd:       body.pnlUsd != null ? Number(body.pnlUsd) : undefined,
      closedPrice:  body.closedPrice != null ? Number(body.closedPrice) : undefined,
      closedAt:     resultado !== 'PENDIENTE' ? new Date() : undefined,
    },
  })

  return NextResponse.json(updated)
}
