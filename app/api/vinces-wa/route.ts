import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ── Config ────────────────────────────────────────────────────────────────────
const LINKS = {
  INTEGRAL: process.env.HOTMART_LINK_ACADEMIA || 'https://hotm.io/NLcSS1',
  FUTUROS:  process.env.HOTMART_LINK_CLUB     || 'https://hotm.io/HhAyjc',
}

const EVO_URL      = process.env.EVOLUTION_API_URL || 'https://evo.nexus-ia.com.es'
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE || 'vinces'
const EVO_KEY      = process.env.EVOLUTION_API_KEY  || '157B8ABC2B63-46DE-B38C-05C3C3ACAA3A'

// ── Contexto de Liberty Trading Pro ───────────────────────────────────────────
const CONTEXTO_LUIS = `
Eres Vinces, el asistente de ventas de Liberty Trading Pro — academia de trading fundada por Luis Riofrío.

SOBRE LUIS RIOFRÍO (el formador):
- Trader intradia especializado en futuros del Nasdaq (NQ/MNQ) con NinjaTrader 8
- Estrategias: rompimiento y consecución (futuros intradia) | Dollar Cost Average (inversión a largo plazo)
- NO enseña fórmulas mágicas. Enseña disciplina, consistencia, un método probado y un sistema que funciona
- Honesto: el trading implica riesgo, no hay garantías de rentabilidad

PROGRAMA 1 — Mentoría Integral de Inversión (2 meses, 1 a 1):
- PARA QUIÉN: personas con trabajo/ingresos estables, que no tienen mucho tiempo libre, que quieren hacer crecer su capital e invertir con método. Perfil: adultos maduros, emprendedores, profesionales ocupados que quieren aprender a abrir cuentas en brokers, comprar acciones, ETFs, cripto, bonos, materias primas, construir un portafolio diversificado.
- QUÉ APRENDEN: estrategia Dollar Cost Average, diversificación de portafolio, apertura de cuenta en Interactive Brokers, exchanges cripto, gestión de capital, conversiones USD/cripto.
- FORMATO: clases 1 a 1 en vivo (ritmo adaptado), soporte por WhatsApp todo el programa, acceso de por vida a comunidad privada con análisis y oportunidades.
- LINK: ${LINKS.INTEGRAL}

PROGRAMA 2 — Maestría en Trading Intradía de Futuros NQ/MNQ (1 año):
- PARA QUIÉN: personas que quieren hacer del trading su profesión o estilo de vida, que tienen tiempo para practicar y operar, que buscan cambiar de carrera, generar track record profesional, conseguir trabajo como operadores. Personas que ven el trading a largo plazo como su medio de vida.
- QUÉ APRENDEN: sistema completo de trading intradia en NQ/MNQ con NinjaTrader 8, lectura de mercado, ejecución, gestión de posición, disciplina, métricas. El sistema opera en la apertura del mercado americano (9:30am NY) pero el alumno puede adaptarlo a su horario.
- FORMATO: clases 1 a 1 con Luis, biblioteca de videos, mentoring grupal, comunidad privada, y Vinces IA como mentor de métricas (registra track record, win rate, profit factor, etc.)
- LINK: ${LINKS.FUTUROS}

CLAVE DE CLASIFICACIÓN:
- ¿Quiere INVERTIR su capital y tiene trabajo? → Mentoría Integral
- ¿Quiere VIVIR DEL TRADING y tiene tiempo para dedicarse? → Maestría en Futuros

PARA QUIÉN NO ES (compártelo con naturalidad si el contexto lo amerita, nunca de forma agresiva):
- NO es para quien busca ingresos inmediatos o "resultados ya". El trading es un proceso que toma tiempo.
- NO es para personas endeudadas que dependen del trading para salir de sus problemas financieros urgentes. La presión económica extrema impide tomar buenas decisiones en el mercado y puede empeorar su situación.
- NO es para personas incumplidas o indisciplinadas que no están dispuestas a comprometerse con el proceso. El nivel de compromiso que el trading exige es alto.

PARA QUIÉN SÍ ES:
- Personas comprometidas, decididas y entusiastas con el aprendizaje.
- Personas disciplinadas o con predisposición real a desarrollar disciplina.
- No se requiere ser perfecto, pero sí tener la actitud y voluntad de convertirse en ello.
- Si alguien menciona urgencia económica extrema o deudas graves, Vinces debe ser honesto y empático: reconocer su situación, explicar con respeto que el trading no es la solución inmediata para eso, y sugerir que primero estabilicen su situación financiera antes de invertir en formación.
`

// ── Preguntas rediseñadas ─────────────────────────────────────────────────────
const PREGUNTAS: Record<string, string> = {
  P1: '¿Actualmente tienes trabajo, negocio o alguna fuente de ingresos? ¿Y has invertido antes o es algo completamente nuevo para ti?',
  P2: '¿Cuál de estas opciones describe mejor lo que buscas?\n\n1️⃣ Aprender a invertir mis ahorros y hacer crecer mi capital (sin dejar mi trabajo)\n2️⃣ Convertirme en trader profesional y vivir del trading\n3️⃣ Generar ingresos extras operando en mis tiempos libres\n4️⃣ Aún no tengo claro, quiero orientación',
  P3: '¿Cuánto tiempo libre tienes al día o a la semana para dedicarle al aprendizaje y práctica?',
  P4: 'Y para cerrar: ¿qué te ha frenado hasta ahora para dar el paso? ¿Qué sería lo más importante para ti en un programa de formación?',
}

const NEXT_STATE: Record<string, string> = {
  NOMBRE: 'P1', P1: 'P2', P2: 'P3', P3: 'P4', P4: 'CLASIFICADO',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function cleanPhone(jid: string): string {
  return jid.replace('@s.whatsapp.net', '').replace('@c.us', '').trim()
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

// ── Transcripción de audio con Groq Whisper ───────────────────────────────────

async function transcribirAudio(rawMessage: any): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) {
    console.error('[Vinces WA] GROQ_API_KEY no configurada')
    return ''
  }

  try {
    const audioMsg = rawMessage?.message?.audioMessage || rawMessage?.message?.pttMessage
    let base64: string = audioMsg?.base64 || ''

    if (!base64) {
      console.log('[Vinces WA] base64 no en payload, llamando getBase64FromMediaMessage...')
      const evoRes = await fetch(`${EVO_URL}/chat/getBase64FromMediaMessage/${EVO_INSTANCE}`, {
        method: 'POST',
        headers: { apikey: EVO_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: rawMessage, convertToMp4: false }),
        signal: AbortSignal.timeout(30000),
      })
      if (evoRes.ok) {
        const evoData = await evoRes.json()
        base64 = evoData.base64 || ''
        console.log('[Vinces WA] base64 obtenido de Evolution API, longitud:', base64.length)
      } else {
        const txt = await evoRes.text()
        console.error(`[Vinces WA] Evolution getBase64 error ${evoRes.status}:`, txt.slice(0, 300))
        return ''
      }
    }

    if (!base64) {
      console.error('[Vinces WA] No se pudo obtener base64 del audio')
      return ''
    }

    console.log('[Vinces WA] base64 listo, longitud:', base64.length)

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

// ── OpenRouter AI ─────────────────────────────────────────────────────────────

async function callAI(messages: { role: string; content: string }[]): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://libertytrading.pro',
      'X-Title': 'Liberty Trading - Vinces WA',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3-0324',
      messages,
      max_tokens: 600,
      temperature: 0.7,
    }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ── Notificar a Luis cuando un lead llega a CTA ───────────────────────────────

const LUIS_PHONE = process.env.LUIS_PHONE || '593988835806' // formato sin + ni espacios

async function notificarLuis(lead: {
  name: string | null
  phone: string
  perfil: string
  respuestas: Record<string, string>
}) {
  try {
    const perfilLabel = lead.perfil === 'INTEGRAL' ? '📘 Mentoría Integral' : '📊 Maestría en Futuros'
    const resumen = Object.entries(lead.respuestas)
      .map(([k, v]) => `• ${PREGUNTAS[k]}\n  → ${v}`)
      .join('\n\n')

    const msg =
      `🔔 *Nuevo lead listo para cierre*\n\n` +
      `👤 *Nombre:* ${lead.name || 'sin nombre'}\n` +
      `📱 *WhatsApp:* +${lead.phone}\n` +
      `🎯 *Perfil:* ${perfilLabel}\n\n` +
      `📋 *Respuestas del formulario:*\n\n${resumen}\n\n` +
      `_Este lead ya recibió el link de pago de Vinces. Puedes hacer seguimiento directo._`

    await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
      method: 'POST',
      headers: { apikey: EVO_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        number: LUIS_PHONE,
        text: msg,
      }),
      signal: AbortSignal.timeout(15000),
    })

    console.log('[Vinces WA] Notificación enviada a Luis para lead:', lead.phone)
  } catch (e: any) {
    console.error('[Vinces WA] Error notificando a Luis:', e?.message)
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

Basándote en el contexto de Liberty Trading Pro, clasifica a ${name} en uno de estos dos perfiles:
- INTEGRAL: quiere invertir su capital, tiene trabajo/ingresos, no tiene mucho tiempo libre, perfil inversor → Mentoría Integral
- FUTUROS: quiere vivir del trading, tiene tiempo para dedicarse, quiere cambio de carrera o trading como profesión → Maestría en Futuros

Responde SOLO este JSON (sin texto adicional):
{"perfil":"INTEGRAL","mensaje":"texto"}

Reglas del mensaje:
- 3 oraciones personalizadas basadas en lo que dijo ${name}
- Cálido, empático, muestra que entendiste su situación
- Explica brevemente POR QUÉ ese programa es el ideal para él/ella
- Sin links, sin asteriscos, sin markdown, sin emojis en exceso
- Termina con una invitación a revisar el programa`

  const raw = await callAI([{ role: 'user', content: prompt }])

  try {
    const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || '{}')
    const perfil: 'INTEGRAL' | 'FUTUROS' = parsed.perfil === 'FUTUROS' ? 'FUTUROS' : 'INTEGRAL'
    const url = LINKS[perfil]
    const producto = perfil === 'FUTUROS' ? 'Maestría en Trading Intradía de Futuros' : 'Mentoría Integral de Inversión'
    const mensajeLimpio = (parsed.mensaje || '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .trim()
    return { perfil, mensaje: `${mensajeLimpio}\n\n👉 ${producto}:\n${url}`, productoUrl: url }
  } catch {
    return {
      perfil: 'INTEGRAL' as const,
      mensaje: `Basado en lo que me contaste, creo que el mejor punto de partida es nuestra Mentoría Integral de Inversión. 🎓\n\n👉 Mentoría Integral de Inversión:\n${LINKS.INTEGRAL}`,
      productoUrl: LINKS.INTEGRAL,
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

  return callAI([
    { role: 'system', content: system },
    ...historial.slice(-6),
    { role: 'user', content: ultimoMensaje },
  ])
}

// ── POST /api/vinces-wa ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone: rawPhone, pushName, isAudio, rawMessage } = body as {
      phone: string
      pushName?: string
      isAudio?: boolean
      rawMessage?: any
    }
    let { message } = body as { message?: string }

    if (!rawPhone) return NextResponse.json({ ok: false, error: 'Missing phone' })

    const phone = cleanPhone(rawPhone)

    // ── Typing indicator: fire-and-forget ────────────────────────────────────
    fetch(`${EVO_URL}/chat/sendPresence/${EVO_INSTANCE}`, {
      method: 'POST',
      headers: { apikey: EVO_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: phone, presence: 'composing', delay: 25000 }),
    }).catch(() => {})

    // ── Transcribir audio si es nota de voz ──────────────────────────────────
    if (isAudio && rawMessage) {
      const transcripcion = await transcribirAudio(rawMessage)
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
        respuesta = `¡Hola ${name}! 👋 Soy Vinces, el asistente de Liberty Trading Pro.\n\nMe alegra que hayas llegado hasta aquí. Para orientarte de la mejor forma, voy a hacerte unas preguntas rápidas 🎯\n\n${PREGUNTAS.P1}`
      } else {
        estado = 'NOMBRE'
        respuesta = '¡Hola! 👋 Soy Vinces, el asistente de Liberty Trading Pro.\n\nEstoy aquí para ayudarte a encontrar el camino correcto en el mundo de las inversiones y el trading.\n\n¿Cómo te llamas?'
      }
    }

    else if (estado === 'NOMBRE') {
      name = primerNombre(texto)
      estado = 'P1'
      respuesta = `¡Mucho gusto, ${name}! 😊\n\nTe haré unas preguntas rápidas para entender exactamente qué necesitas y orientarte bien 👇\n\n${PREGUNTAS.P1}`
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

        // Notificar a Luis (fire-and-forget)
        notificarLuis({ name, phone, perfil: clasificacion.perfil, respuestas }).catch(() => {})

        return NextResponse.json({ ok: true, messages: [respuesta, clasificacion.mensaje] })
      }
    }

    else if (estado === 'CTA') {
      const system = `${CONTEXTO_LUIS}

Estás hablando con ${name || 'un prospecto'} que ya recibió tu recomendación de programa. Responde sus dudas con calidez y precisión usando el contexto de Liberty Trading Pro. Si pregunta precios o fechas de inicio, dile que Luis le dará esa información al contactarlo directamente. Si muestra interés en inscribirse, refuerza positivamente. Sin markdown, sin asteriscos, máximo 3 oraciones.`

      respuesta = await callAI([
        { role: 'system', content: system },
        ...historial.slice(-8),
        { role: 'user', content: texto },
      ])
      const positivo = /gracias|compré|me anoto|perfecto|listo|pagué|sí quiero|quiero inscrib|me interesa|lo tomo|voy a tomar/i.test(texto)
      if (positivo) estado = 'VENDIDO'
    }

    else if (estado === 'VENDIDO') {
      respuesta = `¡Excelente decisión, ${name}! 🎉 Luis se pondrá en contacto contigo muy pronto para darte todos los detalles y comenzar. ¡Bienvenido a Liberty Trading Pro!`
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
