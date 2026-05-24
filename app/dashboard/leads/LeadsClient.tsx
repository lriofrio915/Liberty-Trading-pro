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

interface LeadStats {
  totalAll: number
  porEstado: { estado: string; _count: { estado: number } }[]
  porPerfil: { perfil: string | null; _count: { perfil: number } }[]
}

interface Alumno {
  id: string
  name: string
  email: string
  plan: string
  active: boolean
  createdAt: string
  country: string | null
  lastActivity: string | null
  leccionesCompletadas: number
  progreso: number
  totalSesiones: number
  winRate: number | null
  totalPnl: number | null
}

interface AlumnoStats {
  totalActivos: number
  totalInactivos: number
  newThisMonth: number
  newThisWeek: number
  churnRate: string
}

interface AlumnoDetalle {
  alumno: {
    id: string; name: string; email: string; plan: string; active: boolean
    createdAt: string; country: string | null; tradingStyle: string | null
  }
  planes: {
    name: string; broker: string; instrumento: string
    capitalInicial: number; riesgo: number; rrRatio: number
  }[]
  resumen: {
    totalOps: number; wins: number; losses: number; winRate: number
    totalPnl: number; avgWin: number; avgLoss: number; bestTrade: number; worstTrade: number
  }
  sessions: {
    id: string; date: string; instrumento: string; direccion: string
    resultado: string; pnlNeto: number; pnlBruto: number; comisiones: number
    contratos: number; rrReal: number | null; sentimiento: string | null
    notas: string | null; siguioPlan: boolean
  }[]
  metricasPeriodo: {
    periodo: string; totalOperaciones: number; ganadoras: number; perdedoras: number
    winRate: number; pnlNeto: number; profitFactor: number; maxDrawdown: number
    maxDrawdownPct: number; rrPromedio: number; rendimiento: number; calculadoAt: string
  }[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

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
  FUTUROS:  'bg-cyan-500/20 text-cyan-400',
  MENSUAL:  'bg-purple-500/20 text-purple-400',
  ANUAL:    'bg-cyan-500/20 text-cyan-400',
}

const PERFIL_LABEL: Record<string, string> = {
  INTEGRAL: 'Plan Pro Mensual',
  FUTUROS:  'Plan Pro Anual',
  MENSUAL:  'Plan Pro Mensual',
  ANUAL:    'Plan Pro Anual',
}

const PLAN_COLOR: Record<string, string> = {
  FREE:      'bg-gray-500/20 text-gray-400',
  CLUB:      'bg-blue-500/20 text-blue-400',
  PRO:       'bg-yellow-500/20 text-yellow-400',
  PORTFOLIO: 'bg-purple-500/20 text-purple-400',
}

const PREGUNTAS: Record<string, string> = {
  P1: '¿Tienes trabajo/ingresos? ¿Has invertido antes?',
  P2: '¿Qué buscas principalmente?',
  P3: '¿Cuánto tiempo libre tienes para aprender/practicar?',
  P4: '¿Qué te ha frenado? ¿Qué buscas en un programa de formación?',
}

const LANDING_PAGES = [
  { nombre: 'Principal',          slug: '/',                  descripcion: 'Página de inicio Liberty Trading Club' },
  { nombre: 'Mentoría Integral',  slug: '/mentoria-integral', descripcion: 'Landing de Mentoría Integral' },
  { nombre: 'Maestría Futuros',   slug: '/maestria-futuros',  descripcion: 'Landing de Maestría en Futuros' },
  { nombre: 'P2P Trading',        slug: '/p2p',               descripcion: 'Landing de Trading P2P' },
  { nombre: 'Unirse al Club',     slug: '/unirse',            descripcion: 'Registro al Liberty Trading Club' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtPnl(val: number) {
  const sign = val >= 0 ? '+' : ''
  return `${sign}$${val.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ── Lead Modal ────────────────────────────────────────────────────────────────

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="min-h-full flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-2xl rounded-2xl border border-[var(--border)] shadow-2xl"
          style={{ background: 'var(--bg-card)' }}
          onClick={e => e.stopPropagation()}>

          <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">{lead.name || 'Sin nombre'}</h2>
              <p className="text-sm text-[var(--text-muted)]">+{lead.phone}</p>
            </div>
            <div className="flex items-center gap-2">
              {lead.perfil && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${PERFIL_COLOR[lead.perfil] || 'bg-gray-500/20 text-gray-400'}`}>
                  {PERFIL_LABEL[lead.perfil] || lead.perfil}
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
            {lead.respuestas && Object.keys(lead.respuestas).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--gold)] mb-3 uppercase tracking-wider">Respuestas del cuestionario</h3>
                <div className="space-y-3">
                  {Object.entries(lead.respuestas).map(([key, val]) => (
                    <div key={key} className="rounded-xl p-3 border border-[var(--border)]" style={{ background: 'var(--bg-secondary)' }}>
                      <p className="text-xs text-[var(--text-muted)] mb-1">{PREGUNTAS[key] || key}</p>
                      <p className="text-sm text-[var(--text-primary)]">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lead.historial && lead.historial.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--gold)] mb-3 uppercase tracking-wider">Conversación completa</h3>
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
                  <button onClick={() => setConfirmDelete(true)} className="text-xs px-3 py-1.5 rounded-lg border border-red-800/40 text-red-400 hover:bg-red-900/20 transition-colors">
                    Eliminar lead
                  </button>
                ) : (
                  <div className="flex gap-1">
                    <button onClick={() => onDelete(lead.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-900/30 border border-red-700/50 text-red-400 hover:bg-red-900/50 transition-colors">
                      Confirmar
                    </button>
                    <button onClick={() => setConfirmDelete(false)} className="text-xs px-2 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)]">
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

// ── Alumno Detail Modal ───────────────────────────────────────────────────────

function AlumnoModal({ alumnoId, onClose }: { alumnoId: string; onClose: () => void }) {
  const [data, setData] = useState<AlumnoDetalle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/alumnos/${alumnoId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [alumnoId])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="min-h-full flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-4xl rounded-2xl border border-[var(--border)] shadow-2xl"
          style={{ background: 'var(--bg-card)' }}
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {loading ? 'Cargando...' : data?.alumno.name}
              </h2>
              {!loading && data && (
                <p className="text-sm text-[var(--text-muted)]">{data.alumno.email}</p>
              )}
            </div>
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-[var(--text-muted)]">Cargando operativa...</div>
          ) : !data ? (
            <div className="p-12 text-center text-[var(--text-muted)]">Error al cargar datos.</div>
          ) : (
            <div className="p-6 space-y-6">

              {/* Plan info */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${PLAN_COLOR[data.alumno.plan] || 'bg-gray-500/20 text-gray-400'}`}>
                  {data.alumno.plan}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${data.alumno.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {data.alumno.active ? 'Activo' : 'Inactivo'}
                </span>
                {data.alumno.country && <span className="text-xs text-[var(--text-muted)]">{data.alumno.country}</span>}
                {data.alumno.tradingStyle && <span className="text-xs text-[var(--text-muted)]">Estilo: {data.alumno.tradingStyle}</span>}
                <span className="text-xs text-[var(--text-muted)] ml-auto">Desde {formatDate(data.alumno.createdAt)}</span>
              </div>

              {/* Resumen general operativa */}
              {data.resumen.totalOps > 0 ? (
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--gold)] mb-3 uppercase tracking-wider">Resumen Operativa</h3>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                      {[
                        { label: 'Operaciones', value: data.resumen.totalOps, color: 'text-[var(--text-primary)]' },
                        { label: 'Win Rate', value: `${data.resumen.winRate.toFixed(1)}%`, color: data.resumen.winRate >= 50 ? 'text-green-400' : 'text-red-400' },
                        { label: 'PnL Total', value: fmtPnl(data.resumen.totalPnl), color: data.resumen.totalPnl >= 0 ? 'text-green-400' : 'text-red-400' },
                        { label: 'Prom. ganadora', value: fmtPnl(data.resumen.avgWin), color: 'text-green-400' },
                        { label: 'Prom. perdedora', value: fmtPnl(data.resumen.avgLoss), color: 'text-red-400' },
                        { label: 'Mejor trade', value: fmtPnl(data.resumen.bestTrade), color: 'text-green-400' },
                        { label: 'Peor trade', value: fmtPnl(data.resumen.worstTrade), color: 'text-red-400' },
                        { label: 'Ganadoras', value: data.resumen.wins, color: 'text-green-400' },
                        { label: 'Perdedoras', value: data.resumen.losses, color: 'text-red-400' },
                      ].map(s => (
                        <div key={s.label} className="rounded-xl p-3 border border-[var(--border)]" style={{ background: 'var(--bg-secondary)' }}>
                          <p className="text-xs text-[var(--text-muted)] mb-1">{s.label}</p>
                          <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Métricas por período */}
                  {data.metricasPeriodo.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--gold)] mb-3 uppercase tracking-wider">Métricas por Período</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-[var(--border)] text-[var(--text-muted)] uppercase tracking-wider">
                              <th className="text-left px-3 py-2">Período</th>
                              <th className="text-right px-3 py-2">Ops</th>
                              <th className="text-right px-3 py-2">Win %</th>
                              <th className="text-right px-3 py-2">PnL</th>
                              <th className="text-right px-3 py-2">Profit Factor</th>
                              <th className="text-right px-3 py-2">Max DD</th>
                              <th className="text-right px-3 py-2">R:R prom</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.metricasPeriodo.map((m, i) => (
                              <tr key={i} className={`border-b border-[var(--border)] ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                                <td className="px-3 py-2 text-[var(--text-primary)] font-medium">{m.periodo}</td>
                                <td className="px-3 py-2 text-right text-[var(--text-muted)]">{m.totalOperaciones}</td>
                                <td className={`px-3 py-2 text-right font-medium ${m.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>{m.winRate.toFixed(1)}%</td>
                                <td className={`px-3 py-2 text-right font-medium ${m.pnlNeto >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmtPnl(m.pnlNeto)}</td>
                                <td className={`px-3 py-2 text-right font-medium ${m.profitFactor >= 1 ? 'text-green-400' : 'text-red-400'}`}>{m.profitFactor.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right text-red-400">{fmtPnl(-Math.abs(m.maxDrawdown))}</td>
                                <td className="px-3 py-2 text-right text-[var(--text-muted)]">{m.rrPromedio.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Planes de trading activos */}
                  {data.planes.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--gold)] mb-3 uppercase tracking-wider">Planes de Trading Activos</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {data.planes.map((p, i) => (
                          <div key={i} className="rounded-xl p-4 border border-[var(--border)]" style={{ background: 'var(--bg-secondary)' }}>
                            <p className="font-semibold text-[var(--text-primary)] mb-2">{p.name}</p>
                            <div className="grid grid-cols-2 gap-1 text-xs text-[var(--text-muted)]">
                              <span>Broker: <span className="text-[var(--text-primary)]">{p.broker}</span></span>
                              <span>Instrumento: <span className="text-[var(--text-primary)]">{p.instrumento}</span></span>
                              <span>Capital: <span className="text-[var(--text-primary)]">${p.capitalInicial.toLocaleString()}</span></span>
                              <span>Riesgo/op: <span className="text-[var(--text-primary)]">{p.riesgo}%</span></span>
                              <span>R:R objetivo: <span className="text-[var(--text-primary)]">{p.rrRatio}</span></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Últimas sesiones */}
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--gold)] mb-3 uppercase tracking-wider">
                      Últimas {data.sessions.length} Operaciones
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[var(--border)] text-[var(--text-muted)] uppercase tracking-wider">
                            <th className="text-left px-3 py-2">Fecha</th>
                            <th className="text-left px-3 py-2">Instrumento</th>
                            <th className="text-left px-3 py-2">Dir.</th>
                            <th className="text-right px-3 py-2">Resultado</th>
                            <th className="text-right px-3 py-2">PnL neto</th>
                            <th className="text-right px-3 py-2">R:R</th>
                            <th className="text-right px-3 py-2">Plan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.sessions.map((s, i) => (
                            <tr key={s.id} className={`border-b border-[var(--border)] ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                              <td className="px-3 py-2 text-[var(--text-muted)]">{formatDate(s.date)}</td>
                              <td className="px-3 py-2 text-[var(--text-primary)] font-medium">{s.instrumento}</td>
                              <td className="px-3 py-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${s.direccion === 'LONG' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                  {s.direccion}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${s.resultado === 'WIN' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                  {s.resultado}
                                </span>
                              </td>
                              <td className={`px-3 py-2 text-right font-medium ${s.pnlNeto >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {fmtPnl(s.pnlNeto)}
                              </td>
                              <td className="px-3 py-2 text-right text-[var(--text-muted)]">
                                {s.rrReal != null ? s.rrReal.toFixed(2) : '—'}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <span className={`text-[10px] ${s.siguioPlan ? 'text-green-400' : 'text-orange-400'}`}>
                                  {s.siguioPlan ? '✓' : '✗'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl p-6 border border-[var(--border)] text-center text-[var(--text-muted)]" style={{ background: 'var(--bg-secondary)' }}>
                  Este alumno aún no tiene operaciones registradas en la plataforma.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Tab 1: Leads y Campañas ───────────────────────────────────────────────────

function LeadsTab() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroPerfil, setFiltroPerfil] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

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

  const copyLink = async (slug: string) => {
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    await navigator.clipboard.writeText(`${base}${slug}`)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  const totalPages = Math.ceil(total / 20)
  const vendidos = stats?.porEstado.find(e => e.estado === 'VENDIDO')?._count?.estado || 0
  const enCTA    = stats?.porEstado.find(e => e.estado === 'CTA')?._count?.estado || 0
  const integral = (stats?.porPerfil.find(e => e.perfil === 'INTEGRAL')?._count?.perfil || 0) +
                   (stats?.porPerfil.find(e => e.perfil === 'MENSUAL')?._count?.perfil || 0)
  const futuros  = (stats?.porPerfil.find(e => e.perfil === 'FUTUROS')?._count?.perfil || 0) +
                   (stats?.porPerfil.find(e => e.perfil === 'ANUAL')?._count?.perfil || 0)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="space-y-8">

      {/* Landing Pages */}
      <div>
        <h2 className="text-base font-bold text-[var(--text-primary)] mb-4">Enlaces de Landing Pages</h2>
        <div className="card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)] uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Nombre</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Descripción</th>
                  <th className="text-left px-4 py-3">URL</th>
                  <th className="px-4 py-3 w-32 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {LANDING_PAGES.map((lp, i) => (
                  <tr key={lp.slug} className={`border-b border-[var(--border)] ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{lp.nombre}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-[var(--text-muted)] text-xs">{lp.descripcion}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`${origin}${lp.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-[var(--gold)] hover:underline"
                      >
                        {origin}{lp.slug}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => copyLink(lp.slug)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          copiedSlug === lp.slug
                            ? 'border-green-600/50 text-green-400 bg-green-900/20'
                            : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--gold)] hover:border-[var(--gold)]'
                        }`}
                      >
                        {copiedSlug === lp.slug ? '✓ Copiado' : 'Copiar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stats de Leads */}
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
            <p className="text-xs text-[var(--text-muted)] mb-1">Plan Pro Mensual</p>
            <p className="text-xl font-black text-purple-400">{integral} leads</p>
          </div>
          <div className="card rounded-xl p-4 border-l-2 border-cyan-500">
            <p className="text-xs text-[var(--text-muted)] mb-1">Plan Pro Anual</p>
            <p className="text-xl font-black text-cyan-400">{futuros} leads</p>
          </div>
        </div>
      )}

      {/* Tabla de Leads */}
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h2 className="text-base font-bold text-[var(--text-primary)]">Leads Captados</h2>
          <div className="flex flex-wrap gap-2 ml-auto">
            <select value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setPage(1) }} className="input text-sm py-2 px-3 rounded-lg">
              <option value="">Todos los estados</option>
              {Object.entries(ESTADO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={filtroPerfil} onChange={e => { setFiltroPerfil(e.target.value); setPage(1) }} className="input text-sm py-2 px-3 rounded-lg">
              <option value="">Todos los perfiles</option>
              <option value="MENSUAL">Plan Pro Mensual</option>
              <option value="INTEGRAL">Plan Pro Mensual (legacy)</option>
              <option value="ANUAL">Plan Pro Anual</option>
              <option value="FUTUROS">Plan Pro Anual (legacy)</option>
            </select>
            {(filtroEstado || filtroPerfil) && (
              <button onClick={() => { setFiltroEstado(''); setFiltroPerfil(''); setPage(1) }} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] px-3 py-2 rounded-lg border border-[var(--border)] transition-colors">
                ✕ Limpiar
              </button>
            )}
            <span className="text-sm text-[var(--text-muted)] self-center">{total} resultado{total !== 1 ? 's' : ''}</span>
          </div>
        </div>

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
                    <tr key={lead.id} className={`border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`} onClick={() => setSelectedLead(lead)}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--text-primary)]">
                          {lead.name || <span className="text-[var(--text-muted)] italic">Sin nombre</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-[var(--text-muted)] font-mono text-xs">+{lead.phone}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${ESTADO_COLOR[lead.estado] || 'bg-gray-500/20 text-gray-400'}`}>
                          {ESTADO_LABEL[lead.estado] || lead.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {lead.perfil ? (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${PERFIL_COLOR[lead.perfil] || 'bg-gray-500/20 text-gray-400'}`}>
                            {PERFIL_LABEL[lead.perfil] || lead.perfil}
                          </span>
                        ) : <span className="text-[var(--text-muted)] text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-[var(--text-muted)] text-xs">{timeAgo(lead.updatedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={e => { e.stopPropagation(); setSelectedLead(lead) }} className="text-xs text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors px-2 py-1 rounded border border-[var(--border)] hover:border-[var(--gold)]">
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

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 transition-colors">
              ← Anterior
            </button>
            <span className="text-sm text-[var(--text-muted)] px-2">{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 transition-colors">
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {selectedLead && (
        <LeadModal lead={selectedLead} onClose={() => setSelectedLead(null)} onDelete={handleDelete} onResetEstado={handleResetEstado} />
      )}
    </div>
  )
}

// ── Tab 2: Alumnos Pro ────────────────────────────────────────────────────────

function AlumnosTab() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [stats, setStats] = useState<AlumnoStats | null>(null)
  const [totalLecciones, setTotalLecciones] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filtroPlan, setFiltroPlan] = useState('')
  const [filtroActivo, setFiltroActivo] = useState('')
  const [selectedAlumnoId, setSelectedAlumnoId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/alumnos')
      .then(r => r.json())
      .then(data => {
        setAlumnos(data.alumnos || [])
        setStats(data.stats || null)
        setTotalLecciones(data.totalLecciones || 0)
        setLoading(false)
      })
  }, [])

  const alumnosFiltrados = alumnos.filter(a => {
    if (filtroPlan && a.plan !== filtroPlan) return false
    if (filtroActivo === 'activo' && !a.active) return false
    if (filtroActivo === 'inactivo' && a.active) return false
    return true
  })

  return (
    <div className="space-y-6">

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Alumnos activos',    value: stats.totalActivos,  color: 'text-green-400' },
            { label: 'Nuevos este mes',    value: stats.newThisMonth,  color: 'text-[var(--gold)]' },
            { label: 'Nuevos esta semana', value: stats.newThisWeek,   color: 'text-blue-400' },
            { label: 'Tasa abandono',      value: `${stats.churnRate}%`, color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="card rounded-xl p-4">
              <p className="text-xs text-[var(--text-muted)] mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <select value={filtroPlan} onChange={e => setFiltroPlan(e.target.value)} className="input text-sm py-2 px-3 rounded-lg">
          <option value="">Todos los planes</option>
          <option value="CLUB">Club</option>
          <option value="PRO">Pro</option>
          <option value="PORTFOLIO">Portfolio</option>
        </select>
        <select value={filtroActivo} onChange={e => setFiltroActivo(e.target.value)} className="input text-sm py-2 px-3 rounded-lg">
          <option value="">Todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
        {(filtroPlan || filtroActivo) && (
          <button onClick={() => { setFiltroPlan(''); setFiltroActivo('') }} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] px-3 py-2 rounded-lg border border-[var(--border)] transition-colors">
            ✕ Limpiar
          </button>
        )}
        <span className="ml-auto text-sm text-[var(--text-muted)] self-center">
          {alumnosFiltrados.length} alumno{alumnosFiltrados.length !== 1 ? 's' : ''}
          {totalLecciones > 0 && ` · ${totalLecciones} lecciones`}
        </span>
      </div>

      {/* Tabla */}
      <div className="card rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[var(--text-muted)]">Cargando alumnos...</div>
        ) : alumnosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-muted)]">No hay alumnos con estos filtros.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)] uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Alumno</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Plan</th>
                  <th className="text-right px-4 py-3 hidden md:table-cell">Operaciones</th>
                  <th className="text-right px-4 py-3 hidden md:table-cell">Win %</th>
                  <th className="text-right px-4 py-3 hidden lg:table-cell">PnL Total</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Progreso</th>
                  <th className="text-left px-4 py-3 hidden xl:table-cell">Registro</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {alumnosFiltrados.map((alumno, i) => (
                  <tr key={alumno.id} className={`border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--text-primary)]">{alumno.name}</div>
                      <div className="text-xs text-[var(--text-muted)]">{alumno.email}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${alumno.active ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span className="text-xs text-[var(--text-muted)]">{alumno.active ? 'Activo' : 'Inactivo'}</span>
                        {alumno.lastActivity && <span className="text-xs text-[var(--text-muted)]">· {timeAgo(alumno.lastActivity)}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${PLAN_COLOR[alumno.plan] || 'bg-gray-500/20 text-gray-400'}`}>
                        {alumno.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-right">
                      {alumno.totalSesiones > 0
                        ? <span className="text-[var(--text-primary)] font-medium">{alumno.totalSesiones}</span>
                        : <span className="text-[var(--text-muted)] text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-right">
                      {alumno.winRate != null
                        ? <span className={`font-medium ${alumno.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>{alumno.winRate}%</span>
                        : <span className="text-[var(--text-muted)] text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-right">
                      {alumno.totalPnl != null
                        ? <span className={`font-medium ${alumno.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmtPnl(alumno.totalPnl)}</span>
                        : <span className="text-[var(--text-muted)] text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-[50px] h-1.5 rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-[var(--gold)]" style={{ width: `${alumno.progreso}%` }} />
                        </div>
                        <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">{alumno.progreso}%</span>
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">{alumno.leccionesCompletadas}/{totalLecciones}</div>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-xs text-[var(--text-muted)]">
                      {formatDate(alumno.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedAlumnoId(alumno.id)}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors px-2 py-1 rounded border border-[var(--border)] hover:border-[var(--gold)] whitespace-nowrap"
                      >
                        Ver detalle →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedAlumnoId && (
        <AlumnoModal alumnoId={selectedAlumnoId} onClose={() => setSelectedAlumnoId(null)} />
      )}
    </div>
  )
}

// ── Main: Admin Panel ─────────────────────────────────────────────────────────

type Tab = 'leads' | 'alumnos'

export default function LeadsClient() {
  const [activeTab, setActiveTab] = useState<Tab>('leads')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'leads',   label: 'Leads y Campañas' },
    { id: 'alumnos', label: 'Alumnos Pro' },
  ]

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[var(--text-primary)]">Administración</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Gestión de prospectos y alumnos activos</p>
      </div>

      <div className="flex gap-1 border-b border-[var(--border)]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-[var(--gold)] text-[var(--gold)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'leads'   && <LeadsTab />}
      {activeTab === 'alumnos' && <AlumnosTab />}
    </div>
  )
}
