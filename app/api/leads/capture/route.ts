import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { notifyNexus } from '@/lib/notify-nexus'
import { wa } from '@/lib/brand'

const resend = new Resend(process.env.RESEND_API_KEY)

const LINKS = {
  QUANT: process.env.NEXT_PUBLIC_HOTMART_LINK_QUANT || '',
}

function cleanPhone(phone: string): string {
  return phone.replace(/[\s\-\+\(\)]/g, '')
}

async function sendConfirmationEmail(name: string, email: string, plan: string) {
  const isGratis = plan === 'GRATIS'
  const planLabel = isGratis ? 'Curso gratuito Liberty' : 'Liberty Quant Club ($1,500, pago único)'
  const planLink  = LINKS.QUANT

  await resend.emails.send({
    from: 'Liberty Trading Club <noreply@libertytrading.pro>',
    to: email,
    subject: `¡Hola ${name}! Te escribimos en un momento 👋`,
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
          Liberty Trading Club
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
          Luis revisa cada registro personalmente — si quieres hablar ya mismo, escríbele directo por WhatsApp.
        </p>
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${wa(`Hola Luis, me registré en ${planLabel} y tengo algunas preguntas`)}"
            style="display:inline-block;background:transparent;color:#C9A84C;font-weight:600;font-size:13px;
                   padding:10px 24px;border:1px solid #C9A84C;border-radius:8px;text-decoration:none;">
            Escribirle a Luis por WhatsApp →
          </a>
        </div>

        <div style="background:#0d0d0d;border:1px solid #1e1e1e;border-radius:12px;padding:20px;margin-bottom:24px;">
          <div style="font-size:11px;color:#4a4642;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">
            Tu plan seleccionado
          </div>
          <div style="font-size:18px;font-weight:700;color:#C9A84C;font-family:Georgia,serif;">
            ${planLabel}
          </div>
          <div style="font-size:12px;color:#8a8480;margin-top:4px;">
            Sin permanencia · Cancela cuando quieras
          </div>
        </div>

        ${isGratis ? `
        <p style="font-size:13px;color:#8a8480;margin:0 0 20px 0;">
          Tu curso gratuito ya está disponible dentro de tu panel:
        </p>
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://libertytrading.pro'}/dashboard/academia"
            style="display:inline-block;background:#C9A84C;color:#000;font-weight:700;font-size:14px;
                   padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">
            Ver el curso gratuito →
          </a>
        </div>
        ` : `
        <p style="font-size:13px;color:#8a8480;margin:0 0 20px 0;">
          Si quieres empezar ahora mismo, puedes hacerlo directamente aquí:
        </p>
        ${planLink ? `
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${planLink}"
            style="display:inline-block;background:#C9A84C;color:#000;font-weight:700;font-size:14px;
                   padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">
            Unirme a Liberty Quant →
          </a>
        </div>
        ` : ''}
        `}

        <div style="border-top:1px solid #1e1e1e;padding-top:20px;">
          <div style="font-size:11px;color:#4a4642;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">
            ${isGratis ? 'Lo que aprenderás en el curso gratuito' : 'Todo lo que incluye Liberty Quant Club'}
          </div>
          ${(isGratis ? [
            '🏦 Abrir y fondear tu cuenta en Interactive Brokers',
            '📊 Analizar acciones con ayuda de Claude',
            '📈 Entender opciones y leer la cadena de opciones',
            '🎬 La historia de Luis: de profesor a operador financiero',
          ] : [
            '🎬 Video clases: infraestructura con Claude Code + tu app de track record',
            '🧠 Estrategias desde cero con Claude Code + NinjaTrader 8 + Obsidian',
            '💻 Portafolio comunitario: 6 bots listos para instalar',
            '🏦 Pase directo a cuenta fondeada de $200k en PJ Capital (valor $300)',
            '📊 Track record verificable de Luis',
            '👥 Comunidad Liberty Quant — el portafolio sigue creciendo',
          ]).map(f => `<div style="font-size:13px;color:#8a8480;padding:4px 0;">${f}</div>`).join('')}
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align:center;margin-top:24px;">
        <p style="font-size:11px;color:#4a4642;margin:0;">
          © ${new Date().getFullYear()} Liberty Trading Club · Ecuador 🇪🇨<br>
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
    const { name, phone, email, plan } = await req.json()

    if (!name || !phone) {
      return NextResponse.json({ error: 'Nombre y teléfono requeridos' }, { status: 400 })
    }

    const cleanedPhone = cleanPhone(phone)
    if (cleanedPhone.length < 8) {
      return NextResponse.json({ error: 'Teléfono inválido' }, { status: 400 })
    }

    const planNorm: 'QUANT' | 'GRATIS' = plan === 'GRATIS' ? 'GRATIS' : 'QUANT'
    const planLabel = planNorm === 'GRATIS' ? 'Curso gratuito' : 'Liberty Quant Club ($1,500)'

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

    const tipoLead = yaConvertido ? '♻️ Lead ya convertido (recontacto)' : existing ? '🔄 Lead conocido (nuevo intento)' : '📥 Nuevo lead'

    // Ejecutar todas las llamadas externas en paralelo con await antes de responder.
    // En Vercel serverless el contexto se cierra al hacer return — fire-and-forget no garantiza ejecución.
    // Promise.allSettled asegura que todos completen (o fallen) antes de devolver la respuesta.
    // Nadie le escribe al lead automáticamente — Luis atiende cada registro personalmente.
    await Promise.allSettled([
      // 1. Email de confirmación
      email?.includes('@')
        ? sendConfirmationEmail(name.trim(), email.trim(), planNorm)
        : Promise.resolve(),

      // 2. Notificar a Luis (nexus_claw → WhatsApp, con fallback a email)
      notifyNexus('new_lead', {
        name: name.trim(),
        phone: cleanedPhone,
        email: email || undefined,
        planInteres: planLabel,
        nota: `${tipoLead} — formulario web`,
      }),
    ])

    return NextResponse.json({ ok: true, status: 'created' })
  } catch (err: any) {
    console.error('[Capture] Error:', err?.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
