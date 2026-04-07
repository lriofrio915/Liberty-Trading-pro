'use client'
import { useState } from 'react'
import ModalShell from './ModalShell'
import type { PatternStats, DatasetMeta } from '@/lib/algolab-pattern-engine'

function generatePine(patternId: string, name: string, direction: 'LONG' | 'SHORT'): string {
  const dir = direction === 'LONG' ? 'long' : 'short'
  const color = direction === 'LONG' ? 'green' : 'red'
  const loc = direction === 'LONG' ? 'location.belowbar' : 'location.abovebar'
  const shape = direction === 'LONG' ? 'shape.triangleup' : 'shape.triangledown'

  const detectionMap: Record<string, string> = {
    HAMMER:           'signal = ta.hammer()',
    INVERTED_HAMMER:  'signal = ta.inverted_hammer()',
    HANGING_MAN:      'signal = ta.hanging_man()',
    SHOOTING_STAR:    'signal = ta.shooting_star()',
    DOJI:             'signal = ta.doji()',
    GRAVESTONE_DOJI:  'signal = ta.gravestone_doji()',
    DRAGONFLY_DOJI:   'signal = ta.dragonfly_doji()',
    DOJI_LONG_LEGGED: 'signal = ta.doji()',
    MORNING_STAR:     'signal = ta.morning_star()',
    EVENING_STAR:     'signal = ta.evening_star()',
    HARAMI_BULL:      'signal = ta.bullish_haramidoji() or ta.harami()',
    HARAMI_BEAR:      'signal = ta.bearish_haramidoji()',
    ENGULFING_BULL: [
      'bearPrev = close[1] < open[1]',
      'bullCurr = close > open',
      'signal   = bearPrev and bullCurr and open < close[1] and close > open[1]',
    ].join('\n'),
    ENGULFING_BEAR: [
      'bullPrev = close[1] > open[1]',
      'bearCurr = close < open',
      'signal   = bullPrev and bearCurr and open > close[1] and close < open[1]',
    ].join('\n'),
    MARUBOZU_BULL: [
      'bodyRatio = math.abs(close - open) / (high - low + 0.00001)',
      'signal    = close > open and bodyRatio > 0.9',
    ].join('\n'),
    MARUBOZU_BEAR: [
      'bodyRatio = math.abs(close - open) / (high - low + 0.00001)',
      'signal    = close < open and bodyRatio > 0.9',
    ].join('\n'),
    KICKER_BULL: [
      'bodyA = math.abs(close[1] - open[1]) / (high[1] - low[1] + 0.00001)',
      'bodyB = math.abs(close - open) / (high - low + 0.00001)',
      'signal = close[1] < open[1] and close > open and open > open[1] and bodyA > 0.6 and bodyB > 0.6',
    ].join('\n'),
    KICKER_BEAR: [
      'bodyA = math.abs(close[1] - open[1]) / (high[1] - low[1] + 0.00001)',
      'bodyB = math.abs(close - open) / (high - low + 0.00001)',
      'signal = close[1] > open[1] and close < open and open < open[1] and bodyA > 0.6 and bodyB > 0.6',
    ].join('\n'),
    '3_WHITE_SOLDIERS': [
      'bull1 = close[2] > open[2]',
      'bull2 = close[1] > open[1] and close[1] > close[2] and open[1] > open[2] and open[1] < close[2]',
      'bull3 = close > open and close > close[1] and open > open[1] and open < close[1]',
      'signal = bull1 and bull2 and bull3',
    ].join('\n'),
    '3_BLACK_CROWS': [
      'bear1 = close[2] < open[2]',
      'bear2 = close[1] < open[1] and close[1] < close[2] and open[1] < open[2] and open[1] > close[2]',
      'bear3 = close < open and close < close[1] and open < open[1] and open > close[1]',
      'signal = bear1 and bear2 and bear3',
    ].join('\n'),
  }

  const detection = detectionMap[patternId]
    ?? `// Patrón: ${name}\n// Implementar detección personalizada\nsignal = false`

  return `//@version=5
strategy("AlgoLab — ${name}", overlay=true,
     default_qty_type=strategy.percent_of_equity,
     default_qty_value=2)

// ── Parámetros ──────────────────────────────────────────────────────────────
atrLen  = input.int(14,   "ATR Period",   minval=1)
tpMult  = input.float(3.0, "TP (× ATR)", minval=0.1, step=0.5)
slMult  = input.float(1.0, "SL (× ATR)", minval=0.1, step=0.25)

// ── ATR ──────────────────────────────────────────────────────────────────────
atr = ta.atr(atrLen)

// ── Detección: ${name} ────────────────────────────────────────────────────
${detection}

// ── Entradas y salidas ───────────────────────────────────────────────────────
if signal
    tp = tpMult * atr / syminfo.mintick
    sl = slMult * atr / syminfo.mintick
    strategy.entry("${name}", strategy.${dir})
    strategy.exit("${name} X", "${name}", profit=tp, loss=sl)

// ── Marcadores visuales ──────────────────────────────────────────────────────
plotshape(signal, style=${shape},
     location=${loc},
     color=color.new(color.${color}, 0),
     size=size.small, title="${name}")
`
}

export default function PineModal({
  stats, meta, onClose,
}: {
  stats: PatternStats[]; meta: DatasetMeta; onClose: () => void
}) {
  const [patternId, setPatternId] = useState(stats[0]?.patternId ?? '')
  const [copied, setCopied] = useState(false)

  const selected = stats.find(s => s.patternId === patternId) ?? stats[0]
  const code = selected ? generatePine(selected.patternId, selected.name, selected.direction) : ''

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
              className="text-xs rounded-lg border border-[var(--border)] px-3 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 text-xs text-[var(--text-secondary)] leading-relaxed font-mono whitespace-pre">
            {code}
          </pre>
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Pega este código en TradingView → Pine Editor → Add to chart. Ajusta los multiplicadores TP/SL según tu gestión de riesgo.
        </p>
      </div>
    </ModalShell>
  )
}
