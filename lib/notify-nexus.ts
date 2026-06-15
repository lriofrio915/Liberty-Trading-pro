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

// ── Sesgo Intradía (monitor c/30min 8:15am–3pm Ecuador) ──────────────────────

type Recomendacion = 'MANTENER' | 'AJUSTAR_STOP' | 'CERRAR'

export function notifySesgoIntraday(
  activos: ActivoSesgo[],
  changed: Set<string> = new Set(),
  morningBias: Map<string, string> = new Map(),
  prevMap: Map<string, { sesgo: string; confianza: number }> = new Map(),
  recomendaciones: Map<string, Recomendacion> = new Map(),
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
  const isPreApertura = prevMap.size === 0

  const lineas = activos.map(a => {
    if (a.simbolo === 'VIX') {
      const dir = a.cambio24h >= 0 ? '+' : ''
      return `📉 *VIX:* $${a.precio.toFixed(2)} (${dir}${a.cambio24h.toFixed(2)}%) — ${a.sesgo === 'COMPRA' ? 'miedo' : 'complacencia'}`
    }
    const sym = a.simbolo.toUpperCase()
    const isChanged = changed.has(sym)
    const badge = isChanged ? '⚡' : sesgoBadge(a.sesgo)
    const mornPrev = morningBias.get(sym)
    const intradayPrev = prevMap.get(sym)
    const sesgoPart = isChanged && mornPrev
      ? `${mornPrev} → ${a.sesgo} (${a.confianza}%)`
      : `${a.sesgo} (${a.confianza}%)`
    const delta = intradayPrev ? a.confianza - intradayPrev.confianza : 0
    const deltaPart = !isPreApertura && Math.abs(delta) >= 3
      ? ` ${delta > 0 ? '▲' : '▼'}${Math.abs(delta)}pts`
      : ''
    return `${badge} *${a.simbolo}:* ${sesgoPart}${deltaPart} — ${a.razon}`
  })

  const recoBadge = (r: Recomendacion) =>
    r === 'MANTENER' ? '✅' : r === 'AJUSTAR_STOP' ? '⚠️' : '🚨'
  const recoLabel = (r: Recomendacion) =>
    r === 'MANTENER' ? 'MANTENER' : r === 'AJUSTAR_STOP' ? 'AJUSTAR STOP' : 'CERRAR POSICIÓN'
  const recoExtra = (sym: string, a: ActivoSesgo, r: Recomendacion) => {
    if (r === 'CERRAR') return ' (sesgo invertido desde apertura)'
    const p = prevMap.get(sym)
    if (r === 'AJUSTAR_STOP' && p && p.sesgo !== a.sesgo) return ' (cambio de dirección)'
    if (r === 'AJUSTAR_STOP') return ' (confianza bajando)'
    return ''
  }

  const recoLineas = activos
    .filter(a => a.simbolo !== 'VIX')
    .map(a => {
      const sym = a.simbolo.toUpperCase()
      const r = recomendaciones.get(sym) ?? 'MANTENER'
      const posicion = morningBias.get(sym) ?? a.sesgo
      return `• ${a.simbolo} ${posicion} → ${recoBadge(r)} ${recoLabel(r)}${recoExtra(sym, a, r)}`
    })

  // PRE-APERTURA decision block (8:15am only)
  const buildAperturaDecision = () => {
    const equity = activos.filter(a => a.simbolo !== 'VIX')
    const vix = activos.find(a => a.simbolo === 'VIX')
    const confAlta = { COMPRA: 0, VENTA: 0 }
    const total    = { COMPRA: 0, VENTA: 0 }
    for (const a of equity) {
      if (a.sesgo === 'COMPRA' || a.sesgo === 'VENTA') {
        total[a.sesgo]++
        if (a.confianza >= 75) confAlta[a.sesgo]++
      }
    }
    const dom: 'COMPRA' | 'VENTA' = confAlta.COMPRA >= confAlta.VENTA ? 'COMPRA' : 'VENTA'
    const n = confAlta[dom]
    const vixOK = vix
      ? (dom === 'COMPRA' && vix.sesgo === 'VENTA') || (dom === 'VENTA' && vix.sesgo === 'COMPRA')
      : true
    const vixWarn = !vixOK ? ' ⚠️ VIX en contra' : ''
    if (n >= 3) {
      const badge = dom === 'COMPRA' ? '🟢' : '🔴'
      return [
        '',
        '━━━━━━━━━━━━━━━',
        `${badge} *ABRIR POSICIÓN ${dom}*`,
        `${n}/4 índices con confianza ≥75%${vixWarn}`,
        '_Confirma en vela de apertura 9:30am ET_',
      ]
    }
    if (n === 2) {
      return [
        '',
        '━━━━━━━━━━━━━━━',
        `🟡 *ESPERAR CONFIRMACIÓN (sesgo ${dom})*`,
        `Solo ${n}/4 índices ≥75% — espera primera vela${vixWarn}`,
        '_Confirma en vela de apertura 9:30am ET_',
      ]
    }
    return [
      '',
      '━━━━━━━━━━━━━━━',
      '⛔ *NO OPERAR HOY*',
      'Sesgo sin convicción — riesgo alto de chop',
    ]
  }

  const footerSection = isPreApertura
    ? buildAperturaDecision()
    : [
        '',
        '━━━━━━━━━━━━━━━',
        '🔔 *Recomendación para tu posición:*',
        ...recoLineas,
        '',
        '_Próxima actualización en 30 min_',
      ]

  const resumen = [
    `📊 *Sesgo Intradía ${horaEcuador} Ecuador — ${fecha}*`,
    '',
    ...lineas,
    ...footerSection,
  ].join('\n')

  return notifyNexus('sesgo_intraday', { resumen })
}

// ── Acciones Sesgo Intradía (monitor c/30min 8:30am–3pm Ecuador) ─────────────

export function notifyAccionesSesgo(
  activos: ActivoSesgo[],
  changed: Set<string> = new Set(),
  morningBias: Map<string, string> = new Map(),
  prevMap: Map<string, { sesgo: string; confianza: number }> = new Map(),
  recomendaciones: Map<string, Recomendacion> = new Map(),
  isPreApertura = false,
) {
  const fecha = new Date().toLocaleDateString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'America/Guayaquil',
  })
  const horaEcuador = new Date().toLocaleTimeString('es-EC', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Guayaquil',
  })

  const fmtActivo = (a: ActivoSesgo) => {
    const sym = a.simbolo.toUpperCase()
    const intradayPrev = prevMap.get(sym)
    const delta = intradayPrev ? a.confianza - intradayPrev.confianza : 0
    const deltaPart = !isPreApertura && Math.abs(delta) >= 5
      ? ` ${delta > 0 ? '▲' : '▼'}${Math.abs(delta)}pts`
      : ''
    const changedMark = changed.has(sym) ? ' ⚡' : ''
    return `  • ${a.simbolo} ${a.confianza}%${deltaPart}${changedMark} — ${a.razon}`
  }

  const compra = activos
    .filter(a => a.sesgo === 'COMPRA' && a.confianza >= 65)
    .sort((a, b) => b.confianza - a.confianza)
    .slice(0, 5)

  const venta = activos
    .filter(a => a.sesgo === 'VENTA' && a.confianza >= 65)
    .sort((a, b) => b.confianza - a.confianza)
    .slice(0, 5)

  const neutralCount = activos.filter(a => a.sesgo === 'NEUTRAL' || a.confianza < 65).length

  const lineas: string[] = [
    `📈 *Acciones MAIA ${horaEcuador} Ecuador — ${fecha}*`,
    '',
  ]

  if (compra.length === 0 && venta.length === 0) {
    lineas.push('⚪ Sin señales claras — mercado en rango o consolidación')
  } else {
    if (compra.length > 0) {
      lineas.push('🟢 *COMPRA* (confianza ≥65%)')
      lineas.push(...compra.map(fmtActivo))
    }
    if (venta.length > 0) {
      if (compra.length > 0) lineas.push('')
      lineas.push('🔴 *VENTA* (confianza ≥65%)')
      lineas.push(...venta.map(fmtActivo))
    }
  }

  if (neutralCount > 0) {
    lineas.push('')
    lineas.push(`⚪ _${neutralCount} acciones en NEUTRAL o sin convicción_`)
  }

  if (!isPreApertura && changed.size > 0) {
    lineas.push('')
    lineas.push(`⚡ *Cambios de sesgo:* ${[...changed].join(', ')}`)
  }

  lineas.push('')
  lineas.push('━━━━━━━━━━━━━━━')

  if (isPreApertura) {
    if (compra.length >= 3) {
      lineas.push(`🟢 *APERTURA ALCISTA* — ${compra.length} acciones con COMPRA ≥65%`)
      lineas.push('_Busca entradas largas en la primera vela_')
    } else if (venta.length >= 3) {
      lineas.push(`🔴 *APERTURA BAJISTA* — ${venta.length} acciones con VENTA ≥65%`)
      lineas.push('_Busca entradas cortas en la primera vela_')
    } else {
      lineas.push('🟡 *APERTURA MIXTA* — sesgo dividido')
      lineas.push('_Espera confirmación antes de entrar_')
    }
  } else {
    if (recomendaciones.size > 0) {
      const cerrar = [...recomendaciones.entries()].filter(([, r]) => r === 'CERRAR').map(([s]) => s)
      const ajustar = [...recomendaciones.entries()].filter(([, r]) => r === 'AJUSTAR_STOP').map(([s]) => s)
      if (cerrar.length > 0) lineas.push(`🚨 *CERRAR posición:* ${cerrar.join(', ')}`)
      if (ajustar.length > 0) lineas.push(`⚠️ *AJUSTAR stop:* ${ajustar.join(', ')}`)
    }
    lineas.push('')
    lineas.push('_Próxima actualización en 30 min_')
  }

  const resumen = lineas.join('\n')
  return notifyNexus('acciones_sesgo', { resumen })
}

// ── Divisas Sesgo Intradía (monitor c/30min vía maia-intraday) ───────────────

export function notifyDivisasSesgo(
  activos: ActivoSesgo[],
  changed: Set<string> = new Set(),
  morningBias: Map<string, string> = new Map(),
  prevMap: Map<string, { sesgo: string; confianza: number }> = new Map(),
  recomendaciones: Map<string, Recomendacion> = new Map(),
  isPreApertura = false,
) {
  const fecha = new Date().toLocaleDateString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'America/Guayaquil',
  })
  const horaEcuador = new Date().toLocaleTimeString('es-EC', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Guayaquil',
  })

  const dxy  = activos.find(a => a.simbolo === 'DXY')
  const pairs = activos.filter(a => a.simbolo !== 'DXY')

  const fmtActivo = (a: ActivoSesgo) => {
    const sym = a.simbolo.toUpperCase()
    const intradayPrev = prevMap.get(sym)
    const delta = intradayPrev ? a.confianza - intradayPrev.confianza : 0
    const deltaPart = !isPreApertura && Math.abs(delta) >= 5
      ? ` ${delta > 0 ? '▲' : '▼'}${Math.abs(delta)}pts`
      : ''
    const changedMark = changed.has(sym) ? ' ⚡' : ''
    return `  • ${a.simbolo} ${a.confianza}%${deltaPart}${changedMark} — ${a.razon}`
  }

  const compra = pairs
    .filter(a => a.sesgo === 'COMPRA' && a.confianza >= 65)
    .sort((a, b) => b.confianza - a.confianza)
    .slice(0, 4)

  const venta = pairs
    .filter(a => a.sesgo === 'VENTA' && a.confianza >= 65)
    .sort((a, b) => b.confianza - a.confianza)
    .slice(0, 4)

  const neutralCount = pairs.filter(a => a.sesgo === 'NEUTRAL' || a.confianza < 65).length

  const lineas: string[] = [
    `💱 *Divisas MAIA ${horaEcuador} Ecuador — ${fecha}*`,
    '',
  ]

  if (dxy) {
    const dir = dxy.cambio24h >= 0 ? '+' : ''
    const usdDir = dxy.sesgo === 'COMPRA' ? '💪 USD FUERTE' : dxy.sesgo === 'VENTA' ? '📉 USD DÉBIL' : '〰️ USD NEUTRAL'
    lineas.push(`📊 *DXY:* $${dxy.precio.toFixed(2)} (${dir}${dxy.cambio24h.toFixed(2)}%) — ${usdDir} ${dxy.confianza}%`)
    lineas.push('')
  }

  if (compra.length === 0 && venta.length === 0) {
    lineas.push('⚪ Sin señales claras — divisas en rango')
  } else {
    if (compra.length > 0) {
      lineas.push('🟢 *COMPRA*')
      lineas.push(...compra.map(fmtActivo))
    }
    if (venta.length > 0) {
      if (compra.length > 0) lineas.push('')
      lineas.push('🔴 *VENTA*')
      lineas.push(...venta.map(fmtActivo))
    }
  }

  if (neutralCount > 0) {
    lineas.push('')
    lineas.push(`⚪ _${neutralCount} pares en NEUTRAL o sin convicción_`)
  }

  if (!isPreApertura && changed.size > 0) {
    lineas.push('')
    lineas.push(`⚡ *Cambios de sesgo:* ${[...changed].join(', ')}`)
  }

  lineas.push('')
  lineas.push('━━━━━━━━━━━━━━━')

  if (isPreApertura) {
    if (compra.length >= 3) {
      lineas.push(`🟢 *SESGO APERTURA: COMPRA* — ${compra.length} pares ≥65%`)
    } else if (venta.length >= 3) {
      lineas.push(`🔴 *SESGO APERTURA: VENTA* — ${venta.length} pares ≥65%`)
    } else {
      lineas.push('🟡 *SESGO APERTURA: MIXTO* — sin dirección dominante')
    }
  } else {
    const cerrar  = [...recomendaciones.entries()].filter(([, r]) => r === 'CERRAR').map(([s]) => s)
    const ajustar = [...recomendaciones.entries()].filter(([, r]) => r === 'AJUSTAR_STOP').map(([s]) => s)
    if (cerrar.length > 0)  lineas.push(`🚨 *CERRAR:* ${cerrar.join(', ')}`)
    if (ajustar.length > 0) lineas.push(`⚠️ *AJUSTAR stop:* ${ajustar.join(', ')}`)
    lineas.push('')
    lineas.push('_Próxima actualización en 30 min_')
  }

  const resumen = lineas.join('\n')
  return notifyNexus('divisas_sesgo', { resumen })
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
