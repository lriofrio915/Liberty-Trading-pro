'use client'
import { useState } from 'react'

const INDICATOR_GROUPS = [
  { label: 'Tendencia',   items: ['SMA', 'EMA', 'WMA'] },
  { label: 'Momentum',   items: ['RSI', 'Stochastic', 'CCI', 'Williams%R', 'ROC', 'MACD', 'ADX'] },
  { label: 'Volatilidad', items: ['BollingerBands', 'ATR', 'KeltnerChannels'] },
  { label: 'Volumen',     items: ['OBV', 'MFI', 'CMF'] },
  { label: 'Especiales',  items: ['ParabolicSAR', 'Supertrend'] },
]

interface BacktestConfig {
  spread: number
  slippage: number
  lotSize: number
  initialBalance: number
  pipValue: number
}

interface DatasetSummary {
  id: string
  symbol: string
  timeframe: string
  candleCount: number
}

interface Props {
  dataset: DatasetSummary
  onGenerated: () => void
}

export default function GeneratePanel({ dataset, onGenerated }: Props) {
  const [selected, setSelected] = useState<string[]>(['RSI', 'EMA', 'ATR'])
  const [config, setConfig] = useState<BacktestConfig>({
    spread: 2,
    slippage: 1,
    lotSize: 0.1,
    initialBalance: 10000,
    pipValue: 10,
  })
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function toggleIndicator(name: string) {
    setSelected(prev =>
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    )
  }

  function updateConfig(key: keyof BacktestConfig, value: string) {
    setConfig(prev => ({ ...prev, [key]: parseFloat(value) || 0 }))
  }

  async function handleGenerate() {
    if (selected.length === 0) {
      setError('Selecciona al menos un indicador')
      return
    }
    setGenerating(true)
    setError(null)
    setMessage('Generando estrategias con IA… esto puede tardar hasta 60 segundos.')
    try {
      const res = await fetch('/api/algolab/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId: dataset.id, selectedIndicators: selected, config }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al generar')
      setMessage(`✓ ${data.strategies.length} estrategias guardadas (de ${data.total ?? data.strategies.length} evaluadas)`)
      onGenerated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar estrategias')
      setMessage(null)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Dataset info */}
      <div className="bg-[var(--bg-card)] border border-[var(--gold)]/40 rounded-xl p-4">
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Dataset seleccionado</p>
        <p className="text-[var(--text-primary)] font-bold">
          {dataset.symbol} · {dataset.timeframe} · {dataset.candleCount.toLocaleString()} velas
        </p>
      </div>

      {/* Indicator selector */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
        <h3 className="text-[var(--text-primary)] font-semibold mb-4 text-sm uppercase tracking-wider">
          Indicadores ({selected.length} seleccionados)
        </h3>
        <div className="space-y-4">
          {INDICATOR_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-xs text-[var(--text-muted)] mb-2">{group.label}</p>
              <div className="flex flex-wrap gap-2">
                {group.items.map(ind => (
                  <button
                    key={ind}
                    onClick={() => toggleIndicator(ind)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                      selected.includes(ind)
                        ? 'bg-[var(--gold)] text-black border-[var(--gold)]'
                        : 'bg-transparent text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--gold)]/50'
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Backtest config */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
        <h3 className="text-[var(--text-primary)] font-semibold mb-4 text-sm uppercase tracking-wider">
          Parámetros de Backtest
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { key: 'spread' as const, label: 'Spread (pips)' },
            { key: 'slippage' as const, label: 'Slippage (pips)' },
            { key: 'lotSize' as const, label: 'Tamaño de lote' },
            { key: 'initialBalance' as const, label: 'Balance inicial ($)' },
            { key: 'pipValue' as const, label: 'Valor del pip ($)' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs text-[var(--text-muted)] mb-1">{label}</label>
              <input
                type="number"
                value={config[key]}
                onChange={e => updateConfig(key, e.target.value)}
                step="any"
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold)]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Generate button */}
      {error && <p className="text-sm text-[var(--red)] text-center">{error}</p>}
      {message && <p className="text-sm text-[var(--text-secondary)] text-center">{message}</p>}
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full py-3 rounded-xl bg-[var(--gold)] text-black font-bold text-sm disabled:opacity-50 hover:brightness-110 transition"
      >
        {generating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            Generando estrategias…
          </span>
        ) : (
          '⚡ Generar Estrategias con IA'
        )}
      </button>
    </div>
  )
}
