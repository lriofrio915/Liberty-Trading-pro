'use client'

import { useState, useMemo } from 'react'

interface Session {
  id: string
  date: string
  instrumento: string
  direccion: string
  resultado: string
  pnlBruto: number
  comisiones: number
  pnlNeto: number
  contratos: number
  entryPrice: number | null
  exitPrice: number | null
  siguioPlan: boolean
  sentimiento: string | null
  notas: string | null
  planId: string | null
}

interface Plan {
  id: string
  name: string
  dataFeedMensual: number | null
  comisionPorTrade: number | null
}

interface Metricas {
  totalTrades: number
  wins: number
  losses: number
  winRate: number
  winRateLong: number
  winRateShort: number
  longsTotal: number
  shortsTotal: number
  longsWin: number
  shortsWin: number
  pnlNeto: number
  profitFactor: number
  rrPromedio: number
  maxDrawdown: number
  maxDrawdownPct: number
  maxRachaGanadora: number
  maxRachaPerdedora: number
  avgWin: number
  avgLoss: number
}

function calcularMetricas(sessions: Session[]): Metricas | null {
  if (!sessions.length) return null

  const wins = sessions.filter(s => s.resultado === 'WIN')
  const losses = sessions.filter(s => s.resultado === 'LOSS')
  const longs = sessions.filter(s => s.direccion === 'LONG')
  const shorts = sessions.filter(s => s.direccion === 'SHORT')
  const longsWin = longs.filter(s => s.resultado === 'WIN')
  const shortsWin = shorts.filter(s => s.resultado === 'WIN')

  const pnlNeto = sessions.reduce((sum, s) => sum + (s.pnlNeto || 0), 0)
  const pnlGanadores = wins.reduce((sum, s) => sum + (s.pnlNeto || 0), 0)
  const pnlPerdedores = losses.reduce((sum, s) => sum + (s.pnlNeto || 0), 0)

  const profitFactor =
    pnlPerdedores !== 0
      ? Math.abs(pnlGanadores / pnlPerdedores)
      : pnlGanadores > 0 ? 999 : 0

  const avgWin = wins.length ? pnlGanadores / wins.length : 0
  const avgLoss = losses.length ? Math.abs(pnlPerdedores / losses.length) : 0
  const rrPromedio = avgLoss !== 0 ? avgWin / avgLoss : 0

  // Max Drawdown
  let peak = 0, maxDD = 0, balance = 0
  const sortedByDate = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  sortedByDate.forEach(s => {
    balance += s.pnlNeto || 0
    if (balance > peak) peak = balance
    const dd = peak - balance
    if (dd > maxDD) maxDD = dd
  })
  const capitalInicial = 51000
  const maxDDPct = capitalInicial > 0 ? (maxDD / capitalInicial) * 100 : 0

  // Rachas
  let rachaGanadora = 0, rachaPerdedora = 0
  let maxRachaGan = 0, maxRachaPer = 0
  sortedByDate.forEach(s => {
    if (s.resultado === 'WIN') {
      rachaGanadora++
      rachaPerdedora = 0
      if (rachaGanadora > maxRachaGan) maxRachaGan = rachaGanadora
    } else if (s.resultado === 'LOSS') {
      rachaPerdedora++
      rachaGanadora = 0
      if (rachaPerdedora > maxRachaPer) maxRachaPer = rachaPerdedora
    }
  })

  return {
    totalTrades: sessions.length,
    wins: wins.length,
    losses: losses.length,
    winRate: sessions.length ? (wins.length / sessions.length) * 100 : 0,
    winRateLong: longs.length ? (longsWin.length / longs.length) * 100 : 0,
    winRateShort: shorts.length ? (shortsWin.length / shorts.length) * 100 : 0,
    longsTotal: longs.length,
    shortsTotal: shorts.length,
    longsWin: longsWin.length,
    shortsWin: shortsWin.length,
    pnlNeto,
    profitFactor,
    rrPromedio,
    maxDrawdown: maxDD,
    maxDrawdownPct: maxDDPct,
    maxRachaGanadora: maxRachaGan,
    maxRachaPerdedora: maxRachaPer,
    avgWin,
    avgLoss: avgLoss * -1,
  }
}

export default function DashboardClient({
  sessions,
  userName,
  userPlan,
  plans = [],
}: {
  sessions: Session[]
  userName: string | null
  userPlan: string | null
  plans?: Plan[]
}) {
  const [mesSeleccionado, setMesSeleccionado] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [planSeleccionado, setPlanSeleccionado] = useState('all')

  const mesesDisponibles = useMemo(() => {
    if (!sessions.length) return []
    const fechas = sessions.map(s => new Date(s.date))
    const minFecha = new Date(Math.min(...fechas.map(f => f.getTime())))
    const meses: string[] = []
    const cursor = new Date(minFecha.getFullYear(), minFecha.getMonth(), 1)
    const hoy = new Date()
    while (cursor <= hoy) {
      meses.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`)
      cursor.setMonth(cursor.getMonth() + 1)
    }
    return meses.reverse()
  }, [sessions])

  const sessionesFiltradas = useMemo(() => {
    return sessions.filter(s => {
      if (mesSeleccionado !== 'all') {
        const fecha = new Date(s.date)
        const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
        if (mes !== mesSeleccionado) return false
      }
      if (planSeleccionado !== 'all' && s.planId !== planSeleccionado) return false
      return true
    })
  }, [sessions, mesSeleccionado, planSeleccionado])

  const metricas = useMemo(() => calcularMetricas(sessionesFiltradas), [sessionesFiltradas])

  // Cost breakdown: comision por trade + data feed proporcional
  const costMetrics = useMemo(() => {
    if (!sessionesFiltradas.length || !plans.length) return null
    const planMap = new Map(plans.map(p => [p.id, p]))
    let comisionesAdicionales = 0
    sessionesFiltradas.forEach(s => {
      if (s.planId) {
        const plan = planMap.get(s.planId)
        if (plan?.comisionPorTrade) comisionesAdicionales += plan.comisionPorTrade
      }
    })
    // Data feed: count unique months in filtered sessions
    const meses = new Set(sessionesFiltradas.map(s => new Date(s.date).toISOString().slice(0, 7)))
    let dataFeedTotal = 0
    plans.forEach(p => {
      if (p.dataFeedMensual) dataFeedTotal += p.dataFeedMensual * meses.size
    })
    const pnlBruto = sessionesFiltradas.reduce((sum, s) => sum + (s.pnlBruto ?? s.pnlNeto), 0)
    const costosTotal = comisionesAdicionales + dataFeedTotal
    return { pnlBruto, comisionesAdicionales, dataFeedTotal, costosTotal, pnlNetoReal: pnlBruto - costosTotal }
  }, [sessionesFiltradas, plans])

  function handleMesChange(mes: string) {
    setMesSeleccionado(mes)
  }

  function handlePlanChange(planId: string) {
    setPlanSeleccionado(planId)
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1">
          Dashboard <span className="gradient-gold">Trading</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">
          {userName} — Plan{' '}
          <span className="text-[var(--gold)] font-bold">{userPlan || 'FREE'}</span>
        </p>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="flex items-center gap-2">
          <span className="label-mono text-xs text-[var(--text-muted)]">Período:</span>
          <select
            value={mesSeleccionado}
            onChange={e => handleMesChange(e.target.value)}
            className="bg-gray-900 border border-yellow-900/30 text-yellow-400 font-mono text-xs px-3 py-2 tracking-widest cursor-pointer focus:outline-none focus:border-yellow-500 rounded-lg"
          >
            <option value="all">TODOS LOS MESES</option>
            {mesesDisponibles.map(m => (
              <option key={m} value={m}>
                {new Date(m + '-02')
                  .toLocaleDateString('es', { month: 'long', year: 'numeric' })
                  .toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {plans.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="label-mono text-xs text-[var(--text-muted)]">Plan:</span>
            <select
              value={planSeleccionado}
              onChange={e => handlePlanChange(e.target.value)}
              className="bg-gray-900 border border-yellow-900/30 text-yellow-400 font-mono text-xs px-3 py-2 tracking-widest cursor-pointer focus:outline-none focus:border-yellow-500 rounded-lg"
            >
              <option value="all">TODOS LOS PLANES</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {metricas ? (
        <>
          {/* Fila 1 — KPIs principales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Trades totales */}
            <div className="card">
              <div className="label-mono text-xs mb-3 text-[var(--text-muted)]">Trades Totales</div>
              <div className="text-2xl font-black" style={{ color: 'var(--gold)' }}>
                {metricas.totalTrades}
              </div>
              <div className="flex gap-3 mt-2 text-xs">
                <span className="text-green-400">✅ {metricas.wins}</span>
                <span className="text-red-400">❌ {metricas.losses}</span>
              </div>
            </div>

            {/* Win Rate */}
            <div className="card">
              <div className="label-mono text-xs mb-3 text-[var(--text-muted)]">Win Rate Total</div>
              <div
                className="text-2xl font-black"
                style={{ color: metricas.winRate >= 50 ? 'var(--green)' : 'var(--red)' }}
              >
                {metricas.winRate.toFixed(1)}%
              </div>
              <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${metricas.winRate}%`,
                    background: metricas.winRate >= 50 ? 'var(--green)' : 'var(--red)',
                  }}
                />
              </div>
            </div>

            {/* PnL Neto */}
            <div className="card">
              <div className="label-mono text-xs mb-3 text-[var(--text-muted)]">PnL Neto</div>
              <div
                className="text-2xl font-black"
                style={{ color: metricas.pnlNeto >= 0 ? 'var(--green)' : 'var(--red)' }}
              >
                {metricas.pnlNeto >= 0 ? '+' : ''}${metricas.pnlNeto.toFixed(2)}
              </div>
            </div>

            {/* Profit Factor */}
            <div className="card">
              <div className="label-mono text-xs mb-3 text-[var(--text-muted)]">Profit Factor</div>
              <div
                className="text-2xl font-black"
                style={{
                  color: metricas.profitFactor >= 1.5 ? 'var(--green)' : 'var(--gold)',
                }}
              >
                {metricas.profitFactor === 999 ? '∞' : metricas.profitFactor.toFixed(2)}x
              </div>
            </div>
          </div>

          {/* Fila 2 — KPIs secundarios */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Win Rate Long/Short */}
            <div className="card">
              <div className="label-mono text-xs mb-3 text-[var(--text-muted)]">Win Rate Dirección</div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-green-400 font-mono">📈 Long</span>
                  <span className="font-bold text-white">{metricas.winRateLong.toFixed(0)}%</span>
                  <span className="text-[var(--text-muted)]">{metricas.longsWin}/{metricas.longsTotal}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-red-400 font-mono">📉 Short</span>
                  <span className="font-bold text-white">{metricas.winRateShort.toFixed(0)}%</span>
                  <span className="text-[var(--text-muted)]">{metricas.shortsWin}/{metricas.shortsTotal}</span>
                </div>
              </div>
            </div>

            {/* RR Promedio */}
            <div className="card">
              <div className="label-mono text-xs mb-3 text-[var(--text-muted)]">RR Promedio</div>
              <div className="text-2xl font-black" style={{ color: 'var(--gold)' }}>
                1:{metricas.rrPromedio.toFixed(2)}
              </div>
            </div>

            {/* Max Drawdown */}
            <div className="card">
              <div className="label-mono text-xs mb-3 text-[var(--text-muted)]">Max Drawdown</div>
              <div className="text-xl font-black text-red-400">
                -${metricas.maxDrawdown.toFixed(2)}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                -{metricas.maxDrawdownPct.toFixed(2)}% del capital
              </div>
            </div>

            {/* Rachas */}
            <div className="card">
              <div className="label-mono text-xs mb-3 text-[var(--text-muted)]">Rachas</div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span>🏆 Ganadora</span>
                  <span className="font-bold text-green-400">{metricas.maxRachaGanadora} trades</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>⚠️ Perdedora</span>
                  <span className="font-bold text-red-400">{metricas.maxRachaPerdedora} trades</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card h-24" style={{ background: 'var(--bg-secondary)' }} />
          ))}
        </div>
      )}

      {/* Costos Operativos */}
      {costMetrics && (costMetrics.comisionesAdicionales > 0 || costMetrics.dataFeedTotal > 0) && (
        <div className="card mb-8">
          <div className="label-mono text-xs mb-4 text-[var(--text-muted)]">Costos Operativos del Periodo</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">PnL Bruto</div>
              <div className="text-xl font-black" style={{ color: costMetrics.pnlBruto >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {costMetrics.pnlBruto >= 0 ? '+' : ''}${costMetrics.pnlBruto.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">Comisiones / Trade</div>
              <div className="text-xl font-black text-red-400">-${costMetrics.comisionesAdicionales.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">Data Feed</div>
              <div className="text-xl font-black text-red-400">-${costMetrics.dataFeedTotal.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">PnL Neto Real</div>
              <div className="text-xl font-black" style={{ color: costMetrics.pnlNetoReal >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {costMetrics.pnlNetoReal >= 0 ? '+' : ''}${costMetrics.pnlNetoReal.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
