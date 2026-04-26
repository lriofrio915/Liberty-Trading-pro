'use client'

import { useEffect, useRef, useState } from 'react'

type Preset = {
  id?: string
  name?: string
  preset?: string
  description?: string
  agents?: number
}

type Mode = 'chat' | 'swarm'

type ChatLine = {
  id: string
  role: 'user' | 'agent' | 'system'
  text: string
  ts: number
}

type StreamState = 'idle' | 'connecting' | 'streaming' | 'done' | 'error'

const SUGGESTED = [
  'Analiza AAPL: tendencia, soporte/resistencia y un setup intradía.',
  'Backtest cruce EMA 9/21 sobre SPY 1H últimos 6 meses con filtro RSI.',
  'Listame 3 small-caps con momentum positivo y catalizador esta semana.',
  'Revisa NVDA por niveles institucionales (VWAP, POC) y dame entradas swing.',
]

export default function VibeClient({ userEmail }: { userEmail: string }) {
  const [mode, setMode] = useState<Mode>('chat')
  const [presets, setPresets] = useState<Preset[]>([])
  const [presetsErr, setPresetsErr] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [vars, setVars] = useState<string>('{\n  "ticker": "AAPL"\n}')

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [runId, setRunId] = useState<string | null>(null)
  const [input, setInput] = useState<string>('')
  const [lines, setLines] = useState<ChatLine[]>([])
  const [streamState, setStreamState] = useState<StreamState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const esRef = useRef<EventSource | null>(null)
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
  }, [lines.length, streamState])

  useEffect(() => () => esRef.current?.close(), [])

  function appendLine(role: ChatLine['role'], text: string) {
    setLines(prev => [...prev, { id: crypto.randomUUID(), role, text, ts: Date.now() }])
  }

  function appendAgentChunk(chunk: string) {
    setLines(prev => {
      const last = prev[prev.length - 1]
      if (last && last.role === 'agent') {
        const updated = { ...last, text: last.text + chunk }
        return [...prev.slice(0, -1), updated]
      }
      return [...prev, { id: crypto.randomUUID(), role: 'agent', text: chunk, ts: Date.now() }]
    })
  }

  function closeStream() {
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }
  }

  function attachStream(streamUrl: string) {
    closeStream()
    setStreamState('connecting')
    const es = new EventSource(streamUrl)
    esRef.current = es

    es.onopen = () => setStreamState('streaming')

    es.onmessage = (ev) => {
      const raw = ev.data
      if (!raw) return
      let parsed: unknown
      try { parsed = JSON.parse(raw) } catch { parsed = raw }

      if (typeof parsed === 'string') {
        appendAgentChunk(parsed)
        return
      }
      const obj = parsed as Record<string, unknown>

      const type = (obj.type ?? obj.event) as string | undefined
      const content =
        (obj.content as string | undefined) ??
        (obj.text as string | undefined) ??
        (obj.delta as string | undefined) ??
        (obj.message as string | undefined)

      if (type === 'done' || type === 'finish' || type === 'end' || type === 'complete') {
        setStreamState('done')
        closeStream()
        return
      }
      if (type === 'error') {
        setStreamState('error')
        setErrorMsg(typeof content === 'string' ? content : 'Error en el agente')
        closeStream()
        return
      }
      if (typeof content === 'string' && content.length) {
        appendAgentChunk(content)
        return
      }
      // Fallback: pretty print event payload as a system note
      appendLine('system', `· evento: ${type ?? 'mensaje'}`)
    }

    es.addEventListener('error', () => {
      // EventSource fires generic 'error' on disconnect AND on stream end.
      // If we already saw 'done', state is already 'done'. Otherwise mark error.
      if (streamState !== 'done') {
        setStreamState(prev => (prev === 'streaming' ? 'done' : 'error'))
      }
      closeStream()
    })
  }

  async function ensureSession(): Promise<string | null> {
    if (sessionId) return sessionId
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
      const id = data.id ?? data.session_id ?? data.session?.id
      if (!id) {
        setErrorMsg('Respuesta sin id de sesión')
        return null
      }
      setSessionId(id)
      return id as string
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo crear sesión')
      return null
    }
  }

  async function sendChat() {
    setErrorMsg(null)
    const text = input.trim()
    if (!text || streamState === 'streaming' || streamState === 'connecting') return
    const sid = await ensureSession()
    if (!sid) return

    appendLine('user', text)
    setInput('')

    const res = await fetch(
      `/api/trading/vibe/sessions/${encodeURIComponent(sid)}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, content: text, role: 'user' }),
      },
    )
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setErrorMsg(j.error ?? `HTTP ${res.status}`)
      return
    }

    attachStream(`/api/trading/vibe/sessions/${encodeURIComponent(sid)}/stream`)
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

    const res = await fetch('/api/trading/vibe/swarm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset: selectedPreset, vars: parsedVars }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setErrorMsg(j.error ?? `HTTP ${res.status}`)
      return
    }
    const data = await res.json()
    const id = data.run_id ?? data.id ?? data.run?.id
    if (!id) { setErrorMsg('Respuesta sin run_id'); return }
    setRunId(id as string)
    attachStream(`/api/trading/vibe/swarm/runs/${encodeURIComponent(id)}/stream`)
  }

  function newConversation() {
    closeStream()
    setSessionId(null)
    setRunId(null)
    setLines([])
    setErrorMsg(null)
    setStreamState('idle')
  }

  const busy = streamState === 'connecting' || streamState === 'streaming'

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black mb-1">
            Vibe <span className="gradient-gold">Trading</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Agente de trading con 71 skills, 29 swarm presets y export Pine/MT5 ·{' '}
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

      {presetsErr && (
        <div className="card mb-4 border border-red-500/40">
          <div className="label-mono text-xs mb-2 text-red-400">Backend Vibe-Trading no responde</div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            No se pudo conectar a <span className="font-mono">VIBE_TRADING_BASE_URL</span>. Levanta el servicio Python:
          </p>
          <pre className="mt-2 p-3 bg-black/40 rounded text-[11px] font-mono text-[var(--text-muted)] overflow-x-auto">
{`git clone https://github.com/HKUDS/Vibe-Trading.git
cd Vibe-Trading && cp agent/.env.example agent/.env
# editar agent/.env con tu OPENROUTER_API_KEY
docker compose up --build   # API en :8899`}
          </pre>
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
              {presets.length > 0 && selectedPreset && (
                <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                  {presets.find(p => (p.id ?? p.preset ?? p.name) === selectedPreset)?.description ?? ''}
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
              disabled={busy}
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
          streamState === 'streaming' ? 'text-[var(--gold)]' :
          streamState === 'connecting' ? 'text-yellow-400' :
          streamState === 'error' ? 'text-red-400' :
          streamState === 'done' ? 'text-green-400' : ''
        }>
          {streamState.toUpperCase()}
        </span>
        {sessionId && <span>· session: <span className="text-[var(--text-secondary)]">{sessionId.slice(0, 8)}…</span></span>}
        {runId && <span>· run: <span className="text-[var(--text-secondary)]">{runId.slice(0, 8)}…</span></span>}
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
                  {l.text || (streamState === 'streaming' ? '…' : '')}
                </div>
              </div>
            ))}
            {busy && (
              <div className="text-xs text-[var(--gold)] animate-pulse">▍</div>
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
        Backend: <span className="text-[var(--text-secondary)]">Vibe-Trading (HKUDS) · FastAPI</span> ·
        Conectado vía proxy <span className="text-[var(--text-secondary)]">/api/trading/vibe/*</span>
      </p>
    </div>
  )
}
