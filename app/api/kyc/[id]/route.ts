import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

async function checkAdmin() {
  if (!ADMIN_EMAIL) return null
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return null
  return user
}

// PATCH — actualizar status, capitalAsignado, notas (admin only)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  try {
    const { status, capitalAsignado, notas, rejectionReason } = await req.json()

    const data: any = {}
    if (status !== undefined)          data.status = status
    if (capitalAsignado !== undefined) data.capitalAsignado = capitalAsignado ? parseFloat(capitalAsignado) : null
    if (notas !== undefined)           data.notas = notas
    if (rejectionReason !== undefined) data.rejectionReason = rejectionReason

    // Registrar quién y cuándo revisó al aprobar/rechazar
    if (status === 'APROBADO' || status === 'RECHAZADO') {
      data.reviewedBy = admin.email
      data.reviewedAt = new Date()
    }

    const updated = await (prisma as any).kycClient.update({
      where: { id },
      data,
    })

    return NextResponse.json({ ok: true, kyc: updated })
  } catch (err: any) {
    console.error('[KYC PATCH]', err?.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// DELETE — eliminar registro KYC (admin only)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  try {
    await (prisma as any).kycClient.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[KYC DELETE]', err?.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
