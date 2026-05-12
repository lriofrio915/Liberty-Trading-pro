'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface Suggestion {
  symbol: string
  name: string
  exchange: string
  type: string
  sector: string
}

interface ForecastData {
  symbol: string
  last_price: number
  prices_history: number[]
  dates_history: string[]
  forecast: number[]
  quantile_p10: number[]
  quantile_p90: number[]
  forecast_dates: string[]
  horizon: number
}

const HORIZONS = [
  { value: 7,  label: '7 días'  },
  { value: 14, label: '14 días' },
  { value: 30, label: '30 días' },
]

const HISTORY_DISPLAY = 60  // last N candles shown in chart

function fmt(n: number): string {
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (n >= 1) return n.toFixed(4)
  return n.toFixed(6)
}

function pct(a: number, b: number): string {
  const p = ((b - a) / a) * 100
  return (p >= 0 ? '+' : '') + p.toFixed(2) + '%'
}

// ── SVG Forecast Chart ─────────────────────────────────────────────────────────

function ForecastChart({ data }: { data: ForecastData }) {
  const W = 800, H = 260, PAD = { top: 16, right: 24, bottom: 40, left: 68 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const hist   = data.prices_history.slice(-HISTORY_DISPLAY)
  const hDates = data.dates_history.slice(-HISTORY_DISPLAY)
  const fcast  = data.forecast
  const p10    = data.quantile_p10
  const p90    = data.quantile_p90
  const fDates = data.forecast_dates

  const allPrices = [...hist, ...fcast, ...p10, ...p90]
  const minP = Math.min(...allPrices) * 0.995
  const maxP = Math.max(...allPrices) * 1.005
  const totalPoints = hist.length + fcast.length

  function xOf(i: number): number {
    return PAD.left + (i / (totalPoints - 1)) * innerW
  }
  function yOf(v: number): number {
    return PAD.top + innerH - ((v - minP) / (maxP - minP)) * innerH
  }

  // Build SVG path strings
  function linePath(arr: number[], offset = 0): string {
    return arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${xOf(offset + i).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ')
  }

  // Confidence band polygon
  const bandPath = [
    ...p90.map((v, i) => `${i === 0 ? 'M' : 'L'}${xOf(hist.length + i).toFixed(1)},${yOf(v).toFixed(1)}`),
    ...[...p10].reverse().map((v, i) => `L${xOf(hist.length + p10.length - 1 - i).toFixed(1)},${yOf(v).toFixed(1)}`),
    'Z',
  ].join(' ')

  // Y axis ticks
  const ticks = 5
  const yTicks = Array.from({ length: ticks }, (_, i) => minP + (i / (ticks - 1)) * (maxP - minP))

  // X axis labels (every ~15 points)
  const allDates = [...hDates, ...fDates]
  const xLabels: { i: number; label: string }[] = []
  const step = Math.max(1, Math.floor(totalPoints / 6))
  for (let i = 0; i < totalPoints; i += step) {
    const d = allDates[i]
    if (d) xLabels.push({ i, label: d.slice(5) }) // MM-DD
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: '400px' }}>
        {/* Grid lines */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={yOf(v)} x2={W - PAD.right} y2={yOf(v)}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={PAD.left - 6} y={yOf(v) + 4} textAnchor="end"
              fontSize="10" fill="rgba(255,255,255,0.35)" fontFamily="monospace">
              {fmt(v)}
            </text>
          </g>
        ))}

        {/* Separator line at forecast start */}
        <line x1={xOf(hist.length - 1)} y1={PAD.top} x2={xOf(hist.length - 1)} y2={H - PAD.bottom}
          stroke="rgba(201,168,76,0.3)" strokeWidth="1" strokeDasharray="4 4" />
        <text x={xOf(hist.length - 1) + 4} y={PAD.top + 10}
          fontSize="9" fill="rgba(201,168,76,0.6)" fontFamily="monospace">
          HOY
        </text>

        {/* Confidence band */}
        <path d={bandPath} fill="rgba(56,189,248,0.08)" />

        {/* p10 / p90 dashed lines */}
        <path d={linePath(p90, hist.length)} fill="none"
          stroke="rgba(56,189,248,0.3)" strokeWidth="1" strokeDasharray="3 3" />
        <path d={linePath(p10, hist.length)} fill="none"
          stroke="rgba(56,189,248,0.3)" strokeWidth="1" strokeDasharray="3 3" />

        {/* Historical line */}
        <path d={linePath(hist)} fill="none" stroke="rgb(201,168,76)" strokeWidth="2" />

        {/* Forecast line */}
        <path d={linePath([hist[hist.length - 1], ...fcast], hist.length - 1)}
          fill="none" stroke="var(--gold)" strokeWidth="2" strokeDasharray="6 3" />

        {/* X axis labels */}
        {xLabels.map(({ i, label }) => (
          <text key={i} x={xOf(i)} y={H - PAD.bottom + 14}
            textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.35)" fontFamily="monospace"
            className={i >= hist.length ? 'fill-[var(--gold)]/60' : ''}>
            {label}
          </text>
        ))}

        {/* Last price dot */}
        <circle cx={xOf(hist.length - 1)} cy={yOf(hist[hist.length - 1])}
          r={4} fill="rgb(201,168,76)" />

        {/* Forecast end dot */}
        <circle cx={xOf(totalPoints - 1)} cy={yOf(fcast[fcast.length - 1])}
          r={4} fill="var(--gold)" />
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-2 px-2 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0.5 bg-[rgb(201,168,76)]" />
          <span>Histórico</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0.5 bg-[var(--gold)] opacity-80" style={{ backgroundImage: 'repeating-linear-gradient(to right, var(--gold) 0, var(--gold) 6px, transparent 6px, transparent 9px)' }} />
          <span>Pronóstico (media)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded-sm" style={{ background: 'rgba(56,189,248,0.15)', border: '1px dashed rgba(56,189,248,0.4)' }} />
          <span>Banda p10-p90</span>
        </div>
      </div>
    </div>
  )
}

// ── Main ForecastTab ───────────────────────────────────────────────────────────

export default function ForecastTab() {
  const [serverOnline, setServerOnline] = useState<boolean | null>(null)
  const [ticker, setTicker]     = useState('')
  const [tickerQuery, setQuery] = useState('')
  const [suggestions, setSugg]  = useState<Suggestion[]>([])
  const [showDrop, setShowDrop] = useState(false)
  const [horizon, setHorizon]   = useState(14)
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState<ForecastData | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef     = useRef<HTMLDivElement | null>(null)

  // Click outside closes dropdown
  useEffect(() => {
    function h(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShowDrop(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Check server health on mount
  useEffect(() => {
    fetch('/api/forecast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ check: true }) })
      .then(r => r.json())
      .then(d => setServerOnline(d?.online === true))
      .catch(() => setServerOnline(false))
  }, [])

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 2) { setSugg([]); setShowDrop(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/flujo/search?q=${encodeURIComponent(q)}`)
        if (!r.ok) return
        const d = await r.json() as { suggestions?: Suggestion[] }
        const s = d.suggestions ?? []
        setSugg(s)
        setShowDrop(s.length > 0)
      } catch {}
    }, 280)
  }, [])

  function onQueryChange(v: string) {
    setQuery(v)
    setTicker('')
    search(v)
  }

  function select(s: Suggestion) {
    setTicker(s.symbol)
    setQuery(s.symbol)
    setSugg([])
    setShowDrop(false)
  }

  async function generate() {
    if (!ticker) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const r = await fetch(`/api/forecast?symbol=${encodeURIComponent(ticker)}&horizon=${horizon}`)
      const d = await r.json()
      if (!r.ok) { setError(d.error ?? `Error ${r.status}`); return }
      setResult(d as ForecastData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const lastPrice  = result?.last_price ?? 0
  const fcstEnd    = result ? result.forecast[result.forecast.length - 1] : 0
  const pctChange  = result ? pct(lastPrice, fcstEnd) : ''
  const direction  = result
    ? fcstEnd > lastPrice * 1.005 ? 'ALCISTA'
    : fcstEnd < lastPrice * 0.995 ? 'BAJISTA'
    : 'LATERAL'
    : ''
  const dirColor = direction === 'ALCISTA' ? '#4ade80' : direction === 'BAJISTA' ? '#f87171' : '#facc15'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border p-5" style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.05) 0%, transparent 70%)', borderColor: 'rgba(56,189,248,0.2)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: 'var(--gold)' }}>
              FORECAST IA — TIMESFM (GOOGLE RESEARCH)
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Pronóstico numérico de precio basado en TimesFM-200M, modelo de series temporales
              entrenado en 100B puntos de datos de Google Research. Inferencia en CPU, sin GPU requerida.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono
              ${serverOnline === true  ? 'border-green-500/40 text-green-400 bg-green-500/10' : ''}
              ${serverOnline === false ? 'border-red-500/40 text-red-400 bg-red-500/10' : ''}
              ${serverOnline === null  ? 'border-[var(--border)] text-[var(--text-muted)]' : ''}
            `}>
              <span className={`w-1.5 h-1.5 rounded-full ${serverOnline === true ? 'bg-green-400 animate-pulse' : serverOnline === false ? 'bg-red-400' : 'bg-[var(--text-muted)] animate-pulse'}`} />
              {serverOnline === true ? 'ONLINE' : serverOnline === false ? 'OFFLINE' : '…'}
            </div>
            {serverOnline === false && (
              <p className="text-[9px] font-mono text-center" style={{ color: 'var(--text-muted)' }}>
                Cold start ~60s
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card space-y-4">
        <p className="text-[10px] font-mono tracking-widest" style={{ color: 'var(--gold)' }}>CONFIGURAR PRONÓSTICO</p>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Ticker autocomplete */}
          <div>
            <label className="text-[10px] font-mono tracking-widest block mb-1.5" style={{ color: 'var(--text-muted)' }}>
              ACCIÓN O TICKER
            </label>
            <div className="relative" ref={wrapRef}>
              <input
                type="text"
                value={tickerQuery}
                onChange={e => onQueryChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && ticker) generate(); if (e.key === 'Escape') setShowDrop(false) }}
                onFocus={() => suggestions.length > 0 && setShowDrop(true)}
                placeholder="Busca empresa o ticker (ej. Apple, AAPL)…"
                autoComplete="off"
                className="w-full bg-[var(--bg-card)] border border-[var(--border)] text-sm px-3 py-2 rounded-lg focus:outline-none font-mono pr-7"
                style={{ color: ticker ? 'var(--gold)' : 'var(--text-secondary)', borderColor: ticker ? 'rgba(201,168,76,0.4)' : undefined }}
              />
              {ticker && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: 'var(--gold)' }}>✓</span>}

              {showDrop && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 rounded-lg border overflow-hidden shadow-xl"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  {suggestions.map((s, i) => (
                    <button key={s.symbol} onMouseDown={e => { e.preventDefault(); select(s) }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}>
                      <span className="font-mono text-xs font-bold flex-shrink-0 w-14" style={{ color: 'var(--gold)' }}>{s.symbol}</span>
                      <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
                      <span className="ml-auto text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{s.exchange}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Horizon */}
          <div>
            <label className="text-[10px] font-mono tracking-widest block mb-1.5" style={{ color: 'var(--text-muted)' }}>HORIZONTE DE PRONÓSTICO</label>
            <div className="grid grid-cols-3 gap-2">
              {HORIZONS.map(h => (
                <button key={h.value} onClick={() => setHorizon(h.value)}
                  className={`py-2 text-xs font-mono rounded-lg border transition-all ${horizon === h.value ? 'text-black border-[var(--gold)] bg-[var(--gold)]' : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--gold-dark)]'}`}>
                  {h.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          disabled={!ticker || loading}
          onClick={generate}
          className="w-full py-3 text-sm font-mono tracking-widest rounded-xl font-bold disabled:opacity-40 transition-opacity hover:opacity-90"
          style={{ background: 'var(--gold)', color: '#000' }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generando pronóstico…
            </span>
          ) : `GENERAR PRONÓSTICO ${ticker || '—'} →`}
        </button>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm text-red-400 font-mono">⚠ {error}</p>
          </div>
        )}
      </div>

      {/* Results */}
      {result && !loading && (
        <>
          {/* Metric summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Precio Actual', value: `$${fmt(lastPrice)}`, color: 'var(--text-primary)' },
              { label: `Pronóstico ${result.horizon}d`, value: `$${fmt(fcstEnd)}`, sub: pctChange, color: dirColor },
              { label: 'Mínimo Probable (p10)', value: `$${fmt(result.quantile_p10[result.quantile_p10.length - 1])}`, color: '#f87171' },
              { label: 'Máximo Probable (p90)', value: `$${fmt(result.quantile_p90[result.quantile_p90.length - 1])}`, color: '#4ade80' },
            ].map(c => (
              <div key={c.label} className="card py-3">
                <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{c.label}</p>
                <p className="text-lg font-black font-mono" style={{ color: c.color }}>{c.value}</p>
                {c.sub && <p className="text-[11px] font-mono mt-0.5" style={{ color: c.color }}>{c.sub}</p>}
              </div>
            ))}
          </div>

          {/* Direction badge */}
          <div className="rounded-xl border p-4 flex items-center gap-4"
            style={{ borderColor: `${dirColor}40`, background: `${dirColor}08` }}>
            <div className="text-2xl font-black font-mono" style={{ color: dirColor }}>
              {direction === 'ALCISTA' ? '▲' : direction === 'BAJISTA' ? '▼' : '◆'} {direction}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              TimesFM estima que {result.symbol} {direction === 'ALCISTA' ? 'subirá' : direction === 'BAJISTA' ? 'bajará' : 'se mantendrá lateral'}{' '}
              un <span style={{ color: dirColor, fontWeight: 'bold' }}>{pctChange}</span> en los próximos {result.horizon} días.{' '}
              Rango probable: ${fmt(result.quantile_p10[result.quantile_p10.length - 1])} — ${fmt(result.quantile_p90[result.quantile_p90.length - 1])}.
            </div>
          </div>

          {/* Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-mono tracking-widest" style={{ color: 'var(--gold)' }}>
                GRÁFICO — {result.symbol} · {HISTORY_DISPLAY}d histórico + {result.horizon}d pronóstico
              </p>
              <p className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>TimesFM-200M</p>
            </div>
            <ForecastChart data={result} />
          </div>

          <p className="text-[10px] text-center font-mono" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
            Pronóstico generado con TimesFM (Google Research, 2024) · Solo referencia — no es asesoramiento financiero
          </p>
        </>
      )}
    </div>
  )
}
