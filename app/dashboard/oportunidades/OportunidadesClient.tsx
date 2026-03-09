'use client'

import { useState } from 'react'

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

// ─── Print / download helper ───────────────────────────────────────────────────
function printReport(opp: Opportunity) {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <title>Informe — ${opp.ticker}</title>
    <style>
      body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:0 24px;color:#111;line-height:1.7}
      h1{font-size:24px;margin-bottom:4px} h2{font-size:14px;color:#555;margin-bottom:24px;font-weight:normal}
      .badge{display:inline-block;background:#111;color:#C9A84C;border:1px solid #C9A84C;border-radius:4px;padding:2px 10px;font-size:12px;margin-right:8px}
      .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;border:1px solid #ddd;border-radius:8px;padding:16px;margin:24px 0}
      .cell{text-align:center} .cell-label{font-size:11px;color:#777;text-transform:uppercase;letter-spacing:.05em}
      .cell-value{font-size:18px;font-weight:bold;margin-top:4px}
      .report{white-space:pre-wrap;font-size:14px;line-height:1.8}
      .footer{margin-top:40px;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:16px}
      @media print{body{margin:0}}
    </style>
  </head><body>
    <h1>${opp.ticker} — ${opp.instrumento}</h1>
    <h2>${opp.title}</h2>
    <div>
      <span class="badge">${opp.direction}</span>
      <span class="badge">${opp.tipo}</span>
      <span class="badge">${opp.timeframe} PLAZO</span>
      <span class="badge">RIESGO ${opp.riesgo}</span>
    </div>
    <div class="grid">
      <div class="cell"><div class="cell-label">Entrada</div><div class="cell-value">$${opp.precioEntrada}</div></div>
      <div class="cell"><div class="cell-label">Objetivo</div><div class="cell-value" style="color:#16a34a">$${opp.precioObjetivo}</div></div>
      <div class="cell"><div class="cell-label">Stop Loss</div><div class="cell-value" style="color:#dc2626">$${opp.stopLoss}</div></div>
    </div>
    <div class="report">${opp.aiReport ?? opp.description}</div>
    <div class="footer">Liberty Trading Pro · ${new Date(opp.publishedAt).toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'})} · Análisis generado con IA</div>
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
      <div className="grid grid-cols-3 gap-2 mb-3">
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
      {expanded && opp.aiReport && (
        <div
          className="mt-4 pt-4 border-t border-[var(--border)] text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto"
          style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '16px' }}
        >
          {opp.aiReport}
        </div>
      )}
    </div>
  )
}

// ─── Admin form ───────────────────────────────────────────────────────────────
function AdminForm({ onCreated }: { onCreated: (opp: Opportunity) => void }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '', ticker: '', instrumento: '', tipo: 'ACCION', direction: 'COMPRA',
    precioEntrada: '', precioObjetivo: '', stopLoss: '',
    timeframe: 'MEDIANO', riesgo: 'MEDIO', description: '', minPlan: 'CLUB',
  })

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          precioEntrada: parseFloat(form.precioEntrada),
          precioObjetivo: parseFloat(form.precioObjetivo),
          stopLoss: parseFloat(form.stopLoss),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al crear')
      onCreated(data.opportunity)
      setOpen(false)
      setForm({ title: '', ticker: '', instrumento: '', tipo: 'ACCION', direction: 'COMPRA',
        precioEntrada: '', precioObjetivo: '', stopLoss: '',
        timeframe: 'MEDIANO', riesgo: 'MEDIO', description: '', minPlan: 'CLUB' })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally { setSaving(false) }
  }

  const inputCls = 'w-full bg-black/30 border border-[var(--border)] text-[var(--text-primary)] text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--gold)] transition-colors'
  const selectCls = inputCls + ' cursor-pointer'

  return (
    <div className="mb-8">
      <button
        onClick={() => setOpen(!open)}
        className="btn-gold rounded-xl px-6 py-2 text-sm font-bold"
      >
        {open ? '✕ Cancelar' : '+ Nueva oportunidad'}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="card mt-4 space-y-4">
          <h3 className="font-bold text-[var(--gold)] text-sm uppercase tracking-widest mb-2">
            Nueva alerta de inversión
          </h3>

          {error && (
            <p className="text-red-400 text-xs border border-red-900 bg-red-950/50 rounded px-3 py-2">{error}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1 font-mono uppercase">Título de la alerta *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} required placeholder="Ej: AAPL rompimiento canal alcista" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1 font-mono uppercase">Ticker *</label>
              <input value={form.ticker} onChange={e => set('ticker', e.target.value.toUpperCase())} required placeholder="AAPL" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1 font-mono uppercase">Nombre del instrumento *</label>
              <input value={form.instrumento} onChange={e => set('instrumento', e.target.value)} required placeholder="Apple Inc." className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1 font-mono uppercase">Tipo</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className={selectCls}>
                {['ACCION','ETF','CRIPTO','FOREX'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1 font-mono uppercase">Dirección</label>
              <select value={form.direction} onChange={e => set('direction', e.target.value)} className={selectCls}>
                <option value="COMPRA">COMPRA (Long)</option>
                <option value="VENTA">VENTA (Short)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1 font-mono uppercase">Precio de entrada *</label>
              <input type="number" step="0.01" value={form.precioEntrada} onChange={e => set('precioEntrada', e.target.value)} required placeholder="185.50" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1 font-mono uppercase">Precio objetivo *</label>
              <input type="number" step="0.01" value={form.precioObjetivo} onChange={e => set('precioObjetivo', e.target.value)} required placeholder="210.00" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1 font-mono uppercase">Stop Loss *</label>
              <input type="number" step="0.01" value={form.stopLoss} onChange={e => set('stopLoss', e.target.value)} required placeholder="178.00" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1 font-mono uppercase">Horizonte temporal</label>
              <select value={form.timeframe} onChange={e => set('timeframe', e.target.value)} className={selectCls}>
                <option value="CORTO">CORTO (días/semanas)</option>
                <option value="MEDIANO">MEDIANO (semanas/meses)</option>
                <option value="LARGO">LARGO (meses/años)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1 font-mono uppercase">Nivel de riesgo</label>
              <select value={form.riesgo} onChange={e => set('riesgo', e.target.value)} className={selectCls}>
                <option value="BAJO">BAJO</option>
                <option value="MEDIO">MEDIO</option>
                <option value="ALTO">ALTO</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1 font-mono uppercase">Plan mínimo requerido</label>
              <select value={form.minPlan} onChange={e => set('minPlan', e.target.value)} className={selectCls}>
                <option value="CLUB">CLUB</option>
                <option value="PRO">PRO</option>
                <option value="PORTFOLIO">PORTFOLIO</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1 font-mono uppercase">Resumen / tesis del analista *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} required rows={3}
              placeholder="Describe brevemente la tesis de inversión, por qué es interesante este activo..."
              className={inputCls + ' resize-none'} />
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="btn-gold rounded-xl px-8 py-2 text-sm font-bold disabled:opacity-50">
              {saving ? '⏳ Generando informe con IA...' : '🤖 Crear + Generar informe'}
            </button>
            <p className="text-xs text-[var(--text-muted)]">
              {saving ? 'La IA está buscando información y redactando el informe. Puede tardar 20-40 seg.' : 'La IA buscará datos financieros y redactará el informe completo automáticamente.'}
            </p>
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
    await fetch(`/api/opportunities/${id}`, { method: 'DELETE' })
    setOpportunities(prev => prev.filter(o => o.id !== id))
  }

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/opportunities/${id}`, {
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
