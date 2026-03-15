'use client'

import React, { useState, useMemo, useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'

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
  userId = '',
}: {
  initialSessions: Session[]
  initialPlans: { id: string; name: string }[]
  userId?: string
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
  const [showShare, setShowShare] = useState(false)
  const [copied, setCopied] = useState(false)

  const publicUrl = userId
    ? `${process.env.NEXT_PUBLIC_APP_URL}/track-record/${userId}`
    : ''

  function copyLink() {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Export CSV ───────────────────────────────────────────────────────────────

  function exportCSV() {
    const headers = ['fecha', 'instrumento', 'direccion', 'resultado', 'pnl_neto', 'pnl_bruto', 'comisiones', 'contratos', 'entry_price', 'exit_price', 'siguio_plan', 'sentimiento', 'notas']
    const rows = filtered.map(s => [
      new Date(s.date).toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' }),
      s.instrumento,
      s.direccion,
      s.resultado,
      s.pnlNeto,
      s.pnlBruto,
      s.comisiones,
      s.contratos,
      s.entryPrice ?? '',
      s.exitPrice ?? '',
      s.siguioPlan,
      s.sentimiento ?? '',
      s.notas ?? '',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `track-record-${new Date().toLocaleDateString('en-CA')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Import ───────────────────────────────────────────────────────────────────

  const importRef = useRef<HTMLInputElement>(null)
  const [importRows, setImportRows] = useState<Record<string, string>[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array', cellDates: true })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const json: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: '' })
        if (json.length === 0) { setImportError('El archivo está vacío o no tiene filas.'); return }
        setImportRows(json)
      } catch {
        setImportError('No se pudo leer el archivo. Verifica que sea CSV o Excel válido.')
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  async function confirmImport() {
    if (!importRows) return
    setImporting(true)
    setImportError('')
    try {
      const res = await fetch('/api/sessions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: importRows }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al importar')
      setToast(`✓ ${json.imported} operaciones importadas`)
      setImportRows(null)
      // Refresh sessions
      const s = await fetch('/api/sessions').then(r => r.json())
      if (s.sessions) setSessions(s.sessions)
    } catch (err: any) {
      setImportError(err.message)
    } finally {
      setImporting(false)
    }
  }

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
        <div className="flex items-center gap-2 flex-wrap">
          {userId && (
            <button
              onClick={() => setShowShare(s => !s)}
              className="btn-outline py-2.5 px-4 rounded-lg text-sm"
            >
              🔗 Compartir
            </button>
          )}
          <button
            onClick={exportCSV}
            className="btn-outline py-2.5 px-4 rounded-lg text-sm"
          >
            ⬇ Exportar CSV
          </button>
          <button
            onClick={() => importRef.current?.click()}
            className="btn-outline py-2.5 px-4 rounded-lg text-sm"
          >
            ⬆ Importar
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleImportFile}
          />
          <button onClick={openNew} className="btn-gold py-2.5 px-5 rounded-lg text-sm">
            ➕ Nueva Operación
          </button>
        </div>
      </div>

      {/* Import preview modal */}
      {importRows && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-3xl rounded-2xl border border-[var(--border)] flex flex-col" style={{ background: '#0d0d0d', maxHeight: '80vh' }}>
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <div className="font-bold text-[var(--text-primary)] mb-0.5">Vista previa de importación</div>
                <div className="text-xs text-[var(--text-muted)]">{importRows.length} filas detectadas — primeras 5 mostradas</div>
              </div>
              <button onClick={() => { setImportRows(null); setImportError('') }} className="text-[var(--text-muted)] hover:text-white text-xl">×</button>
            </div>

            <div className="overflow-auto flex-1 p-4">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {Object.keys(importRows[0]).slice(0, 8).map(k => (
                      <th key={k} className="text-left py-2 px-3 text-[var(--text-muted)] whitespace-nowrap">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importRows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-[var(--border)] border-opacity-50">
                      {Object.values(row).slice(0, 8).map((v, j) => (
                        <td key={j} className="py-2 px-3 text-[var(--text-secondary)] whitespace-nowrap">{String(v)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {importError && (
              <div className="mx-6 mb-2 text-xs text-[var(--red)] bg-red-950/30 border border-red-900/40 rounded-lg px-4 py-2">
                {importError}
              </div>
            )}

            <div className="p-5 border-t border-[var(--border)]">
              <div className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
                Columnas requeridas: <span className="text-[var(--gold)]">fecha, instrumento, direccion, resultado, pnl_neto</span>.
                Opcionales: contratos, entry_price, exit_price, comisiones, notas.<br />
                Valores de resultado: WIN / LOSS / BREAKEVEN. Dirección: LONG / SHORT.
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setImportRows(null); setImportError('') }} className="btn-outline py-2 px-5 rounded-lg text-sm">
                  Cancelar
                </button>
                <button onClick={confirmImport} disabled={importing} className="btn-gold py-2 px-5 rounded-lg text-sm disabled:opacity-60">
                  {importing ? 'Importando...' : `Importar ${importRows.length} operaciones`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share panel */}
      {showShare && publicUrl && (
        <div className="mb-6 rounded-xl border border-[var(--gold-dark)] p-5"
          style={{ background: 'rgba(201,168,76,0.04)' }}>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="label-mono text-[10px] text-[var(--gold)] mb-1">Tu link público de Track Record</div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Comparte tus resultados reales. Cualquiera con este link puede ver tus estadísticas.
              </p>
            </div>
            <button onClick={() => setShowShare(false)} className="text-[var(--text-muted)] hover:text-white text-lg leading-none mt-0.5">×</button>
          </div>

          {/* URL */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2.5 font-mono text-xs text-[var(--text-muted)] truncate">
              {publicUrl}
            </div>
            <button
              onClick={copyLink}
              className="btn-gold py-2.5 px-4 rounded-lg text-xs whitespace-nowrap"
            >
              {copied ? '✓ Copiado' : 'Copiar link'}
            </button>
          </div>

          {/* Social share buttons */}
          <div className="flex flex-wrap gap-2">

            {/* X / Twitter */}
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Mi track record real de trading — sin filtros 📈')}&url=${encodeURIComponent(publicUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--gold)] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.849L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Twitter / X
            </a>

            {/* WhatsApp */}
            <a href={`https://wa.me/?text=${encodeURIComponent('Mi track record real de trading 📈 ' + publicUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-lg border border-[var(--border)] hover:border-[#25D366] transition-colors"
              style={{ color: '#25D366' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>

            {/* LinkedIn */}
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-lg border border-[var(--border)] hover:border-[#0A66C2] transition-colors"
              style={{ color: '#0A66C2' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn
            </a>

            {/* Facebook */}
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-lg border border-[var(--border)] hover:border-[#1877F2] transition-colors"
              style={{ color: '#1877F2' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </a>

            {/* Instagram — no tiene API web directa, copiamos el link */}
            <button
              onClick={() => { copyLink(); setToast('Link copiado — pégalo en Instagram') }}
              className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-lg border border-[var(--border)] hover:border-[#E1306C] transition-colors"
              style={{ color: '#E1306C' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              Instagram
            </button>

            {/* Ver página pública */}
            <a href={publicUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--gold)] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Ver página
            </a>
          </div>
        </div>
      )}

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
