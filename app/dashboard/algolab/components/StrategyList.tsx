'use client'
import { useState } from 'react'

export interface Strategy {
  id: string
  name: string
  description: string
  netProfit: number
  profitFactor: number
  sharpeRatio: number
  maxDrawdownPct: number
  winRate: number
  totalTrades: number
  equityCurve: { t: number; equity: number }[]
  mql5Code: string | null
  indicators: string[]
  rules: unknown
}

type SortKey = 'netProfit' | 'profitFactor' | 'sharpeRatio' | 'winRate' | 'maxDrawdownPct'

interface Props {
  strategies: Strategy[]
  onSelect: (s: Strategy) => void
  selectedId: string | null
}

const COLS: { key: SortKey; label: string; format: (v: number) => string }[] = [
  { key: 'netProfit',     label: 'Profit neto', format: v => `$${v.toFixed(0)}` },
  { key: 'profitFactor',  label: 'P. Factor',   format: v => v.toFixed(2) },
  { key: 'sharpeRatio',   label: 'Sharpe',       format: v => v.toFixed(2) },
  { key: 'maxDrawdownPct', label: 'Max DD%',     format: v => `${v.toFixed(1)}%` },
  { key: 'winRate',       label: 'Win Rate',     format: v => `${(v * 100).toFixed(1)}%` },
]

export default function StrategyList({ strategies, onSelect, selectedId }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('sharpeRatio')
  const [sortAsc, setSortAsc] = useState(false)

  const sorted = [...strategies].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey]
    return sortAsc ? diff : -diff
  })

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(p => !p)
    else { setSortKey(key); setSortAsc(false) }
  }

  if (strategies.length === 0) {
    return (
      <p className="text-center text-[var(--text-muted)] text-sm py-12">
        No hay estrategias para este dataset. Ve a &quot;Generar&quot; para crear estrategias.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="text-left py-3 px-3 text-xs text-[var(--text-muted)] font-medium">Estrategia</th>
            {COLS.map(col => (
              <th key={col.key} className="py-3 px-3">
                <button
                  onClick={() => handleSort(col.key)}
                  className="text-xs text-[var(--text-muted)] font-medium hover:text-[var(--gold)] transition flex items-center gap-1"
                >
                  {col.label}
                  {sortKey === col.key && (sortAsc ? ' ↑' : ' ↓')}
                </button>
              </th>
            ))}
            <th className="text-right py-3 px-3 text-xs text-[var(--text-muted)] font-medium">Trades</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(s => (
            <tr
              key={s.id}
              onClick={() => onSelect(s)}
              className={`border-b border-[var(--border)] cursor-pointer transition ${
                selectedId === s.id
                  ? 'bg-[var(--gold)]/10'
                  : 'hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <td className="py-3 px-3">
                <div className="font-medium text-[var(--text-primary)]">{s.name}</div>
                <div className="text-xs text-[var(--text-muted)] truncate max-w-[180px]">{s.description}</div>
              </td>
              <td className={`py-3 px-3 text-center font-mono font-bold ${s.netProfit >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                {COLS[0].format(s.netProfit)}
              </td>
              <td className={`py-3 px-3 text-center font-mono ${s.profitFactor >= 1.5 ? 'text-[var(--green)]' : 'text-[var(--text-secondary)]'}`}>
                {COLS[1].format(s.profitFactor)}
              </td>
              <td className={`py-3 px-3 text-center font-mono ${s.sharpeRatio >= 1 ? 'text-[var(--green)]' : 'text-[var(--text-secondary)]'}`}>
                {COLS[2].format(s.sharpeRatio)}
              </td>
              <td className={`py-3 px-3 text-center font-mono ${s.maxDrawdownPct > 20 ? 'text-[var(--red)]' : 'text-[var(--text-secondary)]'}`}>
                {COLS[3].format(s.maxDrawdownPct)}
              </td>
              <td className="py-3 px-3 text-center font-mono text-[var(--text-secondary)]">
                {COLS[4].format(s.winRate)}
              </td>
              <td className="py-3 px-3 text-right font-mono text-[var(--text-muted)]">
                {s.totalTrades}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
