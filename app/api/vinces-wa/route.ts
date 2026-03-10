import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ── Config ────────────────────────────────────────────────────────────────────
const LINKS = {
  APRENDIZ: process.env.HOTMART_LINK_ACADEMIA || 'https://hotm.io/NLcSS1',
  TRADER:   process.env.HOTMART_LINK_CLUB     || 'https://hotm.io/HhAyjc',
}

const EVO_URL      = process.env.EVOLUTION_API_URL      || 'https://evo.nexus-ia.com.es'
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE      || 'vinces'
const EVO_KEY      = process.env.EVOLUTION_API_KEY       || '157B8ABC2B63-46DE-B38C-05C3C3ACAA3A'

// ── Preguntas ─────────────────────────────────────────────────────────────────
const PREGUNTAS: Record<string, string> = {
  P1: '¿Tienes experiencia previa operando en mercados financieros (acciones, forex, futuros, cripto)? Cuéntame un poco.',
  P2: '¿Cuál es tu objetivo principal con el trading?\n\n1️⃣ Aprender desde cero\n2️⃣ Mejorar mis resultados actuales\n3️⃣ Generar ingresos consistentes\n4️⃣ Otro',
  P3: '¿Cuántas horas a la semana podrías dedicarle al trading o al aprendizaje?',
  P4: '¿Con qué capital cuentas o planeas iniciar? No te preocupes, no hay respuesta incorrecta 😊',
  P5: 'Última pregunta: ¿Qué es lo que más te frena hoy para comenzar o mejorar en el trading?',
}

const NEXT_STATE: Record<string, string> = {
  NOMBRE: 'P1', P1: 'P2', P2: 'P3', P3: 'P4', P4: 'P5', P5: 'CLASIFICADO',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function cleanPhone(jid: string): string {
  return jid.replace('@s.whatsapp.net', '').replace('@c.us', '').trim()
}

/** Toma solo el primer nombre — "Luis Riofrío" → "Luis" */
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
    // 1. Descargar audio vía Evolution API
    const dlRes = await fetch(
      `${EVO_URL}/chat/getBase64FromMediaMessage/${EVO_INSTANCE}`,
      {
        method: 'POST',
        headers: { apikey: EVO_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: rawMessage }),
        signal: AbortSignal.timeout(15000),
      }
    )

    if (!dlRes.ok) {
      const txt = await dlRes.text()
      console.error(`[Vinces WA] Evolution getBase64 error ${dlRes.status}:`, txt.slice(0, 300))
      return ''
    }

    const dlData = await dlRes.json()
    // Evolution API puede devolver el base64 en distintos campos según versión
    const base64: string = dlData.base64 || dlData.data || dlData.result || ''

    if (!base64) {
      console.error('[Vinces WA] Evolution no devolvió base64:', JSON.stringify(dlData).slice(0, 300))
      return ''
    }

    // 2. Construir multipart manualmente (evita bugs de Blob/FormData en Node.js)
    const audioBuffer = Buffer.from(base64, 'base64')
    const boundary = `----WA${Date.now()}`
    const CRLF = '\r\n'

    const body = Buffer.concat([
      Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="file"; filename="audio.ogg"${CRLF}Content-Type: audio/ogg${CRLF}${CRLF}`),
      audioBuffer,
      Buffer.from(`${CRLF}--${boundary}${CRLF}Content-Disposition: form-data; name="model"${CRLF}${CRLF}whisper-large-v3`),
      Buffer.from(`${CRLF}--${boundary}${CRLF}Content-Disposition: form-data; name="language"${CRLF}${CRLF}es`),
      Buffer.from(`${CRLF}--${boundary}--${CRLF}`),
    ])

    const transcRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body,
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
      temperature: 0.75,
    }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ── Clasificar perfil ─────────────────────────────────────────────────────────

async function clasificarPerfil(name: string, respuestas: Record<string, string>) {
  const resumen = Object.entries(respuestas)
    .map(([k, v]) => `${PREGUNTAS[k]}\nRespuesta: ${v}`)
    .join('\n\n')

  const prompt = `Eres Vinces, coach de Liberty Trading Pro. Analizaste la entrevista de ${name}:

${resumen}

Clasifica:
- APRENDIZ: poca experiencia, quiere aprender desde cero → Mentoría Integral
- TRADER: ya opera o tiene base, quiere especializarse → Especialización en Futuros

Responde SOLO este JSON:
{"perfil":"APRENDIZ","mensaje":"texto"}

Reglas del mensaje: 3 oraciones personalizadas según sus respuestas, cálidas, sin links, sin formato, termina invitando a revisar.`

  const raw = await callAI([{ role: 'user', content: prompt }])

  try {
    const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || '{}')
    const perfil: 'APRENDIZ' | 'TRADER' = parsed.perfil === 'TRADER' ? 'TRADER' : 'APRENDIZ'
    const url = LINKS[perfil]
    const producto = perfil === 'TRADER' ? 'Especialización en Futuros' : 'Mentoría Integral'
    const mensajeLimpio = (parsed.mensaje || '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .trim()
    return { perfil, mensaje: `${mensajeLimpio}\n\n👉 ${producto}:\n${url}`, productoUrl: url }
  } catch {
    return {
      perfil: 'APRENDIZ' as const,
      mensaje: `Basado en lo que me contaste, creo que el mejor camino es nuestra Mentoría Integral. 🎓\n\n👉 Mentoría Integral:\n${LINKS.APRENDIZ}`,
      productoUrl: LINKS.APRENDIZ,
    }
  }
}

// ── Transición conversacional ─────────────────────────────────────────────────

async function respuestaConversacional(
  name: string | null,
  historial: { role: string; content: string }[],
  ultimoMensaje: string,
) {
  const system = `Eres Vinces, asistente de Liberty Trading Pro. Hablas por WhatsApp con ${name || 'un prospecto'}.

REGLAS ESTRICTAS:
1. NUNCA escribas pensamientos internos, notas ni metadatos. Nada de "Interno:", "Nota:", corchetes ni paréntesis aclaratorios.
2. Tu respuesta es SOLO lo que el cliente verá. Nada más.
3. Escribe SOLO 2 oraciones cortas de empatía o reconocimiento. Cálido, humano, natural.
4. NO hagas preguntas. El sistema agrega la siguiente pregunta automáticamente.
5. NO uses asteriscos, guiones ni markdown de ningún tipo.
6. Usa máximo 1 emoji.`

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

    // ── Transcribir audio si es nota de voz ──────────────────────────────────
    if (isAudio && rawMessage) {
      const transcripcion = await transcribirAudio(rawMessage)
      // Si la transcripción falló (empieza con [), responder amigablemente sin avanzar estado
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
    // Siempre usar solo el primer nombre, aunque el DB tenga nombre completo
    let name: string | null = primerNombre(lead.name)
    let respuesta = ''

    // ── Máquina de estados ───────────────────────────────────────────────────

    if (estado === 'NUEVO') {
      name = primerNombre(pushName)
      if (name) {
        estado = 'P1'
        respuesta = `¡Hola ${name}! 👋 Soy Vinces, el asistente de Liberty Trading Pro.\n\nMe alegra que estés aquí. Voy a hacerte unas preguntas rápidas para orientarte mejor 🎯\n\n${PREGUNTAS.P1}`
      } else {
        estado = 'NOMBRE'
        respuesta = '¡Hola! 👋 Soy Vinces, el asistente de Liberty Trading Pro.\n\nEstoy aquí para ayudarte a encontrar tu camino en el trading.\n\n¿Cómo te llamas?'
      }
    }

    else if (estado === 'NOMBRE') {
      name = primerNombre(texto)
      estado = 'P1'
      respuesta = `¡Mucho gusto, ${name}! 😊\n\nTe voy a hacer unas preguntas rápidas para entender qué necesitas 👇\n\n${PREGUNTAS.P1}`
    }

    else if (['P1', 'P2', 'P3', 'P4'].includes(estado)) {
      respuestas[estado] = texto
      const transicion = await respuestaConversacional(name, historial, texto)
      const nextEstado = NEXT_STATE[estado]
      estado = nextEstado
      respuesta = `${transicion}\n\n${PREGUNTAS[nextEstado]}`
    }

    else if (estado === 'P5') {
      respuestas['P5'] = texto
      estado = 'CLASIFICADO'
      respuesta = `Gracias por contarme todo esto, ${name} 🙏\n\nDéjame analizar tu perfil un momento...`

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

      return NextResponse.json({ ok: true, messages: [respuesta, clasificacion.mensaje] })
    }

    else if (estado === 'CTA') {
      const respAI = await respuestaConversacional(name, historial, texto)
      respuesta = respAI
      const positivo = /gracias|compré|me anoto|perfecto|listo|pagué|sí quiero|inscrib/i.test(texto)
      if (positivo) estado = 'VENDIDO'
    }

    else if (estado === 'VENDIDO') {
      respuesta = `¡Felicidades ${name}! 🎉 Ya eres parte de Liberty Trading Pro. En breve recibirás tu acceso. Cualquier duda estoy aquí.`
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
