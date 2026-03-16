import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const EVO_URL      = process.env.EVOLUTION_API_URL  || 'https://evo.nexus-ia.com.es'
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE || 'vinces'
const EVO_KEY      = process.env.EVOLUTION_API_KEY  || '157B8ABC2B63-46DE-B38C-05C3C3ACAA3A'
const LUIS_PHONE   = process.env.LUIS_PHONE         || '593996691586'
const N8N_WEBHOOK         = process.env.N8N_WEBHOOK_LEADS   || ''
const N8N_WEBHOOK_LANDING = process.env.N8N_WEBHOOK_LANDING || ''

const LINKS = {
  MENSUAL: process.env.HOTMART_LINK_MENSUAL || 'https://pay.hotmart.com/R104900326X?checkoutMode=2',
  ANUAL:   process.env.HOTMART_LINK_ANUAL   || 'https://pay.hotmart.com/L104900408S?checkoutMode=2',
}

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

async function sendConfirmationEmail(name: string, email: string, plan: string) {
  const planLabel = plan === 'ANUAL' ? 'Club Anual ($649/año)' : 'Club Mensual ($79/mes)'
  const planLink  = plan === 'ANUAL' ? LINKS.ANUAL : LINKS.MENSUAL

  await resend.emails.send({
    from: 'Liberty Trading Pro <noreply@libertytrading.pro>',
    to: email,
    subject: `¡Hola ${name}! Vinces te escribe en un momento 👋`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#080808;font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <tr><td>
      <!-- Header -->
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:22px;font-weight:700;color:#C9A84C;letter-spacing:2px;font-family:Georgia,serif;">
          Liberty Trading Pro
        </div>
        <div style="font-size:11px;color:#4a4642;letter-spacing:3px;text-transform:uppercase;margin-top:4px;">
          Club de Trading · Luis Riofrío
        </div>
      </div>

      <!-- Card -->
      <div style="background:#111111;border:1px solid #1e1e1e;border-radius:16px;padding:32px;">
        <p style="font-size:20px;font-weight:600;color:#f0ece4;margin:0 0 8px 0;">
          ¡Hola, ${name}! 👋
        </p>
        <p style="font-size:14px;color:#8a8480;line-height:1.7;margin:0 0 24px 0;">
          Recibimos tu solicitud para unirte al <strong style="color:#C9A84C;">${planLabel}</strong>.<br>
          Vinces, nuestro asistente de IA, te escribirá por WhatsApp en los próximos minutos para orientarte y responder tus dudas.
        </p>

        <div style="background:#0d0d0d;border:1px solid #1e1e1e;border-radius:12px;padding:20px;margin-bottom:24px;">
          <div style="font-size:11px;color:#4a4642;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">
            Tu plan seleccionado
          </div>
          <div style="font-size:18px;font-weight:700;color:#C9A84C;font-family:Georgia,serif;">
            ${planLabel}
          </div>
          <div style="font-size:12px;color:#8a8480;margin-top:4px;">
            ${plan === 'ANUAL' ? 'Pago único · Ahorras $299 vs mensual · ~$54/mes' : 'Sin permanencia · Cancela cuando quieras'}
          </div>
        </div>

        <p style="font-size:13px;color:#8a8480;margin:0 0 20px 0;">
          Si quieres empezar ahora mismo, puedes hacerlo directamente aquí:
        </p>

        <div style="text-align:center;margin-bottom:24px;">
          <a href="${planLink}"
            style="display:inline-block;background:#C9A84C;color:#000;font-weight:700;font-size:14px;
                   padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">
            Unirme al ${plan === 'ANUAL' ? 'Club Anual' : 'Club Mensual'} →
          </a>
        </div>

        <div style="border-top:1px solid #1e1e1e;padding-top:20px;">
          <div style="font-size:11px;color:#4a4642;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">
            Todo lo que incluye tu membresía
          </div>
          ${[
            '🎓 Mentoría Integral de Mercados Financieros',
            '📈 Day Trading — Futuros NQ/MNQ Nasdaq',
            '🤝 Mentorías 1:1 con Luis cada mes',
            '🤖 Vinces IA — coaching diario 24/7',
            '💡 Reportes de oportunidades en acciones y ETFs',
            '🌐 Monitor Mundial de geopolítica y macro',
            '📊 Track record verificable de Luis',
            '👥 Comunidad privada activa',
          ].map(f => `<div style="font-size:13px;color:#8a8480;padding:4px 0;">${f}</div>`).join('')}
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align:center;margin-top:24px;">
        <p style="font-size:11px;color:#4a4642;margin:0;">
          © ${new Date().getFullYear()} Liberty Trading Pro · Ecuador 🇪🇨<br>
          Las inversiones implican riesgo. Resultados pasados no garantizan rendimientos futuros.
        </p>
      </div>
    </td></tr>
  </table>
</body>
</html>`,
  })
}

export async function POST(req: NextRequest) {
  try {
    const { name, phone, email, plan, source } = await req.json()

    if (!name || !phone) {
      return NextResponse.json({ error: 'Nombre y teléfono requeridos' }, { status: 400 })
    }

    const cleanedPhone = cleanPhone(phone)
    if (cleanedPhone.length < 8) {
      return NextResponse.json({ error: 'Teléfono inválido' }, { status: 400 })
    }

    const planNorm: 'MENSUAL' | 'ANUAL' = plan === 'ANUAL' ? 'ANUAL' : 'MENSUAL'
    const planLabel = planNorm === 'ANUAL' ? 'Club Anual ($649/año)' : 'Club Mensual ($79/mes)'

    const existing = await (prisma as any).whatsappLead.findUnique({
      where: { phone: cleanedPhone },
    })

    const yaConvertido = existing?.estado === 'VENDIDO'

    // El formulario siempre reinicia la conversación (excepto leads ya vendidos)
    await (prisma as any).whatsappLead.upsert({
      where: { phone: cleanedPhone },
      create: {
        phone: cleanedPhone,
        name: name.trim(),
        estado: 'P1',
        perfil: planNorm,
        respuestas: { planInteres: planLabel },
        historial: [],
      },
      update: {
        name: name.trim(),
        perfil: planNorm,
        updatedAt: new Date(),
        ...(yaConvertido ? {} : {
          estado: 'P1',
          respuestas: { planInteres: planLabel },
          historial: [],
        }),
      },
    })

    // 1. WA al lead — lo maneja el flujo de n8n (formulario-landing) para evitar duplicados

    // 2. Email de confirmación al lead
    if (email?.includes('@')) {
      sendConfirmationEmail(name.trim(), email.trim(), planNorm).catch((e) =>
        console.error('[Capture] Error email:', e?.message)
      )
    }

    // 3. Notificar a Luis
    const tipoLead = yaConvertido ? '♻️ Lead ya convertido (recontacto)' : existing ? '🔄 Lead conocido (nuevo intento)' : '📥 Nuevo lead'
    const msgLuis =
      `${tipoLead} — *formulario web*\n\n` +
      `👤 *Nombre:* ${name.trim()}\n` +
      `📱 *WhatsApp:* +${cleanedPhone}\n` +
      `📧 *Email:* ${email || 'no proporcionado'}\n` +
      `🎯 *Plan de interés:* ${planLabel}\n\n` +
      `_Vinces ya le escribió para iniciar la conversación._`

    sendWA(LUIS_PHONE, msgLuis).catch((e) =>
      console.error('[Capture] Error notif Luis:', e?.message)
    )

    // 4. n8n — use landing webhook when source === 'landing', else default
    const webhookUrl = source === 'landing' ? (N8N_WEBHOOK_LANDING || N8N_WEBHOOK) : N8N_WEBHOOK
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanedPhone,
          email: email?.trim() || '',
          plan: planNorm,
          planLabel,
          source: source || 'web',
          ts: new Date().toISOString(),
        }),
      }).catch((e) => console.error('[Capture] Error n8n:', e?.message))
    }

    return NextResponse.json({ ok: true, status: 'created' })
  } catch (err: any) {
    console.error('[Capture] Error:', err?.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
