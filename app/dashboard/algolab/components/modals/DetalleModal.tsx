'use client'
import { useState } from 'react'
import ModalShell from './ModalShell'
import type { PatternStats } from '@/lib/algolab-pattern-engine'

function pct(n: number) { return (n * 100).toFixed(1) + '%' }
function pts(n: number) { return (n >= 0 ? '+' : '') + n.toFixed(2) }

interface Props {
  stats: PatternStats[]
  onClose: () => void
}

export default function DetalleModal({ stats, onClose }: Props) {
  const top3 = [...stats].sort((a, b) => b.winRate - a.winRate).slice(0, 3)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.fromEntries(top3.map(s => [s.patternId, true]))
  )

  function toggleSection(id: string) {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <ModalShell title="Detalle día a día — Top 3 patrones" onClose={onClose} maxWidth="max-w-4xl">
      {top3.length === 0 ? (
        <p className="text-center text-[var(--text-muted)] py-8 text-sm">
          No hay patrones con suficientes señales.
        </p>
      ) : (
        <div className="space-y-4">
          {top3.map((s, rank) => {
            const trades: number[] = s.equityCurve.map((v, i) =>
              i === 0 ? v : v - s.equityCurve[i - 1]
            )
            const isOpen = openSections[s.patternId]

            return (
              <div
                key={s.patternId}
                className="rounded-xl border border-[var(--border)] overflow-hidden"
              >
                {/* Header de sección */}
                <button
                  onClick={() => toggleSection(s.patternId)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[var(--text-muted)] w-5">#{rank + 1}</span>
                    <span className="font-semibold text-[var(--text-primary)] text-sm">{s.name}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                      s.direction === 'LONG'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-red-500/15 text-red-400'
                    }`}>
                      {s.direction}
                    </span>
                    {/* WR Badge */}
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                      s.winRate >= 0.48
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : s.winRate >= 0.44
                        ? 'bg-orange-500/15 text-orange-400'
                        : 'bg-red-500/15 text-red-400'
                    }`}>
                      WR {pct(s.winRate)}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {s.N} señales · Expct. {s.expectancy.toFixed(3)}
                    </span>
                  </div>
                  <span className="text-[var(--text-muted)] text-lg leading-none">
                    {isOpen ? '▲' : '▼'}
                  </span>
                </button>

                {/* Tabla de trades */}
                {isOpen && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--bg-primary)]">
                          <th className="text-right py-2 px-3 text-[var(--text-muted)] font-medium w-12">#</th>
                          <th className="text-right py-2 px-3 text-[var(--text-muted)] font-medium">ΔPnL (pts)</th>
                          <th className="text-right py-2 px-3 text-[var(--text-muted)] font-medium">Equity acum.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trades.map((delta, i) => (
                          <tr
                            key={i}
                            className="border-b border-[var(--border)]/40 hover:bg-[var(--bg-secondary)]/40 transition-colors"
                          >
                            <td className="py-1.5 px-3 text-right text-[var(--text-muted)]">
                              {i + 1}
                            </td>
                            <td className={`py-1.5 px-3 text-right font-mono font-semibold ${
                              delta >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              {pts(delta)}
                            </td>
                            <td className={`py-1.5 px-3 text-right font-mono ${
                              s.equityCurve[i] >= 0 ? 'text-[var(--text-secondary)]' : 'text-red-400'
                            }`}>
                              {pts(s.equityCurve[i])}
                            </td>
                          </tr>
                        ))}
                        {/* Fila resumen */}
                        <tr className="bg-[var(--bg-secondary)] font-semibold border-t border-[var(--border)]">
                          <td className="py-2 px-3 text-right text-[var(--text-muted)]">Σ</td>
                          <td className="py-2 px-3 text-right" />
                          <td className={`py-2 px-3 text-right font-mono ${
                            s.totalPnlPts >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {pts(s.totalPnlPts)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </ModalShell>
  )
}
