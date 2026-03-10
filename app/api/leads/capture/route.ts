import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const EVO_URL      = process.env.EVOLUTION_API_URL  || 'https://evo.nexus-ia.com.es'
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE || 'vinces'
const EVO_KEY      = process.env.EVOLUTION_API_KEY  || '157B8ABC2B63-46DE-B38C-05C3C3ACAA3A'

function cleanPhone(phone: string): string {
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
    const { name, phone, programa } = await req.json()

    if (!name || !phone) {
      return NextResponse.json({ error: 'Nombre y teléfono requeridos' }, { status: 400 })
    }

    const cleanedPhone = cleanPhone(phone)
    if (cleanedPhone.length < 8) {
      return NextResponse.json({ error: 'Teléfono inválido' }, { status: 400 })
    }

    // Verificar si el lead ya existe y está avanzado en el flujo
    const existing = await (prisma as any).whatsappLead.findUnique({
      where: { phone: cleanedPhone },
    })

    if (existing && !['NUEVO', 'NOMBRE'].includes(existing.estado)) {
      // Ya está en el flujo — no reiniciar, solo confirmar
      return NextResponse.json({ ok: true, status: 'existing' })
    }

    // Crear o actualizar el lead saltando directo a P1 (ya tenemos el nombre)
    await (prisma as any).whatsappLead.upsert({
      where: { phone: cleanedPhone },
      create: {
        phone: cleanedPhone,
        name: name.trim(),
        estado: 'P1',
        respuestas: {},
        historial: [],
      },
      update: {
        name: name.trim(),
        estado: 'P1',
        respuestas: {},
        historial: [],
        updatedAt: new Date(),
      },
    })

    // Mensaje personalizado según el programa de origen (opcional)
    const contextoPrograma = programa === 'INTEGRAL'
      ? 'Vi que te interesa la Mentoría Integral de Inversión. '
      : programa === 'FUTUROS'
        ? 'Vi que te interesa la Maestría en Futuros NQ/MNQ. '
        : ''

    const mensaje =
      `¡Hola ${name.trim()}! 👋 Soy Vinces, el asistente de Liberty Trading Pro.\n\n` +
      `${contextoPrograma}` +
      `Luis me entrenó para orientar a personas que quieren aprender a invertir o hacer trading profesional.\n\n` +
      `¿Me permites hacerte unas preguntas rápidas para recomendarte lo que mejor se adapta a ti? 🎯`

    // Enviar mensaje de inicio (fire-and-forget para no bloquear la respuesta)
    sendWA(cleanedPhone, mensaje).catch((e) =>
      console.error('[Capture] Error enviando WA:', e?.message)
    )

    return NextResponse.json({ ok: true, status: 'created' })
  } catch (err: any) {
    console.error('[Capture] Error:', err?.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
