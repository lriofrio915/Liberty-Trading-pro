import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const EVO_URL      = process.env.EVOLUTION_API_URL  || 'https://evo.nexus-ia.com.es'
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE || 'vinces'
const EVO_KEY      = process.env.EVOLUTION_API_KEY  || '157B8ABC2B63-46DE-B38C-05C3C3ACAA3A'

// Horas de espera entre follow-ups
const FOLLOWUP_DELAYS_H = [6, 24, 72] // horas tras el CTA

// Mensajes para cada etapa
function getFollowupMessage(
  followupIndex: number,
  name: string | null,
  perfil: string | null,
  productoUrl: string | null
): string {
  const n = name ? `, ${name}` : ''
  const link = productoUrl || ''
  const esIntegral = perfil === 'INTEGRAL'

  const msgs = [
    // Follow-up 1 — 6h: check suave
    `Hola${n} 👋 Solo quería asegurarme de que pudiste ver la información que te compartí.\n\n¿Te surgió alguna duda sobre el programa? Con gusto te la aclaro 😊`,

    // Follow-up 2 — 24h: beneficio + urgencia leve
    esIntegral
      ? `${n ? `${name}, h` : 'H'}ola de nuevo 😊 Quería contarte que muchas personas en la Mentoría Integral empezaron exactamente desde donde tú estás ahora — sin experiencia previa — y hoy ya tienen su portafolio diversificado funcionando.\n\nEl ritmo es 100% adaptado a ti y al tiempo que tengas disponible 🙌\n\nSi quieres dar el paso, aquí tienes el acceso:\n${link}`
      : `${n ? `${name}, h` : 'H'}ola de nuevo 😊 Solo quería recordarte que la Maestría en Futuros tiene cupos muy limitados porque las clases son 1 a 1 con Luis.\n\nSi estás considerando unirte, es mejor asegurar tu lugar pronto para no quedarte sin espacio 🎯\n\nAquí tienes el enlace de inscripción:\n${link}`,

    // Follow-up 3 — 72h: último llamado
    `${n ? `${name}, e` : 'E'}ste será mi último mensaje${n} 🤝\n\nEntiendo que la decisión requiere pensarlo bien y eso está perfecto. Si en algún momento decides avanzar, aquí estaré con gusto.\n\nY si tienes alguna duda o quieres hablar directamente con Luis, puedes escribirle a: +593996691586\n\n¡Mucho éxito en lo que sea que decidas! 💪`,
  ]

  return msgs[followupIndex] || ''
}

async function sendWA(phone: string, text: string) {
  const res = await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
    method: 'POST',
    headers: { apikey: EVO_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ number: phone, text }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`EVO ${res.status}: ${txt.slice(0, 200)}`)
  }
}

export async function GET(req: NextRequest) {
  // Verificar que la llamada viene de Vercel Cron
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const results: { phone: string; followup: number; ok: boolean; error?: string }[] = []

  // Buscar leads en estado CTA con follow-ups pendientes (máximo 3)
  const leads = await (prisma as any).whatsappLead.findMany({
    where: { estado: 'CTA', followups: { lt: 3 } },
  })

  for (const lead of leads) {
    const followupIndex = lead.followups // 0, 1 o 2
    const delaySinceUpdate = FOLLOWUP_DELAYS_H[followupIndex] * 60 * 60 * 1000 // ms

    // Referencia de tiempo: lastFollowup si existe, si no updatedAt (cuando llegó a CTA)
    const refTime = lead.lastFollowup ?? lead.updatedAt
    const elapsed = now.getTime() - new Date(refTime).getTime()

    if (elapsed < delaySinceUpdate) continue // aún no es hora

    const msg = getFollowupMessage(followupIndex, lead.name, lead.perfil, lead.productoUrl)
    if (!msg) continue

    try {
      await sendWA(lead.phone, msg)
      await (prisma as any).whatsappLead.update({
        where: { id: lead.id },
        data: {
          followups: followupIndex + 1,
          lastFollowup: now,
          updatedAt: now,
        },
      })
      results.push({ phone: lead.phone, followup: followupIndex + 1, ok: true })
      console.log(`[Cron followup] Enviado follow-up ${followupIndex + 1} a ${lead.phone}`)
    } catch (e: any) {
      results.push({ phone: lead.phone, followup: followupIndex + 1, ok: false, error: e.message })
      console.error(`[Cron followup] Error en ${lead.phone}:`, e.message)
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results })
}
