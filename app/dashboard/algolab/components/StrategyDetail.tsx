'use client'
import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { Strategy } from './StrategyList'

interface Props {
  strategy: Strategy
  onClose: () => void
}

export default function StrategyDetail({ strategy, onClose }: Props) {
  const [tab, setTab] = useState<'metricas' | 'mql5'>('metricas')
  const [copied, setCopied] = useState(false)

  const equityData = Array.isArray(strategy.equityCurve)
    ? strategy.equityCurve.map((p, i) => ({ i: i + 1, equity: p.equity }))
    : []

  async function handleCopy() {
    if (!strategy.mql5Code) return
    await navigator.clipboard.writeText(strategy.mql5Code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    if (!strategy.mql5Code) return
    const blob = new Blob([strategy.mql5Code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${strategy.name.replace(/\s+/g, '_')}.mq5`
    a.click()
    URL.revokeObjectURL(url)
  }

  const metrics = [
    { label: 'Profit Neto',   value: `$${strategy.netProfit.toFixed(2)}`,        positive: strategy.netProfit >= 0 },
    { label: 'Profit Factor', value: strategy.profitFactor.toFixed(2),            positive: strategy.profitFactor >= 1 },
    { label: 'Sharpe Ratio',  value: strategy.sharpeRatio.toFixed(2),             positive: strategy.sharpeRatio >= 1 },
    { label: 'Max Drawdown',  value: `${strategy.maxDrawdownPct.toFixed(1)}%`,    positive: strategy.maxDrawdownPct < 20 },
    { label: 'Win Rate',      value: `${(strategy.winRate * 100).toFixed(1)}%`,   positive: strategy.winRate >= 0.5 },
    { label: 'Total Trades',  value: strategy.totalTrades.toString(),             positive: true },
  ]

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[var(--border)]">
          <div>
            <h2 className="text-[var(--text-primary)] font-bold text-lg">{strategy.name}</h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">{strategy.description}</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl ml-4 leading-none">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] px-5">
          {(['metricas', 'mql5'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 px-4 text-sm font-medium border-b-2 -mb-px transition ${
                tab === t
                  ? 'border-[var(--gold)] text-[var(--gold)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {t === 'metricas' ? 'Métricas & Equity' : 'Código MQL5'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 flex-1">
          {tab === 'metricas' && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {metrics.map(m => (
                  <div key={m.label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 text-center">
                    <div className={`text-lg font-bold font-mono ${m.positive ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                      {m.value}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>
              {equityData.length > 0 && (
                <div>
                  <h4 className="text-sm text-[var(--text-muted)] uppercase tracking-wider mb-3">Curva de Equity</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={equityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="i" tick={false} />
                        <YAxis
                          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                          tickFormatter={(v: number) => `$${v.toLocaleString()}`}
                          width={70}
                        />
                        <Tooltip
                          contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                          labelStyle={{ color: 'var(--text-muted)', fontSize: 11 }}
                          itemStyle={{ color: 'var(--gold)' }}
                          formatter={(v: number) => [`$${v.toLocaleString()}`, 'Equity']}
                          labelFormatter={(i: number) => `Trade #${i}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="equity"
                          stroke="var(--gold)"
                          dot={false}
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'mql5' && (
            <div className="space-y-3">
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                >
                  {copied ? '✓ Copiado' : 'Copiar'}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 text-xs rounded-lg bg-[var(--gold)] text-black font-semibold hover:brightness-110 transition"
                >
                  Descargar .mq5
                </button>
              </div>
              {strategy.mql5Code ? (
                <pre className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4 text-xs text-[var(--text-secondary)] font-mono overflow-auto max-h-96 whitespace-pre">
                  {strategy.mql5Code}
                </pre>
              ) : (
                <p className="text-center text-[var(--text-muted)] text-sm py-8">
                  Código MQL5 no disponible para esta estrategia.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
