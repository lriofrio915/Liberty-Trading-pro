'use client'

import { useEffect, useRef, useState } from 'react'

type Preset = {
  id?: string
  name?: string
  preset?: string
  description?: string
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

const SUGGESTED = [
  'Diseña una estrategia de cruce EMA 9/21 sobre SPY 1H con stop ATR.',
  'Backtest momentum top-10 small-caps US últimos 12 meses, rebalanceo mensual.',
  'Analiza AAPL: tendencia, soporte/resistencia y un setup intradía.',
  'Genera indicador Pine Script: VWAP + bandas de desviación estándar.',
]

const POLL_INTERVAL_MS = 1500
const POLL_TIMEOUT_MS = 120_000

export default function VibeClient({ userEmail }: { userEmail: string }) {
  const [mode, setMode] = useState<Mode>('chat')
  const [presets, setPresets] = useState<Preset[]>([])
  const [presetsErr, setPresetsErr] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [vars, setVars] = useState<string>('{\n  "ticker": "AAPL"\n}')

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [input, setInput] = useState<string>('')
  const [lines, setLines] = useState<ChatLine[]>([])
  const [runState, setRunState] = useState<RunState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const lastSeenIdsRef = useRef<Set<string>>(new Set())
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

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
        setPresets(arr as Preset[])
        setPresetsErr(null)
      })
      .catch(err => {
        setPresetsErr(err?.message ?? 'No se pudo conectar a Vibe-Trading')
      })
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [lines.length, runState])

  useEffect(() => () => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
  }, [])

  function appendLine(role: ChatLine['role'], text: string) {
    setLines(prev => [...prev, { id: crypto.randomUUID(), role, text }])
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
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current)

    const tick = async () => {
      if (Date.now() > deadline) {
        setRunState('error')
        setErrorMsg('El agente tardó más de 2 minutos. Mira los logs del backend.')
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
              appendLine('agent', m.content || '(respuesta vacía)')
              gotAssistant = true
            }
          }
        }

        if (gotAssistant) {
          setRunState('done')
          return
        }
      } catch (err) {
        setRunState('error')
        setErrorMsg(err instanceof Error ? err.message : 'Polling falló')
        return
      }

      pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS)
    }

    pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS)
  }

  async function sendChat() {
    setErrorMsg(null)
    const text = input.trim()
    if (!text || runState === 'sending' || runState === 'thinking') return

    let sid = await ensureSession()
    if (!sid) return

    appendLine('user', text)
    setInput('')

    // Marca como vista la posible existencia previa (al ya estar mi user message creado)
    setRunState('sending')

    try {
      let res = await fetch(
        `/api/trading/vibe/sessions/${encodeURIComponent(sid)}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: text }),
        },
      )

      // La sesión expiró en el backend — crear una nueva y reintentar una vez
      if (res.status === 404) {
        setSessionId(null)
        const newSid = await createFreshSession()
        if (!newSid) { setRunState('error'); return }
        sid = newSid
        res = await fetch(
          `/api/trading/vibe/sessions/${encodeURIComponent(sid)}/messages`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text }),
          },
        )
      }

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setErrorMsg(j.error ?? `HTTP ${res.status}`)
        setRunState('error')
        return
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
      body: JSON.stringify({ preset: selectedPreset, vars: parsedVars }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setErrorMsg(j.error ?? `HTTP ${res.status}`)
      setRunState('error')
      return
    }
    const data = await res.json()
    appendLine('system', `swarm run iniciado: ${JSON.stringify(data).slice(0, 200)}`)
    setRunState('done')
  }

  function newConversation() {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
    setSessionId(null)
    lastSeenIdsRef.current = new Set()
    setLines([])
    setErrorMsg(null)
    setRunState('idle')
  }

  const busy = runState === 'sending' || runState === 'thinking'

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black mb-1">
            Copiloto <span className="gradient-gold">de Trading</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Tu asistente IA para diseñar estrategias, backtests y código Pine/MT5 ·{' '}
            <span className="font-mono text-[var(--text-muted)]">{userEmail}</span>
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
          >NUEVA</button>
        </div>
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
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>Genera indicadores Pine Script para TradingView y Expert Advisors (EA) para MetaTrader 5 automáticamente.</p>
          </div>
        </div>
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
            Configurar Swarm Run
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-[var(--text-muted)] tracking-widest">PRESET</label>
              <select
                value={selectedPreset}
                onChange={e => setSelectedPreset(e.target.value)}
                className="mt-1 w-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--gold)] font-mono text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--gold-dark)]"
              >
                <option value="">— Selecciona —</option>
                {presets.map((p, i) => {
                  const id = (p.id ?? p.preset ?? p.name ?? `preset_${i}`) as string
                  const label = (p.name ?? p.id ?? p.preset ?? id) as string
                  return <option key={id} value={id}>{label}</option>
                })}
              </select>
              {presets.length === 0 && (
                <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                  El backend no tiene swarm presets configurados. Usa el modo CHAT.
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
          {runState === 'thinking' ? 'AGENTE PENSANDO…' : runState.toUpperCase()}
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
              <div className="text-xs text-[var(--gold)] animate-pulse">
                ▍ procesando… (puede tardar 5–60s en runs complejos)
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
        Backend: <span className="text-[var(--text-secondary)]">Vibe-Trading (HKUDS) · FastAPI · DeepSeek</span> ·
        Conectado vía proxy <span className="text-[var(--text-secondary)]">/api/trading/vibe/*</span>
      </p>
    </div>
  )
}
