/**
 * notify-nexus.ts — Centralized notification system for Luis Riofrio.
 *
 * Primary channel: OpenClaw Gateway webhook → nexus_claw → WhatsApp
 * Fallback channel: Resend email → Luis's inbox
 *
 * Configuration (env vars):
 *   OPENCLAW_GATEWAY_URL   — OpenClaw Gateway URL (e.g. https://nexus.tailnet.ts.net)
 *   OPENCLAW_GATEWAY_TOKEN — Bearer token for the Gateway (optional)
 *   RESEND_API_KEY         — Resend API key (for email fallback)
 *   LUIS_EMAIL             — Luis's email for fallback notifications
 *   ADMIN_EMAIL            — Used as fallback if LUIS_EMAIL not set
 */

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || ''
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || ''
const LUIS_EMAIL = process.env.LUIS_EMAIL || process.env.ADMIN_EMAIL || ''
const RESEND_KEY = process.env.RESEND_API_KEY || ''

export interface NexusEvent {
  event: string
  source: 'liberty-trading-pro'
  timestamp: string
  data: Record<string, unknown>
}

// ── Email fallback via Resend ─────────────────────────────────────────────────

async function sendEmailFallback(
  event: string,
  data: Record<string, unknown>,
): Promise<void> {
  if (!RESEND_KEY) {
    console.warn('[notify-nexus] RESEND_API_KEY not configured — email fallback unavailable')
    return
  }
  if (!LUIS_EMAIL) {
    console.warn('[notify-nexus] LUIS_EMAIL not configured — cannot send email')
    return
  }

  const subject = eventLabels[event] || `Liberty Trading — ${event}`
  const body = formatEmailBody(event, data)

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Liberty Trading Pro <notificaciones@libertytrading.pro>',
        to: LUIS_EMAIL,
        subject,
        text: body,
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (res.ok) {
      console.log('[notify-nexus] Email fallback sent for event:', event)
    } else {
      const err = await res.text().catch(() => '')
      console.error('[notify-nexus] Resend error:', res.status, err.slice(0, 200))
    }
  } catch (err: any) {
    console.error('[notify-nexus] Email fallback failed:', err?.message)
  }
}

const eventLabels: Record<string, string> = {
  new_registration: '🔔 Nuevo registro — Liberty Trading',
  lead_contact: '📞 Solicitud de contacto personal',
  new_lead: '💬 Nuevo lead de WhatsApp',
  lead_cta: '🎯 Lead listo para cierre',
  lead_vendido: '✅ Lead convertido — ¡venta!',
}

function formatEmailBody(event: string, data: Record<string, unknown>): string {
  const lines = Object.entries(data)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => {
      const label = fieldLabels[k] || k
      return `${label}: ${String(v)}`
    })
  return `Evento: ${eventLabels[event] || event}\n` +
    `Fecha: ${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}\n` +
    `Fuente: Liberty Trading Pro\n\n` +
    lines.join('\n') +
    `\n\n---\nNotificación automática. Responde a este email para contactar al equipo.`
}

const fieldLabels: Record<string, string> = {
  name: 'Nombre',
  email: 'Email',
  phone: 'WhatsApp',
  plan: 'Plan',
  perfil: 'Perfil recomendado',
  perfilLabel: 'Plan',
  planInteres: 'Plan de interés',
  mensaje: 'Mensaje',
  productoUrl: 'Link de pago',
  respuestas: 'Respuestas',
  nota: 'Nota',
}

// ── Main notify function ──────────────────────────────────────────────────────

/**
 * Sends a structured event to nexus_claw via OpenClaw Gateway webhook.
 * Falls back to email via Resend if the webhook fails.
 * Fire-and-forget: never throws, logs errors silently.
 */
export async function notifyNexus(
  event: string,
  data: Record<string, unknown>,
): Promise<void> {
  const payload: NexusEvent = {
    event,
    source: 'liberty-trading-pro',
    timestamp: new Date().toISOString(),
    data,
  }

  let sent = false

  // Try OpenClaw Gateway webhook
  if (GATEWAY_URL) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (GATEWAY_TOKEN) headers['Authorization'] = `Bearer ${GATEWAY_TOKEN}`

      await fetch(`${GATEWAY_URL}/webhook/liberty-trading`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      })
      console.log('[notify-nexus] Webhook sent:', event)
      sent = true
    } catch (err: any) {
      console.error('[notify-nexus] Webhook failed, trying email fallback:', event, err?.message)
    }
  }

  // Email fallback if webhook didn't send or failed
  if (!sent) {
    await sendEmailFallback(event, data)
  }
}

// ── Typed event helpers ──────────────────────────────────────────────────────

export function notifyNewRegistration(data: {
  name: string
  email: string
  phone?: string | null
  plan: string
}) {
  return notifyNexus('new_registration', data)
}

export function notifyLeadContact(data: {
  name: string
  phone: string
  email?: string
  mensaje?: string
  planInteres: string
}) {
  return notifyNexus('lead_contact', data)
}

export function notifyNewLead(data: {
  name: string | null
  phone: string
  perfil?: string
}) {
  return notifyNexus('new_lead', data)
}

export function notifyLeadCTA(data: {
  name: string | null
  phone: string
  perfil: string
  productoUrl: string
}) {
  return notifyNexus('lead_cta', data)
}

export function notifyLeadVendido(data: {
  name: string | null
  phone: string
}) {
  return notifyNexus('lead_vendido', data)
}
