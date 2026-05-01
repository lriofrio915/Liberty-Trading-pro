'use client'

import { useState, useMemo, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'

// ── Types ─────────────────────────────────────────────────────────────────────

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
  capitalInicial: number
  createdAt: string
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
  profitFactor: number
  rrPromedio: number
  maxDrawdown: number
  maxRachaGanadora: number
  maxRachaPerdedora: number
}

interface BenchmarkPoint {
  date: string
  sp500: number | null
  nasdaq: number | null
}

interface Benchmark {
  sp500: string | null
  nasdaq: string | null
  series: BenchmarkPoint[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcularMetricas(sessions: Session[]): Metricas | null {
  if (!sessions.length) return null

  const wins = sessions.filter(s => s.resultado === 'WIN')
  const losses = sessions.filter(s => s.resultado === 'LOSS')
  const longs = sessions.filter(s => s.direccion === 'LONG')
  const shorts = sessions.filter(s => s.direccion === 'SHORT')
  const longsWin = longs.filter(s => s.resultado === 'WIN')
  const shortsWin = shorts.filter(s => s.resultado === 'WIN')

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

  // Rachas
  let rachaGanadora = 0, rachaPerdedora = 0
  let maxRachaGan = 0, maxRachaPer = 0
  sortedByDate.forEach(s => {
    if (s.resultado === 'WIN') {
      rachaGanadora++; rachaPerdedora = 0
      if (rachaGanadora > maxRachaGan) maxRachaGan = rachaGanadora
    } else if (s.resultado === 'LOSS') {
      rachaPerdedora++; rachaGanadora = 0
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
    profitFactor,
    rrPromedio,
    maxDrawdown: maxDD,
    maxRachaGanadora: maxRachaGan,
    maxRachaPerdedora: maxRachaPer,
  }
}

function fmtMoney(v: number) {
  return `${v >= 0 ? '+' : ''}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function fmtPct(v: number) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

// ── Component ─────────────────────────────────────────────────────────────────

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
  const [mesSeleccionado, setMesSeleccionado] = useState('all')
  const [planSeleccionado, setPlanSeleccionado] = useState('all')
  const [benchmark, setBenchmark] = useState<Benchmark | null>(null)

  // ── Period dates derived from mesSeleccionado ────────────────────────────
  const periodoFechas = useMemo(() => {
    const hoy = new Date()
    const hoyStr = hoy.toLocaleDateString('en-CA')
    if (mesSeleccionado === 'all') {
      return { desde: `${hoy.getFullYear()}-01-01`, hasta: hoyStr }
    }
    const [y, m] = mesSeleccionado.split('-').map(Number)
    const lastDay = new Date(y, m, 0).getDate()
    return {
      desde: `${y}-${String(m).padStart(2, '0')}-01`,
      hasta: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    }
  }, [mesSeleccionado])

  // ── Available months ─────────────────────────────────────────────────────
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

  // ── Filtered sessions ────────────────────────────────────────────────────
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

  // ── Trading metrics ──────────────────────────────────────────────────────
  const metricas = useMemo(() => calcularMetricas(sessionesFiltradas), [sessionesFiltradas])

  // ── Financial metrics (PnL bruto/neto, fees, capital, rendimiento) ───────
  const fin = useMemo(() => {
    if (!sessionesFiltradas.length) return null

    // Plans in scope
    const relevantPlans = planSeleccionado === 'all'
      ? plans
      : plans.filter(p => p.id === planSeleccionado)
    const capitalRef = relevantPlans.reduce((s, p) => s + (p.capitalInicial || 0), 0) || 51000

    // PnL Bruto = sum of all session pnlNeto (raw from user)
    const pnlBruto = sessionesFiltradas.reduce((sum, s) => sum + (s.pnlNeto || 0), 0)

    // Meses transcurridos in selected period
    let mesesTranscurridos: number
    if (mesSeleccionado !== 'all') {
      mesesTranscurridos = 1
    } else {
      const sorted = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      if (sorted.length) {
        const inicio = new Date(sorted[0].date)
        const fin2 = new Date()
        mesesTranscurridos = Math.max(1,
          (fin2.getFullYear() - inicio.getFullYear()) * 12 +
          fin2.getMonth() - inicio.getMonth() + 1
        )
      } else {
        mesesTranscurridos = 1
      }
    }

    // Comisiones: per-session based on linked plan
    const planMap = new Map(plans.map(p => [p.id, p]))
    let comisionesTotal = 0
    sessionesFiltradas.forEach(s => {
      if (s.planId) {
        const plan = planMap.get(s.planId)
        if (plan?.comisionPorTrade) comisionesTotal += plan.comisionPorTrade
      }
    })

    // Data feed: per relevant plan × meses
    let dataFeedTotal = 0
    relevantPlans.forEach(p => {
      if (p.dataFeedMensual) dataFeedTotal += p.dataFeedMensual * mesesTranscurridos
    })

    const pnlNetoReal = pnlBruto - comisionesTotal - dataFeedTotal
    const rendimientoPct = capitalRef > 0 ? (pnlNetoReal / capitalRef) * 100 : 0

    // Capital at start/end of selected period
    let capitalInicialPeriodo = capitalRef
    if (mesSeleccionado !== 'all') {
      const periodoStart = new Date(periodoFechas.desde)
      const sesionesAntes = sessions.filter(s => {
        if (planSeleccionado !== 'all' && s.planId !== planSeleccionado) return false
        return new Date(s.date) < periodoStart
      })
      const pnlAnterior = sesionesAntes.reduce((sum, s) => sum + (s.pnlNeto || 0), 0)
      capitalInicialPeriodo = capitalRef + pnlAnterior
    }
    const capitalFinalPeriodo = capitalInicialPeriodo + pnlNetoReal
    const variacionPct = capitalInicialPeriodo > 0
      ? ((capitalFinalPeriodo - capitalInicialPeriodo) / capitalInicialPeriodo) * 100
      : 0

    return {
      pnlBruto,
      comisionesTotal,
      dataFeedTotal,
      pnlNetoReal,
      rendimientoPct,
      capitalRef,
      capitalInicialPeriodo,
      capitalFinalPeriodo,
      variacionPct,
      mesesTranscurridos,
      tieneFees: comisionesTotal > 0 || dataFeedTotal > 0,
    }
  }, [sessionesFiltradas, sessions, plans, planSeleccionado, mesSeleccionado, periodoFechas])

  // ── Benchmark fetch ──────────────────────────────────────────────────────
  useEffect(() => {
    setBenchmark(null)
    if (!fin) return
    const params = new URLSearchParams({ desde: periodoFechas.desde, hasta: periodoFechas.hasta })
    fetch(`/api/benchmark?${params}`)
      .then(r => r.json())
      .then((data: Benchmark) => setBenchmark(data))
      .catch(() => setBenchmark(null))
  }, [periodoFechas, fin])

  // ── Period label ─────────────────────────────────────────────────────────
  const periodoLabel = mesSeleccionado === 'all'
    ? 'YTD'
    : new Date(mesSeleccionado + '-02').toLocaleDateString('es', { month: 'long', year: 'numeric' }).toUpperCase()

  // ── Render ────────────────────────────────────────────────────────────────

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
            onChange={e => setMesSeleccionado(e.target.value)}
            className="bg-[var(--bg-card)] border border-[var(--border)] text-[var(--gold)] font-mono text-xs px-3 py-2 tracking-widest cursor-pointer focus:outline-none focus:border-[var(--gold-dark)] rounded-lg"
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
              onChange={e => setPlanSeleccionado(e.target.value)}
              className="bg-[var(--bg-card)] border border-[var(--border)] text-[var(--gold)] font-mono text-xs px-3 py-2 tracking-widest cursor-pointer focus:outline-none focus:border-[var(--gold-dark)] rounded-lg"
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
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

            {/* PnL Neto Real */}
            <div className="card overflow-hidden">
              <div className="label-mono text-xs mb-3 text-[var(--text-muted)]">PnL Neto</div>
              {fin ? (
                <>
                  <div
                    className="text-xl sm:text-2xl font-black truncate"
                    style={{ color: fin.pnlNetoReal >= 0 ? 'var(--green)' : 'var(--red)' }}
                  >
                    {fmtMoney(fin.pnlNetoReal)}
                  </div>
                  <div
                    className="text-xs mt-1 font-bold"
                    style={{ color: fin.rendimientoPct >= 0 ? 'var(--green)' : 'var(--red)' }}
                  >
                    {fmtPct(fin.rendimientoPct)} sobre capital
                  </div>
                </>
              ) : (
                <div
                  className="text-xl sm:text-2xl font-black"
                  style={{ color: 'var(--text-muted)' }}
                >
                  $0
                </div>
              )}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card h-24" style={{ background: 'var(--bg-secondary)' }} />
          ))}
        </div>
      )}

      {/* ── Costos Operativos + Capital ── */}
      {fin && (fin.tieneFees || mesSeleccionado !== 'all') && (
        <div className="card mb-8">
          <div className="label-mono text-xs mb-4 text-[var(--text-muted)]">
            Desglose Financiero del Período
          </div>

          {/* PnL breakdown — 3 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">PnL Bruto</div>
              <div className="text-xl font-black" style={{ color: fin.pnlBruto >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {fmtMoney(fin.pnlBruto)}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Suma directa de sesiones</div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">Comisiones + Data Feed</div>
              <div className="text-xl font-black text-red-400">
                {(fin.comisionesTotal + fin.dataFeedTotal) > 0
                  ? `-$${Math.round(fin.comisionesTotal + fin.dataFeedTotal).toLocaleString('en-US')}`
                  : '$0'}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                {sessionesFiltradas.length} trades · {fin.mesesTranscurridos} {fin.mesesTranscurridos === 1 ? 'mes' : 'meses'} feed
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">PnL Neto</div>
              <div className="text-xl font-black" style={{ color: fin.pnlNetoReal >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {fmtMoney(fin.pnlNetoReal)}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Bruto − comisiones − fees</div>
            </div>
          </div>

          {/* Capital al inicio/fin del período */}
          <div className="border-t border-[var(--border)] pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-[var(--text-muted)] mb-1">Capital al inicio</div>
                <div className="text-lg font-black text-white">
                  ${fin.capitalInicialPeriodo.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)] mb-1">Capital Actual</div>
                <div
                  className="text-lg font-black"
                  style={{ color: fin.capitalFinalPeriodo >= fin.capitalInicialPeriodo ? 'var(--green)' : 'var(--red)' }}
                >
                  ${fin.capitalFinalPeriodo.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)] mb-1">Variación</div>
                <div
                  className="text-lg font-black"
                  style={{ color: fin.variacionPct >= 0 ? 'var(--green)' : 'var(--red)' }}
                >
                  {fmtPct(fin.variacionPct)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Benchmark Comparativo ── */}
      {fin && (
        <div className="card mb-8">
          <div className="label-mono text-xs mb-1 text-[var(--text-muted)]">
            Benchmark Comparativo
          </div>
          <div className="text-xs text-[var(--gold)] mb-4 font-mono">{periodoLabel}</div>

          {benchmark === null ? (
            <div className="flex items-center justify-center h-48">
              <span className="text-xs text-[var(--text-muted)] animate-pulse">Cargando benchmark...</span>
            </div>
          ) : (() => {
            // Build user equity curve normalized to 100
            const capitalBase = fin.capitalInicialPeriodo
            const sesionesOrdenadas = [...sessionesFiltradas].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            )
            const userByDate = new Map<string, number>()
            let acum = 0
            sesionesOrdenadas.forEach(s => {
              acum += s.pnlNeto || 0
              const d = new Date(s.date).toISOString().slice(0, 10)
              userByDate.set(d, acum)
            })

            // Merge benchmark series with user equity
            const series = benchmark.series ?? []
            let lastUserVal = 0
            const chartData = series.map(point => {
              if (userByDate.has(point.date)) lastUserVal = userByDate.get(point.date)!
              const userPct = capitalBase > 0 ? 100 + (lastUserVal / capitalBase) * 100 : 100
              return {
                fecha: point.date.slice(5), // "MM-DD"
                tuCuenta: parseFloat(userPct.toFixed(3)),
                nasdaq: point.nasdaq,
                sp500: point.sp500,
              }
            })

            const fmtVal = (v: number) => {
              const pct = (v - 100).toFixed(2)
              return `${parseFloat(pct) >= 0 ? '+' : ''}${pct}%`
            }

            return (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                    <XAxis
                      dataKey="fecha"
                      tick={{ fill: '#4a4642', fontSize: 10, fontFamily: 'monospace' }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: '#4a4642', fontSize: 10, fontFamily: 'monospace' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={fmtVal}
                      width={52}
                      domain={['auto', 'auto']}
                    />
                    <RTooltip
                      formatter={(v, name) => {
                        const labels: Record<string, string> = {
                          tuCuenta: 'Tu Cuenta',
                          nasdaq: 'Nasdaq 100',
                          sp500: 'S&P 500',
                        }
                        const key = String(name ?? '')
                        return [v != null ? fmtVal(Number(v)) : '—', labels[key] ?? key]
                      }}
                      labelFormatter={(l) => `Fecha: ${l}`}
                      contentStyle={{
                        background: '#111',
                        border: '1px solid #C9A84C44',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                      }}
                      labelStyle={{ color: '#6B6560', fontSize: '11px' }}
                    />
                    <ReferenceLine y={100} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                    <Legend
                      formatter={(value) => {
                        const labels: Record<string, string> = {
                          tuCuenta: 'Tu Cuenta',
                          nasdaq: 'Nasdaq 100',
                          sp500: 'S&P 500',
                        }
                        return <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#9B9690' }}>{labels[value] ?? value}</span>
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="tuCuenta"
                      stroke="#C9A84C"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#C9A84C', stroke: '#111' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="nasdaq"
                      stroke="#4A9EFF"
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 4, fill: '#4A9EFF', stroke: '#111' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sp500"
                      stroke="#9B9B9B"
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 4, fill: '#9B9B9B', stroke: '#111' }}
                    />
                  </LineChart>
                </ResponsiveContainer>

                <p className="text-[10px] text-[var(--text-muted)] font-mono mt-1">
                  Base 100 al inicio del período · Fuente: Yahoo Finance
                </p>

                {/* Comparison text */}
                {benchmark.nasdaq && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)]">
                    {(() => {
                      const diff = fin.rendimientoPct - parseFloat(benchmark.nasdaq!)
                      const supera = diff >= 0
                      return (
                        <p className="text-xs" style={{ color: supera ? 'var(--green)' : 'var(--text-muted)' }}>
                          {supera
                            ? `✅ Tu cuenta superó al Nasdaq 100 por ${diff.toFixed(2)} puntos porcentuales`
                            : `⚠️ El Nasdaq 100 superó tu cuenta por ${Math.abs(diff).toFixed(2)} puntos porcentuales`}
                        </p>
                      )
                    })()}
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
