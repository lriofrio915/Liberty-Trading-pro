'use client'
import { useState, useEffect } from 'react'
import ModalShell from './ModalShell'
import type { PatternStats, DatasetMeta } from '@/lib/algolab-pattern-engine'

export default function PineModal({
  stats, meta, onClose,
}: {
  stats: PatternStats[]; meta: DatasetMeta; onClose: () => void
}) {
  const [patternId, setPatternId] = useState(stats[0]?.patternId ?? '')
  const [copied, setCopied] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selected = stats.find(s => s.patternId === patternId) ?? stats[0]

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    setError(null)
    fetch('/api/algolab/pine-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patternId: selected.patternId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setCode(data.code)
      })
      .catch(() => setError('Error al generar Pine Script'))
      .finally(() => setLoading(false))
  }, [selected?.patternId])

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <ModalShell title="Pine Script — exportar patrón" onClose={onClose} maxWidth="max-w-3xl">
      <div className="space-y-4">
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
                {s.name} ({s.direction}) — WR {(s.winRate * 100).toFixed(1)}%
              </option>
            ))}
          </select>
        </div>

        {/* Info */}
        {selected && (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-0.5">
              {meta.symbol} · {meta.timeframe}
            </span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-0.5">
              TP 3× ATR · SL 1× ATR (ajustable)
            </span>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-400">
              WR backtest: {(selected.winRate * 100).toFixed(1)}% · N={selected.N}
            </span>
          </div>
        )}

        {/* Código */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[var(--text-muted)]">Pine Script v5</span>
            <button
              onClick={copy}
              disabled={loading || !code}
              className="text-xs rounded-lg border border-[var(--border)] px-3 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40"
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-8 text-xs text-[var(--text-muted)]">
              Generando Pine Script...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
              {error}
            </div>
          ) : (
            <pre className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 text-xs text-[var(--text-secondary)] leading-relaxed font-mono whitespace-pre">
              {code}
            </pre>
          )}
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Pega este código en TradingView → Pine Editor → Add to chart. Ajusta los multiplicadores TP/SL según tu gestión de riesgo.
        </p>
      </div>
    </ModalShell>
  )
}
