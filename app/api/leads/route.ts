import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

async function checkAdmin() {
  if (!ADMIN_EMAIL) {
    console.error('[checkAdmin] ADMIN_EMAIL no está configurado en las variables de entorno')
    return null
  }
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return null
  return user
}

// GET — listar todos los leads con paginación y filtros
export async function GET(req: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const estado = searchParams.get('estado') || ''
  const perfil = searchParams.get('perfil') || ''
  const page  = parseInt(searchParams.get('page') || '1')
  const limit = 20

  const where: any = {}
  if (estado) where.estado = estado
  if (perfil) where.perfil = perfil

  const [leads, total] = await Promise.all([
    (prisma as any).whatsappLead.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    (prisma as any).whatsappLead.count({ where }),
  ])

  // Stats globales
  const [totalAll, porEstado, porPerfil] = await Promise.all([
    (prisma as any).whatsappLead.count(),
    (prisma as any).whatsappLead.groupBy({ by: ['estado'], _count: { estado: true } }),
    (prisma as any).whatsappLead.groupBy({ by: ['perfil'], _count: { perfil: true } }),
  ])

  return NextResponse.json({ leads, total, page, limit, stats: { totalAll, porEstado, porPerfil } })
}

// DELETE — eliminar un lead
export async function DELETE(req: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await (prisma as any).whatsappLead.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

// PATCH — actualizar estado de un lead
export async function PATCH(req: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, estado } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const lead = await (prisma as any).whatsappLead.update({
    where: { id },
    data: { estado, updatedAt: new Date() },
  })
  return NextResponse.json({ ok: true, lead })
}
