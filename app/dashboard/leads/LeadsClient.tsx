'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Lead {
  id: string
  phone: string
  name: string | null
  estado: string
  perfil: string | null
  respuestas: Record<string, string> | null
  historial: { role: string; content: string }[] | null
  productoUrl: string | null
  createdAt: string
  updatedAt: string
}

interface Stats {
  totalAll: number
  porEstado: { estado: string; _count: { estado: number } }[]
  porPerfil: { perfil: string | null; _count: { perfil: number } }[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ESTADO_LABEL: Record<string, string> = {
  NUEVO: 'Nuevo', NOMBRE: 'Nombre', P1: 'Preg. 1', P2: 'Preg. 2',
  P3: 'Preg. 3', P4: 'Preg. 4', P5: 'Preg. 5',
  CLASIFICADO: 'Clasificado', CTA: 'Oferta enviada', VENDIDO: 'Vendido',
}

const ESTADO_COLOR: Record<string, string> = {
  NUEVO: 'bg-gray-500/20 text-gray-400',
  NOMBRE: 'bg-gray-500/20 text-gray-400',
  P1: 'bg-blue-500/20 text-blue-400',
  P2: 'bg-blue-500/20 text-blue-400',
  P3: 'bg-blue-500/20 text-blue-400',
  P4: 'bg-blue-500/20 text-blue-400',
  P5: 'bg-blue-500/20 text-blue-400',
  CLASIFICADO: 'bg-yellow-500/20 text-yellow-400',
  CTA: 'bg-orange-500/20 text-orange-400',
  VENDIDO: 'bg-green-500/20 text-green-400',
}

const PERFIL_COLOR: Record<string, string> = {
  INTEGRAL: 'bg-purple-500/20 text-purple-400',
  FUTUROS: 'bg-cyan-500/20 text-cyan-400',
}

const PREGUNTAS: Record<string, string> = {
  P1: '¿Tienes trabajo/ingresos? ¿Has invertido antes?',
  P2: '¿Qué buscas principalmente?',
  P3: '¿Cuánto tiempo libre tienes para aprender/practicar?',
  P4: '¿Qué te ha frenado? ¿Qué buscas en un programa de formación?',
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return `hace ${d}d`
  if (h > 0) return `hace ${h}h`
  if (m > 0) return `hace ${m}m`
  return 'ahora'
}

// ── Modal de detalle ──────────────────────────────────────────────────────────

function LeadModal({ lead, onClose, onDelete, onResetEstado }: {
  lead: Lead
  onClose: () => void
  onDelete: (id: string) => void
  onResetEstado: (id: string, estado: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [resetting, setResetting] = useState(false)

  const handleReset = async () => {
    setResetting(true)
    await onResetEstado(lead.id, 'NUEVO')
    setResetting(false)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <div className="min-h-full flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-2xl rounded-2xl border border-[var(--border)] shadow-2xl"
          style={{ background: 'var(--bg-card)' }}
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {lead.name || 'Sin nombre'}
              </h2>
              <p className="text-sm text-[var(--text-muted)]">+{lead.phone}</p>
            </div>
            <div className="flex items-center gap-2">
              {lead.perfil && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${PERFIL_COLOR[lead.perfil] || 'bg-gray-500/20 text-gray-400'}`}>
                  {lead.perfil === 'FUTUROS' ? 'Maestría Futuros' : 'Mentoría Integral'}
                </span>
              )}
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${ESTADO_COLOR[lead.estado] || 'bg-gray-500/20 text-gray-400'}`}>
                {ESTADO_LABEL[lead.estado] || lead.estado}
              </span>
              <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] ml-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">

            {/* Respuestas al cuestionario */}
            {lead.respuestas && Object.keys(lead.respuestas).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--gold)] mb-3 uppercase tracking-wider">
                  Respuestas del cuestionario
                </h3>
                <div className="space-y-3">
                  {Object.entries(lead.respuestas).map(([key, val]) => (
                    <div key={key} className="rounded-xl p-3 border border-[var(--border)]"
                      style={{ background: 'var(--bg-secondary)' }}>
                      <p className="text-xs text-[var(--text-muted)] mb-1">{PREGUNTAS[key] || key}</p>
                      <p className="text-sm text-[var(--text-primary)]">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Historial de conversación */}
            {lead.historial && lead.historial.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--gold)] mb-3 uppercase tracking-wider">
                  Conversación completa
                </h3>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {lead.historial.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[var(--gold-dark)]/20 text-[var(--text-primary)] border border-[var(--gold-dark)]/30'
                          : 'border border-[var(--border)] text-[var(--text-secondary)]'
                      }`} style={msg.role === 'assistant' ? { background: 'var(--bg-secondary)' } : {}}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              <div className="text-xs text-[var(--text-muted)]">
                Creado {timeAgo(lead.createdAt)} · Actualizado {timeAgo(lead.updatedAt)}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  disabled={resetting}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--gold)] transition-colors disabled:opacity-50"
                >
                  {resetting ? 'Reiniciando...' : '↩ Reiniciar conversación'}
                </button>
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-800/40 text-red-400 hover:bg-red-900/20 transition-colors"
                  >
                    🗑 Eliminar lead
                  </button>
                ) : (
                  <div className="flex gap-1">
                    <button
                      onClick={() => onDelete(lead.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-900/30 border border-red-700/50 text-red-400 hover:bg-red-900/50 transition-colors"
                    >
                      ¿Confirmar?
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs px-2 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)]"
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LeadsClient() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroPerfil, setFiltroPerfil] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (filtroEstado) params.set('estado', filtroEstado)
    if (filtroPerfil) params.set('perfil', filtroPerfil)
    const res = await fetch(`/api/leads?${params}`)
    const data = await res.json()
    setLeads(data.leads || [])
    setTotal(data.total || 0)
    setStats(data.stats || null)
    setLoading(false)
  }, [page, filtroEstado, filtroPerfil])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const handleDelete = async (id: string) => {
    await fetch('/api/leads', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setSelectedLead(null)
    fetchLeads()
  }

  const handleResetEstado = async (id: string, estado: string) => {
    await fetch('/api/leads', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, estado }) })
    setSelectedLead(null)
    fetchLeads()
  }

  const totalPages = Math.ceil(total / 20)

  const vendidos = stats?.porEstado.find(e => e.estado === 'VENDIDO')?._count?.estado || 0
  const enCTA    = stats?.porEstado.find(e => e.estado === 'CTA')?._count?.estado || 0
  const integral = stats?.porPerfil.find(e => e.perfil === 'INTEGRAL')?._count?.perfil || 0
  const futuros  = stats?.porPerfil.find(e => e.perfil === 'FUTUROS')?._count?.perfil || 0

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[var(--text-primary)]">
          📱 Leads WhatsApp
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Contactos captados por Vinces IA en WhatsApp
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total leads', value: stats.totalAll, color: 'text-[var(--text-primary)]' },
            { label: 'Oferta enviada', value: enCTA, color: 'text-orange-400' },
            { label: 'Vendidos', value: vendidos, color: 'text-green-400' },
            { label: 'Tasa cierre', value: stats.totalAll > 0 ? `${((vendidos / stats.totalAll) * 100).toFixed(0)}%` : '0%', color: 'text-[var(--gold)]' },
          ].map(s => (
            <div key={s.label} className="card rounded-xl p-4">
              <p className="text-xs text-[var(--text-muted)] mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Perfil breakdown */}
      {(integral > 0 || futuros > 0) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card rounded-xl p-4 border-l-2 border-purple-500">
            <p className="text-xs text-[var(--text-muted)] mb-1">Mentoría Integral</p>
            <p className="text-xl font-black text-purple-400">{integral} leads</p>
          </div>
          <div className="card rounded-xl p-4 border-l-2 border-cyan-500">
            <p className="text-xs text-[var(--text-muted)] mb-1">Maestría Futuros</p>
            <p className="text-xl font-black text-cyan-400">{futuros} leads</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filtroEstado}
          onChange={e => { setFiltroEstado(e.target.value); setPage(1) }}
          className="input text-sm py-2 px-3 rounded-lg"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={filtroPerfil}
          onChange={e => { setFiltroPerfil(e.target.value); setPage(1) }}
          className="input text-sm py-2 px-3 rounded-lg"
        >
          <option value="">Todos los perfiles</option>
          <option value="INTEGRAL">Mentoría Integral</option>
          <option value="FUTUROS">Maestría Futuros</option>
        </select>
        {(filtroEstado || filtroPerfil) && (
          <button
            onClick={() => { setFiltroEstado(''); setFiltroPerfil(''); setPage(1) }}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] px-3 py-2 rounded-lg border border-[var(--border)] transition-colors"
          >
            ✕ Limpiar filtros
          </button>
        )}
        <span className="ml-auto text-sm text-[var(--text-muted)] self-center">
          {total} resultado{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabla */}
      <div className="card rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[var(--text-muted)]">Cargando leads...</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-muted)]">No hay leads con estos filtros.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)] uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Contacto</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Teléfono</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Perfil</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Actualizado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, i) => (
                  <tr
                    key={lead.id}
                    className={`border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--text-primary)]">
                        {lead.name || <span className="text-[var(--text-muted)] italic">Sin nombre</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-[var(--text-muted)] font-mono text-xs">
                      +{lead.phone}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${ESTADO_COLOR[lead.estado] || 'bg-gray-500/20 text-gray-400'}`}>
                        {ESTADO_LABEL[lead.estado] || lead.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {lead.perfil ? (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${PERFIL_COLOR[lead.perfil] || 'bg-gray-500/20 text-gray-400'}`}>
                          {lead.perfil === 'FUTUROS' ? 'Futuros' : 'Integral'}
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)] text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-[var(--text-muted)] text-xs">
                      {timeAgo(lead.updatedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedLead(lead) }}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors px-2 py-1 rounded border border-[var(--border)] hover:border-[var(--gold)]"
                      >
                        Ver →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 transition-colors"
          >
            ← Anterior
          </button>
          <span className="text-sm text-[var(--text-muted)] px-2">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 transition-colors"
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* Modal de detalle */}
      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onDelete={handleDelete}
          onResetEstado={handleResetEstado}
        />
      )}
    </div>
  )
}
