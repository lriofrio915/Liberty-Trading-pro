'use client'
import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { PatternAnalysisResult, PatternStats, DatasetMeta } from '@/lib/algolab-pattern-engine'
import DetalleModal from './modals/DetalleModal'
import GridSearchModal from './modals/GridSearchModal'
import PropFirmModal from './modals/PropFirmModal'
import VelasModal from './modals/VelasModal'
import PineModal from './modals/PineModal'
import PeorCasoModal from './modals/PeorCasoModal'

// ─── TIPOS Y HELPERS ──────────────────────────────────────────────────────────

type DirectionFilter = 'ALL' | 'LONG' | 'SHORT'
type SortTab = 'wr' | 'pnl' | 'equity'
type ModalId = 'detalle' | 'gridsearch' | 'propfirm' | 'velas' | 'pine' | 'peorCaso' | null

const COLORS = ['#f59e0b', '#60a5fa', '#34d399', '#f87171', '#a78bfa']

function pct(n: number) { return (n * 100).toFixed(1) + '%' }
function pts(n: number) { return (n >= 0 ? '+' : '') + n.toFixed(2) }
function fmtHour(h: number) { return String(h).padStart(2, '0') + ':00' }
function fmtDate(ms: number) {
  return new Date(ms).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function wrColor(wr: number): string {
  if (wr >= 0.48) return 'bg-emerald-500'
  if (wr >= 0.44) return 'bg-orange-400'
  return 'bg-red-500'
}

function wrTextColor(wr: number): string {
  if (wr >= 0.48) return 'text-emerald-400'
  if (wr >= 0.44) return 'text-orange-400'
  return 'text-red-400'
}

// ─── HEADER KPI ───────────────────────────────────────────────────────────────

function HeaderStats({ stats, meta }: { stats: PatternStats[]; meta: DatasetMeta }) {
  const positive = stats.filter(s => s.totalPnlPts > 0).length
  const bestWR = stats.length > 0 ? Math.max(...stats.map(s => s.winRate)) : 0
  const bestPnL = stats.length > 0 ? Math.max(...stats.map(s => s.totalPnlPts)) : 0

  const tile = (label: string, value: string, sub?: string) => (
    <div className="flex-1 min-w-[110px] rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
      <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
    </div>
  )

  return (
    <div className="space-y-2">
      {/* Metadata row */}
      <div className="flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
        <span className="rounded-full border border-[var(--border)] px-2 py-0.5">
          {meta.symbol} · {meta.timeframe}
        </span>
        <span className="rounded-full border border-[var(--border)] px-2 py-0.5">
          {fmtDate(meta.dateFrom)} — {fmtDate(meta.dateTo)}
        </span>
        <span className="rounded-full border border-[var(--border)] px-2 py-0.5">
          {meta.totalBars.toLocaleString()} barras
        </span>
        <span className="rounded-full border border-[var(--border)] px-2 py-0.5">
          Volumen: {meta.volumeWindowHours.map(fmtHour).join(' – ')} UTC
        </span>
        <span className="rounded-full border border-[var(--border)] px-2 py-0.5">
          Pip est. {meta.pipValueEstimate}
        </span>
      </div>

      {/* KPIs */}
      <div className="flex flex-wrap gap-3">
        {tile('Patrones analizados', '57')}
        {tile('Con PnL positivo', String(positive), `de ${stats.length} con ≥30 señales`)}
        {tile('Mejor WR%', pct(bestWR))}
        {tile('Mayor PnL (pts)', pts(bestPnL))}
      </div>
    </div>
  )
}

// ─── TABLA DE PATRONES ────────────────────────────────────────────────────────

function PatternTable({ stats }: { stats: PatternStats[] }) {
  if (stats.length === 0) {
    return (
      <p className="text-center text-[var(--text-muted)] py-12 text-sm">
        No hay patrones con ≥ 30 señales en la ventana de volumen seleccionada.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
            <th className="text-left py-3 px-3 text-xs text-[var(--text-muted)] font-medium w-8">#</th>
            <th className="text-left py-3 px-3 text-xs text-[var(--text-muted)] font-medium">Patrón</th>
            <th className="text-center py-3 px-2 text-xs text-[var(--text-muted)] font-medium w-10">Dir</th>
            <th className="text-right py-3 px-3 text-xs text-[var(--text-muted)] font-medium w-14">N</th>
            <th className="text-left py-3 px-3 text-xs text-[var(--text-muted)] font-medium min-w-[100px]">WR%</th>
            <th className="text-right py-3 px-3 text-xs text-[var(--text-muted)] font-medium w-16">WR%</th>
            <th className="text-right py-3 px-3 text-xs text-[var(--text-muted)] font-medium w-20">PnL (pts)</th>
            <th className="text-right py-3 px-3 text-xs text-[var(--text-muted)] font-medium w-20">Expectativa</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s, idx) => (
            <tr
              key={s.patternId}
              className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-secondary)]/60 transition-colors"
            >
              <td className="py-3 px-3 text-[var(--text-muted)]">{idx + 1}</td>
              <td className="py-3 px-3 font-medium text-[var(--text-primary)]">{s.name}</td>
              <td className="py-3 px-2 text-center">
                <span className={`inline-block rounded-full text-xs px-1.5 py-0.5 font-bold ${
                  s.direction === 'LONG'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-red-500/15 text-red-400'
                }`}>
                  {s.direction === 'LONG' ? 'L' : 'S'}
                </span>
              </td>
              <td className="py-3 px-3 text-right text-[var(--text-secondary)]">{s.N}</td>
              <td className="py-3 px-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-[var(--border)] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${wrColor(s.winRate)}`}
                      style={{ width: `${Math.min(s.winRate * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className={`py-3 px-3 text-right font-semibold ${wrTextColor(s.winRate)}`}>
                {pct(s.winRate)}
              </td>
              <td className={`py-3 px-3 text-right font-semibold ${
                s.totalPnlPts >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {pts(s.totalPnlPts)}
              </td>
              <td className={`py-3 px-3 text-right ${
                s.expectancy >= 0 ? 'text-[var(--text-secondary)]' : 'text-red-400/70'
              }`}>
                {s.expectancy.toFixed(3)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── GRÁFICO EQUITY ACUMULADA ─────────────────────────────────────────────────

function EquityChart({ stats }: { stats: PatternStats[] }) {
  const top = stats.slice(0, 5)

  const maxLen = Math.max(...top.map(s => s.equityCurve.length), 0)
  const chartData = Array.from({ length: maxLen }, (_, i) => {
    const point: Record<string, number | string> = { trade: i + 1 }
    top.forEach(s => {
      point[s.name] = s.equityCurve[i] ?? s.equityCurve[s.equityCurve.length - 1] ?? 0
    })
    return point
  })

  if (chartData.length === 0) {
    return <p className="text-center text-[var(--text-muted)] py-12 text-sm">Sin datos para graficar.</p>
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--text-muted)]">Top 5 patrones por WR% — Equity acumulada (pts)</p>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData}>
          <XAxis dataKey="trade" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip formatter={(v: number | undefined) => pts(v ?? 0)} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {top.map((s, idx) => (
            <Line
              key={s.patternId}
              type="monotone"
              dataKey={s.name}
              stroke={COLORS[idx % COLORS.length]}
              dot={false}
              strokeWidth={1.5}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── RESUMEN TEXTUAL ──────────────────────────────────────────────────────────

function PatternSummary({ stats, meta }: { stats: PatternStats[]; meta: DatasetMeta }) {
  if (stats.length === 0) return null

  const byWR = [...stats].sort((a, b) => b.winRate - a.winRate)
  const byPnL = [...stats].sort((a, b) => b.totalPnlPts - a.totalPnlPts)
  const positive = stats.filter(s => s.totalPnlPts > 0)
  const winWindow = meta.volumeWindowHours.map(fmtHour).join('–')

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-1.5 text-sm text-[var(--text-secondary)]">
      <p className="font-semibold text-amber-400 text-xs uppercase tracking-wide mb-2">Hallazgos clave</p>
      <p>
        El patrón con <strong>mayor win rate</strong> fue <em>{byWR[0]?.name}</em>{' '}
        ({pct(byWR[0]?.winRate ?? 0)}) con {byWR[0]?.N} señales ({byWR[0]?.direction}).
      </p>
      <p>
        El <strong>mayor PnL acumulado</strong> lo registró <em>{byPnL[0]?.name}</em>{' '}
        ({pts(byPnL[0]?.totalPnlPts ?? 0)} pts) con expectativa de{' '}
        {byPnL[0]?.expectancy.toFixed(3)} ATR por trade.
      </p>
      <p>
        <strong>{positive.length} de {stats.length}</strong> patrones con señales suficientes
        arrojaron PnL positivo. La ventana de volumen analizada fue <strong>{winWindow} UTC</strong>.
      </p>
      {byWR[0] && byWR[0].winRate >= 0.5 && (
        <p>
          Los patrones con WR ≥ 50% son candidatos sólidos para pruebas adicionales con grid search de TP/SL.
        </p>
      )}
    </div>
  )
}

// ─── BOTONES OPCIONALES ───────────────────────────────────────────────────────

function OptionalButtons({
  stats, meta: _meta, datasetId, onOpen,
}: {
  stats: PatternStats[]
  meta: DatasetMeta
  datasetId: string | null
  onOpen: (id: Exclude<ModalId, null>) => void
}) {
  const buttons: { id: Exclude<ModalId, null>; label: string; needsDataset?: boolean }[] = [
    { id: 'detalle',    label: 'Detalle día a día top 3' },
    { id: 'gridsearch', label: 'Grid search TP/SL',    needsDataset: true },
    { id: 'propfirm',   label: 'Prop firm sim' },
    { id: 'velas',      label: 'Visualizador de velas', needsDataset: true },
    { id: 'pine',       label: 'Pine Script' },
    { id: 'peorCaso',   label: 'Análisis peor caso' },
  ]
  const noStats = stats.length === 0
  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-medium">Análisis opcionales</p>
      <div className="flex flex-wrap gap-2">
        {buttons.map(btn => {
          const disabled = noStats || (btn.needsDataset && !datasetId)
          return (
            <button
              key={btn.id}
              disabled={disabled}
              onClick={() => !disabled && onOpen(btn.id)}
              title={disabled ? (noStats ? 'Ejecuta el análisis primero' : 'Requiere dataset cargado') : undefined}
              className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                disabled
                  ? 'border-[var(--border)] text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                  : 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10 cursor-pointer'
              }`}
            >
              {btn.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

interface Props {
  result: PatternAnalysisResult | null
  loading: boolean
  datasetId: string | null
}

export default function PatternReport({ result, loading, datasetId }: Props) {
  const [dirFilter, setDirFilter] = useState<DirectionFilter>('ALL')
  const [sortTab, setSortTab] = useState<SortTab>('wr')
  const [openModal, setOpenModal] = useState<ModalId>(null)

  const filtered = useMemo(() => {
    if (!result) return []
    let s = result.stats
    if (dirFilter !== 'ALL') s = s.filter(p => p.direction === dirFilter)
    if (sortTab === 'wr') return [...s].sort((a, b) => b.winRate - a.winRate)
    if (sortTab === 'pnl') return [...s].sort((a, b) => b.totalPnlPts - a.totalPnlPts)
    return s
  }, [result, dirFilter, sortTab])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-[var(--text-muted)]">
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Cargando análisis…
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-[var(--text-muted)]">
        <p className="text-sm">Selecciona un dataset y presiona &quot;Analizar 57 Patrones&quot; en la pestaña Generar.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <HeaderStats stats={result.stats} meta={result.meta} />

      {/* Filtro de dirección */}
      <div className="flex gap-1">
        {(['ALL', 'LONG', 'SHORT'] as DirectionFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setDirFilter(f)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              dirFilter === f
                ? 'bg-amber-500 text-black'
                : 'border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {f === 'ALL' ? 'Todos' : f}
          </button>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-4 border-b border-[var(--border)]">
        {([
          { id: 'wr', label: 'Ranking WR%' },
          { id: 'pnl', label: 'Ranking PnL' },
          { id: 'equity', label: 'Gráfico equity acumulada' },
        ] as { id: SortTab; label: string }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setSortTab(tab.id)}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              sortTab === tab.id
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido del tab */}
      {sortTab === 'equity'
        ? <EquityChart stats={filtered} />
        : <PatternTable stats={filtered} />
      }

      {/* Resumen */}
      <PatternSummary stats={result.stats} meta={result.meta} />

      {/* Botones opcionales */}
      <OptionalButtons
        stats={result.stats}
        meta={result.meta}
        datasetId={datasetId}
        onOpen={setOpenModal}
      />

      {/* Modales */}
      {openModal === 'detalle'    && <DetalleModal    stats={result.stats} onClose={() => setOpenModal(null)} />}
      {openModal === 'gridsearch' && <GridSearchModal stats={result.stats} datasetId={datasetId} onClose={() => setOpenModal(null)} />}
      {openModal === 'propfirm'   && <PropFirmModal   stats={result.stats} onClose={() => setOpenModal(null)} />}
      {openModal === 'velas'      && <VelasModal      stats={result.stats} datasetId={datasetId} onClose={() => setOpenModal(null)} />}
      {openModal === 'pine'       && <PineModal       stats={result.stats} meta={result.meta} onClose={() => setOpenModal(null)} />}
      {openModal === 'peorCaso'   && <PeorCasoModal   stats={result.stats} onClose={() => setOpenModal(null)} />
    </div>
  )
}
