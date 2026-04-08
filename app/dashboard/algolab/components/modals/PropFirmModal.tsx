'use client'
import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import ModalShell from './ModalShell'
import type { PatternStats } from '@/lib/algolab-pattern-engine'

function pts(n: number) { return (n >= 0 ? '+' : '') + n.toFixed(2) }
function fmt(n: number) { return n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }

interface SimResult {
  balance: number
  maxDD: number
  status: 'PASSED' | 'BLOWN' | 'ACTIVE'
  curve: number[]
}

function simulate(
  equityCurve: number[],
  initialBalance: number,
  maxDDPct: number,
  targetPct: number
): SimResult {
  const trades = equityCurve.map((v, i) => i === 0 ? v : v - equityCurve[i - 1])
  const maxDDLimit = initialBalance * (maxDDPct / 100)
  const target = initialBalance * (1 + targetPct / 100)
  let balance = initialBalance
  let peak = initialBalance
  let maxDD = 0
  let status: 'PASSED' | 'BLOWN' | 'ACTIVE' = 'ACTIVE'
  const curve: number[] = [balance]

  for (const pnl of trades) {
    balance += pnl
    if (balance > peak) peak = balance
    const dd = peak - balance
    if (dd > maxDD) maxDD = dd
    if (dd >= maxDDLimit) { status = 'BLOWN'; break }
    if (balance >= target) { status = 'PASSED'; break }
    curve.push(balance)
  }
  if (status === 'ACTIVE') curve.push(balance)
  return { balance, maxDD, status, curve }
}

interface Props {
  stats: PatternStats[]
  onClose: () => void
}

export default function PropFirmModal({ stats, onClose }: Props) {
  const [selectedPatternId, setSelectedPatternId] = useState<string>(stats[0]?.patternId ?? '')
  const [initialBalance, setInitialBalance] = useState(100000)
  const [maxDDPct, setMaxDDPct] = useState(10)
  const [targetPct, setTargetPct] = useState(10)

  const selectedPattern = stats.find(s => s.patternId === selectedPatternId)

  const simResult = useMemo<SimResult | null>(() => {
    if (!selectedPattern || selectedPattern.equityCurve.length === 0) return null
    return simulate(selectedPattern.equityCurve, initialBalance, maxDDPct, targetPct)
  }, [selectedPattern, initialBalance, maxDDPct, targetPct])

  const chartData = useMemo(() => {
    if (!simResult) return []
    return simResult.curve.map((v, i) => ({ trade: i, balance: v }))
  }, [simResult])

  const targetLine = initialBalance * (1 + targetPct / 100)
  const blowLine = initialBalance * (1 - maxDDPct / 100)

  return (
    <ModalShell title="Simulador Prop Firm" onClose={onClose} maxWidth="max-w-3xl">
      <div className="space-y-5">
        {/* Parámetros */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">
              Cuenta inicial ($)
            </label>
            <input
              type="number"
              value={initialBalance}
              onChange={e => setInitialBalance(Number(e.target.value))}
              min={1000}
              step={1000}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-amber-500/60"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">
              Max DD total (%)
            </label>
            <input
              type="number"
              value={maxDDPct}
              onChange={e => setMaxDDPct(Number(e.target.value))}
              min={1}
              max={50}
              step={0.5}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-amber-500/60"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">
              Objetivo (%)
            </label>
            <input
              type="number"
              value={targetPct}
              onChange={e => setTargetPct(Number(e.target.value))}
              min={1}
              max={100}
              step={0.5}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-amber-500/60"
            />
          </div>
          <div>
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
                  {s.name} ({s.direction})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Referencia de límites */}
        <div className="flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
          <span>
            Inicio: <span className="text-[var(--text-primary)] font-semibold">${fmt(initialBalance)}</span>
          </span>
          <span>
            Objetivo: <span className="text-emerald-400 font-semibold">${fmt(targetLine)}</span>
          </span>
          <span>
            Blow-out: <span className="text-red-400 font-semibold">${fmt(blowLine)}</span>
          </span>
        </div>

        {/* Resultado */}
        {simResult && (
          <>
            {/* Badge de estado */}
            <div className="flex items-center gap-4">
              <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${
                simResult.status === 'PASSED'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : simResult.status === 'BLOWN'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  simResult.status === 'PASSED' ? 'bg-emerald-400' :
                  simResult.status === 'BLOWN' ? 'bg-red-400' : 'bg-amber-400'
                }`} />
                {simResult.status === 'PASSED' ? 'APROBADO' :
                 simResult.status === 'BLOWN' ? 'CUENTA QUEBRADA' : 'EN PROGRESO'}
              </span>

              {/* KPIs */}
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-[var(--text-muted)] text-xs block">Balance final</span>
                  <span className={`font-bold ${simResult.balance >= initialBalance ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${fmt(simResult.balance)}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] text-xs block">Max Drawdown</span>
                  <span className="font-bold text-red-400">${fmt(simResult.maxDD)}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] text-xs block">Trades simulados</span>
                  <span className="font-bold text-[var(--text-primary)]">{simResult.curve.length - 1}</span>
                </div>
              </div>
            </div>

            {/* Gráfico de equity */}
            {chartData.length > 1 && (
              <div className="space-y-1">
                <p className="text-xs text-[var(--text-muted)]">Curva de balance simulada</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="trade" tick={{ fontSize: 10 }} label={{ value: 'Trade', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      formatter={(v: number | undefined) => [`$${fmt(v ?? 0)}`, 'Balance']}
                      labelFormatter={(l: string | number) => `Trade ${l}`}
                    />
                    <ReferenceLine
                      y={targetLine}
                      stroke="#34d399"
                      strokeDasharray="4 2"
                      label={{ value: 'Objetivo', fill: '#34d399', fontSize: 10 }}
                    />
                    <ReferenceLine
                      y={blowLine}
                      stroke="#f87171"
                      strokeDasharray="4 2"
                      label={{ value: 'Blow-out', fill: '#f87171', fontSize: 10 }}
                    />
                    <ReferenceLine
                      y={initialBalance}
                      stroke="#6b7280"
                      strokeDasharray="2 2"
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="#f59e0b"
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        {!selectedPattern && (
          <p className="text-center text-[var(--text-muted)] py-8 text-sm">
            No hay patrones disponibles para simular.
          </p>
        )}
      </div>
    </ModalShell>
  )
}
