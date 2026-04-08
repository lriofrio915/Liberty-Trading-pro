'use client'
import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import ModalShell from './ModalShell'
import type { PatternStats } from '@/lib/algolab-pattern-engine'

function pts(n: number) { return (n >= 0 ? '+' : '') + n.toFixed(2) }

function computeWorstCase(equityCurve: number[]) {
  if (equityCurve.length === 0) return null
  const deltas = equityCurve.map((v, i) => i === 0 ? v : v - equityCurve[i - 1])

  // Max drawdown
  let peak = -Infinity, maxDD = 0
  for (const v of equityCurve) {
    if (v > peak) peak = v
    const dd = peak - v
    if (dd > maxDD) maxDD = dd
  }
  const peakVal = Math.max(...equityCurve)
  const maxDDPct = peakVal > 0 ? (maxDD / peakVal) * 100 : 0

  // Streaks
  let maxLoss = 0, maxWin = 0, curLoss = 0, curWin = 0
  for (const d of deltas) {
    if (d < 0) { curLoss++; curWin = 0;  if (curLoss > maxLoss) maxLoss = curLoss }
    else        { curWin++;  curLoss = 0; if (curWin  > maxWin)  maxWin  = curWin  }
  }

  const totalPnl = equityCurve[equityCurve.length - 1] ?? 0
  const rf = maxDD > 0 ? totalPnl / maxDD : Infinity

  const sorted = [...deltas].sort((a, b) => a - b)
  const bot10 = sorted.slice(0, Math.max(1, Math.floor(sorted.length * 0.1)))
  const avgBot10 = bot10.reduce((s, v) => s + v, 0) / bot10.length

  return { maxDD, maxDDPct, maxLoss, maxWin, rf, avgBot10, totalPnl }
}

export default function PeorCasoModal({
  stats, onClose,
}: { stats: PatternStats[]; onClose: () => void }) {
  const [patternId, setPatternId] = useState(stats[0]?.patternId ?? '')
  const selected = stats.find(s => s.patternId === patternId) ?? stats[0]

  const metrics = useMemo(() => selected ? computeWorstCase(selected.equityCurve) : null, [selected])

  const chartData = useMemo(() =>
    (selected?.equityCurve ?? []).map((v, i) => ({ trade: i + 1, equity: +v.toFixed(2) })),
    [selected])

  function metricCard(label: string, value: string, sub?: string, warn?: boolean) {
    return (
      <div className={`rounded-xl border p-4 ${warn ? 'border-red-500/30 bg-red-500/5' : 'border-[var(--border)] bg-[var(--bg-secondary)]'}`}>
        <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
        <p className={`text-xl font-bold ${warn ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>{value}</p>
        {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
      </div>
    )
  }

  return (
    <ModalShell title="Análisis de peor caso" onClose={onClose} maxWidth="max-w-2xl">
      <div className="space-y-5">
        {/* Selector */}
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">Patrón</label>
          <select
            value={patternId}
            onChange={e => setPatternId(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            {stats.map(s => (
              <option key={s.patternId} value={s.patternId}>
                {s.name} ({s.direction}) — N={s.N} · WR {(s.winRate * 100).toFixed(1)}%
              </option>
            ))}
          </select>
        </div>

        {metrics && (
          <>
            {/* Métricas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {metricCard('Max Drawdown (pts)',    pts(metrics.maxDD),              'caída máxima peak-to-trough', metrics.maxDD > 0)}
              {metricCard('Max Drawdown (%)',      metrics.maxDDPct.toFixed(1) + '%', 'sobre el pico de equity',   metrics.maxDDPct > 20)}
              {metricCard('Racha perdedora máx.',  String(metrics.maxLoss) + ' trades', undefined, metrics.maxLoss >= 5)}
              {metricCard('Racha ganadora máx.',   String(metrics.maxWin)  + ' trades')}
              {metricCard('Recovery Factor',
                metrics.rf === Infinity ? '∞' : metrics.rf.toFixed(2),
                'PnL total / max drawdown',
                metrics.rf < 1 && metrics.rf !== Infinity)}
              {metricCard('Avg peor 10% trades',  pts(metrics.avgBot10) + ' pts', 'promedio del 10% de peores trades', metrics.avgBot10 < 0)}
            </div>

            {/* Equity curve */}
            <div className="space-y-1">
              <p className="text-xs text-[var(--text-muted)]">Equity acumulada — {selected?.name}</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <XAxis dataKey="trade" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number | undefined) => pts(v ?? 0)} labelFormatter={l => `Trade #${l}`} />
                  <Line type="monotone" dataKey="equity" stroke="#f59e0b" dot={false} strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Interpretación */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 text-xs text-[var(--text-secondary)] space-y-1">
              <p className="font-semibold text-[var(--text-primary)] mb-1">Interpretación</p>
              {metrics.rf >= 2 && <p>✓ Recovery Factor ≥ 2 — el patrón recupera bien las pérdidas.</p>}
              {metrics.rf < 1 && metrics.rf > 0 && <p>⚠ Recovery Factor {'<'} 1 — el drawdown supera el PnL neto.</p>}
              {metrics.maxLoss >= 7 && <p>⚠ Racha de {metrics.maxLoss} pérdidas consecutivas — considera tamaño de posición reducido.</p>}
              {metrics.maxDDPct <= 15 && <p>✓ Drawdown ≤ 15% del pico — compatible con reglas prop firm estándar.</p>}
              {metrics.maxDDPct > 20 && <p>⚠ Drawdown {'>'} 20% — puede superar límites de prop firms (10% max DD).</p>}
            </div>
          </>
        )}
      </div>
    </ModalShell>
  )
}
