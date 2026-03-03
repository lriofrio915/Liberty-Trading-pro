'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

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
  dataFeedMensual: number | null
  comisionPorTrade: number | null
  maxDrawdownPermitido: number | null
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
  dataFeedMensual: string
  comisionPorTrade: string
  maxDrawdownPermitido: string
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

  // Max Drawdown
  let peak = 0, maxDD = 0, balance = 0
  const sorted = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  sorted.forEach(s => {
    const p = s.resultado === 'WIN' ? Math.abs(s.pnlNeto) : s.resultado === 'LOSS' ? -Math.abs(s.pnlNeto) : s.pnlNeto
    balance += p
    if (balance > peak) peak = balance
    const dd = peak - balance
    if (dd > maxDD) maxDD = dd
  })

  return { total: sessions.length, wins: wins.length, losses: losses.length, pnl, winRate, profitFactor, maxDrawdown: maxDD }
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

// ── Portal modal ──────────────────────────────────────────────────────────────

interface ModalProps {
  mode: 'new' | 'edit'
  form: FormState
  set: (k: keyof FormState, v: unknown) => void
  saving: boolean
  onSubmit: () => void
  onClose: () => void
}

function PlanModal({ mode, form, set, saving, onSubmit, onClose }: ModalProps) {
  return createPortal(
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        zIndex: 9999,
        overflowY: 'auto',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#111111',
          border: '1px solid rgba(201,168,76,0.2)',
          width: '100%',
          maxWidth: '680px',
          position: 'relative',
          marginBottom: '40px',
          padding: '2rem',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', color: '#666', fontSize: '1.25rem', lineHeight: 1 }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#666')}
        >
          ✕
        </button>

        <div className="label-mono mb-1 text-[var(--gold)]">
          {mode === 'edit' ? 'Editar Plan' : 'Nuevo Plan'}
        </div>
        <h2 className="headline text-2xl text-[var(--text-primary)] mb-6">
          {mode === 'edit' ? form.name || 'Plan de Trading' : 'Crear Plan de Trading'}
        </h2>

        {/* 01 — Identificación */}
        <div className="mb-6">
          <div className="label-mono text-[10px] text-[var(--gold)] mb-3 border-b border-[var(--border)] pb-2">
            01 — Identificacion
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label-mono text-[10px] block mb-1.5">Nombre del plan *</label>
              <input
                type="text"
                placeholder="ej. Plan NQ - Sesion NY"
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

        {/* 02 — Capital y Riesgo */}
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
            <div className="sm:col-span-2">
              <label className="label-mono text-[10px] block mb-1.5">Max Drawdown Permitido (USD)</label>
              <input
                type="number"
                step="100"
                placeholder="ej. 2000"
                value={form.maxDrawdownPermitido}
                onChange={e => set('maxDrawdownPermitido', e.target.value)}
                className="input text-sm"
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Si llegas a esta perdida maxima, paras de operar</p>
            </div>
          </div>
        </div>

        {/* 03 — Sesión */}
        <div className="mb-6">
          <div className="label-mono text-[10px] text-[var(--gold)] mb-3 border-b border-[var(--border)] pb-2">
            03 — Sesion de trading
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
              <label className="label-mono text-[10px] block mb-1.5">Gestion de stop</label>
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

        {/* 04 — Costos Operativos */}
        <div className="mb-6">
          <div className="label-mono text-[10px] text-[var(--gold)] mb-3 border-b border-[var(--border)] pb-2">
            04 — Costos Operativos
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-mono text-[10px] block mb-1.5">Data Feed Mensual (USD)</label>
              <input
                type="number"
                step="1"
                placeholder="ej. 150"
                value={form.dataFeedMensual}
                onChange={e => set('dataFeedMensual', e.target.value)}
                className="input text-sm"
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Costo fijo mensual por acceso a datos de mercado</p>
            </div>
            <div>
              <label className="label-mono text-[10px] block mb-1.5">Comision por Trade (USD) — ida + vuelta</label>
              <input
                type="number"
                step="0.01"
                placeholder="ej. 4.20"
                value={form.comisionPorTrade}
                onChange={e => set('comisionPorTrade', e.target.value)}
                className="input text-sm"
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Costo total por abrir y cerrar una posicion</p>
            </div>
          </div>
        </div>

        {/* 05 — Reglas */}
        <div className="mb-6">
          <div className="label-mono text-[10px] text-[var(--gold)] mb-3 border-b border-[var(--border)] pb-2">
            05 — Reglas del plan
          </div>
          <textarea
            rows={6}
            placeholder={'Escribe tus reglas de trading. Ej:\n1. Solo operar en la primera hora de NY\n2. Maximo 2 trades por dia\n3. No operar si hay noticias de alto impacto\n4. Stop loss obligatorio antes de entrar'}
            value={form.reglas}
            onChange={e => set('reglas', e.target.value)}
            className="input text-sm resize-none w-full"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-5 border-t border-[var(--border)]">
          <button
            onClick={onSubmit}
            disabled={saving || !form.name.trim()}
            className="btn-gold py-3 px-7 rounded-lg flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : mode === 'edit' ? 'Guardar cambios' : 'Crear plan'}
          </button>
          <button onClick={onClose} className="btn-outline py-3 px-5 rounded-lg">
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body
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
  const [tradesPerMonth, setTradesPerMonth] = useState('20')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

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
    dataFeedMensual: '',
    comisionPorTrade: '',
    maxDrawdownPermitido: '',
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
      dataFeedMensual: plan.dataFeedMensual != null ? String(plan.dataFeedMensual) : '',
      comisionPorTrade: plan.comisionPorTrade != null ? String(plan.comisionPorTrade) : '',
      maxDrawdownPermitido: plan.maxDrawdownPermitido != null ? String(plan.maxDrawdownPermitido) : '',
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
        dataFeedMensual: form.dataFeedMensual ? parseFloat(form.dataFeedMensual) : null,
        comisionPorTrade: form.comisionPorTrade ? parseFloat(form.comisionPorTrade) : null,
        maxDrawdownPermitido: form.maxDrawdownPermitido ? parseFloat(form.maxDrawdownPermitido) : null,
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
          <p className="text-[var(--text-secondary)] text-sm">Define tus reglas y gestion de riesgo</p>
        </div>
        <button onClick={openNew} className="btn-gold py-2.5 px-5 rounded-lg text-sm">
          + Nuevo Plan
        </button>
      </div>

      {/* Empty state */}
      {plans.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-bold mb-2">Sin planes de trading</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-md mx-auto">
            Crea tu primer plan para definir reglas, gestion de riesgo y objetivos.
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

            // Cost line for card
            const costParts: string[] = []
            if (plan.dataFeedMensual) costParts.push(`Data Feed: $${plan.dataFeedMensual}/mes`)
            if (plan.comisionPorTrade) costParts.push(`Comision: $${plan.comisionPorTrade}/trade`)

            // Calculator
            const tradesNum = parseInt(tradesPerMonth) || 0
            const totalComisiones = plan.comisionPorTrade ? plan.comisionPorTrade * tradesNum : 0
            const totalOperativo = (plan.dataFeedMensual ?? 0) + totalComisiones

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
                    {costParts.length > 0 && (
                      <div className="text-[10px] text-[var(--text-muted)] mt-1">
                        {costParts.join(' | ')}
                      </div>
                    )}
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
                  <div className="text-xs text-[var(--text-muted)] mb-4">Sin operaciones vinculadas aun</div>
                )}

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-[var(--border)] pt-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="label-mono text-[9px] mb-0.5">Horario de sesion</div>
                        <div className="font-medium">{plan.horaInicio} – {plan.horaFin}</div>
                      </div>
                      <div>
                        <div className="label-mono text-[9px] mb-0.5">Gestion de Stop</div>
                        <div className="font-medium">{plan.gestionStop || '—'}</div>
                      </div>
                      <div>
                        <div className="label-mono text-[9px] mb-0.5">Riesgo $ / Trade</div>
                        <div className="font-medium">
                          {plan.riesgoPorTrade > 0 ? `$${plan.riesgoPorTrade}` : '—'}
                        </div>
                      </div>
                    </div>

                    {/* Drawdown bar */}
                    {plan.maxDrawdownPermitido != null && plan.maxDrawdownPermitido > 0 && (() => {
                      const pct = (stats.maxDrawdown / plan.maxDrawdownPermitido!) * 100
                      const barColor = pct >= 100 ? '#FF4444' : pct >= 80 ? '#f97316' : '#eab308'
                      return (
                        <div className="bg-black/30 rounded-lg p-3">
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="label-mono text-[9px]">Drawdown actual vs limite</span>
                            {pct >= 100
                              ? <span className="font-bold text-red-400">⛔ LIMITE ALCANZADO</span>
                              : <span style={{ color: barColor }} className="font-bold">{pct.toFixed(0)}%</span>
                            }
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.min(pct, 100)}%`, background: barColor }}
                              className="h-full rounded-full transition-all duration-500"
                            />
                          </div>
                          <div className="flex justify-between text-[10px] mt-1 text-[var(--text-muted)]">
                            <span>-${stats.maxDrawdown.toFixed(0)} actual</span>
                            <span>Limite: -${plan.maxDrawdownPermitido}</span>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Cost calculator */}
                    {(plan.dataFeedMensual || plan.comisionPorTrade) && (
                      <div className="bg-black/30 rounded-lg p-4">
                        <div className="label-mono text-[9px] mb-3 text-[var(--gold)]">Calculadora de costos operativos</div>
                        <div className="flex items-center gap-3 mb-3">
                          <label className="text-xs text-[var(--text-muted)] whitespace-nowrap">Trades / mes:</label>
                          <input
                            type="number"
                            min="1"
                            value={tradesPerMonth}
                            onChange={e => setTradesPerMonth(e.target.value)}
                            className="input text-sm w-24 py-1"
                          />
                        </div>
                        <div className="space-y-1 text-sm">
                          {plan.comisionPorTrade != null && (
                            <div className="flex justify-between">
                              <span className="text-[var(--text-muted)]">Comisiones ({tradesNum} trades × ${plan.comisionPorTrade})</span>
                              <span className="font-mono-custom text-[var(--red)]">-${totalComisiones.toFixed(2)}</span>
                            </div>
                          )}
                          {plan.dataFeedMensual != null && (
                            <div className="flex justify-between">
                              <span className="text-[var(--text-muted)]">Data Feed mensual</span>
                              <span className="font-mono-custom text-[var(--red)]">-${plan.dataFeedMensual.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t border-[var(--border)] font-bold">
                            <span>Costo operativo total mensual</span>
                            <span className="font-mono-custom" style={{ color: 'var(--red)' }}>-${totalOperativo.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}

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

      {/* ── Modal via Portal (escapa overflow:hidden del layout) ── */}
      {mounted && modalMode !== null && (
        <PlanModal
          mode={modalMode}
          form={form}
          set={set}
          saving={saving}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}

      {/* ── Delete confirmation via Portal ── */}
      {mounted && confirmDeleteId && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div className="card-panel w-full max-w-sm text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="headline text-xl text-[var(--text-primary)] mb-2">¿Eliminar este plan?</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Las operaciones vinculadas no seran eliminadas. Esta accion no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deleting}
                className="flex-1 py-3 rounded-lg text-sm font-bold bg-[var(--red)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Si, eliminar'}
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 btn-outline py-3 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
