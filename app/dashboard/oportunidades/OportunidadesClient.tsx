'use client'

import { useState, useEffect, useRef } from 'react'

interface ReportJSON {
  ticker: string
  empresa: string
  bolsa: string
  precio_actual: string
  precio_objetivo: string
  informe_numero: string
  resumen: string
  negocio: string
  fuentes_ingresos: string[][]
  financieros: string
  valoracion: string
  factores_positivos: string[][]
  factores_riesgo: string[][]
  conclusion: string
  mes_año: string
}

interface Opportunity {
  id: string
  title: string
  ticker: string
  instrumento: string
  tipo: string
  direction: string
  precioEntrada: number
  precioObjetivo: number
  stopLoss: number
  timeframe: string
  riesgo: string
  description: string
  aiReport: string | null
  publishedAt: string
  status: string
  active: boolean
  minPlan: string
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVA:              'bg-green-950 text-green-400',
  OBJETIVO_ALCANZADO:  'bg-blue-950 text-blue-400',
  STOP_ACTIVADO:       'bg-red-950 text-red-400',
  CANCELADA:           'bg-gray-800 text-gray-400',
}
const STATUS_LABELS: Record<string, string> = {
  ACTIVA:              '● Activa',
  OBJETIVO_ALCANZADO:  '✓ Objetivo',
  STOP_ACTIVADO:       '✕ Stop',
  CANCELADA:           '○ Cancelada',
}
const RIESGO_COLOR: Record<string, string> = {
  BAJO: 'text-green-400', MEDIO: 'text-yellow-400', ALTO: 'text-red-400',
}

// ─── Parse aiReport safely ────────────────────────────────────────────────────
function parseReport(raw: string | null): ReportJSON | null {
  if (!raw) return null
  try { return JSON.parse(raw) as ReportJSON } catch { return null }
}

// ─── Print / download helper ───────────────────────────────────────────────────
function printReport(opp: Opportunity) {
  const win = window.open('', '_blank')
  if (!win) return
  const r = parseReport(opp.aiReport)

  const tableRows = (rows: string[][], headerStyle = '') =>
    rows.map((row, i) =>
      `<tr style="${i === 0 ? headerStyle : ''}">${row.map(c => `<td style="padding:6px 10px;border:1px solid #ddd">${c}</td>`).join('')}</tr>`
    ).join('')

  const body = r ? `
    <h2 style="color:#C9A84C;font-size:18px;margin:0 0 4px">Informe de Inversión — ${r.ticker}</h2>
    <p style="color:#555;font-size:13px;margin:0 0 20px">${r.empresa} · ${r.bolsa} · ${r.mes_año}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;border:1px solid #ddd;border-radius:8px;padding:16px;margin:0 0 24px">
      <div><div style="font-size:11px;color:#777;text-transform:uppercase">Precio Actual</div><div style="font-size:20px;font-weight:bold">$${r.precio_actual}</div></div>
      <div><div style="font-size:11px;color:#777;text-transform:uppercase">Precio Objetivo</div><div style="font-size:20px;font-weight:bold;color:#16a34a">$${r.precio_objetivo}</div></div>
    </div>
    <h3 style="font-size:13px;text-transform:uppercase;color:#C9A84C;letter-spacing:.05em;margin:24px 0 8px">Resumen Ejecutivo</h3>
    <p style="font-size:14px;line-height:1.7;margin:0 0 20px">${r.resumen}</p>
    <h3 style="font-size:13px;text-transform:uppercase;color:#C9A84C;letter-spacing:.05em;margin:24px 0 8px">El Negocio</h3>
    <p style="font-size:14px;line-height:1.7;margin:0 0 20px;white-space:pre-wrap">${r.negocio}</p>
    <h3 style="font-size:13px;text-transform:uppercase;color:#C9A84C;letter-spacing:.05em;margin:24px 0 8px">Histórico Financiero</h3>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px;font-size:13px">${tableRows(r.fuentes_ingresos, 'background:#f5f5f5;font-weight:bold')}</table>
    <h3 style="font-size:13px;text-transform:uppercase;color:#C9A84C;letter-spacing:.05em;margin:24px 0 8px">Análisis Financiero</h3>
    <p style="font-size:14px;line-height:1.7;margin:0 0 20px;white-space:pre-wrap">${r.financieros}</p>
    <h3 style="font-size:13px;text-transform:uppercase;color:#C9A84C;letter-spacing:.05em;margin:24px 0 8px">Valoración y Consenso</h3>
    <p style="font-size:14px;line-height:1.7;margin:0 0 20px;white-space:pre-wrap">${r.valoracion}</p>
    <h3 style="font-size:13px;text-transform:uppercase;color:#16a34a;letter-spacing:.05em;margin:24px 0 8px">Factores Positivos</h3>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px;font-size:13px">${tableRows(r.factores_positivos)}</table>
    <h3 style="font-size:13px;text-transform:uppercase;color:#dc2626;letter-spacing:.05em;margin:24px 0 8px">Factores de Riesgo</h3>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px;font-size:13px">${tableRows(r.factores_riesgo)}</table>
    <h3 style="font-size:13px;text-transform:uppercase;color:#C9A84C;letter-spacing:.05em;margin:24px 0 8px">Conclusión y Recomendación</h3>
    <p style="font-size:14px;line-height:1.7;margin:0 0 20px;white-space:pre-wrap">${r.conclusion}</p>
  ` : `<div style="white-space:pre-wrap;font-size:14px;line-height:1.8">${opp.aiReport ?? opp.description}</div>`

  win.document.write(`<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <title>Informe — ${opp.ticker}</title>
    <style>
      body{font-family:Georgia,serif;max-width:820px;margin:40px auto;padding:0 24px;color:#111;line-height:1.7}
      .footer{margin-top:40px;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:16px}
      @media print{body{margin:0}}
    </style>
  </head><body>
    ${body}
    <div class="footer">Liberty Trading Pro · ${new Date(opp.publishedAt).toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'})} · Análisis generado con IA · Liberty Trading Club</div>
  </body></html>`)
  win.document.close()
  win.print()
}

// ─── Opportunity card ──────────────────────────────────────────────────────────
function OppCard({ opp, isAdmin, onDelete, onStatusChange }: {
  opp: Opportunity
  isAdmin: boolean
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const rr = ((opp.precioObjetivo - opp.precioEntrada) / (opp.precioEntrada - opp.stopLoss)).toFixed(1)
  const potencial = (((opp.precioObjetivo - opp.precioEntrada) / opp.precioEntrada) * 100).toFixed(1)

  return (
    <div className={`card flex flex-col gap-0 transition-all ${!opp.active ? 'opacity-60' : ''}`}>
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl font-black text-[var(--gold)]">{opp.ticker}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              opp.direction === 'COMPRA' ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'
            }`}>{opp.direction}</span>
            <span className="text-xs text-[var(--text-muted)] font-mono">{opp.tipo}</span>
          </div>
          <p className="text-sm font-semibold mt-0.5 text-[var(--text-primary)]">{opp.title}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{opp.instrumento}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[opp.status] ?? STATUS_COLORS.ACTIVA}`}>
          {STATUS_LABELS[opp.status] ?? opp.status}
        </span>
      </div>

      {/* Price grid */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {[
          { label: 'Entrada', value: `$${opp.precioEntrada}`, color: '' },
          { label: 'Objetivo', value: `$${opp.precioObjetivo}`, color: 'text-green-400' },
          { label: 'Stop Loss', value: `$${opp.stopLoss}`, color: 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center py-2 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
            <p className="text-[10px] text-[var(--text-muted)] font-mono uppercase">{label}</p>
            <p className={`text-sm font-bold mt-0.5 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-muted)] mb-3 flex-wrap">
        <span>RR: <span className="text-[var(--gold)]">{rr}x</span></span>
        <span>Potencial: <span className="text-green-400">+{potencial}%</span></span>
        <span className={RIESGO_COLOR[opp.riesgo]}>Riesgo {opp.riesgo}</span>
        <span>{opp.timeframe} plazo</span>
        <span className="ml-auto text-[var(--text-muted)]">
          {new Date(opp.publishedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {/* Summary */}
      <p className="text-sm text-[var(--text-secondary)] mb-3 leading-relaxed">{opp.description}</p>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap mt-auto pt-3 border-t border-[var(--border)]">
        {opp.aiReport && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs font-mono text-[var(--gold)] hover:text-[var(--gold-light)] transition-colors"
            >
              {expanded ? '▲ Ocultar informe' : '▼ Ver informe completo'}
            </button>
            <button
              onClick={() => printReport(opp)}
              className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors ml-auto"
            >
              ↓ Descargar PDF
            </button>
          </>
        )}

        {isAdmin && (
          <div className="flex gap-2 ml-auto flex-wrap">
            <select
              value={opp.status}
              onChange={(e) => onStatusChange(opp.id, e.target.value)}
              className="text-xs bg-black/40 border border-[var(--border)] text-[var(--text-secondary)] px-2 py-1 rounded"
            >
              <option value="ACTIVA">Activa</option>
              <option value="OBJETIVO_ALCANZADO">Objetivo alcanzado</option>
              <option value="STOP_ACTIVADO">Stop activado</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
            <button
              onClick={() => onDelete(opp.id)}
              className="text-xs text-red-500 hover:text-red-400 font-mono border border-red-900 px-2 py-1 rounded transition-colors"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>

      {/* Expanded AI report */}
      {expanded && opp.aiReport && (() => {
        const r = parseReport(opp.aiReport)
        if (!r) return (
          <div className="mt-4 pt-4 border-t border-[var(--border)] text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto"
            style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '16px' }}>
            {opp.aiReport}
          </div>
        )
        return (
          <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-5 text-sm">
            {/* Header */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Precio Actual</div>
                <div className="text-lg font-bold font-mono" style={{ color: 'var(--text-primary)' }}>${r.precio_actual}</div>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Precio Objetivo</div>
                <div className="text-lg font-bold font-mono text-green-400">${r.precio_objetivo}</div>
              </div>
            </div>

            {/* Resumen */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>Resumen Ejecutivo</p>
              <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{r.resumen}</p>
            </div>

            {/* Negocio */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>El Negocio</p>
              <p className="leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{r.negocio}</p>
            </div>

            {/* Histórico financiero */}
            {r.fuentes_ingresos?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>Histórico Financiero</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    {r.fuentes_ingresos.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i === 0 ? 'var(--bg-hover)' : 'transparent' }}>
                        {row.map((cell, j) => (
                          <td key={j} className={`px-3 py-2 ${i === 0 ? 'font-bold' : ''}`} style={{ color: i === 0 ? 'var(--text-muted)' : 'var(--text-secondary)' }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </table>
                </div>
              </div>
            )}

            {/* Financieros */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>Análisis Financiero</p>
              <p className="leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{r.financieros}</p>
            </div>

            {/* Valoración */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>Valoración y Consenso</p>
              <p className="leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{r.valoracion}</p>
            </div>

            {/* Factores positivos */}
            {r.factores_positivos?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-green-400">Factores Positivos</p>
                <div className="space-y-2">
                  {r.factores_positivos.map(([titulo, desc], i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-green-400 flex-shrink-0">▲</span>
                      <div><span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{titulo}:</span>{' '}
                        <span style={{ color: 'var(--text-secondary)' }}>{desc}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Factores de riesgo */}
            {r.factores_riesgo?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-red-400">Factores de Riesgo</p>
                <div className="space-y-2">
                  {r.factores_riesgo.map(([titulo, desc], i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-red-400 flex-shrink-0">▼</span>
                      <div><span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{titulo}:</span>{' '}
                        <span style={{ color: 'var(--text-secondary)' }}>{desc}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conclusión */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>Conclusión y Recomendación</p>
              <p className="leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{r.conclusion}</p>
            </div>

            <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
              Liberty Trading Club · Informe generado con IA · {r.mes_año}
            </p>
          </div>
        )
      })()}
    </div>
  )
}

interface Suggestion { symbol: string; name: string; exchange: string }

// ─── Admin form ───────────────────────────────────────────────────────────────
function AdminForm({ onCreated }: { onCreated: (opp: Opportunity) => void }) {
  const [open, setOpen]           = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [query, setQuery]         = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected]   = useState<Suggestion | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef  = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setSuggestions([])
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Search suggestions as user types
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = query.trim()
    if (q.length < 1) { setSuggestions([]); return }
    if (selected && selected.symbol === q.toUpperCase()) return  // already selected
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/picks/search?q=${encodeURIComponent(q)}`)
        const json = await res.json()
        setSuggestions(res.ok ? (json.suggestions ?? []) : [])
      } catch { setSuggestions([]) }
      finally { setSearching(false) }
    }, 400)
  }, [query, selected])

  function pickSuggestion(s: Suggestion) {
    setSelected(s)
    setQuery(s.symbol)
    setSuggestions([])
  }

  function reset() {
    setQuery(''); setSelected(null); setSuggestions([])
    setError(null); setOpen(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const ticker = selected?.symbol ?? query.trim().toUpperCase()
    if (!ticker) return
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al crear')
      onCreated(data.opportunity)
      reset()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally { setSaving(false) }
  }

  const inputCls = 'w-full bg-black/30 border border-[var(--border)] text-[var(--text-primary)] text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--gold)] transition-colors'

  return (
    <div className="mb-8">
      <button onClick={() => setOpen(!open)} className="btn-gold rounded-xl px-6 py-2 text-sm font-bold">
        {open ? '✕ Cancelar' : '+ Generar Informe de Inversión'}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="card mt-4 space-y-5 max-w-lg">
          <div>
            <h3 className="font-bold text-[var(--gold)] text-sm uppercase tracking-widest mb-0.5">
              Nuevo Informe de Inversión
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Busca por empresa o ticker — los datos se obtienen de Yahoo Finance automáticamente
            </p>
          </div>

          {error && (
            <p className="text-red-400 text-xs border border-red-900 bg-red-950/50 rounded px-3 py-2">{error}</p>
          )}

          {/* Search box with dropdown */}
          <div ref={wrapperRef} className="relative">
            <div className="relative">
              <input
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(null) }}
                required
                autoComplete="off"
                placeholder="Busca empresa o ticker: Apple, NVDA, Tesla..."
                className={inputCls + ' pr-10'}
                disabled={saving}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {searching ? (
                  <svg className="animate-spin h-4 w-4" style={{ color: 'var(--gold)' }} viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : selected ? (
                  <span className="text-green-400 text-sm">✓</span>
                ) : null}
              </div>
            </div>

            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-xl"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                {suggestions.map(s => (
                  <button
                    key={s.symbol}
                    type="button"
                    onClick={() => pickSuggestion(s)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                  >
                    <span className="font-mono font-bold text-sm min-w-[56px]" style={{ color: 'var(--gold)' }}>
                      {s.symbol}
                    </span>
                    <span className="text-sm flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
                      {s.name}
                    </span>
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {s.exchange}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected company preview */}
          {selected && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)' }}>
              <span className="font-mono font-black text-lg" style={{ color: 'var(--gold)' }}>{selected.symbol}</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{selected.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selected.exchange}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving || (!selected && !query.trim())}
              className="btn-gold rounded-xl px-8 py-2.5 text-sm font-bold disabled:opacity-50"
            >
              {saving ? '⏳ Generando informe...' : '🤖 Generar Informe'}
            </button>
            {saving && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Obteniendo datos de Yahoo Finance y generando con IA. ~30-60 seg.
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  )
}

// ─── Main export ───────────────────────────────────────────────────────────────
export default function OportunidadesClient({
  initialOpportunities,
  plan,
  isAdmin,
}: {
  initialOpportunities: Opportunity[]
  plan: string
  isAdmin: boolean
}) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities)

  const handleCreated = (opp: Opportunity) => {
    setOpportunities(prev => [opp, ...prev])
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta oportunidad?')) return
    await fetch(`/api/picks/${id}`, { method: 'DELETE' })
    setOpportunities(prev => prev.filter(o => o.id !== id))
  }

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/picks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, active: status === 'ACTIVA' }),
    })
    setOpportunities(prev => prev.map(o =>
      o.id === id ? { ...o, status, active: status === 'ACTIVA' } : o
    ))
  }

  const activeOpps = isAdmin ? opportunities : opportunities.filter(o => o.active)

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">
            <span className="gradient-gold">Oportunidades</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Alertas de inversión analizadas con IA — Plan{' '}
            <span className="text-[var(--gold)] font-bold">{plan}</span>
            {isAdmin && <span className="ml-2 text-xs bg-[var(--gold)] text-black px-2 py-0.5 rounded font-bold">ADMIN</span>}
          </p>
        </div>
      </div>

      {/* Admin form */}
      {isAdmin && <AdminForm onCreated={handleCreated} />}

      {/* Opportunities grid */}
      {activeOpps.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">{isAdmin ? '📭' : '🔒'}</div>
          <h2 className="text-xl font-bold mb-2">
            {isAdmin ? 'No hay oportunidades publicadas' : 'Contenido Premium'}
          </h2>
          <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-md mx-auto">
            {isAdmin
              ? 'Crea la primera alerta de inversión con el formulario de arriba.'
              : 'Las oportunidades de inversión están disponibles para miembros Club y superiores.'}
          </p>
          {!isAdmin && (
            <a href="/dashboard/planes" className="btn-gold inline-block py-3 px-8 rounded-xl">
              Ver Planes →
            </a>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeOpps.map((opp) => (
            <OppCard
              key={opp.id}
              opp={opp}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
