'use client'

import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlanSession {
  id: string
  date: string
  resultado: string
  pnlNeto: number
  instrumento: string
  direccion: string
}

interface TradingPlan {
  id: string
  name: string
  broker: string
  accountName: string
  capitalInicial: number
  riesgo: number
  rrRatio: number
  riesgoPorTrade: number
  gestionStop: string
  reglas: string
  horaInicio: string
  horaFin: string
  instrumento: string
  active: boolean
  createdAt: string
  sessions: PlanSession[]
}

interface FormState {
  name: string
  broker: string
  accountName: string
  capitalInicial: string
  riesgo: string
  rrRatio: string
  riesgoPorTrade: string
  gestionStop: string
  reglas: string
  horaInicio: string
  horaFin: string
  instrumento: string
  active: boolean
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INSTRUMENTS = ['NQ', 'MNQ', 'ES', 'MES', 'BTC', 'ETH', 'Otro']

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeStats(sessions: PlanSession[]) {
  const wins = sessions.filter(s => s.resultado === 'WIN')
  const losses = sessions.filter(s => s.resultado === 'LOSS')
  const pnl = sessions.reduce((sum, s) => {
    const abs = Math.abs(s.pnlNeto)
    if (s.resultado === 'WIN') return sum + abs
    if (s.resultado === 'LOSS') return sum - abs
    return sum + s.pnlNeto
  }, 0)
  const winRate = sessions.length > 0 ? (wins.length / sessions.length) * 100 : 0
  const winsGross = wins.reduce((s, t) => s + Math.abs(t.pnlNeto), 0)
  const lossesGross = losses.reduce((s, t) => s + Math.abs(t.pnlNeto), 0)
  const profitFactor = lossesGross > 0 ? winsGross / lossesGross : wins.length > 0 ? Infinity : 0
  return { total: sessions.length, wins: wins.length, losses: losses.length, pnl, winRate, profitFactor }
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

export default function PlanesClient({ initialPlans }: { initialPlans: TradingPlan[] }) {
  const [plans, setPlans] = useState<TradingPlan[]>(initialPlans)
  const [modalMode, setModalMode] = useState<'new' | 'edit' | null>(null)
  const [editingPlan, setEditingPlan] = useState<TradingPlan | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState('')

  const blankForm = (): FormState => ({
    name: '',
    broker: '',
    accountName: '',
    capitalInicial: '',
    riesgo: '1',
    rrRatio: '2',
    riesgoPorTrade: '',
    gestionStop: '',
    reglas: '',
    horaInicio: '09:30',
    horaFin: '11:30',
    instrumento: 'NQ',
    active: true,
  })

  const [form, setForm] = useState<FormState>(blankForm())
  const set = (k: keyof FormState, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  const openNew = () => {
    setForm(blankForm())
    setEditingPlan(null)
    setModalMode('new')
  }

  const openEdit = (plan: TradingPlan) => {
    setForm({
      name: plan.name,
      broker: plan.broker,
      accountName: plan.accountName,
      capitalInicial: String(plan.capitalInicial),
      riesgo: String(plan.riesgo),
      rrRatio: String(plan.rrRatio),
      riesgoPorTrade: String(plan.riesgoPorTrade),
      gestionStop: plan.gestionStop,
      reglas: plan.reglas,
      horaInicio: plan.horaInicio,
      horaFin: plan.horaFin,
      instrumento: plan.instrumento,
      active: plan.active,
    })
    setEditingPlan(plan)
    setModalMode('edit')
  }

  const closeModal = () => {
    setModalMode(null)
    setEditingPlan(null)
    setForm(blankForm())
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        broker: form.broker.trim(),
        accountName: form.accountName.trim(),
        capitalInicial: parseFloat(form.capitalInicial) || 0,
        riesgo: parseFloat(form.riesgo) || 1,
        rrRatio: parseFloat(form.rrRatio) || 2,
        riesgoPorTrade: parseFloat(form.riesgoPorTrade) || 0,
        gestionStop: form.gestionStop.trim(),
        reglas: form.reglas.trim(),
        horaInicio: form.horaInicio,
        horaFin: form.horaFin,
        instrumento: form.instrumento,
        active: form.active,
      }

      if (modalMode === 'edit' && editingPlan) {
        const res = await fetch(`/api/planes/${editingPlan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (data.plan) {
          setPlans(prev => prev.map(p =>
            p.id === editingPlan.id ? { ...data.plan, sessions: editingPlan.sessions } : p
          ))
          closeModal()
          showToast('Plan actualizado correctamente')
        }
      } else {
        const res = await fetch('/api/planes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (data.plan) {
          setPlans(prev => [{ ...data.plan, sessions: [] }, ...prev])
          closeModal()
          showToast('Plan creado correctamente')
        }
      }
    } catch {
      showToast('Error al guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/planes/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.ok) {
        setPlans(prev => prev.filter(p => p.id !== id))
        setConfirmDeleteId(null)
        setExpandedId(null)
        showToast('Plan eliminado')
      }
    } catch {
      showToast('Error al eliminar. Intenta de nuevo.')
    } finally {
      setDeleting(false)
    }
  }

  const toggleActive = async (plan: TradingPlan) => {
    try {
      const res = await fetch(`/api/planes/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...plan, active: !plan.active }),
      })
      const data = await res.json()
      if (data.plan) {
        setPlans(prev => prev.map(p =>
          p.id === plan.id ? { ...data.plan, sessions: plan.sessions } : p
        ))
      }
    } catch {
      showToast('Error al actualizar estado')
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fadeIn">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">
            <span className="gradient-gold">Planes de Trading</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">Define tus reglas y gestión de riesgo</p>
        </div>
        <button onClick={openNew} className="btn-gold py-2.5 px-5 rounded-lg text-sm">
          ➕ Nuevo Plan
        </button>
      </div>

      {/* Empty state */}
      {plans.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-bold mb-2">Sin planes de trading</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-md mx-auto">
            Crea tu primer plan para definir reglas, gestión de riesgo y objetivos.
          </p>
          <button onClick={openNew} className="btn-gold inline-block py-3 px-8 rounded-xl">
            Crear Plan
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map(plan => {
            const stats = computeStats(plan.sessions)
            const isExpanded = expandedId === plan.id

            return (
              <div key={plan.id} className={`card-gold transition-all ${!plan.active ? 'opacity-60' : ''}`}>

                {/* Plan header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold truncate">{plan.name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                        plan.active ? 'bg-green-950 text-green-400' : 'bg-gray-900 text-gray-500'
                      }`}>
                        {plan.active ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">
                      {plan.broker}{plan.accountName ? ` · ${plan.accountName}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => openEdit(plan)}
                      className="p-2 text-gray-400 hover:text-yellow-400 transition-colors rounded"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(plan.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : plan.id)}
                      className="p-2 text-gray-500 hover:text-gray-300 text-xs transition-colors"
                    >
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {/* Plan info grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                  {[
                    { label: 'Capital', value: `$${plan.capitalInicial.toLocaleString()}` },
                    { label: 'Riesgo/Trade', value: `${plan.riesgo}%` },
                    { label: 'R:R Objetivo', value: `${plan.rrRatio}:1` },
                    { label: 'Instrumento', value: plan.instrumento },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="label-mono text-[9px] mb-0.5">{item.label}</div>
                      <div className="font-medium">{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Stats from linked sessions */}
                {stats.total > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                      { label: 'Trades', value: stats.total, color: 'var(--gold)' },
                      {
                        label: 'Win Rate',
                        value: `${stats.winRate.toFixed(0)}%`,
                        color: stats.winRate >= 50 ? 'var(--green)' : 'var(--red)',
                      },
                      {
                        label: 'PnL Total',
                        value: `${stats.pnl >= 0 ? '+' : ''}$${stats.pnl.toFixed(0)}`,
                        color: stats.pnl >= 0 ? 'var(--green)' : 'var(--red)',
                      },
                      {
                        label: 'Profit F.',
                        value: isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : '∞',
                        color: stats.profitFactor >= 1.5 ? 'var(--green)' : 'var(--text-muted)',
                      },
                    ].map(s => (
                      <div key={s.label} className="bg-black/30 rounded-lg py-2 px-3 text-center">
                        <div
                          className="text-base font-black"
                          style={{ color: s.color, fontFamily: 'var(--font-serif)' }}
                        >
                          {s.value}
                        </div>
                        <div className="label-mono text-[8px] mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {stats.total === 0 && (
                  <div className="text-xs text-[var(--text-muted)] mb-4">
                    Sin operaciones vinculadas aún
                  </div>
                )}

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-[var(--border)] pt-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="label-mono text-[9px] mb-0.5">Horario de sesión</div>
                        <div className="font-medium">{plan.horaInicio} – {plan.horaFin}</div>
                      </div>
                      <div>
                        <div className="label-mono text-[9px] mb-0.5">Gestión de Stop</div>
                        <div className="font-medium">{plan.gestionStop || '—'}</div>
                      </div>
                      <div>
                        <div className="label-mono text-[9px] mb-0.5">Riesgo $ / Trade</div>
                        <div className="font-medium">
                          {plan.riesgoPorTrade > 0 ? `$${plan.riesgoPorTrade}` : '—'}
                        </div>
                      </div>
                    </div>

                    {plan.reglas && (
                      <div>
                        <div className="label-mono text-[9px] mb-2">Reglas del plan</div>
                        <div className="bg-black/30 rounded-lg p-3 text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                          {plan.reglas}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={() => toggleActive(plan)}
                        className={`text-xs font-bold px-4 py-2 rounded-lg border transition-all ${
                          plan.active
                            ? 'border-gray-600 text-gray-400 hover:border-red-600 hover:text-red-400'
                            : 'border-green-700 text-green-400 hover:bg-green-950'
                        }`}
                      >
                        {plan.active ? 'Desactivar plan' : 'Activar plan'}
                      </button>
                      <span className="text-xs text-[var(--text-muted)]">
                        Creado {new Date(plan.createdAt).toLocaleDateString('es-EC', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal (New / Edit) ── */}
      {modalMode !== null && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="relative bg-[#111] border border-yellow-900/30 w-full max-w-2xl my-auto rounded-sm p-8">
            <button onClick={closeModal} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white text-xl">✕</button>

            <div className="label-mono mb-1 text-[var(--gold)]">
              {modalMode === 'edit' ? 'Editar Plan' : 'Nuevo Plan'}
            </div>
            <h2 className="headline text-2xl text-[var(--text-primary)] mb-6">
              {modalMode === 'edit' ? form.name || 'Plan de Trading' : 'Crear Plan de Trading'}
            </h2>

            {/* Section 1: Identificación */}
            <div className="mb-6">
              <div className="label-mono text-[10px] text-[var(--gold)] mb-3 border-b border-[var(--border)] pb-2">
                01 — Identificación
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label-mono text-[10px] block mb-1.5">Nombre del plan *</label>
                  <input
                    type="text"
                    placeholder="ej. Plan NQ — Sesión NY"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="label-mono text-[10px] block mb-1.5">Broker</label>
                  <input
                    type="text"
                    placeholder="ej. TopStep, Apex, IBKR"
                    value={form.broker}
                    onChange={e => set('broker', e.target.value)}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="label-mono text-[10px] block mb-1.5">Nombre de cuenta</label>
                  <input
                    type="text"
                    placeholder="ej. Funded 50K"
                    value={form.accountName}
                    onChange={e => set('accountName', e.target.value)}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="label-mono text-[10px] block mb-1.5">Instrumento principal</label>
                  <select value={form.instrumento} onChange={e => set('instrumento', e.target.value)} className="input text-sm">
                    {INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-mono text-[10px] block mb-1.5">Estado</label>
                  <div className="flex gap-2">
                    {([true, false] as const).map(v => (
                      <button
                        key={String(v)}
                        onClick={() => set('active', v)}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                          form.active === v
                            ? v
                              ? 'bg-green-950 border-green-700 text-green-400'
                              : 'bg-gray-900 border-gray-600 text-gray-400'
                            : 'border-[var(--border)] text-[var(--text-muted)]'
                        }`}
                      >
                        {v ? 'Activo' : 'Inactivo'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Capital y Riesgo */}
            <div className="mb-6">
              <div className="label-mono text-[10px] text-[var(--gold)] mb-3 border-b border-[var(--border)] pb-2">
                02 — Capital y Riesgo
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-mono text-[10px] block mb-1.5">Capital inicial (USD)</label>
                  <input
                    type="number"
                    step="100"
                    placeholder="ej. 50000"
                    value={form.capitalInicial}
                    onChange={e => set('capitalInicial', e.target.value)}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="label-mono text-[10px] block mb-1.5">Riesgo por trade (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    placeholder="ej. 1"
                    value={form.riesgo}
                    onChange={e => set('riesgo', e.target.value)}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="label-mono text-[10px] block mb-1.5">R:R objetivo</label>
                  <input
                    type="number"
                    step="0.25"
                    min="1"
                    placeholder="ej. 2"
                    value={form.rrRatio}
                    onChange={e => set('rrRatio', e.target.value)}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="label-mono text-[10px] block mb-1.5">Riesgo $ por trade</label>
                  <input
                    type="number"
                    step="10"
                    placeholder="ej. 500"
                    value={form.riesgoPorTrade}
                    onChange={e => set('riesgoPorTrade', e.target.value)}
                    className="input text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Sesión */}
            <div className="mb-6">
              <div className="label-mono text-[10px] text-[var(--gold)] mb-3 border-b border-[var(--border)] pb-2">
                03 — Sesión de trading
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-mono text-[10px] block mb-1.5">Hora de inicio</label>
                  <input
                    type="time"
                    value={form.horaInicio}
                    onChange={e => set('horaInicio', e.target.value)}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="label-mono text-[10px] block mb-1.5">Hora de cierre</label>
                  <input
                    type="time"
                    value={form.horaFin}
                    onChange={e => set('horaFin', e.target.value)}
                    className="input text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-mono text-[10px] block mb-1.5">Gestión de stop</label>
                  <input
                    type="text"
                    placeholder="ej. Stop fijo 10 puntos, trailing stop, ATR x1.5"
                    value={form.gestionStop}
                    onChange={e => set('gestionStop', e.target.value)}
                    className="input text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Reglas */}
            <div className="mb-6">
              <div className="label-mono text-[10px] text-[var(--gold)] mb-3 border-b border-[var(--border)] pb-2">
                04 — Reglas del plan
              </div>
              <textarea
                rows={6}
                placeholder={`Escribe tus reglas de trading. Ej:\n1. Solo operar en la primera hora de NY\n2. Máximo 2 trades por día\n3. No operar si hay noticias de alto impacto\n4. Stop loss obligatorio antes de entrar`}
                value={form.reglas}
                onChange={e => set('reglas', e.target.value)}
                className="input text-sm resize-none w-full"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-5 border-t border-[var(--border)]">
              <button
                onClick={handleSubmit}
                disabled={saving || !form.name.trim()}
                className="btn-gold py-3 px-7 rounded-lg flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : modalMode === 'edit' ? 'Guardar cambios' : 'Crear plan'}
              </button>
              <button onClick={closeModal} className="btn-outline py-3 px-5 rounded-lg">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.9)' }}>
          <div className="card-panel w-full max-w-sm text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="headline text-xl text-[var(--text-primary)] mb-2">¿Eliminar este plan?</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Las operaciones vinculadas no serán eliminadas. Esta acción no se puede deshacer.
            </p>
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
