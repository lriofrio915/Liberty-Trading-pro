import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { callAI } from '@/lib/ai-providers'
import { notifyNexus } from '@/lib/notify-nexus'

const N8N_WEBHOOK_LANDING = process.env.N8N_WEBHOOK_LANDING || ''

const LINKS = {
  MENSUAL: process.env.HOTMART_LINK_MENSUAL || '',
  ANUAL:   process.env.HOTMART_LINK_ANUAL   || '',
}

if (!LINKS.MENSUAL || !LINKS.ANUAL) {
  console.warn('[VincesLanding] HOTMART_LINK_MENSUAL o HOTMART_LINK_ANUAL no configurados — los leads recibirán links vacíos')
}

function sanitizeText(text: string): string {
  return text
    .replace(/\u2014/g, '--')
    .replace(/\u2013/g, '-')
    .replace(/\u2018/g, "'")
    .replace(/\u2019/g, "'")
    .replace(/\u201C/g, '"')
    .replace(/\u201D/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/[^\x00-\x7F]/g, '')
}

async function captureLead(name: string, phone: string, email: string, plan: string) {
  const cleanedPhone = phone.replace(/[\s\-\+\(\)]/g, '')
  if (cleanedPhone.length < 7) return false

  const planNorm: 'MENSUAL' | 'ANUAL' = 'MENSUAL'
  const planLabel = 'Plan Pro Mensual ($29/mes)'

  try {
    const existing = await (prisma as any).whatsappLead.findUnique({ where: { phone: cleanedPhone } })
    const yaConvertido = existing?.estado === 'VENDIDO'

    await (prisma as any).whatsappLead.upsert({
      where: { phone: cleanedPhone },
      create: {
        phone: cleanedPhone,
        name: name.trim(),
        estado: 'CTA',
        perfil: planNorm,
        respuestas: { planInteres: planLabel, fuente: 'chat_landing' },
        historial: [],
      },
      update: {
        name: name.trim(),
        perfil: planNorm,
        updatedAt: new Date(),
        ...(yaConvertido ? {} : {
          estado: 'CTA',
          respuestas: { planInteres: planLabel, fuente: 'chat_landing' },
        }),
      },
    })

    const msgLuis =
      `📥 Nuevo lead *chat web*\n\n` +
      `👤 *Nombre:* ${name.trim()}\n` +
      `📱 *WhatsApp:* +${cleanedPhone}\n` +
      `📧 *Email:* ${email || 'no proporcionado'}\n` +
      `🎯 *Plan:* ${planLabel}\n\n` +
      `_Capturado desde el chat de la landing._`

    await Promise.allSettled([
      notifyNexus('lead_landing', {
        name: name.trim(),
        phone: cleanedPhone,
        email: email || '',
        plan: planNorm,
        planLabel,
        fuente: 'chat_landing',
      }),
      N8N_WEBHOOK_LANDING
        ? fetch(N8N_WEBHOOK_LANDING, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: name.trim(),
              phone: cleanedPhone,
              email: email || '',
              plan: planNorm,
              planLabel,
              source: 'chat_landing',
              ts: new Date().toISOString(),
            }),
            signal: AbortSignal.timeout(8000),
          })
        : Promise.resolve(),
    ])

    return true
  } catch (e) {
    console.error('[VincesLanding] captureLead error:', e)
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, leadSession } = await req.json()

    if (!process.env.OPENROUTER_API_KEY && !process.env.MINIMAX_API_KEY) {
      return NextResponse.json({ error: 'No AI provider configured' }, { status: 500 })
    }

    const systemPrompt = sanitizeText(
      `Eres Vinces, el asistente de ventas de Liberty Trading Club, la plataforma de trading de Luis Riofrio (Ecuador).\n\n` +
      `TU OBJETIVO: Entender la situacion del visitante, recomendarle el plan ideal y capturar su nombre + telefono para darle seguimiento personalizado.\n\n` +
      `PLAN DISPONIBLE:\n` +
      `- Plan Pro Mensual: $29/mes - sin permanencia, cancela cuando quieras, todo incluido\n\n` +
      `QUE INCLUYE:\n` +
      `- Mentoria Integral de Mercados Financieros (desde cero hasta trader profesional)\n` +
      `- Day Trading en Futuros NQ/MNQ, CFDs, acciones y opciones financieras\n` +
      `- Mentorias 1:1 con Luis Riofrio cada mes\n` +
      `- Vinces IA - coaching diario personalizado\n` +
      `- Reportes de oportunidades en acciones y ETFs\n` +
      `- Monitor Mundial de geopolitica y macro en tiempo real\n` +
      `- Track record verificable de Luis\n` +
      `- Comunidad privada activa\n\n` +
      `FLUJO DE LA CONVERSACION:\n` +
      `1. Saludar calidamente y preguntar sobre su experiencia en trading\n` +
      `2. Entender sus objetivos y situacion actual\n` +
      `3. Recomendar el plan mas adecuado segun su perfil\n` +
      `4. Cuando sea natural, pedir su nombre y numero de WhatsApp para enviarle el link de pago y seguimiento personalizado\n` +
      `5. Cuando tengas nombre Y telefono, incluir EXACTAMENTE al final (sin texto despues): <!--LEAD:{"name":"NOMBRE","phone":"TELEFONO","plan":"MENSUAL_O_ANUAL"}-->\n\n` +
      `REGLAS:\n` +
      `- Respuestas cortas: maximo 3-4 oraciones\n` +
      `- Maximo 1-2 preguntas por mensaje\n` +
      `- No presiones para comprar - enfocate en entender y ayudar\n` +
      `- Responde siempre en espanol\n` +
      `- El marcador <!--LEAD:--> solo usarlo cuando ya tengas nombre Y telefono confirmados\n` +
      (leadSession?.name  ? `- Ya conoces su nombre: ${leadSession.name} - no vuelvas a pedirlo\n` : '') +
      (leadSession?.phone ? `- Ya tienes su telefono: ${leadSession.phone} - no vuelvas a pedirlo\n` : '') +
      (leadSession?.captured ? `- Lead ya registrado. Ayudale con dudas sobre los planes y envialo al link de pago.\n` : '')
    )

    const mensajesSanitizados = (messages || []).map((m: any) => ({
      role: m.role,
      content: sanitizeText(String(m.content ?? '')),
    }))

    const result = await callAI({
      messages: [
        { role: 'system', content: systemPrompt },
        ...mensajesSanitizados,
      ],
      maxTokens: 400,
      temperature: 0.75,
      httpReferer: process.env.NEXT_PUBLIC_APP_URL || 'https://libertytrading.pro',
      xTitle: 'Liberty Trading Club -- Vinces Landing',
    })

    let content: string = result.content || ''
    if (!content) return NextResponse.json({ error: 'No response from AI' }, { status: 500 })

    // Extract LEAD marker if present
    let extractedData: { name?: string; phone?: string; plan?: string } | null = null
    let leadCaptured = false

    const leadMatch = content.match(/<!--LEAD:(\{.*?\})-->/)
    if (leadMatch && !leadSession?.captured) {
      try {
        extractedData = JSON.parse(leadMatch[1])
        // Remove marker from displayed content
        content = content.replace(/<!--LEAD:\{.*?\}-->/, '').trim()

        if (extractedData?.name && extractedData?.phone) {
          leadCaptured = await captureLead(
            extractedData.name,
            extractedData.phone,
            leadSession?.email || '',
            extractedData.plan || 'MENSUAL',
          )
        }
      } catch (e) {
        console.error('[VincesLanding] lead parse error:', e)
        content = content.replace(/<!--LEAD:.*?-->/, '').trim()
      }
    }

    return NextResponse.json({
      content,
      leadCaptured,
      extractedData,
      links: leadCaptured ? { mensual: LINKS.MENSUAL, anual: LINKS.ANUAL } : null,
    })
  } catch (err: any) {
    console.error('[VincesLanding] error:', err?.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
