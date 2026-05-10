'use client'

import { useEffect, useRef, useState } from 'react'

type RunStatus = 'idle' | 'starting' | 'running' | 'reconnecting' | 'completed' | 'failed'

type SSEEvent =
  | { type: 'log'; message: string }
  | { type: 'done'; status: 'completed' | 'failed'; result: string }
  | { type: 'error'; message: string }

const DEPTH_OPTIONS = [
  { value: 'shallow',  label: 'Superficial',  time: '1-3 min',  desc: '1 analista por categoría', estSecs: 180  },
  { value: 'moderate', label: 'Moderado',      time: '3-7 min',  desc: '3 analistas por categoría', estSecs: 420 },
  { value: 'deep',     label: 'Profundo',      time: '10-20 min',desc: 'Todos los analistas (máx. precisión)', estSecs: 900 },
]

const AGENTS = [
  { key: 'fundamental', label: 'Análisis Fundamental', icon: '📊' },
  { key: 'tecnico',     label: 'Análisis Técnico',     icon: '📈' },
  { key: 'sentimiento', label: 'Sentimiento',           icon: '🧠' },
  { key: 'noticias',    label: 'Noticias',              icon: '📰' },
  { key: 'bullbear',    label: 'Bull/Bear Researcher',  icon: '⚡' },
  { key: 'research',    label: 'Research Manager',      icon: '🔍' },
  { key: 'trader',      label: 'Trader',                icon: '💹' },
  { key: 'portfolio',   label: 'Portfolio Manager',     icon: '🎯' },
  { key: 'risk',        label: 'Risk Manager',          icon: '🛡️' },
  { key: 'decision',    label: 'Decisión Final',        icon: '⚖️' },
]

const MAX_POLL_ATTEMPTS = 240

function decisionBadge(result: string): { label: string; color: string } {
  const up = result.toUpperCase()
  if (up.includes('BUY') || up.includes('COMPRAR') || up.includes('ALCISTA') || up.includes('BULLISH')) {
    return { label: 'COMPRAR', color: 'bg-green-500/20 border-green-500/40 text-green-400' }
  }
  if (up.includes('SELL') || up.includes('VENDER') || up.includes('BAJISTA') || up.includes('BEARISH')) {
    return { label: 'VENDER', color: 'bg-red-500/20 border-red-500/40 text-red-400' }
  }
  if (up.includes('UNDERWEIGHT')) {
    return { label: 'REDUCIR', color: 'bg-orange-500/20 border-orange-500/40 text-orange-400' }
  }
  if (up.includes('OVERWEIGHT')) {
    return { label: 'AUMENTAR', color: 'bg-green-500/20 border-green-500/40 text-green-400' }
  }
  return { label: 'MANTENER', color: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' }
}

function agentStep(elapsed: number, estSecs: number): number {
  // returns index of last completed agent (-1 = none yet)
  if (elapsed <= 0) return -1
  const perAgent = estSecs / AGENTS.length
  return Math.min(Math.floor(elapsed / perAgent), AGENTS.length - 1)
}

type AgentState = 'idle' | 'active' | 'done'

function AgentTimeline({ elapsed, estSecs, running, done }: {
  elapsed: number
  estSecs: number
  running: boolean
  done: boolean
}) {
  const current = done ? AGENTS.length : agentStep(elapsed, estSecs)

  return (
    <div className="space-y-1">
      {AGENTS.map((a, i) => {
        let state: AgentState = 'idle'
        if (done || i < current) state = 'done'
        else if (running && i === current) state = 'active'

        return (
          <div
            key={a.key}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono transition-all duration-500
              ${state === 'done'   ? 'border-[var(--gold)]/30 bg-[var(--gold)]/5 text-[var(--gold)]' : ''}
              ${state === 'active' ? 'border-[var(--gold)]/60 bg-[var(--gold)]/10 text-[var(--gold)]' : ''}
              ${state === 'idle'   ? 'border-[var(--border)] text-[var(--text-muted)]' : ''}
            `}
          >
            {state === 'done'   && <span className="text-[10px] text-green-400 flex-shrink-0">✓</span>}
            {state === 'active' && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[var(--gold)] animate-pulse" />}
            {state === 'idle'   && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[var(--border)]" />}
            <span className={state === 'active' ? 'font-bold' : ''}>{a.label}</span>
            {state === 'active' && <span className="ml-auto text-[9px] opacity-60 animate-pulse">procesando…</span>}
            {state === 'done' && i === AGENTS.length - 1 && <span className="ml-auto text-[9px] text-green-400">lista</span>}
          </div>
        )
      })}
    </div>
  )
}

export default function TauricResearchTab() {
  const [ticker, setTicker]   = useState('')
  const [date, setDate]       = useState(() => new Date().toISOString().split('T')[0])
  const [depth, setDepth]     = useState('shallow')
  const [status, setStatus]   = useState<RunStatus>('idle')
  const [logs, setLogs]       = useState<string[]>([])
  const [result, setResult]   = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError]     = useState<string | null>(null)

  const evtRef    = useRef<EventSource | null>(null)
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const statusRef = useRef<RunStatus>('idle')
  const runIdRef  = useRef<string | null>(null)
  const logsEndRef = useRef<HTMLDivElement | null>(null)

  function updateStatus(s: RunStatus) {
    statusRef.current = s
    setStatus(s)
  }

  function clearPoll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  useEffect(() => () => {
    evtRef.current?.close()
    if (timerRef.current) clearInterval(timerRef.current)
    clearPoll()
  }, [])

  function startPolling(runId: string) {
    updateStatus('reconnecting')
    let attempts = 0
    pollRef.current = setInterval(async () => {
      attempts++
      if (attempts > MAX_POLL_ATTEMPTS) {
        clearPoll()
        setError('El análisis tardó demasiado. Intenta de nuevo.')
        updateStatus('failed')
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
        return
      }
      try {
        const r = await fetch(`/api/tauric/runs/${encodeURIComponent(runId)}`)
        if (!r.ok) return
        const d = await r.json() as { status?: string; logs?: string[]; result?: string; output?: string }
        if (Array.isArray(d.logs) && d.logs.length > 0) setLogs(d.logs)
        const done = d.status === 'completed' || d.status === 'failed'
        if (done) {
          clearPoll()
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
          const res = d.result ?? d.output ?? null
          setResult(res)
          updateStatus(d.status === 'completed' ? 'completed' : 'failed')
          if (d.status === 'failed') setError(res ?? 'Análisis fallido')
        }
      } catch { /* silent retry */ }
    }, 5000)
  }

  async function handleAnalyze() {
    if (!ticker.trim()) return
    updateStatus('starting')
    setLogs([])
    setResult(null)
    setError(null)
    setElapsed(0)
    runIdRef.current = null
    evtRef.current?.close()
    if (timerRef.current) clearInterval(timerRef.current)
    clearPoll()

    try {
      const res = await fetch('/api/tauric/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: ticker.trim().toUpperCase(), date, depth }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? `Error ${res.status}`); updateStatus('failed'); return }

      const runId: string = data.run_id
      runIdRef.current = runId
      updateStatus('running')
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)

      const es = new EventSource(`/api/tauric/runs/${encodeURIComponent(runId)}/stream`)
      evtRef.current = es

      es.onmessage = (e) => {
        const payload: SSEEvent = JSON.parse(e.data)
        if (payload.type === 'log') {
          setLogs(prev => [...prev, payload.message])
        } else if (payload.type === 'done') {
          es.close()
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
          setResult(payload.result)
          updateStatus(payload.status === 'completed' ? 'completed' : 'failed')
          if (payload.status === 'failed') setError(payload.result)
        } else if (payload.type === 'error') {
          es.close()
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
          setError(payload.message)
          updateStatus('failed')
        }
      }

      es.onerror = () => {
        es.close()
        if (statusRef.current === 'completed' || statusRef.current === 'failed') return
        const rid = runIdRef.current
        if (rid) {
          startPolling(rid)
        } else {
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
          setError('Conexión interrumpida. Intenta de nuevo.')
          updateStatus('failed')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      updateStatus('failed')
    }
  }

  function reset() {
    evtRef.current?.close()
    if (timerRef.current) clearInterval(timerRef.current)
    clearPoll()
    runIdRef.current = null
    updateStatus('idle')
    setLogs([])
    setResult(null)
    setError(null)
    setElapsed(0)
  }

  const busy = status === 'starting' || status === 'running' || status === 'reconnecting'
  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const elapsedStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`

  const depthOpt = DEPTH_OPTIONS.find(d => d.value === depth) ?? DEPTH_OPTIONS[0]

  // Separate the final decision label from body (result may be just a word or full text)
  const resultIsShort = result && result.trim().split(/\s+/).length <= 5
  const resultBody = resultIsShort ? null : result

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="rounded-xl border p-5" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.06) 0%, transparent 70%)', borderColor: 'rgba(201,168,76,0.2)' }}>
        <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: 'var(--gold)' }}>
          TAURIC RESEARCH — MULTI-AGENT LLM TRADING FRAMEWORK
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Análisis bursátil profundo con 10 agentes especializados trabajando en paralelo.
          Cada agente aporta una perspectiva distinta; el Portfolio Manager sintetiza la decisión final.
        </p>
      </div>

      {/* Form */}
      {status === 'idle' && (
        <div className="card space-y-4">
          <p className="text-[10px] font-mono tracking-widest" style={{ color: 'var(--gold)' }}>CONFIGURAR ANÁLISIS</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono tracking-widest block mb-1.5" style={{ color: 'var(--text-muted)' }}>TICKER</label>
              <input
                type="text"
                value={ticker}
                onChange={e => setTicker(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                placeholder="NVDA, AAPL, TSLA…"
                className="w-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--gold)] font-mono text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--gold-dark)]"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono tracking-widest block mb-1.5" style={{ color: 'var(--text-muted)' }}>FECHA DE ANÁLISIS</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] font-mono text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--gold-dark)]"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono tracking-widest block mb-2" style={{ color: 'var(--text-muted)' }}>PROFUNDIDAD DE ANÁLISIS</label>
            <div className="grid sm:grid-cols-3 gap-2">
              {DEPTH_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDepth(opt.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${depth === opt.value ? 'border-[var(--gold)] bg-[var(--gold)]/10' : 'border-[var(--border)] hover:border-[var(--gold-dark)]'}`}
                >
                  <div className={`text-xs font-bold font-mono mb-0.5 ${depth === opt.value ? 'text-[var(--gold)]' : 'text-[var(--text-primary)]'}`}>
                    {opt.label}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{opt.desc}</div>
                  <div className="text-[10px] mt-1" style={{ color: 'var(--gold)' }}>~{opt.time}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={!ticker.trim()}
            onClick={handleAnalyze}
            className="w-full py-3 text-sm font-mono tracking-widest rounded-xl bg-[var(--gold)] text-black font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            ANALIZAR CON IA →
          </button>
        </div>
      )}

      {/* Running / Reconnecting */}
      {busy && (
        <div className="card space-y-4">
          {/* Header row */}
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 flex-shrink-0" style={{ color: 'var(--gold)' }} viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Analizando {ticker.trim().toUpperCase()}…
              </p>
              <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                {elapsedStr} transcurrido · profundidad: {depth}
              </p>
            </div>
          </div>

          {status === 'reconnecting' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-mono"
              style={{ borderColor: 'rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.06)', color: 'var(--gold)' }}>
              <span className="animate-pulse">●</span>
              <span>Stream interrumpido — reconectando vía polling cada 5s…</span>
            </div>
          )}

          {/* Two-column: agent timeline + log console */}
          <div className="grid sm:grid-cols-2 gap-3">
            {/* Agent stepper */}
            <div>
              <p className="text-[9px] font-mono tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>AGENTES</p>
              <AgentTimeline
                elapsed={elapsed}
                estSecs={depthOpt.estSecs}
                running={status === 'running' || status === 'reconnecting'}
                done={false}
              />
            </div>

            {/* Log console */}
            <div>
              <p className="text-[9px] font-mono tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>ACTIVIDAD</p>
              <div
                className="rounded-lg border p-3 font-mono text-xs overflow-y-auto space-y-1"
                style={{ background: '#0d0d0d', borderColor: 'var(--border)', height: '228px', color: '#4ade80' }}
              >
                {logs.length === 0 && <span style={{ color: 'var(--text-muted)' }}>Iniciando…</span>}
                {logs.map((l, i) => <div key={i}>{l}</div>)}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>

          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            Los análisis profundos pueden tardar hasta 20 minutos. Mantén esta pestaña abierta.
          </p>
        </div>
      )}

      {/* Result */}
      {status === 'completed' && result && (
        <div className="space-y-4">
          {/* Decision badge */}
          {(() => {
            const { label, color } = decisionBadge(result)
            return (
              <div className={`rounded-xl border p-5 ${color}`}>
                <p className="text-[10px] font-mono tracking-widest mb-2 opacity-70">DECISIÓN FINAL — {ticker.trim().toUpperCase()}</p>
                <p className="text-3xl font-black font-mono">{label}</p>
                <p className="text-[11px] font-mono mt-1 opacity-80">{result.trim()}</p>
                <p className="text-[10px] mt-2 opacity-50">{date} · {depth} · {elapsedStr}</p>
              </div>
            )
          })()}

          {/* Agent completion summary */}
          <div className="card">
            <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: 'var(--gold)' }}>AGENTES COMPLETADOS</p>
            <AgentTimeline elapsed={elapsed} estSecs={depthOpt.estSecs} running={false} done={true} />
          </div>

          {/* Full analysis text if backend returned rich text */}
          {resultBody && (
            <div className="card">
              <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: 'var(--gold)' }}>ANÁLISIS COMPLETO</p>
              <pre className="text-xs leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono, monospace)' }}>
                {resultBody}
              </pre>
            </div>
          )}

          {/* Activity log from run */}
          {logs.length > 0 && (
            <div className="card">
              <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>REGISTRO DE ACTIVIDAD</p>
              <div className="space-y-1 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                {logs.map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <span style={{ color: 'var(--text-muted)' }}>{String(i + 1).padStart(2, '0')}</span>
                    <span>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={reset}
            className="px-5 py-2.5 text-xs font-mono tracking-widest rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--gold-dark)]"
          >
            NUEVO ANÁLISIS
          </button>
        </div>
      )}

      {/* Error / failed */}
      {status === 'failed' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm text-red-400 font-mono">⚠ {error ?? 'El análisis falló.'}</p>
          </div>
          <button onClick={reset} className="px-5 py-2.5 text-xs font-mono tracking-widest rounded-xl border border-[var(--border)] text-[var(--text-secondary)]">
            INTENTAR DE NUEVO
          </button>
        </div>
      )}
    </div>
  )
}
