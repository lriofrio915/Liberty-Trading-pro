import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ── Producto links ─────────────────────────────────────────────────────────────
const LINKS = {
  APRENDIZ: process.env.HOTMART_LINK_ACADEMIA || 'https://libertytrading.pro/academia',
  TRADER:   process.env.HOTMART_LINK_CLUB     || 'https://libertytrading.pro/club',
}

// ── Preguntas de la entrevista ─────────────────────────────────────────────────
const PREGUNTAS: Record<string, string> = {
  P1: '¿Tienes experiencia previa operando en mercados financieros (acciones, forex, futuros, cripto)? Cuéntame un poco.',
  P2: '¿Cuál es tu objetivo principal con el trading?\n\n1️⃣ Aprender desde cero\n2️⃣ Mejorar mis resultados actuales\n3️⃣ Generar ingresos consistentes\n4️⃣ Otro',
  P3: '¿Cuántas horas a la semana podrías dedicarle al trading o al aprendizaje?',
  P4: '¿Con qué capital cuentas o planeas iniciar? No te preocupes, no hay respuesta incorrecta 😊',
  P5: 'Última pregunta: ¿Qué es lo que más te frena hoy para comenzar o mejorar en el trading?',
}

// Estado → siguiente estado
const NEXT_STATE: Record<string, string> = {
  NOMBRE: 'P1',
  P1: 'P2',
  P2: 'P3',
  P3: 'P4',
  P4: 'P5',
  P5: 'CLASIFICADO',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function cleanPhone(jid: string): string {
  // Evolution API sends "5939XXXXXXXX@s.whatsapp.net" or just the number
  return jid.replace('@s.whatsapp.net', '').replace('@c.us', '').trim()
}

async function callAI(messages: { role: string; content: string }[]): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
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

// ── Clasificar perfil con AI ───────────────────────────────────────────────────

async function clasificarPerfil(name: string, respuestas: Record<string, string>): Promise<{
  perfil: 'APRENDIZ' | 'TRADER'
  mensaje: string
  productoUrl: string
}> {
  const resumen = Object.entries(respuestas)
    .map(([k, v]) => `${PREGUNTAS[k]}\nRespuesta: ${v}`)
    .join('\n\n')

  const prompt = `Eres Vinces, coach de trading de Liberty Trading Pro. Analizaste la entrevista de ${name}:

${resumen}

Basándote en sus respuestas, clasifícalo como:
- APRENDIZ: no tiene experiencia o necesita base sólida antes de operar → ofrecerle la Academia
- TRADER: ya opera o tiene experiencia suficiente → ofrecerle el Club/Pro

Responde en este JSON exacto:
{"perfil":"APRENDIZ"|"TRADER","mensaje":"[mensaje personalizado de 3-4 oraciones explicando por qué ese producto es para él, con tono cálido y motivador, terminando con el link]"}

No incluyas nada más que el JSON.`

  const raw = await callAI([{ role: 'user', content: prompt }])

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch?.[0] || '{}')
    const perfil: 'APRENDIZ' | 'TRADER' = parsed.perfil === 'TRADER' ? 'TRADER' : 'APRENDIZ'
    const url = LINKS[perfil]
    const mensaje = (parsed.mensaje || '').replace(/\[link\]/gi, url).replace(/https?:\/\/\S+/g, url)
    return { perfil, mensaje: mensaje + `\n\n🔗 ${url}`, productoUrl: url }
  } catch {
    const perfil = 'APRENDIZ'
    return {
      perfil,
      mensaje: `Basado en lo que me contaste, creo que el mejor camino para ti es nuestra Academia. 🎓\n\n🔗 ${LINKS.APRENDIZ}`,
      productoUrl: LINKS.APRENDIZ,
    }
  }
}

// ── Respuesta conversacional con AI ───────────────────────────────────────────

async function respuestaConversacional(
  name: string | null,
  historial: { role: string; content: string }[],
  ultimoMensaje: string,
  estado: string,
): Promise<string> {
  const system = `Eres Vinces, el asistente de ventas de Liberty Trading Pro. Eres cálido, empático y profesional.
Tu tarea es hacer una entrevista de calificación a posibles clientes de trading, UNA pregunta a la vez.
Si el usuario se desvía o hace preguntas generales, responde brevemente y retoma el flujo.
Nombre del prospecto: ${name || 'el usuario'}.
Estado actual de la conversación: ${estado}.
No uses asteriscos ni markdown. Escribe en texto plano para WhatsApp. Usa emojis con moderación.`

  const messages = [
    { role: 'system', content: system },
    ...historial.slice(-10),
    { role: 'user', content: ultimoMensaje },
  ]

  return callAI(messages)
}

// ── POST /api/vinces-wa ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Extraer datos del payload de Evolution API
    const { phone: rawPhone, message, pushName } = body as {
      phone: string
      message: string
      pushName?: string
    }

    if (!rawPhone || !message?.trim()) {
      return NextResponse.json({ ok: false, error: 'Missing phone or message' })
    }

    const phone = cleanPhone(rawPhone)
    const texto = message.trim()

    // Buscar o crear lead
    let lead = await (prisma as any).whatsappLead.findUnique({ where: { phone } })

    if (!lead) {
      lead = await (prisma as any).whatsappLead.create({
        data: {
          phone,
          name: pushName || null,
          estado: 'NUEVO',
          historial: [],
          respuestas: {},
        },
      })
    }

    const historial: { role: string; content: string }[] = (lead.historial as any) || []
    const respuestas: Record<string, string> = (lead.respuestas as any) || {}
    let { estado, name } = lead
    let respuesta = ''

    // ── Máquina de estados ──────────────────────────────────────────────────

    if (estado === 'NUEVO') {
      name = pushName || null
      if (name) {
        // Tenemos nombre de WA, ir directo a P1
        estado = 'P1'
        respuesta = `¡Hola ${name}! 👋 Soy *Vinces*, el asistente de Liberty Trading Pro.\n\nMe alegra que estés aquí. Voy a hacerte unas preguntas rápidas para orientarte mejor 🎯\n\n${PREGUNTAS.P1}`
      } else {
        estado = 'NOMBRE'
        respuesta = '¡Hola! 👋 Soy *Vinces*, el asistente de Liberty Trading Pro.\n\nEstoy aquí para ayudarte a encontrar el camino correcto en el mundo del trading.\n\n¿Cómo te llamas?'
      }
    }

    else if (estado === 'NOMBRE') {
      name = texto.split(' ')[0] // tomar primer nombre
      estado = 'P1'
      respuesta = `¡Mucho gusto, ${name}! 😊\n\nTe voy a hacer unas preguntas rápidas para entender qué necesitas 👇\n\n${PREGUNTAS.P1}`
    }

    else if (['P1', 'P2', 'P3', 'P4'].includes(estado)) {
      // Guardar respuesta a la pregunta actual
      respuestas[estado] = texto

      // Generar transición natural con AI
      const transicion = await respuestaConversacional(name, historial, texto, estado)
      const nextEstado = NEXT_STATE[estado]
      estado = nextEstado

      respuesta = `${transicion}\n\n${PREGUNTAS[nextEstado]}`
    }

    else if (estado === 'P5') {
      // Última pregunta respondida → clasificar
      respuestas['P5'] = texto
      estado = 'CLASIFICADO'

      respuesta = `Gracias por contarme todo esto, ${name || 'amigo'} 🙏\n\nDéjame analizar tu perfil un momento...`

      // Actualizar estado intermedio primero, luego clasificar async
      historial.push({ role: 'user', content: texto })
      historial.push({ role: 'assistant', content: respuesta })

      await (prisma as any).whatsappLead.update({
        where: { phone },
        data: {
          name,
          estado,
          respuestas,
          historial: historial.slice(-20),
          updatedAt: new Date(),
        },
      })

      // Clasificación (devolvemos la respuesta intermedia ahora; la oferta se enviará en el siguiente webhook)
      const clasificacion = await clasificarPerfil(name || 'Trader', respuestas)

      await (prisma as any).whatsappLead.update({
        where: { phone },
        data: {
          estado: 'CTA',
          perfil: clasificacion.perfil,
          productoUrl: clasificacion.productoUrl,
          historial: [
            ...historial,
            { role: 'assistant', content: clasificacion.mensaje },
          ].slice(-20),
          updatedAt: new Date(),
        },
      })

      // Devolver ambos mensajes para que n8n los envíe en secuencia
      return NextResponse.json({
        ok: true,
        messages: [respuesta, clasificacion.mensaje],
      })
    }

    else if (estado === 'CTA') {
      // El usuario respondió después de recibir la oferta
      const respAI = await respuestaConversacional(name, historial, texto, 'CTA')
      respuesta = respAI

      // Si dice algo positivo, mantener en CTA; si compró, marcar VENDIDO
      const positivo = /gracias|compré|me anoto|perfecto|listo|pagué|sí quiero/i.test(texto)
      if (positivo) estado = 'VENDIDO'
    }

    else if (estado === 'VENDIDO') {
      respuesta = `¡Felicidades ${name || ''}! 🎉 Ya eres parte de Liberty Trading Pro. En breve recibirás acceso. Cualquier duda estoy aquí 🚀`
    }

    // Actualizar historial y estado
    historial.push({ role: 'user', content: texto })
    historial.push({ role: 'assistant', content: respuesta })

    await (prisma as any).whatsappLead.update({
      where: { phone },
      data: {
        name,
        estado,
        respuestas,
        historial: historial.slice(-20),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ ok: true, messages: [respuesta] })
  } catch (err: any) {
    console.error('Vinces WA error:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
