'use client'

import { useState, useCallback, useEffect } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type Period = 'today' | 'week' | 'month' | 'year' | 'custom'

interface Session {
  id: string
  date: string
  instrumento: string
  direccion: string
  resultado: string
  pnlNeto: number
  pnlBruto: number
  comisiones: number
  rrReal: number | null
  siguioPlan: boolean
  notas: string | null
  sentimiento: string | null
}

interface ReportStats {
  total: number
  wins: number
  losses: number
  breakevens: number
  winRate: number
  pnlNeto: number
  pnlBruto: number
  comisiones: number
  profitFactor: number
  rrPromedio: number
  maxDrawdown: number
  mejorTrade: number
  peorTrade: number
  disciplina: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const pad = (n: number) => n.toString().padStart(2, '0')
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

function getPeriodDates(period: Period, customFrom: string, customTo: string) {
  const now = new Date()
  if (period === 'today') {
    const t = fmtDate(now)
    return { from: t, to: t }
  }
  if (period === 'week') {
    const day = now.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const mon = new Date(now)
    mon.setDate(now.getDate() + diff)
    return { from: fmtDate(mon), to: fmtDate(now) }
  }
  if (period === 'month') {
    return { from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, to: fmtDate(now) }
  }
  if (period === 'year') {
    return { from: `${now.getFullYear()}-01-01`, to: fmtDate(now) }
  }
  return { from: customFrom, to: customTo }
}

function periodLabel(period: Period, from: string, to: string) {
  if (period === 'today') return 'Hoy'
  if (period === 'week') return 'Esta semana'
  if (period === 'month') return 'Este mes'
  if (period === 'year') return `Año ${new Date().getFullYear()}`
  return `${from} al ${to}`
}

function fmtNum(n: number, decimals = 2) {
  return (n >= 0 ? '+' : '') + n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function formatAnalysis(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^(\d+\.\s+[A-ZÁÉÍÓÚ\s]+)$/gm, '<div class="text-[var(--gold)] font-bold mt-3 mb-1">$1</div>')
    .replace(/\n/g, '<br/>')
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-black/30 border border-[var(--border)] rounded-xl py-4 px-4">
      <div className="label-mono text-[9px] text-[var(--text-muted)] mb-1">{label}</div>
      <div className="text-lg font-black" style={{ color: color || 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{sub}</div>}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ReportesClient() {
  const [period, setPeriod] = useState<Period>('month')
  const [customFrom, setCustomFrom] = useState(fmtDate(new Date()))
  const [customTo, setCustomTo] = useState(fmtDate(new Date()))
  const [sessions, setSessions] = useState<Session[]>([])
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = useCallback(async (p: Period, cf: string, ct: string) => {
    const { from, to } = getPeriodDates(p, cf, ct)
    if (!from || !to) return
    setLoading(true)
    setAnalysis(null)
    setError(null)
    try {
      const res = await fetch(`/api/reportes?from=${from}&to=${to}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSessions(data.sessions)
      setStats(data.stats)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load on mount and period change
  useEffect(() => {
    fetchReport(period, customFrom, customTo)
  }, [period]) // eslint-disable-line

  const handleCustomApply = () => fetchReport('custom', customFrom, customTo)

  const handleAiAnalysis = async () => {
    if (!stats || stats.total === 0) return
    setAiLoading(true)
    try {
      const { from, to } = getPeriodDates(period, customFrom, customTo)
      const label = periodLabel(period, from, to)
      const res = await fetch('/api/reportes/analisis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats, periodLabel: label, sessions }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAnalysis(data.analysis)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setAiLoading(false)
    }
  }

  const handlePrint = () => {
    const { from, to } = getPeriodDates(period, customFrom, customTo)
    const label = periodLabel(period, from, to)
    if (!stats) return

    const rows = sessions.map(s => `
      <tr style="border-bottom:1px solid #222">
        <td style="padding:6px 8px">${new Date(s.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
        <td style="padding:6px 8px">${s.instrumento}</td>
        <td style="padding:6px 8px">${s.direccion}</td>
        <td style="padding:6px 8px;color:${s.resultado === 'WIN' ? '#4CAF50' : s.resultado === 'LOSS' ? '#F44336' : '#aaa'}">${s.resultado}</td>
        <td style="padding:6px 8px;text-align:right;color:${s.pnlNeto >= 0 ? '#4CAF50' : '#F44336'}">${s.pnlNeto >= 0 ? '+' : ''}$${s.pnlNeto.toFixed(2)}</td>
        <td style="padding:6px 8px;text-align:right">${s.rrReal !== null ? s.rrReal.toFixed(2) : '—'}</td>
        <td style="padding:6px 8px;max-width:200px;font-size:11px;color:#aaa">${s.notas || ''}</td>
      </tr>
    `).join('')

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>Reporte ${label}</title>
      <style>
        body { font-family: monospace; background: #0a0a0a; color: #e0e0e0; padding: 32px; }
        h1 { color: #C9A84C; font-size: 20px; margin-bottom: 4px; }
        .sub { color: #888; font-size: 12px; margin-bottom: 24px; }
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .kpi { background: #111; border: 1px solid #333; border-radius: 8px; padding: 12px; }
        .kpi-label { font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
        .kpi-val { font-size: 18px; font-weight: 900; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { text-align: left; padding: 6px 8px; color: #C9A84C; border-bottom: 1px solid #333; font-size: 10px; text-transform: uppercase; }
        .analysis { background: #111; border: 1px solid #333; border-radius: 8px; padding: 16px; font-size: 13px; line-height: 1.7; margin-top: 24px; }
        @media print { body { background: white; color: black; } .kpi { background: #f5f5f5; border-color: #ddd; } .analysis { background: #f9f9f9; border-color: #ddd; } }
      </style></head><body>
      <h1>Reporte de Operativa</h1>
      <div class="sub">Periodo: ${label} &nbsp;|&nbsp; Generado: ${new Date().toLocaleDateString('es-ES')}</div>
      <div class="grid">
        <div class="kpi"><div class="kpi-label">Total Trades</div><div class="kpi-val">${stats.total}</div></div>
        <div class="kpi"><div class="kpi-label">Win Rate</div><div class="kpi-val" style="color:${stats.winRate >= 50 ? '#4CAF50' : '#F44336'}">${stats.winRate.toFixed(1)}%</div></div>
        <div class="kpi"><div class="kpi-label">PnL Neto</div><div class="kpi-val" style="color:${stats.pnlNeto >= 0 ? '#4CAF50' : '#F44336'}">${fmtNum(stats.pnlNeto)}</div></div>
        <div class="kpi"><div class="kpi-label">Profit Factor</div><div class="kpi-val">${stats.profitFactor.toFixed(2)}</div></div>
        <div class="kpi"><div class="kpi-label">RR Promedio</div><div class="kpi-val">${stats.rrPromedio.toFixed(2)}</div></div>
        <div class="kpi"><div class="kpi-label">Max Drawdown</div><div class="kpi-val" style="color:#F44336">-$${stats.maxDrawdown.toFixed(2)}</div></div>
        <div class="kpi"><div class="kpi-label">Mejor Trade</div><div class="kpi-val" style="color:#4CAF50">+$${stats.mejorTrade.toFixed(2)}</div></div>
        <div class="kpi"><div class="kpi-label">Disciplina</div><div class="kpi-val">${stats.disciplina.toFixed(1)}%</div></div>
      </div>
      <table>
        <thead><tr><th>Fecha</th><th>Instrumento</th><th>Dirección</th><th>Resultado</th><th style="text-align:right">PnL</th><th style="text-align:right">RR</th><th>Notas</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${analysis ? `<div class="analysis"><strong style="color:#C9A84C">Analisis Vinces AI</strong><br/><br/>${analysis.replace(/\n/g, '<br/>')}</div>` : ''}
      </body></html>
    `)
    win.document.close()
    setTimeout(() => win.print(), 300)
  }

  const { from, to } = getPeriodDates(period, customFrom, customTo)
  const label = periodLabel(period, from, to)

  const PERIODS: { key: Period; label: string }[] = [
    { key: 'today', label: 'Hoy' },
    { key: 'week', label: 'Esta semana' },
    { key: 'month', label: 'Este mes' },
    { key: 'year', label: 'Este año' },
    { key: 'custom', label: 'Rango' },
  ]

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-black mb-1">
            <span className="gradient-gold">Reportes</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">Análisis detallado de tu operativa por período</p>
        </div>
        <button
          onClick={handlePrint}
          disabled={!stats || stats.total === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--gold-dark)] text-[var(--gold)] text-sm font-medium hover:bg-[var(--gold-dark)]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          🖨️ Exportar PDF
        </button>
      </div>

      {/* Period selector */}
      <div className="card mb-5">
        <div className="flex flex-wrap gap-2">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p.key
                  ? 'bg-[var(--gold)] text-black'
                  : 'bg-black/30 text-[var(--text-secondary)] hover:text-white border border-[var(--border)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="flex flex-wrap items-end gap-3 mt-4 pt-4 border-t border-[var(--border)]">
            <div>
              <div className="label-mono text-[9px] text-[var(--text-muted)] mb-1">DESDE</div>
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <div className="label-mono text-[9px] text-[var(--text-muted)] mb-1">HASTA</div>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <button
              onClick={handleCustomApply}
              className="px-4 py-2 bg-[var(--gold)] text-black text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              Aplicar
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="card text-center py-12">
          <div className="text-[var(--gold)] text-sm animate-pulse">Cargando reporte...</div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="card border-red-500/30 text-red-400 text-sm py-4 px-5 mb-4">{error}</div>
      )}

      {/* No data */}
      {!loading && stats && stats.total === 0 && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <div className="text-[var(--text-muted)] text-sm">Sin operaciones registradas para <strong className="text-white">{label}</strong></div>
        </div>
      )}

      {/* KPIs */}
      {!loading && stats && stats.total > 0 && (
        <>
          <div className="mb-2">
            <span className="label-mono text-[9px] text-[var(--gold)]">PERÍODO: {label.toUpperCase()}</span>
          </div>

          {/* Row 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <KpiCard
              label="Total Trades"
              value={stats.total.toString()}
              sub={`${stats.wins}G · ${stats.losses}P · ${stats.breakevens}BE`}
            />
            <KpiCard
              label="Win Rate"
              value={`${stats.winRate.toFixed(1)}%`}
              color={stats.winRate >= 50 ? 'var(--green)' : 'var(--red)'}
            />
            <KpiCard
              label="PnL Neto"
              value={`${stats.pnlNeto >= 0 ? '+' : ''}$${Math.abs(stats.pnlNeto).toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
              sub={`Bruto: $${stats.pnlBruto.toFixed(2)} · Comis: $${stats.comisiones.toFixed(2)}`}
              color={stats.pnlNeto >= 0 ? 'var(--green)' : 'var(--red)'}
            />
            <KpiCard
              label="Profit Factor"
              value={stats.profitFactor >= 99 ? '∞' : stats.profitFactor.toFixed(2)}
              color={stats.profitFactor >= 1.5 ? 'var(--green)' : stats.profitFactor >= 1 ? 'var(--gold)' : 'var(--red)'}
            />
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <KpiCard
              label="RR Promedio"
              value={stats.rrPromedio > 0 ? `1:${stats.rrPromedio.toFixed(2)}` : '—'}
              color={stats.rrPromedio >= 1.5 ? 'var(--green)' : 'var(--gold)'}
            />
            <KpiCard
              label="Max Drawdown"
              value={`-$${stats.maxDrawdown.toFixed(2)}`}
              color="var(--red)"
            />
            <KpiCard
              label="Mejor Trade"
              value={`+$${stats.mejorTrade.toFixed(2)}`}
              color="var(--green)"
            />
            <KpiCard
              label="Disciplina"
              value={`${stats.disciplina.toFixed(1)}%`}
              sub="% siguió el plan"
              color={stats.disciplina >= 80 ? 'var(--green)' : stats.disciplina >= 60 ? 'var(--gold)' : 'var(--red)'}
            />
          </div>

          {/* Sessions table */}
          <div className="card mb-5">
            <div className="label-mono text-[9px] text-[var(--gold)] mb-3">OPERACIONES DEL PERÍODO</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {['Fecha', 'Instrumento', 'Dirección', 'Resultado', 'PnL Neto', 'RR', 'Sentimiento', 'Notas'].map(h => (
                      <th key={h} className="text-left py-2 px-2 text-[var(--gold)] font-medium label-mono text-[9px] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id} className="border-b border-[var(--border)]/30 hover:bg-white/[0.02] transition-colors">
                      <td className="py-2 px-2 whitespace-nowrap text-[var(--text-secondary)]">
                        {new Date(s.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="py-2 px-2 font-medium">{s.instrumento}</td>
                      <td className="py-2 px-2 text-[var(--text-secondary)]">{s.direccion}</td>
                      <td className="py-2 px-2">
                        <span className={`font-bold ${s.resultado === 'WIN' ? 'text-[var(--green)]' : s.resultado === 'LOSS' ? 'text-[var(--red)]' : 'text-[var(--text-muted)]'}`}>
                          {s.resultado}
                        </span>
                      </td>
                      <td className={`py-2 px-2 font-bold text-right ${s.pnlNeto >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                        {s.pnlNeto >= 0 ? '+' : ''}${s.pnlNeto.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-center text-[var(--text-secondary)]">
                        {s.rrReal !== null ? s.rrReal.toFixed(2) : '—'}
                      </td>
                      <td className="py-2 px-2 text-[var(--text-muted)]">{s.sentimiento || '—'}</td>
                      <td className="py-2 px-2 text-[var(--text-muted)] max-w-[200px] truncate">{s.notas || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="label-mono text-[9px] text-[var(--gold)] mb-0.5">ANÁLISIS CON IA</div>
                <div className="text-xs text-[var(--text-muted)]">Vinces analiza tu operativa del período y te da feedback concreto</div>
              </div>
              {!analysis && (
                <button
                  onClick={handleAiAnalysis}
                  disabled={aiLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--gold)] text-black text-sm font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
                >
                  {aiLoading ? (
                    <>
                      <span className="animate-spin">⚙️</span>
                      Analizando...
                    </>
                  ) : (
                    <>🤖 Generar análisis</>
                  )}
                </button>
              )}
              {analysis && (
                <button
                  onClick={() => { setAnalysis(null) }}
                  className="text-xs text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  ✕ Cerrar
                </button>
              )}
            </div>

            {analysis && (
              <div
                className="text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border)] pt-4"
                dangerouslySetInnerHTML={{ __html: formatAnalysis(analysis) }}
              />
            )}

            {!analysis && !aiLoading && (
              <div className="text-center py-6 text-[var(--text-muted)] text-xs">
                Haz clic en &quot;Generar análisis&quot; para que Vinces revise tu operativa
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
