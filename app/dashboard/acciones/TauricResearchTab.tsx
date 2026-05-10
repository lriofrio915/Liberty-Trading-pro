'use client'

import { useEffect, useRef, useState } from 'react'

type RunStatus = 'idle' | 'starting' | 'running' | 'reconnecting' | 'completed' | 'failed'

type SSEEvent =
  | { type: 'log'; message: string }
  | { type: 'done'; status: 'completed' | 'failed'; result: string }
  | { type: 'error'; message: string }

const DEPTH_OPTIONS = [
  { value: 'shallow',  label: 'Superficial',  time: '1-3 min',  desc: '1 analista por categoría' },
  { value: 'moderate', label: 'Moderado',      time: '3-7 min',  desc: '3 analistas por categoría' },
  { value: 'deep',     label: 'Profundo',      time: '10-20 min',desc: 'Todos los analistas (máx. precisión)' },
]

const MAX_POLL_ATTEMPTS = 240 // 20 min at 5s intervals

function decisionBadge(result: string): { label: string; color: string } {
  const up = result.toUpperCase()
  if (up.includes('BUY') || up.includes('COMPRAR') || up.includes('ALCISTA')) {
    return { label: 'COMPRAR', color: 'bg-green-500/20 border-green-500/40 text-green-400' }
  }
  if (up.includes('SELL') || up.includes('VENDER') || up.includes('BAJISTA')) {
    return { label: 'VENDER', color: 'bg-red-500/20 border-red-500/40 text-red-400' }
  }
  return { label: 'MANTENER', color: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' }
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

  const evtRef     = useRef<EventSource | null>(null)
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const statusRef  = useRef<RunStatus>('idle')
  const runIdRef   = useRef<string | null>(null)
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
        const d = await r.json() as {
          status?: string
          logs?: string[]
          result?: string
          output?: string
        }
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
      } catch {
        // silent — retry next interval
      }
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
        // SSE dropped — fall back to polling if we have a run ID
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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="rounded-xl border p-5" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.06) 0%, transparent 70%)', borderColor: 'rgba(201,168,76,0.2)' }}>
        <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: 'var(--gold)' }}>
          TAURIC RESEARCH — MULTI-AGENT LLM TRADING FRAMEWORK
        </p>
        <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
          Análisis bursátil profundo con 10 agentes especializados trabajando en paralelo.
          Cada agente aporta una perspectiva distinta; el Portfolio Manager sintetiza la decisión final.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px]">
          {['Análisis Fundamental', 'Análisis Técnico', 'Sentimiento', 'Noticias', 'Bull/Bear Researcher', 'Research Manager', 'Trader', 'Portfolio Manager', 'Risk Manager', 'Decisión Final'].map((a, i) => (
            <div key={a} className={`px-2 py-1.5 rounded-lg border font-mono ${i === 9 ? 'border-[var(--gold)]/40 text-[var(--gold)]' : 'border-[var(--border)] text-[var(--text-muted)]'}`}
              style={{ background: i === 9 ? 'rgba(201,168,76,0.08)' : 'var(--bg-card)' }}>
              {a}
            </div>
          ))}
        </div>
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

          <div
            className="rounded-lg border p-3 font-mono text-xs overflow-y-auto space-y-1"
            style={{ background: '#0d0d0d', borderColor: 'var(--border)', maxHeight: '200px', color: '#4ade80' }}
          >
            {logs.length === 0 && <span style={{ color: 'var(--text-muted)' }}>Iniciando…</span>}
            {logs.map((l, i) => <div key={i}>{l}</div>)}
            <div ref={logsEndRef} />
          </div>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            Los análisis profundos pueden tardar hasta 20 minutos. Mantén esta pestaña abierta.
          </p>
        </div>
      )}

      {/* Result */}
      {status === 'completed' && result && (
        <div className="space-y-4">
          {(() => {
            const { label, color } = decisionBadge(result)
            return (
              <div className={`rounded-xl border p-5 ${color}`}>
                <p className="text-[10px] font-mono tracking-widest mb-2 opacity-70">DECISIÓN FINAL — {ticker.trim().toUpperCase()}</p>
                <p className="text-3xl font-black font-mono">{label}</p>
                <p className="text-[10px] mt-1 opacity-60">{date} · {depth} · {elapsedStr}</p>
              </div>
            )
          })()}
          <div className="card">
            <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: 'var(--gold)' }}>ANÁLISIS COMPLETO</p>
            <pre className="text-xs leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono, monospace)' }}>
              {result}
            </pre>
          </div>
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
