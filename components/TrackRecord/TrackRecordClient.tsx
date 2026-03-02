'use client'

import { useState, useMemo, useRef, useCallback } from 'react'

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
}

const INSTRUMENTS = ['NQ', 'MNQ', 'BTC', 'ETH', 'Otro']
const RESULTS = ['WIN', 'LOSS', 'BREAKEVEN']
const SENTIMIENTOS = ['Sereno', 'Confiado', 'Ansioso', 'Impulsivo', 'Neutral']

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
      <div className="card border-[var(--gold-dark)] bg-[var(--bg-card)] px-5 py-3 flex items-center gap-3 shadow-xl">
        <span className="text-[var(--green)] text-lg">✓</span>
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white text-xs ml-2">✕</button>
      </div>
    </div>
  )
}

export default function TrackRecordClient({ initialSessions }: { initialSessions: Session[] }) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [showModal, setShowModal] = useState(false)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [filterMonth, setFilterMonth] = useState('all')
  const [filterResult, setFilterResult] = useState('all')
  const [filterInstrument, setFilterInstrument] = useState('all')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormState>({
    date: new Date().toISOString().split('T')[0],
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
  })

  const set = (k: keyof FormState, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  // Unique months for filter
  const months = useMemo(() => {
    const set = new Set<string>()
    sessions.forEach(s => {
      const d = new Date(s.date)
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    })
    return Array.from(set).sort().reverse()
  }, [sessions])

  // Filtered sessions
  const filtered = useMemo(() => {
    return sessions.filter(s => {
      const d = new Date(s.date)
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (filterMonth !== 'all' && month !== filterMonth) return false
      if (filterResult !== 'all' && s.resultado !== filterResult) return false
      if (filterInstrument !== 'all' && s.instrumento !== filterInstrument) return false
      return true
    })
  }, [sessions, filterMonth, filterResult, filterInstrument])

  // Metrics
  const metrics = useMemo(() => {
    const wins = filtered.filter(s => s.resultado === 'WIN').length
    const total = filtered.length
    const pnl = filtered.reduce((sum, s) => sum + (s.pnlNeto ?? 0), 0)
    return {
      total,
      wins,
      pnl,
      winRate: total > 0 ? (wins / total) * 100 : 0,
    }
  }, [filtered])

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScreenshotFile(file)
    setScreenshotPreview(URL.createObjectURL(file))
  }, [])

  const resetForm = useCallback(() => {
    setForm({
      date: new Date().toISOString().split('T')[0],
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
    })
    setScreenshotFile(null)
    setScreenshotPreview('')
    if (fileRef.current) fileRef.current.value = ''
  }, [])

  const handleSubmit = async () => {
    if (!form.date || !form.instrumento || form.pnlNeto === '') return
    setSaving(true)
    try {
      let screenshotUrl = ''

      // Upload screenshot if provided
      if (screenshotFile) {
        const fd = new FormData()
        fd.append('file', screenshotFile)
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
        const upData = await upRes.json()
        screenshotUrl = upData.url ?? ''
      }

      const pnlNeto = parseFloat(form.pnlNeto)
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: form.date,
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
          screenshotUrl: screenshotUrl || null,
        }),
      })
      const data = await res.json()
      if (data.session) {
        setSessions(prev => [data.session, ...prev])
        setShowModal(false)
        resetForm()
        setToast('Operación registrada correctamente')
        setTimeout(() => setToast(''), 4000)
      }
    } catch {
      setToast('Error al guardar. Intenta de nuevo.')
      setTimeout(() => setToast(''), 4000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="animate-fadeIn">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1"><span className="gradient-gold">Track Record</span></h1>
          <p className="text-[var(--text-secondary)] text-sm">Historial completo de operaciones</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-gold py-2.5 px-5 rounded-lg text-sm">
          ➕ Nueva Operación
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Trades', value: metrics.total, color: 'var(--gold)' },
          { label: 'Win Rate', value: `${metrics.winRate.toFixed(1)}%`, color: metrics.winRate >= 50 ? 'var(--green)' : 'var(--red)' },
          { label: 'Ganadoras', value: metrics.wins, color: 'var(--green)' },
          { label: 'PnL Total', value: `${metrics.pnl >= 0 ? '+' : ''}$${metrics.pnl.toFixed(0)}`, color: metrics.pnl >= 0 ? 'var(--green)' : 'var(--red)' },
        ].map((stat) => (
          <div key={stat.label} className="card text-center py-4">
            <div className="text-2xl font-black mb-1" style={{ color: stat.color, fontFamily: 'var(--font-serif)' }}>
              {stat.value}
            </div>
            <div className="label-mono text-[10px]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="input text-sm py-1.5 px-3 w-auto"
        >
          <option value="all">Todos los meses</option>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select
          value={filterResult}
          onChange={e => setFilterResult(e.target.value)}
          className="input text-sm py-1.5 px-3 w-auto"
        >
          <option value="all">Todos los resultados</option>
          {RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={filterInstrument}
          onChange={e => setFilterInstrument(e.target.value)}
          className="input text-sm py-1.5 px-3 w-auto"
        >
          <option value="all">Todos los instrumentos</option>
          {INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        {(filterMonth !== 'all' || filterResult !== 'all' || filterInstrument !== 'all') && (
          <button
            onClick={() => { setFilterMonth('all'); setFilterResult('all'); setFilterInstrument('all') }}
            className="text-xs text-[var(--text-muted)] hover:text-white border border-[var(--border)] px-3 py-1.5 rounded-lg transition-colors"
          >
            Limpiar filtros ✕
          </button>
        )}
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
                  {['Fecha', 'Instrumento', 'Dir.', 'Resultado', 'P&L Neto', 'Contratos', 'Screenshot', ''].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <>
                    <tr
                      key={s.id}
                      onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)}
                      className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 text-[var(--text-secondary)] whitespace-nowrap">
                        {new Date(s.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-medium font-mono-custom">{s.instrumento}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${s.direccion === 'LONG' ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'}`}>
                          {s.direccion}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          s.resultado === 'WIN' ? 'bg-green-950 text-green-400' :
                          s.resultado === 'LOSS' ? 'bg-red-950 text-red-400' :
                          'bg-yellow-950 text-yellow-400'
                        }`}>
                          {s.resultado}
                        </span>
                      </td>
                      <td className={`py-3 px-4 font-bold font-mono-custom ${s.pnlNeto >= 0 ? 'positive' : 'negative'}`}>
                        {s.pnlNeto >= 0 ? '+' : ''}${Math.abs(s.pnlNeto).toFixed(0)}
                      </td>
                      <td className="py-3 px-4 text-[var(--text-secondary)]">{s.contratos}</td>
                      <td className="py-3 px-4">
                        {s.screenshotUrl
                          ? <span className="text-[var(--gold)] text-xs">📸 Ver</span>
                          : <span className="text-[var(--text-muted)] text-xs">—</span>
                        }
                      </td>
                      <td className="py-3 px-4 text-[var(--text-muted)] text-xs">
                        {expandedRow === s.id ? '▲' : '▼'}
                      </td>
                    </tr>
                    {expandedRow === s.id && (
                      <tr key={`${s.id}-detail`} className="bg-[var(--bg-secondary)]">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {s.entryPrice && (
                              <div>
                                <div className="label-mono text-[9px] mb-0.5">Entrada</div>
                                <div className="text-sm font-mono-custom">{s.entryPrice}</div>
                              </div>
                            )}
                            {s.exitPrice && (
                              <div>
                                <div className="label-mono text-[9px] mb-0.5">Salida</div>
                                <div className="text-sm font-mono-custom">{s.exitPrice}</div>
                              </div>
                            )}
                            <div>
                              <div className="label-mono text-[9px] mb-0.5">Siguió el plan</div>
                              <div className="text-sm">{s.siguioPlan ? '✅ Sí' : '❌ No'}</div>
                            </div>
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
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="card-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => { setShowModal(false); resetForm() }}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white text-xl"
            >✕</button>

            <div className="label-mono mb-2 text-[var(--gold)]">Nueva Operación</div>
            <h2 className="headline text-2xl text-[var(--text-primary)] mb-6">Registrar Trade</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Fecha */}
              <div>
                <label className="label-mono text-[10px] block mb-1.5">Fecha *</label>
                <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input text-sm" />
              </div>

              {/* Instrumento */}
              <div>
                <label className="label-mono text-[10px] block mb-1.5">Instrumento *</label>
                <select value={form.instrumento} onChange={e => set('instrumento', e.target.value)} className="input text-sm">
                  {INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

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

              {/* Resultado */}
              <div>
                <label className="label-mono text-[10px] block mb-1.5">Resultado *</label>
                <div className="flex gap-2">
                  {RESULTS.map(r => (
                    <button
                      key={r}
                      onClick={() => set('resultado', r)}
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

              {/* P&L Neto */}
              <div>
                <label className="label-mono text-[10px] block mb-1.5">P&L Neto (USD) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="ej. 480 o -120"
                  value={form.pnlNeto}
                  onChange={e => set('pnlNeto', e.target.value)}
                  className="input text-sm"
                />
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

              {/* Precio entrada */}
              <div>
                <label className="label-mono text-[10px] block mb-1.5">Precio de entrada (opcional)</label>
                <input
                  type="number"
                  step="0.25"
                  placeholder="ej. 21450.00"
                  value={form.entryPrice}
                  onChange={e => set('entryPrice', e.target.value)}
                  className="input text-sm"
                />
              </div>

              {/* Precio salida */}
              <div>
                <label className="label-mono text-[10px] block mb-1.5">Precio de salida (opcional)</label>
                <input
                  type="number"
                  step="0.25"
                  placeholder="ej. 21530.00"
                  value={form.exitPrice}
                  onChange={e => set('exitPrice', e.target.value)}
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
                      <img src={screenshotPreview} alt="Preview" className="max-h-40 mx-auto rounded object-contain" />
                      <p className="text-xs text-[var(--text-muted)]">{screenshotFile?.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-2xl">📸</div>
                      <p className="text-xs text-[var(--text-muted)]">Haz clic para subir screenshot</p>
                      <p className="text-[10px] text-[var(--text-muted)]">JPG, PNG — máx 10MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFile}
                  className="hidden"
                />
                {screenshotPreview && (
                  <button
                    onClick={() => { setScreenshotFile(null); setScreenshotPreview(''); if (fileRef.current) fileRef.current.value = '' }}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--red)] mt-1 transition-colors"
                  >
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
                {saving ? 'Guardando...' : 'Guardar Operación'}
              </button>
              <button
                onClick={() => { setShowModal(false); resetForm() }}
                className="btn-outline py-3 px-5 rounded-lg"
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
