'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

type RunStatus = 'idle' | 'starting' | 'running' | 'reconnecting' | 'completed' | 'failed'

type SSEEvent =
  | { type: 'log'; message: string }
  | { type: 'done'; status: 'completed' | 'failed'; result: string }
  | { type: 'error'; message: string }

type Suggestion = { symbol: string; name: string; exchange: string; type: string }

const DEPTH_OPTIONS = [
  { value: 'shallow',  label: 'Superficial',  time: '1-3 min',  desc: '1 analista por categoría',       estSecs: 180  },
  { value: 'moderate', label: 'Moderado',      time: '3-7 min',  desc: '3 analistas por categoría',      estSecs: 420  },
  { value: 'deep',     label: 'Profundo',      time: '10-20 min',desc: 'Todos los analistas (máx. precisión)', estSecs: 900 },
]

const AGENTS = [
  { key: 'fundamental', label: 'Análisis Fundamental' },
  { key: 'tecnico',     label: 'Análisis Técnico'     },
  { key: 'sentimiento', label: 'Sentimiento'           },
  { key: 'noticias',    label: 'Noticias'              },
  { key: 'bullbear',    label: 'Bull/Bear Researcher'  },
  { key: 'research',    label: 'Research Manager'      },
  { key: 'trader',      label: 'Trader'                },
  { key: 'portfolio',   label: 'Portfolio Manager'     },
  { key: 'risk',        label: 'Risk Manager'          },
  { key: 'decision',    label: 'Decisión Final'        },
]

const MAX_POLL_ATTEMPTS = 240

function decisionBadge(result: string): { label: string; color: string } {
  const up = result.toUpperCase()
  if (up.includes('BUY') || up.includes('COMPRAR') || up.includes('ALCISTA') || up.includes('BULLISH') || up.includes('OVERWEIGHT'))
    return { label: 'COMPRAR', color: 'bg-green-500/20 border-green-500/40 text-green-400' }
  if (up.includes('SELL') || up.includes('VENDER') || up.includes('BAJISTA') || up.includes('BEARISH') || up.includes('UNDERWEIGHT'))
    return { label: 'REDUCIR / VENDER', color: 'bg-red-500/20 border-red-500/40 text-red-400' }
  return { label: 'MANTENER', color: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' }
}

function agentIndex(elapsed: number, estSecs: number) {
  if (elapsed <= 0) return -1
  return Math.min(Math.floor(elapsed / (estSecs / AGENTS.length)), AGENTS.length - 1)
}

function AgentTimeline({ elapsed, estSecs, running, done }: {
  elapsed: number; estSecs: number; running: boolean; done: boolean
}) {
  const current = done ? AGENTS.length : agentIndex(elapsed, estSecs)
  return (
    <div className="space-y-1">
      {AGENTS.map((a, i) => {
        const state = done || i < current ? 'done' : running && i === current ? 'active' : 'idle'
        return (
          <div key={a.key} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono transition-all duration-500
            ${state === 'done'   ? 'border-[var(--gold)]/30 bg-[var(--gold)]/5 text-[var(--gold)]' : ''}
            ${state === 'active' ? 'border-[var(--gold)]/60 bg-[var(--gold)]/10 text-[var(--gold)]' : ''}
            ${state === 'idle'   ? 'border-[var(--border)] text-[var(--text-muted)]' : ''}
          `}>
            {state === 'done'   && <span className="text-[10px] text-green-400 flex-shrink-0">✓</span>}
            {state === 'active' && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[var(--gold)] animate-pulse" />}
            {state === 'idle'   && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[var(--border)]" />}
            <span className={state === 'active' ? 'font-bold' : ''}>{a.label}</span>
            {state === 'active' && <span className="ml-auto text-[9px] opacity-60 animate-pulse">procesando…</span>}
          </div>
        )
      })}
    </div>
  )
}

export default function TauricResearchTab() {
  // Form state
  const [ticker, setTicker]   = useState('')
  const [tickerQuery, setTickerQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showDrop, setShowDrop]       = useState(false)
  const [searching, setSearching]     = useState(false)
  const [date, setDate]   = useState(() => new Date().toISOString().split('T')[0])
  const depth = 'deep'

  // Run state
  const [status, setStatus]   = useState<RunStatus>('idle')
  const [logs, setLogs]       = useState<string[]>([])
  const [result, setResult]   = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError]     = useState<string | null>(null)

  // Conclusion state
  const [conclusion, setConclusion]         = useState<string | null>(null)
  const [generatingConclusion, setGenConc]  = useState(false)

  // Refs
  const evtRef      = useRef<EventSource | null>(null)
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const statusRef   = useRef<RunStatus>('idle')
  const runIdRef    = useRef<string | null>(null)
  const logsRef     = useRef<string[]>([])
  const logsEndRef  = useRef<HTMLDivElement | null>(null)
  const inputWrapRef = useRef<HTMLDivElement | null>(null)

  function updateStatus(s: RunStatus) { statusRef.current = s; setStatus(s) }
  function clearPoll() { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }

  // keep logsRef in sync so fetchConclusion can read current logs
  useEffect(() => { logsRef.current = logs }, [logs])

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [logs])

  // click-outside closes dropdown
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (inputWrapRef.current && !inputWrapRef.current.contains(e.target as Node)) {
        setShowDrop(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // cleanup on unmount
  useEffect(() => () => {
    evtRef.current?.close()
    if (timerRef.current) clearInterval(timerRef.current)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    clearPoll()
  }, [])

  // ── Autocomplete search ────────────────────────────────────────────────────
  const searchTicker = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 2) { setSuggestions([]); setShowDrop(false); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await fetch(`/api/tauric/search?q=${encodeURIComponent(q)}`)
        if (r.ok) {
          const d = await r.json() as { suggestions: Suggestion[] }
          setSuggestions(d.suggestions ?? [])
          setShowDrop((d.suggestions?.length ?? 0) > 0)
        }
      } catch { /* silent */ }
      finally { setSearching(false) }
    }, 300)
  }, [])

  function onQueryChange(val: string) {
    setTickerQuery(val)
    setTicker('')      // clear selected ticker until user picks a suggestion
    searchTicker(val)
  }

  function selectSuggestion(s: Suggestion) {
    setTicker(s.symbol)
    setTickerQuery(s.symbol)
    setSuggestions([])
    setShowDrop(false)
  }

  // ── AI conclusion ──────────────────────────────────────────────────────────
  async function fetchConclusion(signal: string, currentTicker: string) {
    setGenConc(true)
    try {
      const r = await fetch('/api/tauric/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: currentTicker,
          signal,
          depth,
          date,
          logs: logsRef.current,
        }),
      })
      if (r.ok) {
        const d = await r.json() as { conclusion?: string }
        setConclusion(d.conclusion ?? null)
      }
    } catch { /* silent */ }
    finally { setGenConc(false) }
  }

  // ── Polling fallback ───────────────────────────────────────────────────────
  function startPolling(runId: string, currentTicker: string) {
    updateStatus('reconnecting')
    let attempts = 0
    pollRef.current = setInterval(async () => {
      if (++attempts > MAX_POLL_ATTEMPTS) {
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
        if (d.status === 'completed' || d.status === 'failed') {
          clearPoll()
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
          const res = d.result ?? d.output ?? null
          setResult(res)
          updateStatus(d.status === 'completed' ? 'completed' : 'failed')
          if (d.status === 'failed') setError(res ?? 'Análisis fallido')
          else if (res) fetchConclusion(res, currentTicker)
        }
      } catch { /* silent retry */ }
    }, 5000)
  }

  // ── Main analyze handler ───────────────────────────────────────────────────
  async function handleAnalyze() {
    if (!ticker) return
    const currentTicker = ticker
    updateStatus('starting')
    setLogs([])
    setResult(null)
    setError(null)
    setConclusion(null)
    setElapsed(0)
    runIdRef.current = null
    evtRef.current?.close()
    if (timerRef.current) clearInterval(timerRef.current)
    clearPoll()

    try {
      const res = await fetch('/api/tauric/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: currentTicker, date, depth }),
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
          else fetchConclusion(payload.result, currentTicker)
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
        if (rid) startPolling(rid, currentTicker)
        else {
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
    setConclusion(null)
    setGenConc(false)
    setTickerQuery('')
    setTicker('')
    setSuggestions([])
    setShowDrop(false)
  }

  const busy = status === 'starting' || status === 'running' || status === 'reconnecting'
  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const elapsedStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  const depthOpt = DEPTH_OPTIONS.find(d => d.value === depth) ?? DEPTH_OPTIONS[0]

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
            {/* Ticker autocomplete */}
            <div>
              <label className="text-[10px] font-mono tracking-widest block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                EMPRESA O TICKER <span className="opacity-50">(1 por análisis)</span>
              </label>
              <div className="relative" ref={inputWrapRef}>
                <input
                  type="text"
                  value={tickerQuery}
                  onChange={e => onQueryChange(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && ticker) handleAnalyze()
                    if (e.key === 'Escape') setShowDrop(false)
                  }}
                  onFocus={() => suggestions.length > 0 && setShowDrop(true)}
                  placeholder="Busca empresa o ticker (ej. Apple, AAPL)…"
                  autoComplete="off"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--gold)] font-mono text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--gold-dark)] pr-8"
                />
                {/* search indicator */}
                {searching && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono animate-pulse" style={{ color: 'var(--text-muted)' }}>…</span>
                )}
                {ticker && !searching && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-green-400">✓</span>
                )}

                {/* Dropdown */}
                {showDrop && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 rounded-lg border overflow-hidden shadow-xl"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    {suggestions.map((s, i) => (
                      <button
                        key={s.symbol}
                        onMouseDown={e => { e.preventDefault(); selectSuggestion(s) }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--gold)]/5 transition-colors ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}
                      >
                        <span className="font-mono text-xs font-bold flex-shrink-0" style={{ color: 'var(--gold)', minWidth: '52px' }}>
                          {s.symbol}
                        </span>
                        <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
                        <span className="ml-auto text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{s.exchange}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {!ticker && tickerQuery.length > 0 && !searching && suggestions.length === 0 && tickerQuery.length >= 2 && (
                <p className="text-[10px] mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>Sin resultados — prueba otro término</p>
              )}
            </div>

            {/* Date */}
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

          <button
            disabled={!ticker}
            onClick={handleAnalyze}
            className="w-full py-3 text-sm font-mono tracking-widest rounded-xl bg-[var(--gold)] text-black font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            ANALIZAR {ticker || '—'} CON IA →
          </button>
        </div>
      )}

      {/* Running */}
      {busy && (
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 flex-shrink-0" style={{ color: 'var(--gold)' }} viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Analizando {ticker}…</p>
              <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{elapsedStr} transcurrido · {depth}</p>
            </div>
          </div>

          {status === 'reconnecting' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-mono"
              style={{ borderColor: 'rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.06)', color: 'var(--gold)' }}>
              <span className="animate-pulse">●</span>
              <span>Stream interrumpido — reconectando vía polling cada 5s…</span>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] font-mono tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>AGENTES</p>
              <AgentTimeline elapsed={elapsed} estSecs={depthOpt.estSecs} running={status === 'running' || status === 'reconnecting'} done={false} />
            </div>
            <div>
              <p className="text-[9px] font-mono tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>ACTIVIDAD</p>
              <div className="rounded-lg border p-3 font-mono text-xs overflow-y-auto space-y-1"
                style={{ background: '#0d0d0d', borderColor: 'var(--border)', height: '228px', color: '#4ade80' }}>
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
                <p className="text-[10px] font-mono tracking-widest mb-2 opacity-70">DECISIÓN FINAL — {ticker}</p>
                <p className="text-3xl font-black font-mono">{label}</p>
                <p className="text-[11px] font-mono mt-1 opacity-80">{result.trim()}</p>
                <p className="text-[10px] mt-2 opacity-50">{date} · {depth} · {elapsedStr}</p>
              </div>
            )
          })()}

          {/* AI Conclusion */}
          {generatingConclusion && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[11px] font-mono"
              style={{ borderColor: 'rgba(201,168,76,0.2)', background: 'rgba(201,168,76,0.04)', color: 'var(--text-muted)' }}>
              <span className="animate-pulse" style={{ color: 'var(--gold)' }}>●</span>
              Generando conclusión con IA…
            </div>
          )}
          {conclusion && (
            <div className="card">
              <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: 'var(--gold)' }}>ANÁLISIS IA</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{conclusion}</p>
            </div>
          )}

          {/* Agent completion */}
          <div className="card">
            <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: 'var(--gold)' }}>AGENTES COMPLETADOS</p>
            <AgentTimeline elapsed={elapsed} estSecs={depthOpt.estSecs} running={false} done={true} />
          </div>

          {/* Activity log */}
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

          <button onClick={reset} className="px-5 py-2.5 text-xs font-mono tracking-widest rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--gold-dark)]">
            NUEVO ANÁLISIS
          </button>
        </div>
      )}

      {/* Error */}
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
