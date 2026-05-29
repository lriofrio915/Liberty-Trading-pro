/**
 * notify-nexus.ts — Centralized notification system for Luis Riofrio.
 *
 * Primary channel: OpenClaw Gateway webhook → nexus_claw → WhatsApp
 * Fallback channel: Resend email → Luis's inbox
 * Direct channel:  Evolution API sendWA (used when gateway not configured)
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
        from: 'Liberty Trading Club <notificaciones@libertytrading.pro>',
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
  futuros_sesgo: '📊 Sesgo Futuros 8:15am Ecuador',
  acciones_daily_scanner: '📈 Daily Scanner Acciones',
  morning_agents_intraday: '⚡ Picks Intraday 9am Ecuador',
  market_scan_morning: '📊 Market Scan 8:05am Ecuador',
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
    `Fuente: Liberty Trading Club\n\n` +
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

// ── Futuros sesgo ─────────────────────────────────────────────────────────────

interface ActivoSesgo {
  simbolo: string
  nombre: string
  precio: number
  cambio24h: number
  sesgo: string
  confianza: number
  razon: string
  riesgo: string
}

// ── Acciones Daily Scanner ────────────────────────────────────────────────────

interface DailyScanSignal {
  stock_code?: string
  symbol?: string
  operation_advice?: string
  sentiment_score?: number
  summary?: string
}

function signalEmoji(advice?: string): string {
  const up = (advice ?? '').toUpperCase()
  if (up.includes('买入') || up.includes('BUY') || up.includes('COMPRAR') || up.includes('ALCISTA') || up.includes('BULLISH')) return '✅'
  if (up.includes('卖出') || up.includes('SELL') || up.includes('VENDER') || up.includes('BAJISTA') || up.includes('BEARISH')) return '🔴'
  if (up.includes('减持') || up.includes('REDUCE')) return '🟠'
  if (up.includes('增持') || up.includes('ACCUMULATE')) return '🟢'
  return '⚪'
}

export function notifyAccionesDailyScanner(signals: DailyScanSignal[], tickers: string[], isAuto: boolean) {
  const fecha = new Date().toLocaleDateString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long',
    timeZone: 'America/New_York',
  })

  const lineas = signals.map(s => {
    const ticker = (s.stock_code ?? s.symbol ?? '').toUpperCase()
    const emoji = signalEmoji(s.operation_advice)
    const score = s.sentiment_score != null ? ` (${s.sentiment_score}%)` : ''
    return `${emoji} ${ticker}${score}`
  })

  const resumen = [
    `📈 *Daily Scanner Acciones — ${fecha}*`,
    isAuto ? '_(Escaneo automático)_' : '_(Escaneo manual)_',
    '',
    ...lineas,
    '',
    `Total: ${signals.length} acciones escaneadas`,
  ].join('\n')

  return notifyNexus('acciones_daily_scanner', { resumen, count: signals.length, isAuto })
}

// ── Morning Agents 9am ───────────────────────────────────────────────────────

export interface MorningAgentResult {
  agent: string
  picks: { ticker: string; direction: string; precioEntrada: number }[]
}

const AGENT_EMOJI: Record<string, string> = {
  Peter: '🏛',
  SmallCap: '📦',
  Intraday: '⚡',
}

export function notifyMorningAgents(results: MorningAgentResult[]) {
  const fecha = new Date().toLocaleDateString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long',
    timeZone: 'America/Guayaquil',
  })

  const dirEmoji = (d: string) => d === 'COMPRA' ? '✅' : '🔴'

  const sections = results
    .filter(r => r.picks.length > 0)
    .map(r => {
      const emoji = AGENT_EMOJI[r.agent] ?? '🤖'
      const lines = r.picks.map(p =>
        `${dirEmoji(p.direction)} ${p.ticker}: ${p.direction} @ $${p.precioEntrada.toFixed(2)}`
      )
      return [`${emoji} *Agente ${r.agent}* (${r.picks.length})`, ...lines].join('\n')
    })

  const total = results.reduce((sum, r) => sum + r.picks.length, 0)

  const resumen = [
    `⚡ *Agentes 9am — ${fecha}*`,
    '_(Análisis automático)_',
    '',
    ...(sections.length ? sections : ['Sin picks hoy — mercado sin señales.']),
    '',
    total > 0 ? `Total: ${total} pick(s) guardados. Apertura: 9:30am ET.` : '',
  ].join('\n')

  return notifyNexus('morning_agents_intraday', { resumen, total })
}

// ── Futuros sesgo ─────────────────────────────────────────────────────────────

export function notifyFuturosSesgo(activos: ActivoSesgo[], saved: number) {
  const fecha = new Date().toLocaleDateString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'America/Guayaquil',
  })

  const sesgoBadge = (s: string) => s === 'COMPRA' ? '✅' : s === 'VENTA' ? '🔴' : '⚪'

  const lineas = activos.map(a => {
    if (a.simbolo === 'VIX') {
      const dir = a.cambio24h >= 0 ? '+' : ''
      return `📈 VIX: $${a.precio.toFixed(2)} (${dir}${a.cambio24h.toFixed(2)}%)`
    }
    return `${sesgoBadge(a.sesgo)} ${a.simbolo}: ${a.sesgo} (${a.confianza}%) — ${a.razon}`
  })

  const resumen = [
    `📊 *Sesgo Futuros 8:15am Ecuador — ${fecha}*`,
    '',
    ...lineas,
    '',
    saved > 0
      ? `Señales guardadas: ${saved}. Entrada se confirma a las 9:30am ET.`
      : 'Sin señales direccionales hoy.',
  ].join('\n')

  return notifyNexus('futuros_sesgo', { resumen, saved })
}

// ── Market Scan 8:05am ───────────────────────────────────────────────────────

interface MarketScanOportunidad {
  simbolo: string
  nombre: string
  sesgo: string
  confianza: number
  precio9am: number
  razon: string | null
  sector?: string | null
}

export function notifyMarketScan(data: {
  oportunidades: MarketScanOportunidad[]
  sesgogeneral: string
  autoSaved: number
}) {
  const fecha = new Date().toLocaleDateString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'America/Guayaquil',
  })

  const sesgoBadge = (s: string) => s === 'COMPRA' ? '✅' : s === 'VENTA' ? '🔴' : '⚪'

  const top = [...data.oportunidades]
    .sort((a, b) => b.confianza - a.confianza)
    .slice(0, 10)

  const lineas = top.map(o =>
    `${sesgoBadge(o.sesgo)} ${o.simbolo}: ${o.sesgo} (${o.confianza}%) — ${o.razon ?? ''}`
  )

  const resumen = [
    `📊 *Market Scan 8:05am Ecuador — ${fecha}*`,
    `Sesgo general: ${data.sesgogeneral}`,
    '',
    ...(lineas.length ? lineas : ['Sin oportunidades destacadas hoy.']),
    '',
    `Total oportunidades: ${data.oportunidades.length}`,
    data.autoSaved > 0
      ? `Señales guardadas (≥80%): ${data.autoSaved} — visibles en dashboard.`
      : 'Sin señales de alta confianza guardadas.',
  ].join('\n')

  return notifyNexus('market_scan_morning', { resumen, total: data.oportunidades.length, autoSaved: data.autoSaved })
}
