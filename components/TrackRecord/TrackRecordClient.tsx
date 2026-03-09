'use client'

import React, { useState, useMemo, useRef, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Session {
  id: string
  date: string
  instrumento: string
  direccion: string
  resultado: string
  pnlBruto: number
  comisiones: number
  pnlNeto: number
  contratos: number
  entryPrice: number | null
  exitPrice: number | null
  siguioPlan: boolean
  sentimiento: string | null
  notas: string | null
  screenshotUrl: string | null
  planId: string | null
}

interface FormState {
  date: string
  instrumento: string
  direccion: string
  resultado: string
  pnlNeto: string
  contratos: string
  entryPrice: string
  exitPrice: string
  siguioPlan: boolean
  sentimiento: string
  notas: string
  planId: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INSTRUMENTS = ['NQ', 'MNQ', 'BTC', 'ETH', 'Otro']
const RESULTS = ['WIN', 'LOSS', 'BREAKEVEN']
const SENTIMIENTOS = ['Sereno', 'Confiado', 'Ansioso', 'Impulsivo', 'Neutral']
const TZ = 'America/Guayaquil'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Display a DB date string in Guayaquil timezone */
function formatDateGYE(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-EC', {
    timeZone: TZ,
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  })
}

/** Extract "YYYY-MM-DD" from a DB date string in Guayaquil TZ (for form pre-fill) */
function toDateInputGYE(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-CA', { timeZone: TZ })
}

/** Normalize PnL sign: WIN → positive, LOSS → negative, BREAKEVEN → as-is */
function normalizePnl(pnl: number, resultado: string): number {
  const abs = Math.abs(pnl)
  if (resultado === 'WIN') return abs
  if (resultado === 'LOSS') return -abs
  return pnl
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
      <div className="card border-[var(--gold-dark)] px-5 py-3 flex items-center gap-3 shadow-xl">
        <span className="text-[var(--green)] text-lg">✓</span>
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white text-xs ml-2">✕</button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TrackRecordClient({
  initialSessions,
  initialPlans = [],
}: {
  initialSessions: Session[]
  initialPlans: { id: string; name: string }[]
}) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions)

  // Modal mode: null = closed, 'new' = create, 'edit' = edit
  const [modalMode, setModalMode] = useState<'new' | 'edit' | null>(null)
  const [editingSession, setEditingSession] = useState<Session | null>(null)

  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const [planSeleccionado, setPlanSeleccionado] = useState('all')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState('')

  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const blankForm = (): FormState => ({
    date: new Date().toLocaleDateString('en-CA', { timeZone: TZ }),
    instrumento: 'NQ',
    direccion: 'LONG',
    resultado: 'WIN',
    pnlNeto: '',
    contratos: '1',
    entryPrice: '',
    exitPrice: '',
    siguioPlan: true,
    sentimiento: 'Sereno',
    notas: '',
    planId: '',
  })

  const [form, setForm] = useState<FormState>(blankForm())
  const set = (k: keyof FormState, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  // ── Computed ────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return sessions.filter(s => {
      if (planSeleccionado !== 'all' && s.planId !== planSeleccionado) return false
      if (fechaInicio) {
        const d = new Date(s.date).toLocaleDateString('en-CA', { timeZone: TZ })
        if (d < fechaInicio) return false
      }
      if (fechaFin) {
        const d = new Date(s.date).toLocaleDateString('en-CA', { timeZone: TZ })
        if (d > fechaFin) return false
      }
      return true
    })
  }, [sessions, planSeleccionado, fechaInicio, fechaFin])

  const metrics = useMemo(() => {
    const total = filtered.length
    const wins = filtered.filter(s => s.resultado === 'WIN')
    const losses = filtered.filter(s => s.resultado === 'LOSS')
    const winPnls = wins.map(s => normalizePnl(s.pnlNeto ?? 0, s.resultado))
    const lossPnls = losses.map(s => Math.abs(normalizePnl(s.pnlNeto ?? 0, s.resultado)))
    const avgGanador = winPnls.length ? winPnls.reduce((s, p) => s + p, 0) / winPnls.length : 0
    const avgPerdedor = lossPnls.length ? lossPnls.reduce((s, p) => s + p, 0) / lossPnls.length : 0
    const rrPromedio = avgPerdedor > 0 ? avgGanador / avgPerdedor : 0
    return {
      total,
      wins: wins.length,
      winRate: total > 0 ? (wins.length / total) * 100 : 0,
      rrPromedio,
    }
  }, [filtered])

  // ── Handlers ────────────────────────────────────────────────────────────────

  /** When user clicks WIN/LOSS/BREAKEVEN — auto-correct PnL sign */
  const handleResultado = (r: string) => {
    setForm(f => {
      if (f.pnlNeto === '') return { ...f, resultado: r }
      const parsed = parseFloat(f.pnlNeto)
      if (isNaN(parsed)) return { ...f, resultado: r }
      const adjusted = normalizePnl(parsed, r)
      return { ...f, resultado: r, pnlNeto: String(adjusted) }
    })
  }

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScreenshotFile(file)
    setScreenshotPreview(URL.createObjectURL(file))
  }, [])

  const resetScreenshot = () => {
    setScreenshotFile(null)
    setScreenshotPreview('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const openNew = () => {
    setForm(blankForm())
    resetScreenshot()
    setEditingSession(null)
    setModalMode('new')
  }

  const openEdit = (s: Session) => {
    setForm({
      date: toDateInputGYE(s.date),
      instrumento: s.instrumento,
      direccion: s.direccion,
      resultado: s.resultado,
      pnlNeto: String(s.pnlNeto), // keep original sign for display
      contratos: String(s.contratos),
      entryPrice: s.entryPrice != null ? String(s.entryPrice) : '',
      exitPrice: s.exitPrice != null ? String(s.exitPrice) : '',
      siguioPlan: s.siguioPlan,
      sentimiento: s.sentimiento ?? 'Sereno',
      notas: s.notas ?? '',
      planId: s.planId ?? '',
    })
    // Show existing screenshot URL in preview area (no File object)
    setScreenshotFile(null)
    setScreenshotPreview(s.screenshotUrl ?? '')
    setEditingSession(s)
    setModalMode('edit')
  }

  const closeModal = () => {
    setModalMode(null)
    setEditingSession(null)
    setForm(blankForm())
    resetScreenshot()
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  // ── Upload helper ────────────────────────────────────────────────────────────

  const uploadScreenshot = async (): Promise<string | null> => {
    if (!screenshotFile) return null
    const fd = new FormData()
    fd.append('file', screenshotFile)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    return data.url ?? null
  }

  // ── Submit (create or update) ────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.date || !form.instrumento || form.pnlNeto === '') return
    setSaving(true)
    try {
      // Screenshot: new file > existing URL > null
      let screenshotUrl: string | null = null
      if (screenshotFile) {
        screenshotUrl = await uploadScreenshot()
      } else if (screenshotPreview.startsWith('http')) {
        screenshotUrl = screenshotPreview
      }

      const rawPnl = parseFloat(form.pnlNeto)
      const pnlNeto = normalizePnl(rawPnl, form.resultado)

      // Build date at local noon so UTC storage never shifts the day (UTC-5)
      const [fy, fm, fd] = form.date.split('-').map(Number)
      const localNoon = new Date(fy, fm - 1, fd, 12, 0, 0)

      const body = {
        date: localNoon.toISOString(), // ISO string — API stores directly
        instrumento: form.instrumento,
        direccion: form.direccion,
        resultado: form.resultado,
        pnlNeto,
        pnlBruto: pnlNeto,
        comisiones: 0,
        contratos: parseInt(form.contratos || '1'),
        entryPrice: form.entryPrice ? parseFloat(form.entryPrice) : null,
        exitPrice: form.exitPrice ? parseFloat(form.exitPrice) : null,
        siguioPlan: form.siguioPlan,
        sentimiento: form.sentimiento,
        notas: form.notas || null,
        screenshotUrl,
        planId: form.planId || null,
      }

      if (modalMode === 'edit' && editingSession) {
        const res = await fetch(`/api/sessions/${editingSession.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (data.session) {
          setSessions(prev => prev.map(s => s.id === editingSession.id ? data.session : s))
          closeModal()
          showToast('Operación actualizada correctamente')
        } else {
          throw new Error(data.error || 'Error al actualizar')
        }
      } else {
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (data.session) {
          setSessions(prev => [data.session, ...prev])
          closeModal()
          showToast('Operación registrada correctamente')
        } else {
          throw new Error(data.error || 'Error al guardar')
        }
      }
    } catch {
      showToast('Error al guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.ok) {
        setSessions(prev => prev.filter(s => s.id !== id))
        setExpandedRow(null)
        setConfirmDeleteId(null)
        showToast('Operación eliminada')
      }
    } catch {
      showToast('Error al eliminar. Intenta de nuevo.')
    } finally {
      setDeleting(false)
    }
  }

  // ── PnL input color ──────────────────────────────────────────────────────────

  const pnlColor = () => {
    if (form.pnlNeto === '') return 'var(--text-primary)'
    const n = parseFloat(form.pnlNeto)
    if (isNaN(n)) return 'var(--text-primary)'
    return n >= 0 ? 'var(--green)' : 'var(--red)'
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fadeIn">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1"><span className="gradient-gold">Track Record</span></h1>
          <p className="text-[var(--text-secondary)] text-sm">Historial completo de operaciones</p>
        </div>
        <button onClick={openNew} className="btn-gold py-2.5 px-5 rounded-lg text-sm">
          ➕ Nueva Operación
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {initialPlans.length > 0 && (
          <select
            value={planSeleccionado}
            onChange={e => setPlanSeleccionado(e.target.value)}
            className="input text-sm py-1.5 px-3 w-auto"
          >
            <option value="all">Todos los planes</option>
            {initialPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        <div className="flex items-center gap-2">
          <label className="label-mono text-[10px] text-[var(--text-muted)] whitespace-nowrap">Desde:</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={e => setFechaInicio(e.target.value)}
            className="input text-sm py-1.5 px-3 w-auto"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="label-mono text-[10px] text-[var(--text-muted)] whitespace-nowrap">Hasta:</label>
          <input
            type="date"
            value={fechaFin}
            onChange={e => setFechaFin(e.target.value)}
            className="input text-sm py-1.5 px-3 w-auto"
          />
        </div>
        {(planSeleccionado !== 'all' || fechaInicio || fechaFin) && (
          <button
            onClick={() => { setPlanSeleccionado('all'); setFechaInicio(''); setFechaFin('') }}
            className="text-xs text-[var(--text-muted)] hover:text-white border border-[var(--border)] px-3 py-1.5 rounded-lg transition-colors"
          >
            Limpiar ✕
          </button>
        )}
      </div>

      {/* Metrics — 3 cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Win Rate', value: `${metrics.winRate.toFixed(1)}%`, color: metrics.winRate >= 50 ? 'var(--green)' : 'var(--red)' },
          { label: 'Total Trades', value: metrics.total, color: 'var(--gold)' },
          { label: 'RR Promedio', value: `1:${metrics.rrPromedio.toFixed(2)}`, color: 'var(--gold)' },
        ].map(stat => (
          <div key={stat.label} className="card text-center py-4">
            <div className="text-2xl font-black mb-1" style={{ color: stat.color, fontFamily: 'var(--font-serif)' }}>
              {stat.value}
            </div>
            <div className="label-mono text-[10px]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-[var(--text-muted)] text-sm">
              {sessions.length === 0
                ? 'No hay operaciones registradas. ¡Registra tu primera operación!'
                : 'Sin operaciones con los filtros seleccionados.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                  {['Fecha', 'Instrumento', 'Dir.', 'Resultado', 'P&L Neto', 'Contratos', ''].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <React.Fragment key={s.id}>
                    <tr
                      className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      {/* Fecha — timezone-safe */}
                      <td
                        className="py-3 px-4 text-[var(--text-secondary)] whitespace-nowrap cursor-pointer"
                        onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)}
                      >
                        {formatDateGYE(s.date)}
                      </td>
                      <td
                        className="py-3 px-4 font-medium font-mono-custom cursor-pointer"
                        onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)}
                      >
                        {s.instrumento}
                      </td>
                      <td
                        className="py-3 px-4 cursor-pointer"
                        onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)}
                      >
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${s.direccion === 'LONG' ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'}`}>
                          {s.direccion}
                        </span>
                      </td>
                      <td
                        className="py-3 px-4 cursor-pointer"
                        onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)}
                      >
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          s.resultado === 'WIN' ? 'bg-green-950 text-green-400' :
                          s.resultado === 'LOSS' ? 'bg-red-950 text-red-400' :
                          'bg-yellow-950 text-yellow-400'
                        }`}>
                          {s.resultado}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 font-bold font-mono-custom cursor-pointer ${normalizePnl(s.pnlNeto, s.resultado) >= 0 ? 'positive' : 'negative'}`}
                        onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)}
                      >
                        {(() => { const p = normalizePnl(s.pnlNeto, s.resultado); return `${p >= 0 ? '+' : '-'}$${Math.abs(p).toFixed(0)}` })()}
                      </td>
                      <td
                        className="py-3 px-4 text-[var(--text-secondary)] cursor-pointer"
                        onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)}
                      >
                        {s.contratos}
                      </td>
                      {/* Action buttons — always visible */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-0.5 justify-end">
                          <button
                            onClick={e => { e.stopPropagation(); openEdit(s) }}
                            className="p-2 text-gray-400 hover:text-yellow-400 transition-colors rounded"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setConfirmDeleteId(s.id) }}
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded"
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                          <button
                            onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)}
                            className="p-2 text-gray-500 hover:text-gray-300 text-xs transition-colors"
                          >
                            {expandedRow === s.id ? '▲' : '▼'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded details */}
                    {expandedRow === s.id && (
                      <tr className="bg-[var(--bg-secondary)]">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {s.entryPrice != null && (
                              <div>
                                <div className="label-mono text-[9px] mb-0.5">Entrada</div>
                                <div className="text-sm font-mono-custom">{s.entryPrice}</div>
                              </div>
                            )}
                            {s.exitPrice != null && (
                              <div>
                                <div className="label-mono text-[9px] mb-0.5">Salida</div>
                                <div className="text-sm font-mono-custom">{s.exitPrice}</div>
                              </div>
                            )}
                            <div>
                              <div className="label-mono text-[9px] mb-0.5">Siguió el plan</div>
                              <div className="text-sm">{s.siguioPlan ? '✅ Sí' : '❌ No'}</div>
                            </div>
                            {s.planId && (() => {
                              const p = initialPlans.find(pl => pl.id === s.planId)
                              return p ? (
                                <div>
                                  <div className="label-mono text-[9px] mb-0.5">Plan</div>
                                  <div className="text-sm text-[var(--gold)]">{p.name}</div>
                                </div>
                              ) : null
                            })()}
                            {s.sentimiento && (
                              <div>
                                <div className="label-mono text-[9px] mb-0.5">Sentimiento</div>
                                <div className="text-sm">{s.sentimiento}</div>
                              </div>
                            )}
                            {s.notas && (
                              <div className="col-span-2 md:col-span-4">
                                <div className="label-mono text-[9px] mb-0.5">Notas</div>
                                <div className="text-sm text-[var(--text-secondary)] leading-relaxed">{s.notas}</div>
                              </div>
                            )}
                            {s.screenshotUrl && (
                              <div className="col-span-2 md:col-span-4">
                                <div className="label-mono text-[9px] mb-2">Screenshot</div>
                                <a href={s.screenshotUrl} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={s.screenshotUrl}
                                    alt="Screenshot de la operación"
                                    className="max-h-64 rounded-lg border border-[var(--border)] object-contain"
                                  />
                                </a>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal (New / Edit) ── */}
      {modalMode !== null && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="min-h-full flex justify-center px-4 py-12">
          <div className="card-panel w-full max-w-2xl h-fit relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white text-xl">✕</button>

            <div className="label-mono mb-1 text-[var(--gold)]">
              {modalMode === 'edit' ? 'Editar Operación' : 'Nueva Operación'}
            </div>
            <h2 className="headline text-2xl text-[var(--text-primary)] mb-6">
              {modalMode === 'edit'
                ? `${form.instrumento} — ${form.date}`
                : 'Registrar Trade'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Fecha */}
              <div>
                <label className="label-mono text-[10px] block mb-1.5">Fecha *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => set('date', e.target.value)}
                  className="input text-sm"
                />
              </div>

              {/* Instrumento */}
              <div>
                <label className="label-mono text-[10px] block mb-1.5">Instrumento *</label>
                <select value={form.instrumento} onChange={e => set('instrumento', e.target.value)} className="input text-sm">
                  {INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              {/* Plan */}
              {initialPlans.length > 0 && (
                <div>
                  <label className="label-mono text-[10px] block mb-1.5">Plan usado (opcional)</label>
                  <select value={form.planId} onChange={e => set('planId', e.target.value)} className="input text-sm">
                    <option value="">Sin plan</option>
                    {initialPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}

              {/* Dirección */}
              <div>
                <label className="label-mono text-[10px] block mb-1.5">Dirección *</label>
                <div className="flex gap-2">
                  {['LONG', 'SHORT'].map(d => (
                    <button
                      key={d}
                      onClick={() => set('direccion', d)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                        form.direccion === d
                          ? d === 'LONG' ? 'bg-green-950 border-green-700 text-green-400' : 'bg-red-950 border-red-700 text-red-400'
                          : 'border-[var(--border)] text-[var(--text-muted)]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resultado — auto-signs PnL on click */}
              <div>
                <label className="label-mono text-[10px] block mb-1.5">Resultado *</label>
                <div className="flex gap-2">
                  {RESULTS.map(r => (
                    <button
                      key={r}
                      onClick={() => handleResultado(r)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                        form.resultado === r
                          ? r === 'WIN' ? 'bg-green-950 border-green-700 text-green-400'
                          : r === 'LOSS' ? 'bg-red-950 border-red-700 text-red-400'
                          : 'bg-yellow-950 border-yellow-700 text-yellow-400'
                          : 'border-[var(--border)] text-[var(--text-muted)]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* P&L Neto — color by sign, auto-sign hint */}
              <div>
                <label className="label-mono text-[10px] block mb-1.5">
                  P&L Neto (USD) *
                  <span className="ml-2 normal-case text-[var(--text-muted)]">— el signo se aplica automático</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ej: 1105 (el signo se aplica automático)"
                  value={form.pnlNeto}
                  onChange={e => set('pnlNeto', e.target.value)}
                  className="input text-sm font-mono-custom font-bold"
                  style={{ color: pnlColor() }}
                />
                {form.pnlNeto !== '' && !isNaN(parseFloat(form.pnlNeto)) && (
                  <div className="text-[10px] mt-1 font-mono-custom" style={{ color: pnlColor() }}>
                    {normalizePnl(parseFloat(form.pnlNeto), form.resultado) >= 0 ? '▲ +' : '▼ '}
                    ${Math.abs(normalizePnl(parseFloat(form.pnlNeto), form.resultado)).toFixed(2)}
                  </div>
                )}
              </div>

              {/* Contratos */}
              <div>
                <label className="label-mono text-[10px] block mb-1.5">Contratos</label>
                <input
                  type="number"
                  min="1"
                  value={form.contratos}
                  onChange={e => set('contratos', e.target.value)}
                  className="input text-sm"
                />
              </div>

              {/* Siguió el plan */}
              <div>
                <label className="label-mono text-[10px] block mb-1.5">¿Siguió el plan?</label>
                <div className="flex gap-2">
                  {[true, false].map(v => (
                    <button
                      key={String(v)}
                      onClick={() => set('siguioPlan', v)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                        form.siguioPlan === v
                          ? v ? 'bg-green-950 border-green-700 text-green-400' : 'bg-red-950 border-red-700 text-red-400'
                          : 'border-[var(--border)] text-[var(--text-muted)]'
                      }`}
                    >
                      {v ? 'Sí' : 'No'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sentimiento */}
              <div>
                <label className="label-mono text-[10px] block mb-1.5">Sentimiento al operar</label>
                <select value={form.sentimiento} onChange={e => set('sentimiento', e.target.value)} className="input text-sm">
                  {SENTIMIENTOS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Notas */}
              <div className="sm:col-span-2">
                <label className="label-mono text-[10px] block mb-1.5">Notas</label>
                <textarea
                  rows={3}
                  placeholder="Contexto de la operación, setup, errores, aprendizajes..."
                  value={form.notas}
                  onChange={e => set('notas', e.target.value)}
                  className="input text-sm resize-none"
                />
              </div>

              {/* Screenshot */}
              <div className="sm:col-span-2">
                <label className="label-mono text-[10px] block mb-1.5">Screenshot (JPG/PNG)</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border border-dashed border-[var(--border)] rounded-lg p-4 text-center cursor-pointer hover:border-[var(--gold-dark)] transition-colors"
                >
                  {screenshotPreview ? (
                    <div className="space-y-2">
                      <img
                        src={screenshotPreview}
                        alt="Preview"
                        className="max-h-40 mx-auto rounded object-contain"
                      />
                      {screenshotFile && (
                        <p className="text-xs text-[var(--text-muted)]">{screenshotFile.name}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-2xl">📸</div>
                      <p className="text-xs text-[var(--text-muted)]">Haz clic para subir screenshot</p>
                      <p className="text-[10px] text-[var(--text-muted)]">JPG, PNG — máx 10MB</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
                {screenshotPreview && (
                  <button onClick={resetScreenshot} className="text-xs text-[var(--text-muted)] hover:text-[var(--red)] mt-1 transition-colors">
                    Quitar imagen
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-5 border-t border-[var(--border)]">
              <button
                onClick={handleSubmit}
                disabled={saving || !form.date || !form.instrumento || form.pnlNeto === ''}
                className="btn-gold py-3 px-7 rounded-lg flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving
                  ? 'Guardando...'
                  : modalMode === 'edit' ? 'Guardar cambios' : 'Guardar Operación'}
              </button>
              <button onClick={closeModal} className="btn-outline py-3 px-5 rounded-lg">
                Cancelar
              </button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.9)' }}>
          <div className="card-panel w-full max-w-sm text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="headline text-xl text-[var(--text-primary)] mb-2">¿Eliminar esta operación?</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deleting}
                className="flex-1 py-3 rounded-lg text-sm font-bold bg-[var(--red)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 btn-outline py-3 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
