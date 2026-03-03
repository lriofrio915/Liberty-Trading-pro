'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Plan { id: string; name: string; capitalInicial: number }
interface Retiro {
  id: string
  planId: string | null
  monto: number
  fecha: string
  nota: string | null
  plan: { id: string; name: string; capitalInicial: number } | null
}
interface SessionSummary { planId: string | null; pnlNeto: number; resultado: string }

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[10000] animate-fadeIn">
      <div className="card border-[var(--gold-dark)] px-5 py-3 flex items-center gap-3 shadow-xl">
        <span className="text-[var(--green)] text-lg">✓</span>
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white text-xs ml-2">✕</button>
      </div>
    </div>
  )
}

export default function RetirosClient({
  initialRetiros,
  initialPlans,
  initialSessions,
}: {
  initialRetiros: Retiro[]
  initialPlans: Plan[]
  initialSessions: SessionSummary[]
}) {
  const [retiros, setRetiros] = useState<Retiro[]>(initialRetiros)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' })
  const [form, setForm] = useState({ planId: '', monto: '', fecha: today, nota: '' })

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000) }

  const handleSubmit = async () => {
    if (!form.monto || parseFloat(form.monto) <= 0) return
    setSaving(true)
    try {
      const res = await fetch('/api/retiros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, monto: parseFloat(form.monto) }),
      })
      const data = await res.json()
      if (data.retiro) {
        setRetiros(prev => [data.retiro, ...prev])
        setShowModal(false)
        setForm({ planId: '', monto: '', fecha: today, nota: '' })
        showToast('Retiro registrado correctamente')
      }
    } catch { showToast('Error al guardar') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await fetch(`/api/retiros/${id}`, { method: 'DELETE' })
      setRetiros(prev => prev.filter(r => r.id !== id))
      showToast('Retiro eliminado')
    } catch { showToast('Error al eliminar') } finally { setDeleting(null) }
  }

  // Capital actual per plan
  const planStats = initialPlans.map(plan => {
    const planSessions = initialSessions.filter(s => s.planId === plan.id)
    const pnlAcumulado = planSessions.reduce((sum, s) => {
      const abs = Math.abs(s.pnlNeto)
      if (s.resultado === 'WIN') return sum + abs
      if (s.resultado === 'LOSS') return sum - abs
      return sum + s.pnlNeto
    }, 0)
    const totalRetirado = retiros.filter(r => r.planId === plan.id).reduce((sum, r) => sum + r.monto, 0)
    const capitalActual = plan.capitalInicial + pnlAcumulado - totalRetirado
    return { ...plan, pnlAcumulado, totalRetirado, capitalActual }
  })

  const totalRetirado = retiros.reduce((sum, r) => sum + r.monto, 0)

  return (
    <div className="animate-fadeIn">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1"><span className="gradient-gold">Retiros</span></h1>
          <p className="text-[var(--text-secondary)] text-sm">Historial de retiros por plan</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-gold py-2.5 px-5 rounded-lg text-sm">
          + Nuevo Retiro
        </button>
      </div>

      {/* Capital por plan */}
      {planStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {planStats.map(p => (
            <div key={p.id} className="card-gold">
              <div className="text-sm font-bold mb-3">{p.name}</div>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Capital Inicial', value: `$${p.capitalInicial.toLocaleString()}`, color: 'var(--text-primary)' },
                  { label: 'PnL Acumulado', value: `${p.pnlAcumulado >= 0 ? '+' : ''}$${p.pnlAcumulado.toFixed(2)}`, color: p.pnlAcumulado >= 0 ? 'var(--green)' : 'var(--red)' },
                  { label: 'Total Retirado', value: `-$${p.totalRetirado.toFixed(2)}`, color: 'var(--text-muted)' },
                  { label: 'Capital Actual', value: `$${p.capitalActual.toFixed(2)}`, color: p.capitalActual >= p.capitalInicial ? 'var(--green)' : 'var(--red)' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-[var(--text-muted)]">{item.label}</span>
                    <span className="font-bold" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="card mb-6 flex items-center justify-between">
        <div className="label-mono text-xs text-[var(--text-muted)]">Total retirado acumulado</div>
        <div className="text-2xl font-black text-[var(--gold)]">${totalRetirado.toFixed(2)}</div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {retiros.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">💰</div>
            <p className="text-[var(--text-muted)] text-sm">Sin retiros registrados aun</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                {['Fecha', 'Plan', 'Monto', 'Nota', ''].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {retiros.map(r => (
                <tr key={r.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors">
                  <td className="py-3 px-4 text-[var(--text-secondary)] whitespace-nowrap">
                    {new Date(r.fecha).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 text-[var(--text-secondary)]">{r.plan?.name || '—'}</td>
                  <td className="py-3 px-4 font-bold text-[var(--gold)]">${r.monto.toFixed(2)}</td>
                  <td className="py-3 px-4 text-[var(--text-muted)] text-xs">{r.nota || '—'}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDelete(r.id)}
                      disabled={deleting === r.id}
                      className="text-gray-500 hover:text-red-400 transition-colors text-xs"
                    >
                      {deleting === r.id ? '...' : '🗑️'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {mounted && showModal && createPortal(
        <div
          onClick={e => e.target === e.currentTarget && setShowModal(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div style={{ backgroundColor: '#111', border: '1px solid rgba(201,168,76,0.2)', width: '100%', maxWidth: '480px', padding: '2rem', position: 'relative' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', color: '#666', fontSize: '1.25rem' }}>✕</button>
            <div className="label-mono mb-1 text-[var(--gold)]">Nuevo Retiro</div>
            <h2 className="headline text-2xl text-[var(--text-primary)] mb-6">Registrar Retiro</h2>

            <div className="space-y-4">
              <div>
                <label className="label-mono text-[10px] block mb-1.5">Plan asociado</label>
                <select value={form.planId} onChange={e => setForm(f => ({ ...f, planId: e.target.value }))} className="input text-sm">
                  <option value="">Sin plan especifico</option>
                  {initialPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label-mono text-[10px] block mb-1.5">Monto retirado (USD) *</label>
                <input type="number" step="0.01" min="0" placeholder="ej. 500" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} className="input text-sm" />
              </div>
              <div>
                <label className="label-mono text-[10px] block mb-1.5">Fecha del retiro *</label>
                <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className="input text-sm" />
              </div>
              <div>
                <label className="label-mono text-[10px] block mb-1.5">Nota (opcional)</label>
                <input type="text" placeholder="ej. Retiro mensual" value={form.nota} onChange={e => setForm(f => ({ ...f, nota: e.target.value }))} className="input text-sm" />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-5 border-t border-[var(--border)]">
              <button onClick={handleSubmit} disabled={saving || !form.monto} className="btn-gold py-3 px-7 rounded-lg flex-1 disabled:opacity-50">
                {saving ? 'Guardando...' : 'Registrar Retiro'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-outline py-3 px-5 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
