import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Campos permitidos para actualizar desde n8n (evitar sobreescritura de campos internos)
const ALLOWED_PATCH_FIELDS = ['estado', 'perfil', 'name', 'respuestas', 'historial', 'productoUrl', 'followups', 'lastFollowup']

// GET /api/bot/lead/:phone — n8n consulta el estado del lead
export async function GET(
  _req: NextRequest,
  { params }: { params: { phone: string } }
) {
  const phone = params.phone?.trim()
  if (!phone) return NextResponse.json({ found: false }, { status: 400 })

  try {
    const lead = await prisma.whatsappLead.findUnique({
      where: { phone },
    })
    if (!lead) return NextResponse.json({ found: false })
    return NextResponse.json({
      found:      true,
      phone:      lead.phone,
      name:       lead.name,
      estado:     lead.estado,
      perfil:     lead.perfil,
      respuestas: lead.respuestas,
    })
  } catch {
    return NextResponse.json({ found: false })
  }
}

// PATCH /api/bot/lead/:phone — n8n actualiza uno o varios campos del lead
export async function PATCH(
  req: NextRequest,
  { params }: { params: { phone: string } }
) {
  const phone = params.phone?.trim()
  if (!phone) return NextResponse.json({ ok: false, error: 'Phone requerido' }, { status: 400 })

  try {
    const body = await req.json()

    // Filtrar solo campos permitidos
    const data: Record<string, unknown> = {}
    for (const key of ALLOWED_PATCH_FIELDS) {
      if (key in body) data[key] = body[key]
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ ok: false, error: 'No hay campos válidos para actualizar' }, { status: 400 })
    }

    const lead = await prisma.whatsappLead.update({
      where: { phone },
      data: { ...data, updatedAt: new Date() },
    })

    return NextResponse.json({ ok: true, lead })
  } catch (e: any) {
    if (e?.code === 'P2025') {
      return NextResponse.json({ ok: false, error: 'Lead no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
