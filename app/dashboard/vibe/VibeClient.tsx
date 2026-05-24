'use client'

import { useEffect, useRef, useState } from 'react'

type PresetVar = {
  name: string
  description?: string
  required?: boolean
}

type Preset = {
  id?: string
  name?: string
  preset?: string
  title?: string
  description?: string
  variables?: PresetVar[]
}

type Mode = 'chat' | 'swarm'

type ChatLine = {
  id: string
  role: 'user' | 'agent' | 'system'
  text: string
}

type RunState = 'idle' | 'sending' | 'thinking' | 'done' | 'error'

type RemoteMessage = {
  message_id: string
  role: 'user' | 'assistant'
  content: string
  created_at?: string
  metadata?: { run_id?: string; status?: string } | null
}

/** Builds a JSON template from preset variable definitions — empty values so user fills them in */
function buildVarsTemplate(preset: Preset): string {
  if (!preset.variables?.length) return '{}'
  const obj: Record<string, string> = {}
  for (const v of preset.variables) {
    obj[v.name] = ''
  }
  return JSON.stringify(obj, null, 2)
}

const SUGGESTED = [
  'Diseña una estrategia de cruce EMA 9/21 sobre SPY 1H con stop ATR.',
  'Backtest momentum top-10 small-caps US últimos 12 meses, rebalanceo mensual.',
  'Analiza AAPL: tendencia, soporte/resistencia y un setup intradía.',
  'Genera indicador Pine Script: VWAP + bandas de desviación estándar.',
]

/** Descripciones en español para los presets SWARM */
const PRESET_DESC_ES: Record<string, string> = {
  commodity_research_team:      'Análisis paralelo de oferta/demanda, macro y técnico; estratega sintetiza visión integral de materias primas.',
  macro_strategy_forum:         'Perspectivas global, doméstica y de política convergen en asignación cross-asset por horizonte definido.',
  geopolitical_war_room:        'Sala de crisis: impacto geopolítico en mercados, rutas de escape y oportunidades por región y clase de activo.',
  crypto_research_lab:          'Análisis on-chain, DeFi y sentimiento en paralelo; estratega entrega recomendación de posicionamiento crypto.',
  crypto_trading_desk:          'Señales técnicas y de flujo para trading activo en crypto; incluye niveles de entrada, stop y objetivo.',
  social_alpha_team:            'Señales de redes sociales, flujo institucional y sentimiento retail; detecta alpha antes de que se refleje en precio.',
  event_driven_task_force:      'Análisis de catalizadores corporativos (earnings, M&A, regulación) y su impacto en el precio objetivo.',
  technical_analysis_panel:     'Cinco escuelas de análisis técnico en paralelo (Clásico, Ichimoku, Elliott, Armónico, SMC) con resonancia consolidada.',
  credit_research_team:         'Análisis tridimensional de calidad crediticia, entorno de tasas y sector; estratega entrega visión completa de renta fija.',
  equity_research_team:         'Investigación de renta variable: fundamental, técnico y catalizadores sectoriales consolidados.',
  investment_committee:         'Comité de inversiones: debate de tesis, consenso y allocación final con gestión de riesgo explícita.',
  risk_committee:               'Evaluación de riesgos macro, de mercado y de portafolio; escenarios de estrés y planes de contingencia.',
  sector_rotation_team:         'Señales de rotación sectorial basadas en ciclo económico, flujos y momentum relativo.',
  factor_research_committee:    'Investigación de factores quant (valor, momentum, calidad, baja volatilidad); validación estadística rigurosa.',
  fundamental_research_team:    'Análisis fundamental profundo: estados financieros, ventaja competitiva, valoración intrínseca.',
  global_allocation_committee:  'Asignación global multi-activo: acciones, bonos, commodities y FX con gestión de riesgo integrada.',
  global_equities_desk:         'Renta variable global: análisis regional, sectorial y de stock-picking con visión top-down y bottom-up.',
  macro_rates_fx_desk:          'Mesa integrada de macro, tasas de interés y divisas; perspectiva cross-market para carry y cobertura.',
  ml_quant_lab:                 'Ingeniería de features y diseño de modelos ML en paralelo; backtest estricto fuera de muestra.',
  quant_strategy_desk:          'Desarrollo de estrategias cuantitativas sistemáticas con análisis de capacidad y drawdown esperado.',
  portfolio_review_board:       'Revisión completa de portafolio: atribución de rendimiento, riesgo concentrado y rebalanceo óptimo.',
  pairs_research_lab:           'Investigación de pares estadísticos: cointegración, spreads y estrategias market-neutral.',
  statistical_arbitrage_desk:   'Arbitraje estadístico: mean-reversion, z-score y gestión de riesgo en estrategias de baja correlación.',
  sentiment_intelligence_team:  'Inteligencia de sentimiento multi-fuente: opciones, encuestas, flows y posicionamiento institucional.',
  derivatives_strategy_desk:    'Estrategias con derivados: volatilidad implícita, griegas, spreads y cobertura de portafolio.',
  etf_allocation_desk:          'Asignación táctica con ETFs: exposición eficiente a factores, sectores y geografías con costo mínimo.',
  convertible_bond_team:        'Análisis de bonos convertibles: valor del bono, prima de conversión y perfil riesgo/retorno híbrido.',
  earnings_research_desk:       'Investigación pre-earnings: estimados vs consenso, posicionamiento de opciones y reacción histórica al precio.',
  fund_selection_panel:         'Selección de fondos: análisis de alfa, consistencia, costos y adecuación al perfil de riesgo.',
}

/** Nombres en español para los presets SWARM */
const PRESET_ES: Record<string, string> = {
  commodity_research_team:      'Equipo de Materias Primas',
  macro_strategy_forum:         'Foro de Estrategia Macro',
  geopolitical_war_room:        'Sala de Crisis Geopolítica',
  crypto_research_lab:          'Laboratorio Crypto',
  crypto_trading_desk:          'Mesa de Trading Crypto',
  social_alpha_team:            'Equipo de Alpha Social',
  event_driven_task_force:      'Fuerza de Tarea Event-Driven',
  technical_analysis_panel:     'Panel de Análisis Técnico',
  credit_research_team:         'Equipo de Crédito',
  equity_research_team:         'Equipo de Renta Variable',
  investment_committee:         'Comité de Inversiones',
  risk_committee:               'Comité de Riesgo',
  sector_rotation_team:         'Equipo de Rotación Sectorial',
  factor_research_committee:    'Comité de Factores Quant',
  fundamental_research_team:    'Equipo de Análisis Fundamental',
  global_allocation_committee:  'Comité de Asignación Global',
  global_equities_desk:         'Mesa de Renta Variable Global',
  macro_rates_fx_desk:          'Mesa Macro / Tasas / FX',
  ml_quant_lab:                 'Laboratorio ML Quant',
  quant_strategy_desk:          'Mesa de Estrategia Cuantitativa',
  portfolio_review_board:       'Junta de Revisión de Portafolio',
  pairs_research_lab:           'Laboratorio de Pares',
  statistical_arbitrage_desk:   'Mesa de Arbitraje Estadístico',
  sentiment_intelligence_team:  'Equipo de Inteligencia de Sentimiento',
  derivatives_strategy_desk:    'Mesa de Derivados',
  etf_allocation_desk:          'Mesa de Asignación ETF',
  convertible_bond_team:        'Equipo de Bonos Convertibles',
  earnings_research_desk:       'Mesa de Earnings',
  fund_selection_panel:         'Panel de Selección de Fondos',
}

const POLL_INTERVAL_MS = 1500
const POLL_TIMEOUT_MS = 480_000  // 8 min para tareas complejas
const WARN_LONG_MS    = 120_000  // aviso visual al llegar a 2 min
const STORAGE_LINES   = 'vibe:chat:lines'
const STORAGE_SESSION = 'vibe:chat:session'

export default function VibeClient({ isAdmin }: { isAdmin: boolean }) {
  const [mode, setMode] = useState<Mode>('chat')
  const [presets, setPresets] = useState<Preset[]>([])
  const [presetsErr, setPresetsErr] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [vars, setVars] = useState<string>('{\n  "ticker": "AAPL"\n}')

  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(STORAGE_SESSION)
  })
  const [input, setInput] = useState<string>('')
  const [lines, setLines] = useState<ChatLine[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(STORAGE_LINES)
      return raw ? (JSON.parse(raw) as ChatLine[]) : []
    } catch { return [] }
  })
  const [runState, setRunState] = useState<RunState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const lastSeenIdsRef = useRef<Set<string>>(new Set())
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollDeadlineRef = useRef<number>(0)
  const isSendingRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const keepaliveRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const thinkStartRef = useRef<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [video, setVideo] = useState<{ youtubeUrl: string; title: string | null }>({ youtubeUrl: '', title: null })
  const [showGuide, setShowGuide] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editUrl, setEditUrl] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/trading/vibe/swarm')
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: unknown) => {
        const arr = Array.isArray(data)
          ? data
          : (data as { presets?: unknown[] })?.presets ?? []
        const presetList = arr as Preset[]
        setPresets(presetList)
        setPresetsErr(null)
        // Auto-select first preset and populate vars template
        if (presetList.length > 0) {
          const first = presetList[0]
          const firstId = (first.id ?? first.preset ?? first.name ?? '') as string
          setSelectedPreset(firstId)
          setVars(buildVarsTemplate(first))
        }
      })
      .catch(err => {
        setPresetsErr(err?.message ?? 'No se pudo conectar a Vibe-Trading')
      })
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/section-video?section=quant')
        if (res.ok) { const d = await res.json(); if (d.youtubeUrl) setVideo(d) }
      } catch {}
    })()
  }, [])

  // Cargar historial desde DB al montar. Tiene precedencia sobre localStorage.
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/trading/vibe/history')
        if (!res.ok) return
        const data: { id: string; role: string; text: string }[] = await res.json()
        if (data.length > 0) {
          const dbLines = data.map(m => ({
            id: m.id,
            role: m.role as ChatLine['role'],
            text: m.text,
          }))
          setLines(dbLines)
          try { localStorage.setItem(STORAGE_LINES, JSON.stringify(dbLines.slice(-200))) } catch {}
        }
      } catch {}
    })()
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [lines.length, runState])

  useEffect(() => () => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
    if (keepaliveRef.current) clearInterval(keepaliveRef.current)
    if (elapsedRef.current) clearInterval(elapsedRef.current)
  }, [])

  // Keepalive: hace un GET silencioso cada 45s para prevenir expiración de sesión
  useEffect(() => {
    if ((runState === 'done' || runState === 'thinking') && sessionId) {
      keepaliveRef.current = setInterval(async () => {
        try {
          await fetch(
            `/api/trading/vibe/sessions/${encodeURIComponent(sessionId)}/messages`,
            { cache: 'no-store' },
          )
        } catch { /* silencioso */ }
      }, 45_000)
    }
    return () => {
      if (keepaliveRef.current) { clearInterval(keepaliveRef.current); keepaliveRef.current = null }
    }
  }, [runState, sessionId])

  // Contador de tiempo transcurrido mientras el agente piensa
  useEffect(() => {
    if (runState === 'thinking') {
      thinkStartRef.current = Date.now()
      setElapsedSeconds(0)
      elapsedRef.current = setInterval(() => {
        if (thinkStartRef.current) {
          setElapsedSeconds(Math.floor((Date.now() - thinkStartRef.current) / 1000))
        }
      }, 1000)
    } else {
      if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null }
      if (runState !== 'done') { thinkStartRef.current = null; setElapsedSeconds(0) }
    }
    return () => {
      if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null }
    }
  }, [runState])

  // Persistir historial de chat en localStorage (máx 200 líneas)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LINES, JSON.stringify(lines.slice(-200)))
    } catch { /* localStorage lleno o bloqueado */ }
  }, [lines])

  // Persistir sessionId en localStorage
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(STORAGE_SESSION, sessionId)
    } else {
      localStorage.removeItem(STORAGE_SESSION)
    }
  }, [sessionId])

  function appendLine(role: ChatLine['role'], text: string) {
    setLines(prev => [...prev, { id: crypto.randomUUID(), role, text }])
  }

  function saveMessage(role: 'user' | 'agent', text: string) {
    fetch('/api/trading/vibe/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, text }),
    }).catch(() => {})
  }

  async function createFreshSession(): Promise<string | null> {
    try {
      const res = await fetch('/api/trading/vibe/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setErrorMsg(j.error ?? `HTTP ${res.status}`)
        return null
      }
      const data = await res.json()
      const id = data.session_id ?? data.id ?? data.session?.id
      if (!id) {
        setErrorMsg('Respuesta sin session_id')
        return null
      }
      setSessionId(id)
      lastSeenIdsRef.current = new Set()
      return id as string
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo crear sesión')
      return null
    }
  }

  async function ensureSession(): Promise<string | null> {
    if (sessionId) return sessionId
    return createFreshSession()
  }

  function pollMessages(sid: string, deadline: number) {
    pollDeadlineRef.current = deadline
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current)

    const tick = async () => {
      if (Date.now() > pollDeadlineRef.current) {
        setRunState('error')
        setErrorMsg('El agente superó el tiempo máximo de espera. Intenta de nuevo.')
        return
      }

      try {
        const res = await fetch(
          `/api/trading/vibe/sessions/${encodeURIComponent(sid)}/messages`,
          { cache: 'no-store' },
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: RemoteMessage[] = await res.json()
        const seen = lastSeenIdsRef.current

        let gotAssistant = false
        for (const m of data) {
          if (seen.has(m.message_id)) continue
          seen.add(m.message_id)
          if (m.role === 'assistant') {
            const status = m.metadata?.status
            if (status && status !== 'completed' && status !== 'success') {
              appendLine('system', `· ${status}`)
            } else {
              const agentText = m.content || '(respuesta vacía)'
              appendLine('agent', agentText)
              saveMessage('agent', agentText)
              gotAssistant = true
            }
          }
        }

        if (gotAssistant) {
          setRunState('done')
          return
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : ''
        if (msg.includes('404')) {
          // Sesión expiró mientras el agente procesaba — reset graceful
          appendLine('system', '· Sesión expirada — la respuesta se perdió. Puedes reenviar tu mensaje.')
          setRunState('done')
          return
        }
        setRunState('error')
        setErrorMsg(msg || 'Polling falló')
        return
      }

      pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS)
    }

    pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS)
  }

  async function sendChat() {
    if (isSendingRef.current) return  // guard síncrono para evitar envíos duplicados
    isSendingRef.current = true
    try {
      setErrorMsg(null)
      const text = input.trim()
      if (!text || runState === 'sending' || runState === 'thinking') return

      // Feedback visual inmediato — el usuario ve su mensaje y el botón cargando
      // antes de que se cree la sesión (que puede tardar 1-2s en el primer mensaje)
      appendLine('user', text)
      saveMessage('user', text)
      setInput('')
      setRunState('sending')

      let sid = await ensureSession()
      if (!sid) { setRunState('error'); return }

      // Instrucción de idioma que acompaña cada mensaje para que el agente responda en español
      const LANG_INSTRUCTION = 'INSTRUCCIÓN PERMANENTE: Responde SIEMPRE en español (castellano). Todos los análisis, explicaciones, recomendaciones y código comentado deben estar en español.\n\n'

      // Construir contexto de los últimos mensajes para recuperación si la sesión expira
      const historyStr = lines.slice(-10).length > 0
        ? lines.slice(-10)
            .map(l => `[${l.role === 'user' ? 'USUARIO' : l.role === 'agent' ? 'AGENTE' : 'SISTEMA'}]: ${l.text}`)
            .join('\n')
            .slice(0, 2800)
        : ''
      const contextStr = LANG_INSTRUCTION + historyStr

      try {
        const res = await fetch(
          `/api/trading/vibe/sessions/${encodeURIComponent(sid)}/messages`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text, context: contextStr }),
          },
        )

        if (!res.ok) {
          if (res.status === 404) {
            // Recovery del server falló — resetear sesión pero PRESERVAR historial.
            // newConversation() borraría el historial; aquí solo limpiamos la sesión.
            appendLine('system', '· Sesión no disponible. Intenta enviar el mensaje de nuevo.')
            setSessionId(null)
            localStorage.removeItem(STORAGE_SESSION)
            lastSeenIdsRef.current = new Set()
            setRunState('error')
            return
          }
          const j = await res.json().catch(() => ({}))
          setErrorMsg(
            res.status >= 500
              ? 'El agente no está disponible temporalmente. Intenta de nuevo en unos segundos.'
              : (j.error ?? `HTTP ${res.status}`),
          )
          setRunState('error')
          return
        }

        // El server renueva la sesión de forma transparente cuando expira (404 upstream)
        const newSid = res.headers.get('X-New-Session-Id')
        if (newSid) {
          setSessionId(newSid)
          sid = newSid
          lastSeenIdsRef.current = new Set()
          appendLine('system', contextStr
            ? '· Sesión renovada — contexto anterior inyectado, el agente puede continuar'
            : '· Sesión renovada — el agente continuará sin contexto previo'
          )
        }

        // El POST devuelve {message_id, attempt_id} — registro el message_id del usuario para no repintarlo.
        const data = await res.json()
        if (data.message_id) lastSeenIdsRef.current.add(data.message_id)
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Error enviando')
        setRunState('error')
        return
      }

      setRunState('thinking')
      pollMessages(sid, Date.now() + POLL_TIMEOUT_MS)
    } finally {
      isSendingRef.current = false
    }
  }

  function pollSwarmRun(runId: string) {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
    const deadline = Date.now() + POLL_TIMEOUT_MS

    const tick = async () => {
      if (Date.now() > deadline) {
        setRunState('error')
        setErrorMsg('SWARM superó el tiempo máximo de espera.')
        return
      }
      try {
        const res = await fetch(
          `/api/trading/vibe/swarm/runs/${encodeURIComponent(runId)}`,
          { cache: 'no-store' },
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const status: string = data.status ?? ''

        // Show task progress as system messages while running
        if ((status === 'running' || status === 'pending') && Array.isArray(data.tasks)) {
          const total: number = data.tasks.length
          const done: number = (data.tasks as { status: string }[]).filter(t => t.status === 'completed').length
          if (total > 0) {
            // Update elapsed display only — no extra messages to avoid spam
          }
        }

        if (status === 'completed') {
          const rawReport: string = data.final_report ?? '(sin reporte)'
          appendLine('system', '· Traduciendo reporte al español…')
          try {
            const tr = await fetch('/api/trading/vibe/swarm/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: rawReport }),
            })
            const trData = tr.ok ? await tr.json() : null
            const report: string = trData?.translated ?? rawReport
            appendLine('agent', report)
            saveMessage('agent', report)
          } catch {
            appendLine('agent', rawReport)
            saveMessage('agent', rawReport)
          }
          setRunState('done')
          return
        }
        if (status === 'failed' || status === 'cancelled') {
          setErrorMsg(`SWARM finalizado con estado: ${status}`)
          setRunState('error')
          return
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Polling SWARM falló')
        setRunState('error')
        return
      }
      pollTimerRef.current = setTimeout(tick, 5000)
    }

    pollTimerRef.current = setTimeout(tick, 3000)
  }

  async function runSwarm() {
    setErrorMsg(null)
    if (!selectedPreset) {
      setErrorMsg('Selecciona un preset de swarm')
      return
    }
    let parsedVars: unknown = {}
    if (vars.trim()) {
      try { parsedVars = JSON.parse(vars) }
      catch { setErrorMsg('JSON de variables inválido'); return }
    }

    appendLine('user', `▶ swarm: ${selectedPreset}\n${vars}`)
    setRunState('sending')

    const res = await fetch('/api/trading/vibe/swarm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset_name: selectedPreset, user_vars: parsedVars }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setErrorMsg(j.error ?? `HTTP ${res.status}`)
      setRunState('error')
      return
    }
    const data = await res.json()
    const runId: string = data.id ?? ''
    if (!runId) {
      setErrorMsg('SWARM no devolvió ID de run')
      setRunState('error')
      return
    }
    appendLine('system', `swarm iniciado · run: ${runId} · agentes procesando…`)
    setRunState('thinking')
    pollSwarmRun(runId)
  }

  function newConversation() {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
    if (keepaliveRef.current) { clearInterval(keepaliveRef.current); keepaliveRef.current = null }
    if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null }
    thinkStartRef.current = null
    setElapsedSeconds(0)
    localStorage.removeItem(STORAGE_LINES)
    localStorage.removeItem(STORAGE_SESSION)
    setSessionId(null)
    lastSeenIdsRef.current = new Set()
    setLines([])
    setErrorMsg(null)
    setRunState('idle')
    // Borrar historial de DB al limpiar chat
    fetch('/api/trading/vibe/history', { method: 'DELETE' }).catch(() => {})
  }

  const busy = runState === 'sending' || runState === 'thinking'

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black mb-1">
            Laboratorio <span className="gradient-gold">Quant</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Laboratorio de estrategias algorítmicas · Backtesting · Indicadores para MT5 y NinjaTrader 8
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('chat')}
            className={`px-4 py-2 text-xs font-mono tracking-widest rounded-lg border ${
              mode === 'chat'
                ? 'bg-[var(--gold)] text-black border-[var(--gold)]'
                : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)]'
            }`}
          >CHAT</button>
          <button
            onClick={() => setMode('swarm')}
            className={`px-4 py-2 text-xs font-mono tracking-widest rounded-lg border ${
              mode === 'swarm'
                ? 'bg-[var(--gold)] text-black border-[var(--gold)]'
                : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)]'
            }`}
          >SWARM</button>
          <button
            onClick={newConversation}
            className="px-3 py-2 text-xs font-mono tracking-widest rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)]"
          >LIMPIAR CHAT</button>
        </div>
      </div>

      {/* Video admin */}
      <div className="mb-5 rounded-xl border p-5" style={{ borderColor: 'rgba(201,168,76,0.18)', background: 'linear-gradient(135deg, rgba(201,168,76,0.04) 0%, transparent 70%)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-mono tracking-widest" style={{ color: 'var(--gold)' }}>VIDEO DEL PROFESIONAL</p>
          {isAdmin && (
            <button onClick={() => { setEditMode(!editMode); if (!editMode) { setEditUrl(video.youtubeUrl); setEditTitle(video.title || '') } }} className="text-[10px] font-mono tracking-widest px-3 py-1 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--gold)]">{editMode ? 'CANCELAR' : 'EDITAR'}</button>
          )}
        </div>
        {editMode && (
          <div className="space-y-3 mb-4">
            <input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="URL de YouTube" className="w-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] text-xs px-4 py-2 rounded-lg focus:outline-none focus:border-[var(--gold-dark)] font-mono" />
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Título (opcional)" className="w-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] text-xs px-4 py-2 rounded-lg focus:outline-none focus:border-[var(--gold-dark)] font-mono" />
            <button onClick={async () => { setSaving(true); try { const r = await fetch('/api/section-video', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section: 'quant', youtubeUrl: editUrl, title: editTitle }) }); if (r.ok) { setVideo({ youtubeUrl: editUrl, title: editTitle }); setEditMode(false) } } catch {} finally { setSaving(false) } }} disabled={!editUrl || saving} className="px-4 py-2 text-xs font-mono tracking-widest rounded-lg bg-[var(--gold)] text-black disabled:opacity-50">{saving ? 'GUARDANDO…' : 'GUARDAR'}</button>
          </div>
        )}
        {video.youtubeUrl ? (
          <div className="aspect-video rounded-lg overflow-hidden">
            <iframe src={`https://www.youtube.com/embed/${(video.youtubeUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/)||[])[1] || ''}`} title={video.title || 'Video'} className="w-full h-full" allowFullScreen />
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed rounded-lg" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs text-[var(--text-muted)]">El administrador aún no ha publicado un video para esta sección.</p>
          </div>
        )}
      </div>

      {/* What is this */}
      <div className="mb-5 rounded-xl border p-4" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.07) 0%, transparent 80%)', borderColor: 'rgba(201,168,76,0.18)' }}>
        <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: 'var(--gold)' }}>¿QUÉ PUEDES HACER AQUÍ?</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <p className="text-xs font-bold text-white mb-1">🎯 Estrategias personalizadas</p>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>Describe tu idea de trading y el agente diseña la estrategia completa: entradas, salidas, stop-loss y take-profit.</p>
          </div>
          <div>
            <p className="text-xs font-bold text-white mb-1">📊 Backtesting inteligente</p>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>Analiza el rendimiento histórico de cualquier estrategia sobre datos reales antes de arriesgar capital.</p>
          </div>
          <div>
            <p className="text-xs font-bold text-white mb-1">⚡ Código listo para usar</p>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>Genera indicadores para TradingView (Pine Script), MetaTrader 5 (EA) y Ninja Trader 8 (NinjaScript).</p>
          </div>
        </div>
      </div>

      {/* Guía de uso */}
      <div className="mb-5 rounded-xl">
        <button
          onClick={() => setShowGuide(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left rounded-xl transition-all"
          style={{
            background: showGuide ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.07)',
            border: '1px solid rgba(201,168,76,0.35)',
          }}
        >
          <span className="text-[11px] font-mono tracking-widest font-bold" style={{ color: 'var(--gold)' }}>
            GUÍA DE USO — CÓMO SACAR PROVECHO AL LABORATORIO QUANT
          </span>
          <span className="text-xs font-mono font-bold" style={{ color: 'var(--gold)' }}>{showGuide ? '▲' : '▼'}</span>
        </button>
        {showGuide && (
          <div className="px-4 pb-5 space-y-5 text-xs text-[var(--text-secondary)] leading-relaxed">

            {/* CHAT */}
            <div>
              <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: 'var(--gold)' }}>MODO CHAT — AGENTE CONVERSACIONAL</p>
              <p className="mb-2">Escribe libremente en español. El agente diseña estrategias, genera código y responde preguntas de trading algorítmico.</p>
              <p className="font-semibold text-white mb-1">Ejemplos de uso:</p>
              <ul className="space-y-1 ml-3 list-disc">
                <li>«Diseña una estrategia de cruce EMA 9/21 sobre NQ a 1H con stop ATR»</li>
                <li>«Genera un EA de MetaTrader 5 que opere breakouts de apertura»</li>
                <li>«Explica el indicador RSI divergente con Pine Script de ejemplo»</li>
                <li>«Backtest momentum top-10 US small-caps, rebalanceo mensual»</li>
              </ul>
              <p className="mt-2 text-[var(--text-muted)]">El historial persiste entre sesiones. Usa <span className="font-mono text-white">LIMPIAR CHAT</span> para empezar desde cero.</p>
            </div>

            {/* SWARM */}
            <div>
              <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: 'var(--gold)' }}>MODO SWARM — ANÁLISIS MULTI-AGENTE EN PARALELO</p>
              <p className="mb-2">SWARM lanza un equipo de agentes especializados que trabajan simultáneamente y entregan un reporte consolidado. Tarda 2-8 minutos.</p>
              <p className="font-semibold text-white mb-1">Pasos para ejecutar:</p>
              <ol className="space-y-1 ml-3 list-decimal">
                <li>Selecciona un <span className="font-mono text-white">PRESET</span> del menú desplegable</li>
                <li>Lee la descripción del preset para entender qué analiza</li>
                <li>Edita el JSON de <span className="font-mono text-white">VARIABLES</span> con valores reales (ej: <span className="font-mono">{'"commodity": "oro"'}</span>)</li>
                <li>Haz click en <span className="font-mono text-white">EJECUTAR SWARM</span> y espera el reporte final</li>
              </ol>
              <p className="mt-2 text-yellow-400 font-mono text-[10px]">⚠ Las variables aparecen vacías por defecto — debes rellenarlas o el análisis será genérico.</p>
            </div>

            {/* PRESETS */}
            <div>
              <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: 'var(--gold)' }}>PRESETS DISPONIBLES</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { name: 'commodity_research_team', vars: 'commodity, horizon', desc: 'Análisis de materias primas: demanda/oferta, macro y técnico' },
                  { name: 'macro_strategy_forum', vars: 'market, horizon', desc: 'Foro macro: perspectivas global, doméstica y política convergiendo en asignación de activos' },
                  { name: 'geopolitical_war_room', vars: 'region, asset_class', desc: 'Impacto geopolítico en mercados: riesgos, rutas de escape y oportunidades' },
                  { name: 'social_alpha_team', vars: 'ticker, timeframe', desc: 'Señales de redes sociales + sentimiento + flujo institucional' },
                  { name: 'event_driven_ta', vars: 'ticker, event', desc: 'Análisis técnico multi-escuela con resonancia (Classic TA + Ichimoku + Elliott + SMC)' },
                  { name: 'credit_research_team', vars: 'target, market', desc: 'Investigación de crédito: calidad crediticia + tasas + sector' },
                ].map(p => (
                  <div key={p.name} className="rounded-lg border border-[var(--border)] p-2.5">
                    <p className="font-mono text-[10px] text-white mb-0.5">{p.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mb-1">{p.desc}</p>
                    <p className="text-[10px]"><span style={{ color: 'var(--gold)' }}>vars:</span> <span className="font-mono">{p.vars}</span></p>
                  </div>
                ))}
              </div>
            </div>

            {/* INTERPRETAR REPORTE */}
            <div>
              <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: 'var(--gold)' }}>CÓMO INTERPRETAR UN REPORTE SWARM</p>
              <div className="space-y-2">
                <div className="rounded-lg border border-[var(--border)] p-2.5">
                  <p className="font-semibold text-white mb-1">Tabla de Escuelas (event_driven_ta)</p>
                  <p>Cada fila es una escuela de análisis técnico votando independientemente. Score −5 (muy bajista) a +5 (muy alcista). El <span className="font-mono text-white">Weighted Average</span> es la señal consolidada.</p>
                </div>
                <div className="rounded-lg border border-[var(--border)] p-2.5">
                  <p className="font-semibold text-white mb-1">Resonancia</p>
                  <p><span className="text-green-400 font-mono">Strong</span> = 4-5 escuelas alineadas → señal confiable. <span className="text-yellow-400 font-mono">Medium</span> = 3/5. <span className="text-red-400 font-mono">Chaos</span> = desacuerdo total → mejor no operar.</p>
                </div>
                <div className="rounded-lg border border-[var(--border)] p-2.5">
                  <p className="font-semibold text-white mb-1">Trade Plan</p>
                  <p>Entry / Stop / Target son niveles técnicos consolidados de todas las escuelas. <span className="text-yellow-400">Úsalos como referencia, no como orden automática.</span> Valida con tu propio análisis antes de operar.</p>
                </div>
                <div className="rounded-lg border border-[var(--border)] p-2.5">
                  <p className="font-semibold text-white mb-1">Signal Shelf Life</p>
                  <p>Cada reporte tiene horizonte temporal (ej: 2-4 semanas) e <span className="font-mono text-white">Invalidation</span> — el nivel donde la señal queda anulada. Si el precio cierra por debajo del nivel de invalidación, la señal ya no es válida.</p>
                </div>
              </div>
            </div>

            {/* CONSEJOS */}
            <div>
              <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: 'var(--gold)' }}>CONSEJOS AVANZADOS</p>
              <ul className="space-y-1 ml-3 list-disc text-[var(--text-muted)]">
                <li>Usa CHAT para explorar y refinar ideas, luego SWARM para análisis profundo antes de operar</li>
                <li>El agente genera código Pine Script y MQL5 listo para copiar — pídele que lo adapte a tu setup</li>
                <li>Después de un SWARM, cambia a CHAT y pídele que explique cualquier parte del reporte</li>
                <li>Los reportes SWARM salen en inglés (limitación del backend) — pega el texto en el chat y pide traducción</li>
              </ul>
            </div>

          </div>
        )}
      </div>

      {presetsErr && (
        <div className="card mb-4 border border-red-500/40">
          <div className="label-mono text-xs mb-2 text-red-400">Backend Vibe-Trading no responde</div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            No se pudo conectar a <span className="font-mono">VIBE_TRADING_BASE_URL</span>.
          </p>
          <p className="text-[10px] text-red-400 mt-2 font-mono">{presetsErr}</p>
        </div>
      )}

      {/* Swarm controls */}
      {mode === 'swarm' && (
        <div className="card mb-4">
          <div className="label-mono text-xs mb-3 text-[var(--text-muted)]">
            Configurar Ejecución SWARM
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-[var(--text-muted)] tracking-widest">PRESET</label>
              <select
                value={selectedPreset}
                onChange={e => {
                  setSelectedPreset(e.target.value)
                  const found = presets.find(p =>
                    (p.id ?? p.preset ?? p.name) === e.target.value
                  )
                  if (found) setVars(buildVarsTemplate(found))
                }}
                className="mt-1 w-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--gold)] font-mono text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--gold-dark)]"
              >
                <option value="">— Selecciona un equipo —</option>
                {presets.map((p, i) => {
                  const id = (p.id ?? p.preset ?? p.name ?? `preset_${i}`) as string
                  const label = PRESET_ES[id] ?? (p.title as string | undefined) ?? id
                  return <option key={id} value={id}>{label}</option>
                })}
              </select>
              {presets.length === 0 && (
                <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                  Sin presets disponibles. Usa el modo CHAT.
                </p>
              )}
              {/* Preset description — Spanish override */}
              {selectedPreset && (
                <p className="mt-1.5 text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {PRESET_DESC_ES[selectedPreset] ?? presets.find(p => (p.id ?? p.preset ?? p.name) === selectedPreset)?.description ?? ''}
                </p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-mono text-[var(--text-muted)] tracking-widest">VARIABLES (JSON)</label>
              <textarea
                value={vars}
                onChange={e => setVars(e.target.value)}
                rows={4}
                className="mt-1 w-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] font-mono text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--gold-dark)]"
              />
              {/* Variable hints — label in Spanish, description kept for reference */}
              {selectedPreset && (() => {
                const p = presets.find(p => (p.id ?? p.preset ?? p.name) === selectedPreset)
                if (!p?.variables?.length) return null
                return (
                  <div className="mt-1.5 space-y-0.5">
                    <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: 'var(--gold)' }}>
                      COMPLETA LAS VARIABLES:
                    </p>
                    {p.variables.map(v => (
                      <p key={v.name} className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        <span className="text-[var(--gold)] font-mono">{v.name}</span>
                        {v.required && <span className="text-red-400 ml-0.5">*</span>}
                        {v.description && <span> — {v.description}</span>}
                      </p>
                    ))}
                    <p className="text-[10px] text-yellow-400 mt-1">⚠ Reemplaza los valores vacíos con datos reales antes de ejecutar.</p>
                  </div>
                )
              })()}
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              disabled={busy || !selectedPreset}
              onClick={runSwarm}
              className="px-4 py-2 text-xs font-mono tracking-widest rounded-lg bg-[var(--gold)] text-black disabled:opacity-50"
            >
              {busy ? 'EJECUTANDO…' : 'EJECUTAR SWARM'}
            </button>
          </div>
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--text-muted)] mb-3">
        <span>Estado:</span>
        <span className={
          runState === 'thinking' ? 'text-[var(--gold)] animate-pulse' :
          runState === 'sending' ? 'text-yellow-400' :
          runState === 'error' ? 'text-red-400' :
          runState === 'done' ? 'text-green-400' : ''
        }>
          {runState === 'thinking'
            ? elapsedSeconds < 30
              ? 'AGENTE PENSANDO…'
              : elapsedSeconds < 120
                ? `ANALIZANDO… (${elapsedSeconds}s)`
                : `TAREA COMPLEJA… (${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s)`
            : runState.toUpperCase()}
        </span>
        {sessionId && <span>· session: <span className="text-[var(--text-secondary)]">{sessionId.slice(0, 8)}…</span></span>}
      </div>

      {/* Chat area */}
      <div
        ref={scrollRef}
        className="card mb-3 overflow-y-auto"
        style={{ minHeight: '320px', maxHeight: '60vh' }}
      >
        {lines.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-[10px] font-mono text-[var(--text-muted)] tracking-widest mb-3">SUGERENCIAS</div>
            <div className="grid md:grid-cols-2 gap-2 max-w-2xl mx-auto">
              {SUGGESTED.map(s => (
                <button
                  key={s}
                  onClick={() => { setMode('chat'); setInput(s) }}
                  className="text-left text-xs p-3 rounded-lg border border-[var(--border)] hover:border-[var(--gold-dark)] text-[var(--text-secondary)]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {lines.map(l => (
              <div key={l.id} className="flex flex-col gap-1">
                <span className="text-[10px] font-mono tracking-widest text-[var(--text-muted)]">
                  {l.role === 'user' ? '> TÚ' : l.role === 'agent' ? '> AGENTE' : '· SISTEMA'}
                </span>
                <div
                  className={
                    l.role === 'user'
                      ? 'text-sm text-white whitespace-pre-wrap'
                      : l.role === 'agent'
                        ? 'text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed'
                        : 'text-xs text-[var(--text-muted)] italic'
                  }
                >
                  {l.text}
                </div>
              </div>
            ))}
            {runState === 'thinking' && (
              <div className="flex flex-col gap-2">
                <div className="text-xs text-[var(--gold)] animate-pulse">
                  {elapsedSeconds < 30
                    ? '▍ procesando…'
                    : elapsedSeconds < 120
                      ? `▍ analizando datos… (${elapsedSeconds}s — puede tardar en tareas complejas)`
                      : `▍ tarea compleja en proceso… el agente sigue trabajando (${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s)`}
                </div>
                {elapsedSeconds >= WARN_LONG_MS / 1000 && (
                  <button
                    onClick={() => { pollDeadlineRef.current = Date.now() + 180_000 }}
                    className="self-start px-3 py-1 text-[10px] font-mono tracking-widest rounded border border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10"
                  >
                    SEGUIR ESPERANDO +3 MIN
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      {mode === 'chat' && (
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendChat()
              }
            }}
            rows={2}
            placeholder="Escribe al agente… (Enter para enviar, Shift+Enter salto de línea)"
            className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] text-sm px-4 py-3 rounded-lg focus:outline-none focus:border-[var(--gold-dark)] font-mono"
            disabled={busy}
          />
          <button
            disabled={busy || !input.trim()}
            onClick={sendChat}
            className="px-5 py-3 text-xs font-mono tracking-widest rounded-lg bg-[var(--gold)] text-black disabled:opacity-50"
          >
            {busy ? '…' : 'ENVIAR'}
          </button>
        </div>
      )}

      {errorMsg && (
        <p className="mt-3 text-xs text-red-400 font-mono">⚠ {errorMsg}</p>
      )}

      <p className="mt-6 text-[10px] font-mono text-[var(--text-muted)]">
        Motor: <span className="text-[var(--text-secondary)]">Vibe-Trading · FastAPI · DeepSeek</span> ·
        Proxy <span className="text-[var(--text-secondary)]">/api/trading/vibe/*</span>
      </p>
    </div>
  )
}
