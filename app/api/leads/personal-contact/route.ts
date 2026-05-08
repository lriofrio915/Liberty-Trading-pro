import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyLeadContact } from '@/lib/notify-nexus'

function cleanPhone(phone: string) {
  return phone.replace(/[\s\-\+\(\)]/g, '')
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, mensaje, plan } = await req.json()

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'Nombre y teléfono requeridos' }, { status: 400 })
    }

    const cleanedPhone = cleanPhone(phone)
    if (cleanedPhone.length < 8) {
      return NextResponse.json({ error: 'Teléfono inválido' }, { status: 400 })
    }

    const planLabel = plan === 'ANUAL' ? 'Plan Pro Anual ($649/año)' : 'Plan Pro Mensual ($79/mes)'

    // Store lead — do NOT trigger automated Vinces chat
    await (prisma as any).whatsappLead.upsert({
      where: { phone: cleanedPhone },
      create: {
        phone: cleanedPhone,
        name: name.trim(),
        estado: 'NUEVO',
        perfil: plan || 'MENSUAL',
        productoUrl: 'contacto-personal',
        respuestas: {
          planInteres: planLabel,
          email: email || '',
          mensaje: mensaje || '',
        },
        historial: [],
      },
      update: {
        name: name.trim(),
        productoUrl: 'contacto-personal',
        updatedAt: new Date(),
      },
    })

    // Notify nexus_claw
    await notifyLeadContact({
      name: name.trim(),
      phone: cleanedPhone,
      email: email?.trim() || undefined,
      mensaje: mensaje?.trim() || undefined,
      planInteres: planLabel,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[PersonalContact]', err?.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
