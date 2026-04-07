'use client'
import { useState } from 'react'
import ModalShell from './ModalShell'
import type { PatternStats } from '@/lib/algolab-pattern-engine'
import type { GridCell } from '@/app/api/algolab/grid-search/route'

function pct(n: number) { return (n * 100).toFixed(1) + '%' }
function pts(n: number) { return (n >= 0 ? '+' : '') + n.toFixed(2) }

function cellWrColor(wr: number): string {
  if (wr >= 0.48) return 'text-emerald-400'
  if (wr >= 0.44) return 'text-orange-400'
  return 'text-red-400'
}

function cellBg(wr: number): string {
  if (wr >= 0.48) return 'bg-emerald-500/10'
  if (wr >= 0.44) return 'bg-orange-500/10'
  return 'bg-red-500/5'
}

interface Props {
  stats: PatternStats[]
  datasetId: string | null
  onClose: () => void
}

interface GridSearchResponse {
  patternId: string
  patternName: string
  direction: 'LONG' | 'SHORT'
  totalSignals: number
  grid: GridCell[]
}

export default function GridSearchModal({ stats, datasetId, onClose }: Props) {
  const [selectedPatternId, setSelectedPatternId] = useState<string>(stats[0]?.patternId ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GridSearchResponse | null>(null)

  async function runGridSearch() {
    if (!datasetId || !selectedPatternId) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/algolab/grid-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId, patternId: selectedPatternId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(err.error ?? `HTTP ${res.status}`)
      }
      const data: GridSearchResponse = await res.json()
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  // Derive unique TP and SL multiplier sets from the grid
  const tpMults = result
    ? [...new Set(result.grid.map(c => c.tp))].sort((a, b) => a - b)
    : []
  const slMults = result
    ? [...new Set(result.grid.map(c => c.sl))].sort((a, b) => a - b)
    : []

  function getCell(tp: number, sl: number): GridCell | undefined {
    return result?.grid.find(c => c.tp === tp && c.sl === sl)
  }

  return (
    <ModalShell title="Grid Search TP/SL" onClose={onClose} maxWidth="max-w-4xl">
      <div className="space-y-5">
        {/* Controles */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">
              Patrón
            </label>
            <select
              value={selectedPatternId}
              onChange={e => setSelectedPatternId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-amber-500/60"
            >
              {stats.map(s => (
                <option key={s.patternId} value={s.patternId}>
                  {s.name} ({s.direction}) — WR {pct(s.winRate)}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={runGridSearch}
            disabled={loading || !datasetId || !selectedPatternId}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              loading || !datasetId || !selectedPatternId
                ? 'bg-amber-500/30 text-amber-400/50 cursor-not-allowed'
                : 'bg-amber-500 text-black hover:bg-amber-400 cursor-pointer'
            }`}
          >
            {loading ? 'Ejecutando…' : 'Ejecutar Grid Search'}
          </button>
        </div>

        {/* Spinner */}
        {loading && (
          <div className="flex items-center justify-center py-12 gap-3 text-[var(--text-muted)]">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Calculando combinaciones TP/SL…
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Resultados */}
        {result && !loading && (
          <div className="space-y-3">
            {/* Resumen */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
              <span>
                Patrón: <span className="text-[var(--text-primary)] font-semibold">{result.patternName}</span>
                <span className={`ml-2 inline-flex items-center rounded-full px-1.5 py-0.5 font-bold ${
                  result.direction === 'LONG' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                }`}>{result.direction}</span>
              </span>
              <span>
                Total señales:{' '}
                <span className="text-[var(--text-primary)] font-semibold">{result.totalSignals}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> ≥ 48% WR
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> 44–47%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> &lt; 44%
              </span>
            </div>

            {/* Tabla de grid */}
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                    <th className="py-2 px-3 text-[var(--text-muted)] font-medium text-left whitespace-nowrap">
                      TP × / SL ×
                    </th>
                    {slMults.map(sl => (
                      <th
                        key={sl}
                        className="py-2 px-3 text-[var(--text-muted)] font-medium text-center whitespace-nowrap"
                      >
                        SL {sl}×
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tpMults.map(tp => (
                    <tr key={tp} className="border-b border-[var(--border)]/50">
                      <td className="py-2 px-3 font-semibold text-[var(--text-secondary)] bg-[var(--bg-secondary)] whitespace-nowrap">
                        TP {tp}×
                      </td>
                      {slMults.map(sl => {
                        const cell = getCell(tp, sl)
                        if (!cell) {
                          return (
                            <td key={sl} className="py-2 px-3 text-center text-[var(--text-muted)]">—</td>
                          )
                        }
                        return (
                          <td
                            key={sl}
                            className={`py-2 px-3 text-center ${cellBg(cell.winRate)}`}
                          >
                            <div className={`font-bold ${cellWrColor(cell.winRate)}`}>
                              {pct(cell.winRate)}
                            </div>
                            <div className={`mt-0.5 ${cell.totalPnlPts >= 0 ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
                              {pts(cell.totalPnlPts)}
                            </div>
                            <div className="text-[var(--text-muted)] mt-0.5">
                              N={cell.N}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Estado inicial */}
        {!result && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-10 text-[var(--text-muted)] text-sm gap-2">
            <p>Selecciona un patrón y ejecuta el grid search para ver la matriz de TP/SL.</p>
          </div>
        )}
      </div>
    </ModalShell>
  )
}
