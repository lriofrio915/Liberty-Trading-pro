import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyNexus } from '@/lib/notify-nexus'
import { callAI } from '@/lib/ai-providers'

// ── Config ────────────────────────────────────────────────────────────────────
const LINKS = {
  MENSUAL: process.env.HOTMART_LINK_MENSUAL || 'https://pay.hotmart.com/R104900326X?checkoutMode=2',
  ANUAL:   process.env.HOTMART_LINK_ANUAL   || 'https://pay.hotmart.com/L104900408S?checkoutMode=2',
}

const OPENCLAW_WEBHOOK_SECRET = process.env.OPENCLAW_WEBHOOK_SECRET || ''

// ── Contexto de Liberty Trading Pro ───────────────────────────────────────────
const CONTEXTO_LUIS = `
Eres Vinces, el asistente de ventas de Liberty Trading Pro — club de trading fundado por Luis Riofrío.

SOBRE LUIS RIOFRÍO (el formador):
- Trader activo en futuros del Nasdaq (NQ/MNQ), acciones y opciones financieras
- Operador Financiero en Emporium Quality Funds con track record verificable y público
- Estrategias: rompimiento y consecución (futuros intradia) | Dollar Cost Average (inversión a largo plazo)
- NO enseña fórmulas mágicas. Enseña disciplina, consistencia, un método probado y un sistema que funciona
- Honesto: el trading implica riesgo, no hay garantías de rentabilidad

MODELO DE NEGOCIO — Club Liberty Trading (suscripción mensual):
Hay UN solo plan con TODO incluido. Sin contratos, sin compromisos.

PLAN PRO — $29/mes (cancela cuando quieras):
- Sin permanencia ni contratos. Puedes cancelar en cualquier momento.
- Acceso completo desde el primer día.
- LINK: ${LINKS.MENSUAL}

QUÉ INCLUYE EL CLUB:
- Mentoría Integral de Mercados Financieros (desde cero hasta invertir con método)
- Day Trading — Futuros NQ/MNQ, CFDs, acciones y opciones financieras
- Mentorías 1:1 personalizadas con Luis cada mes
- Vinces IA — coaching diario personalizado con inteligencia artificial (24/7)
- Reportes de oportunidades en acciones y ETFs
- Monitor Mundial — geopolítica y macro en tiempo real
- Track record verificable — operaciones reales de Luis publicadas
- Reportes de rendimiento semanales y mensuales
- Comunidad privada activa

CLAVE DE RECOMENDACIÓN:
- Solo hay un plan: Plan Pro Mensual ($29/mes) — sin permanencia, cancela cuando quieras

PARA QUIÉN NO ES (compártelo con naturalidad si el contexto lo amerita, nunca de forma agresiva):
- NO es para quien busca ingresos inmediatos o "resultados ya". El trading es un proceso que toma tiempo.
- NO es para personas endeudadas que dependen del trading para salir de sus problemas financieros urgentes. La presión económica extrema impide tomar buenas decisiones en el mercado y puede empeorar su situación.
- NO es para personas incumplidas o indisciplinadas que no están dispuestas a comprometerse con el proceso.

PARA QUIÉN SÍ ES:
- Personas comprometidas, decididas y entusiastas con el aprendizaje.
- Personas disciplinadas o con predisposición real a desarrollar disciplina.
- Si alguien menciona urgencia económica extrema o deudas graves, Vinces debe ser honesto y empático: reconocer su situación, explicar que el trading no es la solución inmediata para eso, y sugerir que primero estabilicen su situación financiera.
`

// ── Preguntas rediseñadas ─────────────────────────────────────────────────────
const PREGUNTAS: Record<string, string> = {
  P1: '¿Actualmente tienes trabajo, negocio o alguna fuente de ingresos? ¿Y has tenido algún contacto con el trading o la inversión antes, o es algo completamente nuevo para ti?',
  P2: '¿Cuál de estas opciones describe mejor lo que buscas?\n\n1️⃣ Aprender a invertir mis ahorros y hacer crecer mi capital\n2️⃣ Convertirme en trader profesional y vivir del trading\n3️⃣ Generar ingresos adicionales operando a tiempo parcial\n4️⃣ Aún no tengo claro, quiero orientarme primero',
  P3: '¿Cuánto tiempo libre tienes al día o a la semana para dedicarle al aprendizaje y la práctica?',
  P4: 'Por último: ¿qué te ha frenado hasta ahora para dar el paso? ¿Y qué sería lo más importante para ti al unirte a un club de trading?',
}

const NEXT_STATE: Record<string, string> = {
  NOMBRE: 'P1', P1: 'P2', P2: 'P3', P3: 'P4', P4: 'CLASIFICADO',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function cleanPhone(jid: string): string {
  return jid.replace('@s.whatsapp.net', '').replace('@c.us', '').trim()
}

/** Sanitiza el nombre antes de inyectarlo en prompts o almacenarlo */
function sanitizeName(name: string | null | undefined): string {
  if (!name) return ''
  return name.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').slice(0, 30).trim()
}

/** Detecta mensajes de despedida o agradecimiento cortos */
function esDespadida(texto: string): boolean {
  const t = texto.trim().toLowerCase()
  return t.length < 80 && /^(ok|okay|okey|gracias|muchas gracias|mil gracias|perfecto|listo|bye|chao|chau|adios|adiós|hasta luego|hasta pronto|nos vemos|que tengas|buen dia|buen día|buenas noches|buenas tardes|fue un placer|encantado|con gusto|entendido|claro|de acuerdo|sin problema|todo bien|nada mas|nada más|eso es todo|es todo|ya es todo|eso sería todo)\b/i.test(t)
}

function primerNombre(fullName: string | null | undefined): string | null {
  if (!fullName?.trim()) return null
  return fullName.trim().split(/\s+/)[0]
}

// ── Transcripción de audio con Groq Whisper (recibe base64 del caller) ────────

async function transcribirAudioBase64(base64: string): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) {
    console.error('[Vinces WA] GROQ_API_KEY no configurada')
    return ''
  }

  if (!base64) {
    console.error('[Vinces WA] No se recibió base64 del audio')
    return ''
  }

  try {
    const audioBuffer = Buffer.from(base64, 'base64')
    const formData = new FormData()
    formData.append('file', new Blob([audioBuffer], { type: 'audio/ogg' }), 'audio.ogg')
    formData.append('model', 'whisper-large-v3')
    formData.append('language', 'es')

    const transcRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqKey}` },
      body: formData,
      signal: AbortSignal.timeout(30000),
    })

    if (!transcRes.ok) {
      const txt = await transcRes.text()
      console.error(`[Vinces WA] Groq error ${transcRes.status}:`, txt.slice(0, 300))
      return ''
    }

    const transcData = await transcRes.json()
    const texto = transcData.text?.trim() || ''
    console.log('[Vinces WA] Transcripción OK:', texto.slice(0, 100))
    return texto
  } catch (e: any) {
    console.error('[Vinces WA] transcribirAudio exception:', e?.message)
    return ''
  }
}

// ── AI Provider ──────────────────────────────────────────────────────────────

async function callAIWrapper(messages: { role: string; content: string }[]): Promise<string> {
  const result = await callAI({
    messages,
    maxTokens: 600,
    temperature: 0.7,
    httpReferer: process.env.NEXT_PUBLIC_APP_URL || 'https://libertytrading.pro',
    xTitle: 'Liberty Trading - Vinces WA',
  })
  return result.content
}

// ── Notificar a Luis cuando un lead llega a CTA (via nexus_claw) ──────────────

async function notificarLuisCTA(lead: {
  name: string | null
  phone: string
  perfil: string
  respuestas: Record<string, string>
  productoUrl: string
}) {
  const perfilLabel = 'Plan Pro Mensual ($29/mes)'

  const resumen = Object.entries(lead.respuestas)
    .map(([k, v]) => `• ${PREGUNTAS[k]}\n  → ${v}`)
    .join('\n\n')

  try {
    await notifyNexus('lead_cta', {
      name: lead.name || 'sin nombre',
      phone: lead.phone,
      perfil: lead.perfil,
      perfilLabel,
      productoUrl: lead.productoUrl,
      respuestas: resumen,
      nota: 'Este lead ya recibió el link de pago de Vinces. Puedes hacer seguimiento directo.',
    })
  } catch (e: any) {
    console.error('[Vinces WA] Error notificando lead CTA:', e?.message)
  }
}

// ── Clasificar perfil ─────────────────────────────────────────────────────────

async function clasificarPerfil(name: string, respuestas: Record<string, string>) {
  const resumen = Object.entries(respuestas)
    .map(([k, v]) => `${PREGUNTAS[k]}\nRespuesta: ${v}`)
    .join('\n\n')

  const prompt = `${CONTEXTO_LUIS}

Analizaste la conversación con ${name}:

${resumen}

Solo hay un plan: Plan Pro Mensual ($29/mes) — sin permanencia, todo incluido.

Responde SOLO este JSON (sin texto adicional):
{"perfil":"MENSUAL","mensaje":"texto"}

Reglas del mensaje:
- 3 oraciones personalizadas basadas en lo que dijo ${name}
- Cálido, empático, muestra que entendiste su situación
- Explica por qué ese plan es el más adecuado para su momento actual
- Menciona el precio del plan recomendado
- Sin links, sin asteriscos, sin markdown, sin emojis en exceso
- Termina con una invitación a revisar el plan`

  const raw = await callAIWrapper([{ role: 'user', content: prompt }])

  try {
    const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || '{}')
    const perfil: 'MENSUAL' | 'ANUAL' = 'MENSUAL'
    const url = LINKS.MENSUAL
    const planLabel = 'Plan Pro Mensual — $29/mes (cancela cuando quieras)'
    const mensajeLimpio = (parsed.mensaje || '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .trim()
    return { perfil, mensaje: `${mensajeLimpio}\n\n👉 ${planLabel}:\n${url}`, productoUrl: url }
  } catch {
    return {
      perfil: 'MENSUAL' as const,
      mensaje: `Basado en lo que me contaste, el mejor punto de partida es el Plan Pro Mensual de Liberty Trading. 🎓\n\n👉 Plan Pro Mensual — $29/mes (cancela cuando quieras):\n${LINKS.MENSUAL}`,
      productoUrl: LINKS.MENSUAL,
    }
  }
}

// ── Transición conversacional ─────────────────────────────────────────────────

async function respuestaConversacional(
  name: string | null,
  historial: { role: string; content: string }[],
  ultimoMensaje: string,
) {
  const system = `${CONTEXTO_LUIS}

Estás en una conversación de WhatsApp con ${name || 'un prospecto'} que está interesado en aprender trading o inversión.

REGLAS ESTRICTAS:
1. NUNCA escribas pensamientos internos, notas ni metadatos. Nada de "Interno:", "Nota:", corchetes ni paréntesis.
2. Tu respuesta es SOLO lo que el cliente verá en WhatsApp.
3. Escribe SOLO 1-2 oraciones cortas de empatía o reconocimiento genuino. Cálido, humano, natural.
4. NO hagas preguntas. El sistema añade la siguiente pregunta automáticamente.
5. NO uses asteriscos, guiones, markdown ni formato de ningún tipo.
6. Usa máximo 1 emoji natural.
7. Si la persona menciona que no sabe algo (activos, términos), tranquilízala: "eso es exactamente para lo que estamos aquí".`

  return callAIWrapper([
    { role: 'system', content: system },
    ...historial.slice(-6),
    { role: 'user', content: ultimoMensaje },
  ])
}

// ── POST /api/vinces-wa ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Auth: validate webhook secret if configured
    if (OPENCLAW_WEBHOOK_SECRET) {
      const incomingSecret = req.headers.get('x-openclaw-secret') || ''
      if (incomingSecret !== OPENCLAW_WEBHOOK_SECRET) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await req.json()
    const { phone: rawPhone, pushName: rawPushName, isAudio, audioBase64 } = body as {
      phone: string
      pushName?: string
      isAudio?: boolean
      audioBase64?: string
    }
    const pushName = sanitizeName(rawPushName)
    let { message } = body as { message?: string }

    if (!rawPhone) return NextResponse.json({ ok: false, error: 'Missing phone' })

    const phone = cleanPhone(rawPhone)

    // ── Transcribir audio si es nota de voz (nexus_claw envía el base64) ────
    if (isAudio && audioBase64) {
      const transcripcion = await transcribirAudioBase64(audioBase64)
      if (!transcripcion || transcripcion.startsWith('[')) {
        const nombreGuardado = primerNombre(
          ((await (prisma as any).whatsappLead.findUnique({ where: { phone } }))?.name) || pushName
        )
        return NextResponse.json({
          ok: true,
          messages: [`${nombreGuardado ? `¡Hola ${nombreGuardado}! ` : ''}Recibí tu nota de voz pero tuve un problema al procesarla 😅 ¿Puedes escribirme tu mensaje? Te respondo de inmediato.`],
        })
      }
      message = transcripcion
    }

    if (!message?.trim()) return NextResponse.json({ ok: false, error: 'Empty message' })

    const texto = message.trim()

    // ── Buscar o crear lead ──────────────────────────────────────────────────
    let lead = await (prisma as any).whatsappLead.findUnique({ where: { phone } })
    if (!lead) {
      lead = await (prisma as any).whatsappLead.create({
        data: { phone, name: primerNombre(pushName), estado: 'NUEVO', historial: [], respuestas: {} },
      })
    }

    const historial: { role: string; content: string }[] = (lead.historial as any) || []
    const respuestas: Record<string, string> = (lead.respuestas as any) || {}
    let { estado } = lead
    let name: string | null = primerNombre(lead.name)
    let respuesta = ''

    // ── Máquina de estados ───────────────────────────────────────────────────

    if (estado === 'NUEVO') {
      name = primerNombre(pushName)
      if (name) {
        estado = 'P1'
        respuesta = `¡Hola ${name}! 👋 Soy Vinces, el asistente del Club Liberty Trading.\n\nMe alegra que hayas llegado hasta aquí. Para orientarte de la mejor forma, voy a hacerte unas preguntas rápidas 🎯\n\n${PREGUNTAS.P1}`
      } else {
        estado = 'NOMBRE'
        respuesta = '¡Hola! 👋 Soy Vinces, el asistente del Club Liberty Trading.\n\nEstoy aquí para ayudarte a encontrar tu camino en el mundo del trading y la inversión.\n\n¿Cómo te llamas?'
      }
    }

    else if (estado === 'NOMBRE') {
      name = primerNombre(texto)
      estado = 'P1'
      respuesta = `¡Mucho gusto, ${name}! 😊\n\nTe haré unas preguntas rápidas para entender qué buscas y recomendarte el plan que mejor se adapte a ti 👇\n\n${PREGUNTAS.P1}`
    }

    else if (['P1', 'P2', 'P3'].includes(estado)) {
      // Detectar despedida: no avanzar, responder con calidez
      if (esDespadida(texto)) {
        respuesta = `¡Fue un placer charlar contigo${name ? `, ${name}` : ''}! 😊 Cuando quieras continuar aquí estaré. ¡Que te vaya muy bien!`
      } else {
        respuestas[estado] = texto
        const transicion = await respuestaConversacional(name, historial, texto)
        const nextEstado = NEXT_STATE[estado]
        estado = nextEstado

        historial.push({ role: 'user', content: texto })
        historial.push({ role: 'assistant', content: transicion })
        historial.push({ role: 'assistant', content: PREGUNTAS[nextEstado] })

        await (prisma as any).whatsappLead.update({
          where: { phone },
          data: { name, estado, respuestas, historial: historial.slice(-20), updatedAt: new Date() },
        })

        // Dos mensajes separados: primero la empatía, luego la pregunta
        return NextResponse.json({ ok: true, messages: [transicion, PREGUNTAS[nextEstado]] })
      }
    }

    else if (estado === 'P4') {
      // Detectar despedida antes de la última pregunta
      if (esDespadida(texto)) {
        respuesta = `¡Un gusto hablar contigo${name ? `, ${name}` : ''}! 😊 Si en algún momento quieres retomar la conversación, aquí estaré. ¡Éxitos!`
      } else {
        respuestas['P4'] = texto
        estado = 'CLASIFICADO'
        respuesta = `Gracias por compartir todo eso conmigo, ${name} 🙏\n\nDéjame analizar tu perfil para darte la mejor recomendación...`

        historial.push({ role: 'user', content: texto })
        historial.push({ role: 'assistant', content: respuesta })

        await (prisma as any).whatsappLead.update({
          where: { phone },
          data: { name, estado, respuestas, historial: historial.slice(-20), updatedAt: new Date() },
        })

        const clasificacion = await clasificarPerfil(name || 'Trader', respuestas)

        await (prisma as any).whatsappLead.update({
          where: { phone },
          data: {
            estado: 'CTA',
            perfil: clasificacion.perfil,
            productoUrl: clasificacion.productoUrl,
            historial: [...historial, { role: 'assistant', content: clasificacion.mensaje }].slice(-20),
            updatedAt: new Date(),
          },
        })

        // Notificar a Luis via nexus_claw (fire-and-forget)
        notificarLuisCTA({
          name,
          phone,
          perfil: clasificacion.perfil,
          respuestas,
          productoUrl: clasificacion.productoUrl,
        }).catch(() => {})

        return NextResponse.json({ ok: true, messages: [respuesta, clasificacion.mensaje] })
      }
    }

    else if (estado === 'CTA') {
      const system = `${CONTEXTO_LUIS}

Estás hablando con ${name || 'un prospecto'} que ya recibió la recomendación del Plan Pro Mensual. Responde sus dudas con calidez y precisión usando el contexto de Liberty Trading Pro. Solo hay un plan: $29/mes, sin contratos, con todo incluido. Si muestra interés en suscribirse, refuerza positivamente. Sin markdown, sin asteriscos, máximo 3 oraciones.`

      respuesta = await callAIWrapper([
        { role: 'system', content: system },
        ...historial.slice(-8),
        { role: 'user', content: texto },
      ])
      const positivo = /gracias|compré|me anoto|perfecto|listo|pagué|sí quiero|quiero inscrib|me interesa|lo tomo|voy a tomar/i.test(texto)
      if (positivo) estado = 'VENDIDO'
    }

    else if (estado === 'VENDIDO') {
      respuesta = `¡Excelente decisión, ${name}! 🎉 Bienvenido al Club Liberty Trading. Luis estará pendiente y podrás comenzar de inmediato. ¡A operar!`
    }

    historial.push({ role: 'user', content: texto })
    historial.push({ role: 'assistant', content: respuesta })

    await (prisma as any).whatsappLead.update({
      where: { phone },
      data: { name, estado, respuestas, historial: historial.slice(-20), updatedAt: new Date() },
    })

    return NextResponse.json({ ok: true, messages: [respuesta] })
  } catch (err: any) {
    console.error('Vinces WA error:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
