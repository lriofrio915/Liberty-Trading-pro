'use client'

import { useState, useCallback, useEffect } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type Period = 'today' | 'week' | 'month' | 'year' | 'custom'

interface Plan {
  id: string
  name: string
  accountName: string
  active: boolean
}

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
  screenshotUrl: string | null
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
  const [selectedPlan, setSelectedPlan] = useState('all')
  const [plans, setPlans] = useState<Plan[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = useCallback(async (p: Period, cf: string, ct: string, plan: string) => {
    const { from, to } = getPeriodDates(p, cf, ct)
    if (!from || !to) return
    setLoading(true)
    setAnalysis(null)
    setError(null)
    try {
      const url = `/api/reportes?from=${from}&to=${to}&planId=${plan}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSessions(data.sessions)
      setStats(data.stats)
      if (data.plans) setPlans(data.plans)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load on mount and when period or plan changes
  useEffect(() => {
    fetchReport(period, customFrom, customTo, selectedPlan)
  }, [period, selectedPlan]) // eslint-disable-line

  const handleCustomApply = () => fetchReport('custom', customFrom, customTo, selectedPlan)

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

    // ── Equity curve SVG ───────────────────────────────────────────────────────
    const sorted = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const cumulative: number[] = []
    let running = 0
    sorted.forEach(s => { running += s.pnlNeto; cumulative.push(running) })

    const svgW = 680, svgH = 160, padX = 48, padY = 20
    const innerW = svgW - padX * 2, innerH = svgH - padY * 2
    const minVal = Math.min(0, ...cumulative)
    const maxVal = Math.max(0, ...cumulative)
    const range = maxVal - minVal || 1

    const px = (i: number) => padX + (i / Math.max(cumulative.length - 1, 1)) * innerW
    const py = (v: number) => padY + innerH - ((v - minVal) / range) * innerH
    const zeroY = py(0)

    const points = cumulative.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ')
    const areaPath = cumulative.length > 0
      ? `M${px(0).toFixed(1)},${zeroY.toFixed(1)} ` +
        cumulative.map((v, i) => `L${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ') +
        ` L${px(cumulative.length - 1).toFixed(1)},${zeroY.toFixed(1)} Z`
      : ''

    const lastVal = cumulative[cumulative.length - 1] ?? 0
    const lineColor = lastVal >= 0 ? '#4CAF50' : '#F44336'

    const equitySvg = cumulative.length > 1 ? `
      <svg width="${svgW}" height="${svgH}" style="display:block;margin:0 auto">
        <defs>
          <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${lineColor}" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="${lineColor}" stop-opacity="0.02"/>
          </linearGradient>
        </defs>
        <!-- zero line -->
        <line x1="${padX}" y1="${zeroY.toFixed(1)}" x2="${svgW - padX}" y2="${zeroY.toFixed(1)}"
              stroke="#444" stroke-width="1" stroke-dasharray="4,3"/>
        <!-- area fill -->
        <path d="${areaPath}" fill="url(#eg)"/>
        <!-- line -->
        <polyline points="${points}" fill="none" stroke="${lineColor}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        <!-- start / end dots -->
        <circle cx="${px(0).toFixed(1)}" cy="${py(cumulative[0]).toFixed(1)}" r="3" fill="${lineColor}"/>
        <circle cx="${px(cumulative.length-1).toFixed(1)}" cy="${py(lastVal).toFixed(1)}" r="4" fill="${lineColor}"/>
        <!-- y labels -->
        <text x="${padX - 4}" y="${(padY + 4).toFixed(1)}" text-anchor="end" font-size="9" fill="#888">$${maxVal.toFixed(0)}</text>
        <text x="${padX - 4}" y="${(zeroY + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="#888">$0</text>
        <text x="${padX - 4}" y="${(svgH - padY + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="#888">$${minVal.toFixed(0)}</text>
        <!-- final label -->
        <text x="${(px(cumulative.length-1) + 6).toFixed(1)}" y="${(py(lastVal) + 4).toFixed(1)}"
              font-size="10" fill="${lineColor}" font-weight="bold">
          ${lastVal >= 0 ? '+' : ''}$${lastVal.toFixed(0)}
        </text>
      </svg>` : '<p style="text-align:center;color:#666;font-size:12px">Sin datos suficientes para la curva</p>'

    // ── Table rows ─────────────────────────────────────────────────────────────
    const rows = sessions.map(s => `
      <tr style="border-bottom:1px solid #222">
        <td style="padding:6px 8px">${new Date(s.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
        <td style="padding:6px 8px">${s.instrumento}</td>
        <td style="padding:6px 8px">${s.direccion}</td>
        <td style="padding:6px 8px;color:${s.resultado === 'WIN' ? '#4CAF50' : s.resultado === 'LOSS' ? '#F44336' : '#aaa'}">${s.resultado}</td>
        <td style="padding:6px 8px;text-align:right;color:${s.pnlNeto >= 0 ? '#4CAF50' : '#F44336'}">${s.pnlNeto >= 0 ? '+' : ''}$${s.pnlNeto.toFixed(2)}</td>
        <td style="padding:6px 8px;text-align:right">${s.rrReal !== null ? s.rrReal.toFixed(2) : '—'}</td>
        <td style="padding:6px 8px;max-width:180px;font-size:11px;color:#aaa">${s.notas || ''}</td>
      </tr>
    `).join('')

    // ── Screenshots annexe ─────────────────────────────────────────────────────
    const screenshots = sessions.filter(s => s.screenshotUrl)
    const annexe = screenshots.length > 0 ? `
      <div style="page-break-before:always;padding-top:8px">
        <div class="section-title">Anexos — Capturas de entradas</div>
        <div class="screenshot-grid">
          ${screenshots.map(s => `
            <div class="screenshot-item">
              <div style="font-size:10px;color:#888;margin-bottom:6px;line-height:1.6">
                <strong style="color:#e0e0e0">${new Date(s.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}</strong>
                &nbsp;·&nbsp;${s.instrumento} ${s.direccion}
                &nbsp;·&nbsp;<span style="color:${s.resultado === 'WIN' ? '#4CAF50' : s.resultado === 'LOSS' ? '#F44336' : '#aaa'};font-weight:bold">${s.resultado}</span>
                &nbsp;·&nbsp;<span style="color:${s.pnlNeto >= 0 ? '#4CAF50' : '#F44336'};font-weight:bold">${s.pnlNeto >= 0 ? '+' : ''}$${s.pnlNeto.toFixed(2)}</span>
              </div>
              <img src="${s.screenshotUrl}" style="width:100%;border-radius:6px;border:1px solid #333;display:block" crossorigin="anonymous"/>
              ${s.notas ? `<div style="font-size:10px;color:#888;margin-top:5px;line-height:1.5">${s.notas}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>` : ''

    // ── Print window ───────────────────────────────────────────────────────────
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>Reporte ${label}</title>
      <style>
        * { box-sizing: border-box; }
        @page { margin: 20mm 18mm; }
        body { font-family: monospace; background: #0a0a0a; color: #e0e0e0; padding: 28px; max-width: 800px; margin: 0 auto; }
        h1 { color: #C9A84C; font-size: 22px; margin-bottom: 4px; }
        .sub { color: #888; font-size: 12px; margin-bottom: 20px; }

        /* KPIs — nunca se parten */
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; page-break-inside: avoid; break-inside: avoid; }
        .kpi { background: #111; border: 1px solid #333; border-radius: 8px; padding: 12px; page-break-inside: avoid; break-inside: avoid; }
        .kpi-label { font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
        .kpi-val { font-size: 17px; font-weight: 900; margin-top: 4px; }

        /* Curva — no se parte */
        .chart-box { background: #111; border: 1px solid #333; border-radius: 8px; padding: 16px; margin-bottom: 20px; page-break-inside: avoid; break-inside: avoid; }
        .chart-title { font-size: 9px; color: #C9A84C; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; }

        /* Tabla — encabezado se repite en cada página */
        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
        th { text-align: left; padding: 7px 8px; color: #C9A84C; border-bottom: 1px solid #333; font-size: 9px; text-transform: uppercase; background: #0a0a0a; }
        tr { page-break-inside: avoid; break-inside: avoid; }
        td { padding: 6px 8px; vertical-align: top; }
        /* Separación visual entre filas */
        tbody tr { border-bottom: 1px solid #1e1e1e; }
        tbody tr:last-child { border-bottom: none; }

        /* Análisis — no rompe párrafos */
        .analysis { background: #111; border: 1px solid #333; border-radius: 8px; padding: 20px; font-size: 12px; line-height: 1.9; margin-bottom: 20px; page-break-inside: avoid; break-inside: avoid; orphans: 3; widows: 3; }
        .analysis p, .analysis div { orphans: 2; widows: 2; }

        /* Sección título (tabla, análisis, anexos) */
        .section-title { font-size: 9px; color: #C9A84C; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px; page-break-after: avoid; break-after: avoid; }

        /* Cada screenshot no se parte */
        .screenshot-item { break-inside: avoid; page-break-inside: avoid; margin-bottom: 20px; }
        .screenshot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

        @media print {
          body { background: white; color: #111; padding: 0; }
          h1 { color: #8a6520; }
          .sub { color: #666; }
          .kpi { background: #f7f7f7; border-color: #ddd; }
          .kpi-label { color: #999; }
          .kpi-val { color: #111; }
          .chart-box { background: #f7f7f7; border-color: #ddd; }
          .analysis { background: #f7f7f7; border-color: #ddd; color: #222; }
          th { background: white; color: #8a6520; border-bottom-color: #ccc; }
          tbody tr { border-bottom-color: #eee; }
          img { max-width: 100%; border-color: #ddd !important; }
          .section-title { color: #8a6520; }
        }
      </style></head><body>
      <h1>Reporte de Operativa</h1>
      <div class="sub">Periodo: ${label} &nbsp;|&nbsp; Generado: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</div>

      <div class="section-title">Resumen del período</div>
      <div class="grid">
        <div class="kpi"><div class="kpi-label">Total Trades</div><div class="kpi-val">${stats.total}</div><div style="font-size:10px;color:#666;margin-top:2px">${stats.wins}G · ${stats.losses}P</div></div>
        <div class="kpi"><div class="kpi-label">Win Rate</div><div class="kpi-val" style="color:${stats.winRate >= 50 ? '#4CAF50' : '#F44336'}">${stats.winRate.toFixed(1)}%</div></div>
        <div class="kpi"><div class="kpi-label">PnL Neto</div><div class="kpi-val" style="color:${stats.pnlNeto >= 0 ? '#4CAF50' : '#F44336'}">${stats.pnlNeto >= 0 ? '+' : ''}$${Math.abs(stats.pnlNeto).toFixed(2)}</div></div>
        <div class="kpi"><div class="kpi-label">Profit Factor</div><div class="kpi-val">${stats.profitFactor >= 99 ? '∞' : stats.profitFactor.toFixed(2)}</div></div>
        <div class="kpi"><div class="kpi-label">RR Promedio</div><div class="kpi-val">${stats.rrPromedio > 0 ? '1:' + stats.rrPromedio.toFixed(2) : '—'}</div></div>
        <div class="kpi"><div class="kpi-label">Max Drawdown</div><div class="kpi-val" style="color:#F44336">-$${stats.maxDrawdown.toFixed(2)}</div></div>
        <div class="kpi"><div class="kpi-label">Mejor Trade</div><div class="kpi-val" style="color:#4CAF50">+$${stats.mejorTrade.toFixed(2)}</div></div>
        <div class="kpi"><div class="kpi-label">Disciplina</div><div class="kpi-val">${stats.disciplina.toFixed(1)}%</div></div>
      </div>

      <div class="chart-box">
        <div class="chart-title">Curva de Rendimiento Acumulado</div>
        ${equitySvg}
      </div>

      <div class="section-title">Operaciones del período</div>
      <table>
        <thead><tr><th>Fecha</th><th>Instrumento</th><th>Dirección</th><th>Resultado</th><th style="text-align:right">PnL</th><th style="text-align:right">RR</th><th>Notas</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>

      ${analysis ? `
        <div class="section-title">Análisis Vinces AI</div>
        <div class="analysis">${analysis
          .split('\n\n')
          .map(p => `<p style="margin-bottom:10px">${p.replace(/\n/g, '<br/>')}</p>`)
          .join('')
        }</div>` : ''}

      ${annexe}
      </body></html>
    `)
    win.document.close()
    setTimeout(() => win.print(), 400)
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

        {/* Plan filter */}
        {plans.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--border)]">
            <span className="label-mono text-[9px] text-[var(--text-muted)] self-center mr-1">CUENTA:</span>
            <button
              onClick={() => setSelectedPlan('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedPlan === 'all'
                  ? 'bg-[var(--gold)]/20 text-[var(--gold)] border border-[var(--gold-dark)]'
                  : 'bg-black/30 text-[var(--text-muted)] border border-[var(--border)] hover:text-white'
              }`}
            >
              Todas
            </button>
            {plans.map(plan => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedPlan === plan.id
                    ? 'bg-[var(--gold)]/20 text-[var(--gold)] border border-[var(--gold-dark)]'
                    : 'bg-black/30 text-[var(--text-muted)] border border-[var(--border)] hover:text-white'
                }`}
              >
                {plan.name}
                {!plan.active && <span className="ml-1 opacity-50">(inactiva)</span>}
              </button>
            ))}
          </div>
        )}

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
