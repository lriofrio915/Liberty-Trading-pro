'use client'

import { useState } from 'react'

// ── Tipos ──────────────────────────────────────────────────────────────────

interface KycClient {
  id: string
  status: string
  fullName: string
  email: string | null
  phone: string | null
  country: string
  city: string | null
  tier: string | null
  capitalDisponible: number | null
  capitalAsignado: number | null
  horizonte: string | null
  toleranciaRiesgo: string | null
  experiencia: string | null
  fuenteCapital: string | null
  objetivo: string | null
  tieneIbkr: boolean
  ibkrAccount: string | null
  esPep: boolean
  documentType: string | null
  documentNumber: string | null
  notas: string | null
  rejectionReason: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  submittedAt: string | null
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  PENDIENTE:  'bg-yellow-400/15 text-yellow-400',
  REVISANDO:  'bg-blue-400/15 text-blue-400',
  APROBADO:   'bg-green-400/15 text-green-400',
  RECHAZADO:  'bg-red-400/15 text-red-400',
}

const TIER_COLORS: Record<string, string> = {
  A: 'bg-purple-400/15 text-purple-400',
  B: 'bg-cyan-400/15 text-cyan-400',
}

function fmt(n: number | null) {
  if (n == null) return '—'
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0 })}`
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Componente ─────────────────────────────────────────────────────────────

export default function ClientesClient({
  initialClientes,
  porStatus,
  aum,
}: {
  initialClientes: KycClient[]
  porStatus: { status: string; _count: { status: number } }[]
  aum: number
}) {
  const [clientes, setClientes] = useState<KycClient[]>(initialClientes)
  const [filter, setFilter]     = useState('TODOS')
  const [selected, setSelected] = useState<KycClient | null>(null)
  const [saving, setSaving]     = useState(false)
  const [editCapital, setEditCapital]   = useState('')
  const [editNotas, setEditNotas]       = useState('')
  const [editReason, setEditReason]     = useState('')
  const [msg, setMsg]                   = useState('')

  const counts = Object.fromEntries(porStatus.map(p => [p.status, p._count.status]))
  const total  = clientes.length

  const visible = filter === 'TODOS' ? clientes : clientes.filter(c => c.status === filter)

  function openModal(c: KycClient) {
    setSelected(c)
    setEditCapital(c.capitalAsignado?.toString() || '')
    setEditNotas(c.notas || '')
    setEditReason(c.rejectionReason || '')
    setMsg('')
  }

  async function patch(id: string, data: object) {
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch(`/api/kyc/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { setMsg(json.error || 'Error'); setSaving(false); return }
      // Actualizar state local
      setClientes(prev => prev.map(c => c.id === id ? { ...c, ...json.kyc } : c))
      setSelected(json.kyc)
      setMsg('Guardado ✓')
    } catch {
      setMsg('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  async function deleteKyc(id: string) {
    if (!confirm('¿Eliminar este registro KYC? Esta acción no se puede deshacer.')) return
    const res = await fetch(`/api/kyc/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setClientes(prev => prev.filter(c => c.id !== id))
      setSelected(null)
    }
  }

  const inputCls = 'w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400/60'

  return (
    <div className="p-6 space-y-6 min-h-screen">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Clientes KYC</h1>
        <p className="text-gray-500 text-sm mt-1">Gestión de formularios de asesoría de inversión</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total clientes" value={total.toString()} />
        <StatCard label="Pendientes"     value={(counts['PENDIENTE'] || 0).toString()} accent="yellow" />
        <StatCard label="Aprobados"      value={(counts['APROBADO']  || 0).toString()} accent="green" />
        <StatCard label="AUM gestionado" value={fmt(aum)} accent="purple" />
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {['TODOS', 'PENDIENTE', 'REVISANDO', 'APROBADO', 'RECHAZADO'].map(s => (
          <button key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === s
                ? 'bg-yellow-400 text-black'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Lista */}
      {visible.length === 0 ? (
        <p className="text-gray-600 text-sm py-10 text-center">No hay clientes en este estado.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {visible.map(c => (
            <button key={c.id} onClick={() => openModal(c)}
              className="text-left bg-[#111] border border-white/8 rounded-xl p-4 hover:border-yellow-400/30 transition-colors space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">{c.fullName}</p>
                  <p className="text-xs text-gray-500">{c.email || c.phone || '—'}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status] || 'bg-white/10 text-gray-400'}`}>
                  {c.status}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {c.tier && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[c.tier] || 'bg-white/10 text-gray-400'}`}>
                    Tier {c.tier}
                  </span>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                  {c.country}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Disponible: <span className="text-gray-300">{fmt(c.capitalDisponible)}</span></span>
                <span>Asignado: <span className={c.capitalAsignado ? 'text-green-400' : 'text-gray-600'}>{fmt(c.capitalAsignado)}</span></span>
              </div>
              <p className="text-[11px] text-gray-600">{fmtDate(c.createdAt)}</p>
            </button>
          ))}
        </div>
      )}

      {/* Modal de detalle */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl my-8 overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div>
                <h2 className="text-base font-bold text-white">{selected.fullName}</h2>
                <p className="text-xs text-gray-500">{selected.email} · {selected.phone}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-6">

              {/* Datos KYC */}
              <section className="space-y-3">
                <h3 className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Datos del cliente</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <KV label="País"            value={`${selected.city ? selected.city + ', ' : ''}${selected.country}`} />
                  <KV label="Tier"            value={selected.tier ? `Tier ${selected.tier}` : '—'} />
                  <KV label="Capital dispon." value={fmt(selected.capitalDisponible)} />
                  <KV label="Horizonte"       value={selected.horizonte || '—'} />
                  <KV label="Riesgo"          value={selected.toleranciaRiesgo || '—'} />
                  <KV label="Fuente capital"  value={selected.fuenteCapital || '—'} />
                  <KV label="Objetivo"        value={selected.objetivo || '—'} />
                  <KV label="IBKR"            value={selected.tieneIbkr ? `Sí${selected.ibkrAccount ? ` (${selected.ibkrAccount})` : ''}` : 'No'} />
                  <KV label="PEP"             value={selected.esPep ? 'Sí ⚠️' : 'No'} />
                  <KV label="Documento"       value={selected.documentType ? `${selected.documentType} ${selected.documentNumber}` : '—'} />
                  <KV label="Enviado"         value={fmtDate(selected.submittedAt)} />
                  <KV label="Revisado por"    value={selected.reviewedBy || '—'} />
                </div>
                {selected.experiencia && (
                  <div className="bg-white/3 rounded-lg p-3 text-sm text-gray-300">
                    <p className="text-xs text-gray-500 mb-1">Experiencia:</p>
                    {selected.experiencia}
                  </div>
                )}
              </section>

              {/* Panel de gestión admin */}
              <section className="space-y-4 border-t border-white/8 pt-5">
                <h3 className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Gestión</h3>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400">Estado</label>
                  <div className="flex gap-2 flex-wrap">
                    {['PENDIENTE', 'REVISANDO', 'APROBADO', 'RECHAZADO'].map(s => (
                      <button key={s}
                        onClick={() => patch(selected.id, { status: s })}
                        disabled={saving}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          selected.status === s
                            ? 'bg-yellow-400 text-black'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Capital asignado */}
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400">Capital asignado (USD que gestionas)</label>
                  <div className="flex gap-2">
                    <input className={inputCls} type="number" min="0" placeholder="0"
                      value={editCapital} onChange={e => setEditCapital(e.target.value)} />
                    <button
                      onClick={() => patch(selected.id, { capitalAsignado: editCapital })}
                      disabled={saving}
                      className="px-4 py-2 bg-yellow-400 text-black text-xs font-semibold rounded-lg hover:bg-yellow-300 disabled:opacity-50 whitespace-nowrap"
                    >
                      Guardar
                    </button>
                  </div>
                </div>

                {/* Notas */}
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400">Notas internas</label>
                  <div className="flex gap-2">
                    <textarea className={inputCls + ' resize-none'} rows={2}
                      placeholder="Notas privadas sobre este cliente..."
                      value={editNotas} onChange={e => setEditNotas(e.target.value)} />
                    <button
                      onClick={() => patch(selected.id, { notas: editNotas })}
                      disabled={saving}
                      className="px-4 py-2 bg-white/8 text-gray-300 text-xs font-medium rounded-lg hover:bg-white/15 disabled:opacity-50 whitespace-nowrap"
                    >
                      Guardar
                    </button>
                  </div>
                </div>

                {/* Motivo de rechazo */}
                {selected.status === 'RECHAZADO' && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400">Motivo de rechazo</label>
                    <div className="flex gap-2">
                      <input className={inputCls} placeholder="Razón del rechazo..."
                        value={editReason} onChange={e => setEditReason(e.target.value)} />
                      <button
                        onClick={() => patch(selected.id, { rejectionReason: editReason })}
                        disabled={saving}
                        className="px-4 py-2 bg-white/8 text-gray-300 text-xs font-medium rounded-lg hover:bg-white/15 disabled:opacity-50 whitespace-nowrap"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                )}

                {msg && <p className="text-xs text-green-400">{msg}</p>}
              </section>

              {/* Eliminar */}
              <div className="border-t border-white/8 pt-4">
                <button
                  onClick={() => deleteKyc(selected.id)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Eliminar registro KYC
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  const colors: Record<string, string> = {
    yellow: 'text-yellow-400',
    green:  'text-green-400',
    purple: 'text-purple-400',
  }
  return (
    <div className="bg-[#111] border border-white/8 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${accent ? colors[accent] : 'text-white'}`}>{value}</p>
    </div>
  )
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-500 text-xs">{label}: </span>
      <span className="text-gray-300">{value}</span>
    </div>
  )
}
