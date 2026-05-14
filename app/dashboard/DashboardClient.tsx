'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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

const PLAN_COLORS: Record<string, string> = {
  FREE: '#6B6560',
  CLUB: '#C9A84C',
  PRO: '#4A9EFF',
  PORTFOLIO: '#A855F7',
}

const SECTOR_ORDER = ['Futuros', 'Acciones US', 'Cripto', 'Forex', 'Materias Primas', 'Indices']

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardClient({
  userName,
  userPlan,
  // Legacy props accepted but unused in this new view
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
        setSignals(data.filter((s: CfdSignal) => s.active))
      }
    } catch {}
    finally { setSignalsLoading(false) }
  }, [])

  useEffect(() => {
    fetchNews()
    fetchSignals()
    const newsInterval = setInterval(fetchNews, 3 * 60 * 1000)
    const signalsInterval = setInterval(fetchSignals, 60 * 1000)
    return () => { clearInterval(newsInterval); clearInterval(signalsInterval) }
  }, [fetchNews, fetchSignals])

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
      return { sector, bullScore: Math.max(0, bullScore), activos: data.activos, total }
    }).filter(s => s.bullScore > 0)

    const totalScore = scored.reduce((sum, s) => sum + s.bullScore, 0)
    if (totalScore === 0) return []

    return scored
      .map(s => ({
        sector: s.sector,
        pct: Math.round((s.bullScore / totalScore) * 100),
        activos: s.activos,
      }))
      .sort((a, b) => b.pct - a.pct)
  }, [sesgoPorSector])

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
            {greeting()}, <span className="text-white font-medium">{userName || 'trader'}</span>
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
        {lastUpdated && (
          <p className="text-[10px] font-mono text-[var(--text-muted)] mt-1">
            Act. {lastUpdated.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">

        {/* Columna izq: Sesgos del día */}
        <div className="lg:col-span-2">
          <div className="card h-full">
            <div className="label-mono text-xs text-[var(--text-muted)] mb-4">SESGOS HOY</div>

            {signalsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-[var(--bg-secondary)] animate-pulse" />
                ))}
              </div>
            ) : Object.keys(sesgoPorSector).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-[var(--text-muted)]">Sin señales activas hoy</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Los sesgos se generan en el análisis diario</p>
              </div>
            ) : (
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
                        <div className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">
                          {total}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
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
                Basado en los sesgos activos · Mercados con mayor proporción de señales alcistas
              </p>
            </div>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {signals.length} señales
            </span>
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
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, var(--gold-dark), var(--gold))`,
                    }}
                  />
                </div>
                <span className="text-xs font-bold font-mono text-[var(--gold)] w-10 text-right shrink-0">
                  {pct}%
                </span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-[var(--text-muted)] font-mono mt-4 pt-3 border-t border-[var(--border)]">
            Esta asignación no es asesoramiento financiero. Úsala como referencia de sesgo algorítmico.
          </p>
        </div>
      )}

      {/* Estado vacío si no hay signals ni asignación */}
      {!signalsLoading && signals.length === 0 && (
        <div className="card text-center py-10 mb-6">
          <p className="text-2xl mb-3">📊</p>
          <p className="text-sm font-medium text-white mb-1">Sin análisis activo</p>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            El análisis diario de sesgos se genera automáticamente. Vuelve más tarde o visita la sección{' '}
            <a href="/dashboard/analisis" className="text-[var(--gold)] hover:underline">Análisis de Mercado</a>.
          </p>
        </div>
      )}
    </div>
  )
}
