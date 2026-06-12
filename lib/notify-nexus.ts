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
  morning_news: '📰 Noticias Matutinas 6:30am Ecuador',
  futuros_sesgo: '📊 Sesgo Futuros 8:15am Ecuador',
  sesgo_intraday: '📊 Sesgo Intradía — Monitor de Mercado',
  acciones_daily_scanner: '📈 Daily Scanner Acciones',
  morning_agents_intraday: '⚡ Picks Intraday 9am Ecuador',
  market_scan_morning: '📊 Market Scan 8:35am Ecuador',
  scan_prices_close: '📉 Cierre de Día — Resumen de Señales',
  futuros_open: '📍 Entradas Futuros 9:30am ET',
  futuros_close: '🏁 Cierre Futuros 3:45pm ET',
  monitor_signals: '🔍 Monitor Señales TP/SL',
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

      const res = await fetch(`${GATEWAY_URL}/webhook/liberty-trading`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      })
      if (res.ok) {
        console.log('[notify-nexus] Webhook sent:', event)
        sent = true
      } else {
        const body = await res.text().catch(() => '')
        console.error('[notify-nexus] Webhook rejected:', res.status, body.slice(0, 200))
      }
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
    timeZone: 'America/Guayaquil',
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

export function notifyFuturosSesgo(
  activos: ActivoSesgo[],
  saved: number,
  savedLevels: { simbolo: string; sesgo: string; precioEntrada: number; stopLoss: number; takeProfit: number; rrRatio: number }[] = [],
) {
  const fecha = new Date().toLocaleDateString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'America/Guayaquil',
  })
  const horaEcuador = new Date().toLocaleTimeString('es-EC', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Guayaquil',
  })

  const sesgoBadge = (s: string) => s === 'COMPRA' ? '✅' : s === 'VENTA' ? '🔴' : '⚪'
  const levelsMap = new Map(savedLevels.map(l => [l.simbolo.toUpperCase(), l]))

  const lineas = activos.map(a => {
    if (a.simbolo === 'VIX') {
      const dir = a.cambio24h >= 0 ? '+' : ''
      return `📈 *VIX:* $${a.precio.toFixed(2)} (${dir}${a.cambio24h.toFixed(2)}%) — ${a.sesgo === 'COMPRA' ? 'miedo' : 'complacencia'}`
    }
    const badge = sesgoBadge(a.sesgo)
    const precio = `$${a.precio.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
    return `${badge} *${a.simbolo}:* ${a.sesgo} (${a.confianza}%) — ${precio} | ${a.razon}`
  })

  const resumen = [
    `📊 *Sesgo Futuros ${horaEcuador} Ecuador — ${fecha}*`,
    '',
    ...lineas,
    '',
    saved > 0
      ? `✅ ${saved} señal(es) guardada(s). Entrada se confirma a las 9:30am ET.`
      : 'Sin señales direccionales hoy.',
  ].join('\n')

  return notifyNexus('futuros_sesgo', { resumen, saved })
}

// ── Sesgo Intradía (monitor c/30min 8:30am–3pm Ecuador) ──────────────────────

export function notifySesgoIntraday(
  activos: ActivoSesgo[],
  changed: Set<string> = new Set(),
  morningBias: Map<string, string> = new Map(),
) {
  const fecha = new Date().toLocaleDateString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'America/Guayaquil',
  })
  const horaEcuador = new Date().toLocaleTimeString('es-EC', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Guayaquil',
  })

  const sesgoBadge = (s: string) => s === 'COMPRA' ? '✅' : s === 'VENTA' ? '🔴' : '⚪'

  const lineas = activos.map(a => {
    if (a.simbolo === 'VIX') {
      const dir = a.cambio24h >= 0 ? '+' : ''
      return `📈 *VIX:* $${a.precio.toFixed(2)} (${dir}${a.cambio24h.toFixed(2)}%) — ${a.sesgo === 'COMPRA' ? 'miedo' : 'complacencia'}`
    }
    const sym = a.simbolo.toUpperCase()
    const isChanged = changed.has(sym)
    const badge = isChanged ? '⚡' : sesgoBadge(a.sesgo)
    const prev = morningBias.get(sym)
    const sesgoPart = isChanged && prev
      ? `${prev} → ${a.sesgo} (${a.confianza}%)`
      : `${a.sesgo} (${a.confianza}%)`
    return `${badge} *${a.simbolo}:* ${sesgoPart} — ${a.razon}`
  })

  const resumen = [
    `📊 *Sesgo Intradía ${horaEcuador} Ecuador — ${fecha}*`,
    '',
    ...lineas,
    '',
    '_Próxima actualización en 30 min_',
  ].join('\n')

  return notifyNexus('sesgo_intraday', { resumen })
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
  const horaEcuador = new Date().toLocaleTimeString('es-EC', {
    hour: '2-digit', minute: '2-digit',
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
    `📊 *Market Scan ${horaEcuador} Ecuador — ${fecha}*`,
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

// ── Scan Prices — Cierre de Día ──────────────────────────────────────────────

interface ScanPricesOportunidad {
  simbolo: string
  sesgo: string
  confianza: number
  precio9am: number
  rendimiento12pm: number | null
  rendimientoFlip: number | null
  horaSesgoFlip: string | null
  rendimiento3pm: number | null
}

export function notifyScanPricesClose(oportunidades: ScanPricesOportunidad[]) {
  const fecha = new Date().toLocaleDateString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'America/Guayaquil',
  })

  const pctFmt = (v: number | null) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` : '—'
  const badge = (v: number | null) => v == null ? '⚪' : v >= 0 ? '✅' : '🔴'

  const lineas = oportunidades.map(o => {
    const flip = o.horaSesgoFlip ? ` | flip ${o.horaSesgoFlip}: ${pctFmt(o.rendimientoFlip)}` : ''
    return `${badge(o.rendimiento3pm)} ${o.simbolo} (${o.sesgo} ${o.confianza}%): 12pm ${pctFmt(o.rendimiento12pm)} | 3pm ${pctFmt(o.rendimiento3pm)}${flip}`
  })

  const ganadas  = oportunidades.filter(o => (o.rendimiento3pm ?? 0) > 0).length
  const perdidas = oportunidades.filter(o => (o.rendimiento3pm ?? 0) < 0).length
  const flips    = oportunidades.filter(o => o.horaSesgoFlip != null).length

  const resumen = [
    `📉 *Cierre de Día — ${fecha}*`,
    '',
    ...lineas,
    '',
    `✅ Ganadoras: ${ganadas} | 🔴 Perdedoras: ${perdidas} | Flips: ${flips}`,
  ].join('\n')

  return notifyNexus('scan_prices_close', { resumen, ganadas, perdidas, flips, total: oportunidades.length })
}

// ── Futuros Open — Entrada 9:30am ET ─────────────────────────────────────────

export function notifyFuturosOpen(updated: number) {
  const fecha = new Date().toLocaleDateString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'America/Guayaquil',
  })

  const resumen = [
    `📍 *Entradas Futuros 9:30am ET — ${fecha}*`,
    '',
    updated > 0
      ? `${updated} señal(es) registrada(s) con precio de entrada, SL y TP desde vela de apertura.`
      : 'Sin señales de futuros para registrar hoy.',
  ].join('\n')

  return notifyNexus('futuros_open', { resumen, updated })
}

// ── Futuros Close — Auditoría 3:45pm ET ─────────────────────────────────────

export function notifyFuturosClose(results: { id: string; resultado: string; pnlUsd: number }[]) {
  const fecha = new Date().toLocaleDateString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'America/Guayaquil',
  })

  const ganadas  = results.filter(r => r.resultado === 'GANADA').length
  const perdidas = results.filter(r => r.resultado === 'PERDIDA').length
  const pnlTotal = results.reduce((acc, r) => acc + r.pnlUsd, 0)

  const resumen = [
    `🏁 *Cierre Futuros 3:45pm ET — ${fecha}*`,
    '',
    results.length > 0
      ? [
          `Auditadas: ${results.length} señal(es)`,
          `✅ Ganadas: ${ganadas} | 🔴 Perdidas: ${perdidas}`,
          `PnL Total: $${pnlTotal.toFixed(2)}`,
        ].join('\n')
      : 'Sin señales de futuros para cerrar hoy.',
  ].join('\n')

  return notifyNexus('futuros_close', {
    resumen,
    ganadas,
    perdidas,
    pnlTotal: parseFloat(pnlTotal.toFixed(2)),
    total: results.length,
  })
}

// ── Morning News 6:30am ───────────────────────────────────────────────────────

type MorningNewsRegion = 'asia' | 'europa' | 'eeuu'

export function notifyMorningNews(articles: {
  title: string
  description: string
  source: string
  link?: string
  region?: MorningNewsRegion
}[]) {
  const fecha = new Date().toLocaleDateString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'America/Guayaquil',
  })

  const regionConfig: Record<MorningNewsRegion, { emoji: string; label: string; sub?: string }> = {
    asia:   { emoji: '🌏', label: 'ASIA',   sub: '_(mientras dormías)_' },
    europa: { emoji: '🌍', label: 'EUROPA',  sub: undefined },
    eeuu:   { emoji: '🌎', label: 'EEUU & AMÉRICAS', sub: undefined },
  }

  const grouped: Record<MorningNewsRegion, typeof articles> = { asia: [], europa: [], eeuu: [] }
  for (const a of articles) {
    const r = (a.region ?? 'eeuu') as MorningNewsRegion
    grouped[r].push(a)
  }

  const sections: string[] = []
  for (const region of (['asia', 'europa', 'eeuu'] as MorningNewsRegion[])) {
    const items = grouped[region]
    if (items.length === 0) continue
    const { emoji, label, sub } = regionConfig[region]
    const header = sub ? `${emoji} *${label}* ${sub}` : `${emoji} *${label}*`
    const lines: string[] = [header, '']
    for (const a of items) {
      lines.push(`🔹 *${a.title}*`)
      lines.push(`_${a.source}_ — ${a.description}`)
      if (a.link) lines.push(a.link)
      lines.push('')
    }
    sections.push(lines.join('\n'))
  }

  const resumen = [
    `📰 *Noticias Matutinas — ${fecha}*`,
    '',
    ...sections,
    `━━━`,
    `📊 _${articles.length} noticias | Liberty Trading Club_`,
  ].join('\n')

  return notifyNexus('morning_news', { resumen, count: articles.length })
}

// ── Monitor Signals — TP/SL en tiempo real ───────────────────────────────────

export function notifyMonitorSignals(checked: number, closed: number) {
  const hora = new Date().toLocaleTimeString('es-EC', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Guayaquil',
  })

  const resumen = [
    `🔍 *Monitor Señales ${hora} Ecuador — Cierre automático*`,
    '',
    `${closed} señal(es) cerrada(s) por TP/SL de ${checked} revisadas.`,
  ].join('\n')

  return notifyNexus('monitor_signals', { resumen, checked, closed })
}
