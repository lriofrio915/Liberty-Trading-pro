import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const EVO_URL      = process.env.EVOLUTION_API_URL  || 'https://evo.nexus-ia.com.es'
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE || 'vinces'
const EVO_KEY      = process.env.EVOLUTION_API_KEY  || ''
const LUIS_PHONE   = process.env.LUIS_PHONE         || ''

function cleanPhone(phone: string) {
  return phone.replace(/[\s\-\+\(\)]/g, '')
}

async function sendWA(phone: string, text: string) {
  await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
    method: 'POST',
    headers: { apikey: EVO_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ number: phone, text }),
    signal: AbortSignal.timeout(15000),
  })
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

    // Notify Luis personally — NOT automated Vinces
    const msgLuis =
      `📞 *Solicitud de contacto personal* — formulario web\n\n` +
      `👤 *Nombre:* ${name.trim()}\n` +
      `📱 *WhatsApp:* +${cleanedPhone}\n` +
      `📧 *Email:* ${email || 'no proporcionado'}\n` +
      `🎯 *Plan de interés:* ${planLabel}\n` +
      (mensaje?.trim() ? `💬 *Mensaje:* ${mensaje.trim()}\n` : '') +
      `\n_Este lead quiere hablar contigo directamente. Vinces NO le ha escrito._`

    await sendWA(LUIS_PHONE, msgLuis)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[PersonalContact]', err?.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
