'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import TickerBar from '@/components/TickerBar/TickerBar'

// ── Types ──────────────────────────────────────────────────────────────────────

interface NewsItem {
  title: string
  description: string
  link: string
  pubDate: string
  source: string
}

interface CfdSignal {
  id: string
  simbolo: string
  nombre: string
  sector: string
  sesgo: string
  confianza: number
  razon: string
  active: boolean
  createdAt: string
}

interface AssetAnalysis {
  simbolo: string
  nombre: string
  precio: number
  cambio24h: number
  sesgo: 'COMPRA' | 'VENTA' | 'NEUTRAL'
  confianza: number
  razon: string
  riesgo: 'bajo' | 'medio' | 'alto'
  sector: string
}

type AutoStatus = 'idle' | 'running' | 'done' | 'error' | 'free-plan'

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function isToday(dateStr: string): boolean {
  return new Date(dateStr).toDateString() === new Date().toDateString()
}

const PLAN_COLORS: Record<string, string> = {
  FREE: '#6B6560',
  CLUB: '#C9A84C',
  PRO: '#4A9EFF',
  PORTFOLIO: '#A855F7',
}

const SECTOR_ORDER = ['Futuros', 'Acciones US', 'Cripto', 'Forex', 'Materias Primas', 'Indices']

const AGENTS = [
  { label: 'Crypto',    desc: 'BTC, ETH, BNB, XRP' },
  { label: 'Acciones',  desc: 'S&P 500 top picks' },
  { label: 'Índices',   desc: 'Nasdaq, SP500, Russell' },
  { label: 'Divisas',   desc: 'DXY, EUR/USD, JPY' },
  { label: 'Materias',  desc: 'Oro, Petróleo, Plata' },
  { label: 'Estrategia',desc: 'Portafolio global' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardClient({
  userName,
  userPlan,
  sessions: _sessions,
  plans: _plans,
}: {
  userName: string | null
  userPlan: string | null
  sessions?: unknown[]
  plans?: unknown[]
}) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [signals, setSignals] = useState<CfdSignal[]>([])
  const [signalsLoading, setSignalsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const [autoStatus, setAutoStatus] = useState<AutoStatus>('idle')
  const [autoError, setAutoError] = useState<string | null>(null)
  const [agentStep, setAgentStep] = useState(0)

  const analysisTriggered = useRef(false)

  // ── Auto-analysis ─────────────────────────────────────────────────────────

  const runAutoAnalysis = useCallback(async () => {
    if (analysisTriggered.current) return
    analysisTriggered.current = true

    setAutoStatus('running')
    setAutoError(null)
    setAgentStep(0)

    // Animate agent progress (~10s per agent)
    let step = 0
    const stepInterval = setInterval(() => {
      step = Math.min(step + 1, AGENTS.length - 1)
      setAgentStep(step)
    }, 10_000)

    try {
      const res = await fetch('/api/analisis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riskProfile: 'moderado' }),
        signal: AbortSignal.timeout(70_000),
      })

      clearInterval(stepInterval)
      setAgentStep(AGENTS.length)

      if (res.status === 403) {
        setAutoStatus('free-plan')
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `Error ${res.status}`)
      }

      const data: { activos: AssetAnalysis[] } = await res.json()

      // Save all activos as CfdSignals (sesgos for dashboard display)
      if (data.activos?.length) {
        const signalsPayload = data.activos.map(a => ({
          simbolo:       a.simbolo,
          nombre:        a.nombre,
          sector:        a.sector,
          sesgo:         a.sesgo,
          confianza:     a.confianza,
          razon:         a.razon,
          precioEntrada: a.precio,
          stopLoss:      0,
          takeProfit:    0,
          lotaje:        0,
          riesgoUsd:     0,
          rrRatio:       0,
          riskProfile:   'moderado',
        }))

        await fetch('/api/cfds/signals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signals: signalsPayload, forceRefresh: true }),
        }).catch(() => {})
      }

      setAutoStatus('done')

      // Reload signals from DB
      const sr = await fetch('/api/cfds/signals')
      if (sr.ok) {
        const data2 = await sr.json()
        if (Array.isArray(data2)) setSignals(data2.filter((s: CfdSignal) => s.active && isToday(s.createdAt)))
      }
      setLastUpdated(new Date())
    } catch (err) {
      clearInterval(stepInterval)
      const isTimeout = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')
      setAutoError(
        isTimeout
          ? 'El análisis tardó demasiado. Los mercados están lentos — intenta de nuevo.'
          : err instanceof Error ? err.message : 'Error al ejecutar el análisis.'
      )
      setAutoStatus('error')
    }
  }, [])

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch('/api/news')
      if (!res.ok) return
      const data = await res.json()
      if (data.news?.length) {
        setNews(data.news)
        setLastUpdated(new Date())
      }
    } catch {}
    finally { setNewsLoading(false) }
  }, [])

  const fetchSignals = useCallback(async () => {
    try {
      const res = await fetch('/api/cfds/signals')
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data)) {
        const active = data.filter((s: CfdSignal) => s.active && isToday(s.createdAt))
        setSignals(active)

        // Auto-trigger analysis if no signals from today
        const hasToday = active.length > 0
        if (!hasToday && !analysisTriggered.current) {
          runAutoAnalysis()
        }
      }
    } catch {}
    finally { setSignalsLoading(false) }
  }, [runAutoAnalysis])

  const handleRefresh = useCallback(() => {
    analysisTriggered.current = false
    setAutoStatus('idle')
    setSignalsLoading(true)
    fetchSignals()
  }, [fetchSignals])

  useEffect(() => {
    fetchNews()
    fetchSignals()
    const newsInterval = setInterval(fetchNews, 3 * 60 * 1000)
    const signalsInterval = setInterval(() => {
      if (autoStatus !== 'running') fetchSignals()
    }, 60 * 1000)
    return () => { clearInterval(newsInterval); clearInterval(signalsInterval) }
  }, [fetchNews, fetchSignals, autoStatus])

  // ── Sesgos por sector ─────────────────────────────────────────────────────

  const sesgoPorSector = useMemo(() => {
    const map: Record<string, { compra: number; venta: number; neutral: number; activos: string[] }> = {}
    signals.forEach(s => {
      const sector = s.sector || 'Otros'
      if (!map[sector]) map[sector] = { compra: 0, venta: 0, neutral: 0, activos: [] }
      const normalized = s.sesgo?.toUpperCase()
      if (normalized === 'COMPRA') map[sector].compra++
      else if (normalized === 'VENTA') map[sector].venta++
      else map[sector].neutral++
      if (map[sector].activos.length < 3) map[sector].activos.push(s.simbolo)
    })
    return map
  }, [signals])

  // ── Asignación de activos ─────────────────────────────────────────────────

  const asignacion = useMemo(() => {
    const sectors = Object.entries(sesgoPorSector)
    if (!sectors.length) return []
    const scored = sectors.map(([sector, data]) => {
      const total = data.compra + data.venta + data.neutral
      const bullScore = total > 0 ? (data.compra - data.venta * 0.5) / total : 0
      return { sector, bullScore: Math.max(0, bullScore), activos: data.activos }
    }).filter(s => s.bullScore > 0)
    const totalScore = scored.reduce((sum, s) => sum + s.bullScore, 0)
    if (totalScore === 0) return []
    return scored
      .map(s => ({ sector: s.sector, pct: Math.round((s.bullScore / totalScore) * 100), activos: s.activos }))
      .sort((a, b) => b.pct - a.pct)
  }, [sesgoPorSector])

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderSesgosContent = () => {
    if (autoStatus === 'running') {
      const agent = AGENTS[Math.min(agentStep, AGENTS.length - 1)]
      const progress = Math.round(((agentStep + 1) / AGENTS.length) * 100)
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg animate-spin">⚙️</span>
            <div>
              <p className="text-xs font-medium text-white">Analizando mercados...</p>
              <p className="text-[10px] text-[var(--text-muted)]">6 agentes de IA evaluando activos globales</p>
            </div>
          </div>
          <div className="space-y-2">
            {AGENTS.map((a, i) => (
              <div
                key={a.label}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                style={{ background: i <= agentStep ? 'rgba(201,168,76,0.08)' : 'var(--bg-secondary)' }}
              >
                <span className="text-[10px]">
                  {i < agentStep ? '✅' : i === agentStep ? '⏳' : '○'}
                </span>
                <span className={`text-xs font-mono ${i <= agentStep ? 'text-white' : 'text-[var(--text-muted)]'}`}>
                  {a.label}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] truncate">{a.desc}</span>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)] mb-1">
              <span>Agente: {agent.label}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${progress}%`, background: 'var(--gold)' }}
              />
            </div>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] font-mono">Esto puede tomar hasta 60 segundos...</p>
        </div>
      )
    }

    if (autoStatus === 'error') {
      return (
        <div className="text-center py-6">
          <p className="text-sm font-medium text-red-400 mb-1">Error en el análisis</p>
          <p className="text-[11px] text-[var(--text-muted)] mb-4">{autoError}</p>
          <button
            onClick={() => { analysisTriggered.current = false; runAutoAnalysis() }}
            className="text-[10px] font-mono px-3 py-1.5 rounded-lg border border-[var(--gold)]/40 text-[var(--gold)] hover:bg-[var(--gold)]/10 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )
    }

    if (autoStatus === 'free-plan') {
      return (
        <div className="text-center py-6">
          <p className="text-sm font-medium text-white mb-2">Plan CLUB requerido</p>
          <p className="text-[11px] text-[var(--text-muted)] mb-4">
            El análisis automático de mercados está disponible para planes CLUB y superiores.
          </p>
          <a
            href="/dashboard/upgrade"
            className="text-[10px] font-mono px-3 py-1.5 rounded-lg bg-[var(--gold)] text-black font-bold hover:opacity-90 transition-opacity"
          >
            Ver planes
          </a>
        </div>
      )
    }

    if (signalsLoading) {
      return (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-[var(--bg-secondary)] animate-pulse" />
          ))}
        </div>
      )
    }

    if (Object.keys(sesgoPorSector).length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-xs text-[var(--text-muted)]">Sin señales activas hoy</p>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {[...SECTOR_ORDER, ...Object.keys(sesgoPorSector).filter(s => !SECTOR_ORDER.includes(s))]
          .filter(s => sesgoPorSector[s])
          .map(sector => {
            const data = sesgoPorSector[sector]
            const total = data.compra + data.venta + data.neutral
            const dominant = data.compra >= data.venta && data.compra >= data.neutral
              ? 'COMPRA'
              : data.venta > data.compra && data.venta >= data.neutral
                ? 'VENTA'
                : 'NEUTRAL'
            const pctDominant = total > 0 ? Math.round((
              dominant === 'COMPRA' ? data.compra :
              dominant === 'VENTA' ? data.venta : data.neutral
            ) / total * 100) : 0

            return (
              <div
                key={sector}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style={{ background: 'var(--bg-secondary)' }}
              >
                <span className="text-base">
                  {dominant === 'COMPRA' ? '🟢' : dominant === 'VENTA' ? '🔴' : '🟡'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white truncate">{sector}</span>
                    <span
                      className="text-[10px] font-mono font-bold ml-2 shrink-0"
                      style={{
                        color: dominant === 'COMPRA' ? 'var(--green)' :
                               dominant === 'VENTA' ? 'var(--red)' : 'var(--gold)',
                      }}
                    >
                      {dominant} {pctDominant}%
                    </span>
                  </div>
                  {data.activos.length > 0 && (
                    <p className="text-[10px] text-[var(--text-muted)] font-mono truncate mt-0.5">
                      {data.activos.join(' · ')}
                    </p>
                  )}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">{total}</div>
              </div>
            )
          })}
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fadeIn">
      {/* Ticker bar */}
      <div className="-mx-6 mb-6">
        <TickerBar />
      </div>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black mb-1">
            <span className="gradient-gold">Market</span> Intelligence
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {greeting()}, <span className="text-white font-medium">{userName?.split(' ')[0] || 'trader'}</span>
            {userPlan && (
              <span
                className="ml-2 text-[10px] font-mono tracking-widest px-2 py-0.5 rounded-full border"
                style={{ color: PLAN_COLORS[userPlan] ?? '#C9A84C', borderColor: (PLAN_COLORS[userPlan] ?? '#C9A84C') + '44' }}
              >
                {userPlan}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0 mt-1">
          {autoStatus === 'running' && (
            <span className="text-[10px] font-mono text-[var(--gold)] animate-pulse">● Analizando...</span>
          )}
          {autoStatus === 'done' && (
            <span className="text-[10px] font-mono text-green-400">✓ Análisis completado</span>
          )}
          {lastUpdated && (
            <p className="text-[10px] font-mono text-[var(--text-muted)]">
              Act. {lastUpdated.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">

        {/* Columna izq: Sesgos del día */}
        <div className="lg:col-span-2">
          <div className="card h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="label-mono text-xs text-[var(--text-muted)]">SESGOS HOY</div>
              <div className="flex items-center gap-2">
                {autoStatus === 'done' && (
                  <span className="text-[9px] font-mono text-green-400 px-1.5 py-0.5 rounded bg-green-500/10">
                    IA
                  </span>
                )}
                <button
                  onClick={handleRefresh}
                  disabled={autoStatus === 'running'}
                  className="text-[14px] text-[var(--text-muted)] hover:text-white disabled:opacity-30 transition-colors leading-none"
                  title="Actualizar sesgos"
                >
                  ↺
                </button>
              </div>
            </div>
            {renderSesgosContent()}
          </div>
        </div>

        {/* Columna der: Noticias */}
        <div className="lg:col-span-3">
          <div className="card h-full">
            <div className="label-mono text-xs text-[var(--text-muted)] mb-4">NOTICIAS FINANCIERAS</div>

            {newsLoading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-16 rounded-lg bg-[var(--bg-secondary)] animate-pulse" />
                ))}
              </div>
            ) : news.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-[var(--text-muted)]">No se pudieron cargar las noticias</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {news.map((item, i) => (
                  <a
                    key={i}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-3 rounded-lg transition-all hover:bg-[var(--bg-secondary)] group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span
                        className="text-[9px] font-mono tracking-widest px-1.5 py-0.5 rounded shrink-0"
                        style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--gold)' }}
                      >
                        {item.source.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">
                        {item.pubDate ? timeAgo(item.pubDate) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-white font-medium leading-snug group-hover:text-[var(--gold)] transition-colors line-clamp-2">
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Asignación de activos */}
      {asignacion.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="label-mono text-xs text-[var(--text-muted)] mb-1">ASIGNACIÓN SUGERIDA DEL DÍA</div>
              <p className="text-[10px] text-[var(--text-muted)]">
                Basado en los sesgos activos · Sectores con mayor proporción alcista
              </p>
            </div>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">{signals.length} señales</span>
          </div>
          <div className="space-y-3">
            {asignacion.map(({ sector, pct, activos }) => (
              <div key={sector} className="flex items-center gap-4">
                <div className="w-28 shrink-0">
                  <p className="text-xs font-medium text-white truncate">{sector}</p>
                  {activos.length > 0 && (
                    <p className="text-[10px] text-[var(--text-muted)] font-mono truncate">{activos.join(', ')}</p>
                  )}
                </div>
                <div className="flex-1 h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--gold-dark), var(--gold))' }}
                  />
                </div>
                <span className="text-xs font-bold font-mono text-[var(--gold)] w-10 text-right shrink-0">{pct}%</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] font-mono mt-4 pt-3 border-t border-[var(--border)]">
            Esta asignación no es asesoramiento financiero. Úsala como referencia de sesgo algorítmico.
          </p>
        </div>
      )}
    </div>
  )
}
