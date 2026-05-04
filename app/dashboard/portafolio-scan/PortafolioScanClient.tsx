'use client'

import { useState, useEffect, useCallback } from 'react'

interface ScanOpportunity {
  id: string
  simbolo: string
  nombre: string
  sector: string
  sesgo: string
  confianza: number
  precio9am: number
  precio12pm: number | null
  precio3pm: number | null
  rendimiento12pm: number | null
  rendimiento3pm: number | null
  precioSesgoFlip: number | null
  horaSesgoFlip: string | null
  rendimientoFlip: number | null
  farosKillSwitch: boolean | null
  farosPsiScore: number | null
  razon: string | null
}

interface ScanStats {
  total: number
  closed: number
  winRate: number | null
  avgRend: number | null
  best: number | null
  worst: number | null
}

interface ScanRecord {
  id: string
  fecha: string
  hora: string
  sesgogeneral: string
  resumen: string | null
  riskProfile: string
  createdAt: string
  stats: {
    sinFaros: ScanStats
    conFaros: ScanStats
    vetadas: number
  }
  oportunidades: ScanOpportunity[]
}

const SESGO_STYLE = {
  COMPRA: 'text-green-400 bg-green-500/10 border-green-500/25',
  VENTA:  'text-red-400 bg-red-500/10 border-red-500/25',
}

function fmtPct(v: number | null, decimals = 1): string {
  if (v == null) return '—'
  return `${v >= 0 ? '+' : ''}${v.toFixed(decimals)}%`
}

function fmtPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (n >= 1) return n.toFixed(4)
  return n.toFixed(6)
}

function rendColor(v: number | null): string {
  if (v == null) return 'text-gray-500'
  if (v > 0) return 'text-green-400'
  if (v < 0) return 'text-red-400'
  return 'text-yellow-400'
}

function StatBlock({ label, stats, vetadas }: { label: string; stats: ScanStats; vetadas?: number }) {
  const accent = label === 'Con FAROS' ? 'text-[var(--gold)]' : 'text-blue-400'
  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${accent}`}>
        {label}
        {vetadas != null && vetadas > 0 && (
          <span className="ml-2 text-red-400 normal-case">({vetadas} vetada{vetadas !== 1 ? 's' : ''} FAROS)</span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        {[
          { k: 'Señales',      v: stats.total.toString() },
          { k: 'Cerradas',     v: stats.closed.toString() },
          { k: 'Win Rate',     v: stats.winRate != null ? `${stats.winRate.toFixed(0)}%` : '—' },
          { k: 'Rend. Prom',   v: fmtPct(stats.avgRend) },
          { k: 'Mejor/Peor',   v: stats.best != null ? `${fmtPct(stats.best)} / ${fmtPct(stats.worst)}` : '—' },
        ].map(s => (
          <div key={s.k}>
            <div className={`text-sm font-black font-mono ${
              s.k === 'Win Rate' && stats.winRate != null
                ? stats.winRate >= 50 ? 'text-green-400' : 'text-red-400'
                : s.k === 'Rend. Prom' && stats.avgRend != null
                  ? stats.avgRend >= 0 ? 'text-green-400' : 'text-red-400'
                  : 'text-[var(--text-primary)]'
            }`}>{s.v}</div>
            <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.k}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function OppRow({ o }: { o: ScanOpportunity }) {
  const sesgoStyle = SESGO_STYLE[o.sesgo as keyof typeof SESGO_STYLE] ?? ''
  const finalRend = o.rendimientoFlip ?? o.rendimiento3pm ?? o.rendimiento12pm

  return (
    <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      <td className="px-3 py-2.5">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg border ${sesgoStyle}`}>
          {o.sesgo === 'COMPRA' ? '▲' : '▼'} {o.simbolo}
        </span>
      </td>
      <td className="px-3 py-2.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>{o.sector}</td>
      <td className="px-3 py-2.5 text-[11px] font-mono" style={{ color: 'var(--text-secondary)' }}>
        {fmtPrice(o.precio9am)}
      </td>
      <td className={`px-3 py-2.5 text-[11px] font-mono font-bold ${rendColor(o.rendimiento12pm)}`}>
        {fmtPct(o.rendimiento12pm)}
      </td>
      <td className={`px-3 py-2.5 text-[11px] font-mono font-bold ${rendColor(o.rendimiento3pm)}`}>
        {fmtPct(o.rendimiento3pm)}
      </td>
      <td className={`px-3 py-2.5 text-[11px] font-mono font-bold ${rendColor(o.rendimientoFlip)}`}>
        {o.rendimientoFlip != null ? `${fmtPct(o.rendimientoFlip)} (${o.horaSesgoFlip})` : '—'}
      </td>
      <td className={`px-3 py-2.5 text-[11px] font-mono font-bold ${rendColor(finalRend)}`}>
        {fmtPct(finalRend)}
      </td>
      <td className="px-3 py-2.5">
        {o.farosKillSwitch === true
          ? <span className="text-[10px] font-bold text-red-400">✕ KS</span>
          : o.farosPsiScore != null
            ? <span className={`text-[10px] font-mono font-bold ${o.farosPsiScore > 0.6 ? 'text-green-400' : o.farosPsiScore > 0.35 ? 'text-yellow-400' : 'text-orange-400'}`}>
                Ψ {(o.farosPsiScore * 100).toFixed(0)}%
              </span>
            : <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>—</span>
        }
      </td>
    </tr>
  )
}

export default function PortafolioScanClient() {
  const [scans, setScans] = useState<ScanRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [view, setView] = useState<'todos' | 'comparacion'>('todos')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/portafolio-scan')
      if (res.ok) setScans(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Global cumulative stats across all scans
  const allOpps = scans.flatMap(s => s.oportunidades)
  const globalSinFaros = scans.reduce((acc, s) => ({
    total:   acc.total + s.stats.sinFaros.total,
    closed:  acc.closed + s.stats.sinFaros.closed,
    wins:    acc.wins + (s.stats.sinFaros.winRate != null && s.stats.sinFaros.closed > 0
               ? Math.round(s.stats.sinFaros.winRate / 100 * s.stats.sinFaros.closed) : 0),
    rendSum: acc.rendSum + (s.stats.sinFaros.avgRend ?? 0) * s.stats.sinFaros.closed,
  }), { total: 0, closed: 0, wins: 0, rendSum: 0 })

  const globalConFaros = scans.reduce((acc, s) => ({
    total:   acc.total + s.stats.conFaros.total,
    closed:  acc.closed + s.stats.conFaros.closed,
    wins:    acc.wins + (s.stats.conFaros.winRate != null && s.stats.conFaros.closed > 0
               ? Math.round(s.stats.conFaros.winRate / 100 * s.stats.conFaros.closed) : 0),
    rendSum: acc.rendSum + (s.stats.conFaros.avgRend ?? 0) * s.stats.conFaros.closed,
  }), { total: 0, closed: 0, wins: 0, rendSum: 0 })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black gradient-gold mb-1">Portafolio Scan</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Seguimiento de señales automáticas 9am ET — abre/cierra según crons 12pm y 3pm
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="text-xs font-bold px-4 py-2 rounded-xl border transition-all btn-gold disabled:opacity-50">
          {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      {/* Global comparison: con vs sin FAROS */}
      {scans.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Acumulado {scans.length} scan{scans.length !== 1 ? 's' : ''} — {allOpps.length} señales totales
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sin FAROS */}
            <div className="rounded-xl border p-5 space-y-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
                Portafolio Sin FAROS — todos los candidatos ≥70%
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xl font-black font-mono" style={{ color: 'var(--text-primary)' }}>{globalSinFaros.total}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Señales</div>
                </div>
                <div>
                  <div className={`text-xl font-black font-mono ${globalSinFaros.closed > 0 ? (globalSinFaros.wins / globalSinFaros.closed) >= 0.5 ? 'text-green-400' : 'text-red-400' : 'text-gray-500'}`}>
                    {globalSinFaros.closed > 0 ? `${((globalSinFaros.wins / globalSinFaros.closed) * 100).toFixed(0)}%` : '—'}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Win Rate</div>
                </div>
                <div>
                  <div className={`text-xl font-black font-mono ${globalSinFaros.closed > 0 ? globalSinFaros.rendSum >= 0 ? 'text-green-400' : 'text-red-400' : 'text-gray-500'}`}>
                    {globalSinFaros.closed > 0 ? `${(globalSinFaros.rendSum / globalSinFaros.closed) >= 0 ? '+' : ''}${(globalSinFaros.rendSum / globalSinFaros.closed).toFixed(2)}%` : '—'}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Rend. Prom</div>
                </div>
              </div>
            </div>
            {/* Con FAROS */}
            <div className="rounded-xl border p-5 space-y-3" style={{ background: 'rgba(201,168,76,0.04)', borderColor: 'rgba(201,168,76,0.2)' }}>
              <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--gold)' }}>
                Portafolio Con FAROS — solo aprobadas (killSwitch=false)
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xl font-black font-mono" style={{ color: 'var(--text-primary)' }}>{globalConFaros.total}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Señales</div>
                </div>
                <div>
                  <div className={`text-xl font-black font-mono ${globalConFaros.closed > 0 ? (globalConFaros.wins / globalConFaros.closed) >= 0.5 ? 'text-green-400' : 'text-red-400' : 'text-gray-500'}`}>
                    {globalConFaros.closed > 0 ? `${((globalConFaros.wins / globalConFaros.closed) * 100).toFixed(0)}%` : '—'}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Win Rate</div>
                </div>
                <div>
                  <div className={`text-xl font-black font-mono ${globalConFaros.closed > 0 ? globalConFaros.rendSum >= 0 ? 'text-green-400' : 'text-red-400' : 'text-gray-500'}`}>
                    {globalConFaros.closed > 0 ? `${(globalConFaros.rendSum / globalConFaros.closed) >= 0 ? '+' : ''}${(globalConFaros.rendSum / globalConFaros.closed).toFixed(2)}%` : '—'}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Rend. Prom</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No data state */}
      {!loading && scans.length === 0 && (
        <div className="rounded-xl border p-12 text-center space-y-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No hay scans registrados aún. El cron se ejecuta automáticamente a las 9am ET (lunes–viernes).
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
            Puedes forzar un scan desde GitHub Actions → Cron — Market Scan 9am ET → Run workflow.
          </p>
        </div>
      )}

      {/* Tabs */}
      {scans.length > 0 && (
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {[
            { id: 'todos' as const, label: `📋 Historial de Scans (${scans.length})` },
            { id: 'comparacion' as const, label: '⚖️ Comparación FAROS' },
          ].map(t => (
            <button key={t.id} onClick={() => setView(t.id)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                view === t.id ? 'bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/30' : 'hover:bg-white/5'
              }`}
              style={view !== t.id ? { color: 'var(--text-muted)' } : {}}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Historial */}
      {view === 'todos' && scans.map(scan => (
        <div key={scan.id} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {/* Scan header */}
          <button
            onClick={() => setExpanded(expanded === scan.id ? null : scan.id)}
            className="w-full p-4 flex items-center justify-between hover:bg-white/3 transition-colors text-left"
            style={{ background: 'var(--bg-card)' }}
          >
            <div className="flex items-center gap-3">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                scan.sesgogeneral === 'ALCISTA' ? 'bg-green-500/15 text-green-400' :
                scan.sesgogeneral === 'BAJISTA' ? 'bg-red-500/15 text-red-400' :
                'bg-yellow-500/10 text-yellow-400'
              }`}>
                {scan.sesgogeneral === 'ALCISTA' ? '▲' : scan.sesgogeneral === 'BAJISTA' ? '▼' : '◆'} {scan.sesgogeneral}
              </span>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {new Date(scan.fecha).toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'short' })}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {scan.stats.sinFaros.total} señales · {scan.stats.vetadas} vetadas FAROS
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs flex-shrink-0">
              <span style={{ color: 'var(--text-muted)' }}>
                Sin FAROS: <span className={rendColor(scan.stats.sinFaros.avgRend)}>{scan.stats.sinFaros.winRate != null ? `${scan.stats.sinFaros.winRate.toFixed(0)}% WR` : '—'}</span>
              </span>
              <span style={{ color: 'var(--gold)', opacity: 0.8 }}>
                Con FAROS: <span className={rendColor(scan.stats.conFaros.avgRend)}>{scan.stats.conFaros.winRate != null ? `${scan.stats.conFaros.winRate.toFixed(0)}% WR` : '—'}</span>
              </span>
              <span style={{ color: 'var(--text-muted)' }}>{expanded === scan.id ? '▲' : '▼'}</span>
            </div>
          </button>

          {/* Expanded: per-scan stats + opportunity table */}
          {expanded === scan.id && (
            <div className="border-t p-4 space-y-4" style={{ borderColor: 'var(--border)' }}>
              {scan.resumen && (
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{scan.resumen}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <StatBlock label="Sin FAROS" stats={scan.stats.sinFaros} />
                <StatBlock label="Con FAROS" stats={scan.stats.conFaros} vetadas={scan.stats.vetadas} />
              </div>

              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                      {['Activo', 'Sector', 'Precio 9am', 'Rend 12pm', 'Rend 3pm', 'Flip', 'Final', 'FAROS'].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scan.oportunidades.map(o => <OppRow key={o.id} o={o} />)}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Comparación tab */}
      {view === 'comparacion' && scans.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-xl border p-5" style={{ background: 'rgba(201,168,76,0.04)', borderColor: 'rgba(201,168,76,0.18)' }}>
            <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: 'var(--gold)' }}>
              METODOLOGÍA DE COMPARACIÓN
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <strong className="text-[var(--text-secondary)]">Portafolio Sin FAROS</strong>: todas las señales detectadas con confianza ≥70% (sesgo de agentes IA).{' '}
              <strong className="text-[var(--text-secondary)]">Portafolio Con FAROS</strong>: mismo universo pero excluyendo activos donde FAROS detectó Kill Switch activo al momento del scan.
              Rendimiento = % a favor del sesgo — positivo = señal correcta. Se usa el rendimiento del flip (si ocurrió), luego 3pm, luego 12pm.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                  {['Fecha', 'Sesgo', 'Señales SF', 'WR SF', 'Rend SF', 'Señales CF', 'WR CF', 'Rend CF', 'Vetadas', 'Diferencia WR'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scans.map(scan => {
                  const sf = scan.stats.sinFaros
                  const cf = scan.stats.conFaros
                  const wrDiff = cf.winRate != null && sf.winRate != null ? cf.winRate - sf.winRate : null
                  return (
                    <tr key={scan.id} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(scan.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`text-[10px] font-bold ${scan.sesgogeneral === 'ALCISTA' ? 'text-green-400' : scan.sesgogeneral === 'BAJISTA' ? 'text-red-400' : 'text-yellow-400'}`}>
                          {scan.sesgogeneral}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-center" style={{ color: 'var(--text-secondary)' }}>{sf.total}</td>
                      <td className={`px-3 py-2.5 font-mono font-bold text-center ${sf.winRate != null ? sf.winRate >= 50 ? 'text-green-400' : 'text-red-400' : 'text-gray-500'}`}>
                        {sf.winRate != null ? `${sf.winRate.toFixed(0)}%` : '—'}
                      </td>
                      <td className={`px-3 py-2.5 font-mono font-bold text-center ${rendColor(sf.avgRend)}`}>{fmtPct(sf.avgRend)}</td>
                      <td className="px-3 py-2.5 font-mono text-center" style={{ color: 'var(--text-secondary)' }}>{cf.total}</td>
                      <td className={`px-3 py-2.5 font-mono font-bold text-center ${cf.winRate != null ? cf.winRate >= 50 ? 'text-green-400' : 'text-red-400' : 'text-gray-500'}`}>
                        {cf.winRate != null ? `${cf.winRate.toFixed(0)}%` : '—'}
                      </td>
                      <td className={`px-3 py-2.5 font-mono font-bold text-center ${rendColor(cf.avgRend)}`}>{fmtPct(cf.avgRend)}</td>
                      <td className="px-3 py-2.5 font-mono text-center text-red-400">{scan.stats.vetadas || '—'}</td>
                      <td className={`px-3 py-2.5 font-mono font-bold text-center ${wrDiff != null ? wrDiff > 0 ? 'text-[var(--gold)]' : wrDiff < 0 ? 'text-red-400' : 'text-gray-500' : 'text-gray-500'}`}>
                        {wrDiff != null ? `${wrDiff > 0 ? '+' : ''}${wrDiff.toFixed(0)}pp` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
            SF = Sin FAROS · CF = Con FAROS · Diferencia WR: positivo = FAROS mejoró el win rate
          </p>
        </div>
      )}
    </div>
  )
}
