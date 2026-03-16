import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function cleanPhone(phone: string): string {
  return phone.replace(/[\s\-\+\(\)]/g, '')
}

// POST /api/bot/lead — n8n crea un lead nuevo (versión ligera, sin efectos secundarios)
// Body: { name, phone, plan?, source? }
export async function POST(req: NextRequest) {
  try {
    const { name, phone, plan, source } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: 'phone requerido' }, { status: 400 })
    }

    const cleanedPhone = cleanPhone(String(phone))
    if (cleanedPhone.length < 8) {
      return NextResponse.json({ error: 'Teléfono inválido' }, { status: 400 })
    }

    const perfil: 'MENSUAL' | 'ANUAL' = plan === 'ANUAL' ? 'ANUAL' : 'MENSUAL'

    const lead = await prisma.whatsappLead.upsert({
      where: { phone: cleanedPhone },
      create: {
        phone: cleanedPhone,
        name:  name ? String(name).trim() : null,
        estado: 'P1',
        perfil,
        respuestas: { source: source || 'n8n' },
        historial:  [],
      },
      update: {
        // Si ya existe y NO está vendido, reinicia el flujo
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ ok: true, lead })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
