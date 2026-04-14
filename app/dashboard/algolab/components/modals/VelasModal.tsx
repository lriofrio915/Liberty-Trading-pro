'use client'
import { useState } from 'react'
import ModalShell from './ModalShell'
import type { PatternStats } from '@/lib/algolab-pattern-engine'
import type { SignalDetail } from '@/app/api/algolab/signal-candles/route'

function pts(n: number) { return (n >= 0 ? '+' : '') + n.toFixed(2) }

export default function VelasModal({
  stats, datasetId, onClose,
}: {
  stats: PatternStats[]; datasetId: string | null; onClose: () => void
}) {
  const [patternId, setPatternId] = useState(stats[0]?.patternId ?? '')
  const [signals, setSignals] = useState<SignalDetail[] | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!datasetId || !patternId) return
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/algolab/signal-candles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId, patternId, limit: 50 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      setSignals(data.signals)
      setTotal(data.totalSignals)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  const wins   = signals?.filter(s => s.result === 'WIN').length ?? 0
  const losses = signals?.filter(s => s.result === 'LOSS').length ?? 0
  const totalPnl = signals?.reduce((acc, s) => acc + s.pnlPts, 0) ?? 0

  return (
    <ModalShell title="Visualizador de velas — señales detectadas" onClose={onClose} maxWidth="max-w-5xl">
      <div className="space-y-4">
        {/* Controles */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-[var(--text-muted)] mb-1">Patrón</label>
            <select
              value={patternId}
              onChange={e => { setPatternId(e.target.value); setSignals(null) }}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              {stats.map(s => (
                <option key={s.patternId} value={s.patternId}>
                  {s.name} ({s.direction}) — WR {(s.winRate * 100).toFixed(1)}%
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={load}
            disabled={loading || !datasetId}
            className="rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-4 py-2 text-sm font-medium text-black transition-colors"
          >
            {loading ? 'Cargando…' : 'Cargar señales'}
          </button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* Resumen */}
        {signals && (
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1">
              Total señales: <strong>{total}</strong> · mostrando {signals.length}
            </span>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-400">
              WIN: {wins}
            </span>
            <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-red-400">
              LOSS: {losses}
            </span>
            <span className={`rounded-full border px-3 py-1 ${totalPnl >= 0 ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/30 text-red-400'}`}>
              PnL total: {pts(totalPnl)} pts
            </span>
          </div>
        )}

        {/* Tabla */}
        {signals && signals.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                  <th className="py-2 px-3 text-left text-[var(--text-muted)] font-medium">Fecha (UTC)</th>
                  <th className="py-2 px-2 text-center text-[var(--text-muted)] font-medium">Dir</th>
                  <th className="py-2 px-3 text-right text-[var(--text-muted)] font-medium">Entrada</th>
                  <th className="py-2 px-3 text-right text-[var(--text-muted)] font-medium">TP</th>
                  <th className="py-2 px-3 text-right text-[var(--text-muted)] font-medium">SL</th>
                  <th className="py-2 px-3 text-right text-[var(--text-muted)] font-medium">ATR</th>
                  <th className="py-2 px-3 text-center text-[var(--text-muted)] font-medium">Resultado</th>
                  <th className="py-2 px-3 text-right text-[var(--text-muted)] font-medium">PnL</th>
                </tr>
              </thead>
              <tbody>
                {signals.map((s, i) => (
                  <tr key={i} className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-secondary)]/60">
                    <td className="py-2 px-3 text-[var(--text-secondary)]">{s.date}</td>
                    <td className="py-2 px-2 text-center">
                      <span className={`inline-block rounded-full text-xs px-1.5 py-0.5 font-bold ${
                        s.direction === 'LONG' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                      }`}>{s.direction === 'LONG' ? 'L' : 'S'}</span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-[var(--text-primary)]">{s.entryPrice}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-400">{s.tpPrice}</td>
                    <td className="py-2 px-3 text-right font-mono text-red-400">{s.slPrice}</td>
                    <td className="py-2 px-3 text-right text-[var(--text-muted)]">{s.atr}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`rounded-full text-xs px-2 py-0.5 font-semibold ${
                        s.result === 'WIN' ? 'bg-emerald-500/15 text-emerald-400'
                        : s.result === 'LOSS' ? 'bg-red-500/15 text-red-400'
                        : 'bg-[var(--border)] text-[var(--text-muted)]'
                      }`}>{s.result}</span>
                    </td>
                    <td className={`py-2 px-3 text-right font-semibold ${
                      s.pnlPts >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>{pts(s.pnlPts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {signals && signals.length === 0 && (
          <p className="text-center text-[var(--text-muted)] py-8 text-sm">
            No se encontraron señales en la ventana de volumen para este patrón.
          </p>
        )}

        {!signals && !loading && (
          <p className="text-center text-[var(--text-muted)] py-8 text-sm">
            Selecciona un patrón y presiona &ldquo;Cargar señales&rdquo;.
          </p>
        )}
      </div>
    </ModalShell>
  )
}
