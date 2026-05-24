'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useCallback, useMemo } from 'react'
import TickerBar from '@/components/TickerBar/TickerBar'

// GdeltMap requires browser APIs — no SSR
const GdeltMap = dynamic(() => import('@/components/GdeltMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[var(--bg-secondary)]">
      <div className="text-center">
        <div className="text-3xl mb-2 animate-pulse">🗺️</div>
        <p className="label-mono text-[10px]">Cargando mapa...</p>
      </div>
    </div>
  ),
})

// ── Types ──────────────────────────────────────────────────────────────────────

interface PriceItem {
  symbol: string
  name: string
  price: number
  change: number
  changePct: number
  up: boolean
}

interface Article {
  title: string
  description: string
  link: string
  pubDate: string
  source: string
}

type Timespan = '1h' | '6h' | '24h' | '7d'

// ── Constants ──────────────────────────────────────────────────────────────────

const TIMESPANS: { value: Timespan; label: string }[] = [
  { value: '1h',  label: '1h' },
  { value: '6h',  label: '6h' },
  { value: '24h', label: '24h' },
  { value: '7d',  label: '7d' },
]

const PRICES_CACHE_KEY = 'monitor-prices-cache'
const PRICES_CACHE_TTL = 45_000

const STRESS_CONFIG: Record<string, { label: string; desc: string; dangerIfHigh?: boolean }> = {
  'VIX':          { label: 'VIX',     desc: 'Volatilidad — miedo del mercado' },
  '^VIX':         { label: 'VIX',     desc: 'Volatilidad — miedo del mercado' },
  'DXY':          { label: 'DXY',     desc: 'Fortaleza del dólar USD' },
  'NQ Futures':   { label: 'NQ',      desc: 'Apetito de riesgo tech' },
  'S&P 500':      { label: 'S&P 500', desc: 'Índice amplio — 500 empresas EE.UU.' },
  'Russell 2000': { label: 'Russell', desc: 'Small caps — apetito de riesgo' },
  'Oro':          { label: 'Oro',     desc: 'Refugio seguro — stress global' },
}

const PLAN_COLORS: Record<string, string> = {
  FREE:      '#6B6560',
  CLUB:      '#C9A84C',
  PRO:       '#4A9EFF',
  PORTFOLIO: '#A855F7',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
    if (diff < 60)    return 'Hace un momento'
    if (diff < 3600)  return `Hace ${Math.floor(diff / 60)}m`
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`
    return `Hace ${Math.floor(diff / 86400)}d`
  } catch {
    return ''
  }
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function fmtPrice(price: number, name: string): string {
  if (!price || isNaN(price)) return '—'
  if (name === 'VIX') return price.toFixed(2)
  if (name.includes('/')) return price.toFixed(2)
  return price.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

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
  const [prices, setPrices]                 = useState<PriceItem[]>([])
  const [pricesLoading, setPricesLoading]   = useState(true)
  const [monitorArticles, setMonitorArticles]           = useState<Article[]>([])
  const [monitorNewsLoading, setMonitorNewsLoading]     = useState(true)
  const [timespan, setTimespan] = useState<Timespan>('24h')

  // ── Fetch prices (stress indicators) ──────────────────────────────────────

  const fetchPrices = useCallback(async () => {
    try {
      const cached = localStorage.getItem(PRICES_CACHE_KEY)
      if (cached) {
        const { prices: cachedPrices, ts } = JSON.parse(cached)
        if (Date.now() - ts < PRICES_CACHE_TTL) {
          setPrices(cachedPrices)
          setPricesLoading(false)
          return
        }
      }
      const res = await fetch('/api/prices')
      const data = await res.json()
      if (data.prices?.length) {
        localStorage.setItem(PRICES_CACHE_KEY, JSON.stringify({ prices: data.prices, ts: Date.now() }))
        setPrices(data.prices)
      }
    } catch {}
    finally { setPricesLoading(false) }
  }, [])

  // ── Fetch international news ───────────────────────────────────────────────

  const fetchMonitorNews = useCallback(async () => {
    try {
      const res = await fetch('/api/monitor/news', { cache: 'no-store' })
      const data = await res.json()
      setMonitorArticles(data.articles ?? [])
    } catch {}
    finally { setMonitorNewsLoading(false) }
  }, [])

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchPrices()
    fetchMonitorNews()
    const pricesTimer   = setInterval(fetchPrices,      60_000)
    const monitorTimer  = setInterval(fetchMonitorNews, 120_000)
    return () => {
      clearInterval(pricesTimer)
      clearInterval(monitorTimer)
    }
  }, [fetchPrices, fetchMonitorNews])

  // ── Stress indicators ──────────────────────────────────────────────────────

  const stressIndicators = useMemo(
    () => prices.filter(p =>
      ['VIX', '^VIX', 'DXY', 'NQ Futures', 'S&P 500', 'Russell 2000', 'Oro'].includes(p.name)
    ),
    [prices]
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fadeIn">

      {/* Ticker bar — flush al borde superior cancelando el padding del layout */}
      <div className="-mx-6 -mt-4 md:-mt-8 mb-6">
        <TickerBar />
      </div>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black mb-1">
            <span className="gradient-gold">Market</span> Intelligence
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {greeting()},{' '}
            <span className="text-white font-medium">{userName?.split(' ')[0] || 'trader'}</span>
            {userPlan && (
              <span
                className="ml-2 text-[10px] font-mono tracking-widest px-2 py-0.5 rounded-full border"
                style={{
                  color:       PLAN_COLORS[userPlan] ?? '#C9A84C',
                  borderColor: (PLAN_COLORS[userPlan] ?? '#C9A84C') + '44',
                }}
              >
                {userPlan}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── Indicadores de stress ────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="label-mono mb-2.5 text-[var(--gold)]">Indicadores de stress del mercado</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {pricesLoading
            ? Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="card h-20 animate-pulse" />
              ))
            : stressIndicators.map(p => {
                const cfg = STRESS_CONFIG[p.name] ?? { label: p.name, desc: '' }
                const bad = cfg.dangerIfHigh ? p.up : !p.up
                return (
                  <div key={p.symbol} className="card flex flex-col gap-1 py-3">
                    <div className="flex items-center justify-between">
                      <span className="label-mono text-[10px]">{cfg.label}</span>
                      <span
                        className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background: bad ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                          color:      bad ? '#ef4444'              : '#22c55e',
                        }}
                      >
                        {p.changePct >= 0 ? '+' : ''}{p.changePct.toFixed(2)}%
                      </span>
                    </div>
                    <div
                      className="text-xl font-bold"
                      style={{ fontFamily: 'var(--font-serif)', color: bad ? '#ef4444' : '#22c55e' }}
                    >
                      {fmtPrice(p.price, p.name)}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] leading-tight">{cfg.desc}</div>
                  </div>
                )
              })}
        </div>
      </div>

      {/* ── Selector de período ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-3">
        <span className="label-mono text-[10px] mr-2">Período:</span>
        {TIMESPANS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTimespan(value)}
            className={`px-3 py-1 rounded-md text-xs font-mono transition-all border ${
              timespan === value
                ? 'border-[var(--gold)] text-[var(--gold)] bg-[rgba(201,168,76,0.08)]'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--gold-dark)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Mapa geopolítico ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div
          className="rounded-xl overflow-hidden border border-[var(--border)]"
          style={{ height: 500 }}
        >
          <GdeltMap timespan={timespan} />
        </div>

        {/* Banner herramientas externas */}
        <div className="mt-2 rounded-lg border border-yellow-900/30 bg-yellow-900/10 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-yellow-400 text-xs font-mono tracking-widest font-bold">
              HERRAMIENTAS DE SEGUIMIENTO EN TIEMPO REAL
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Conflictos globales · Tráfico naval · Vuelos militares y comerciales
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <a
              href="https://liveuamap.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-yellow-500 text-black text-xs font-bold px-3 py-1.5 rounded hover:bg-yellow-400 transition-colors tracking-widest"
            >
              LIVEUAMAP ↗
            </a>
            <a
              href="https://www.marinetraffic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-yellow-700/50 text-yellow-400 text-xs font-bold px-3 py-1.5 rounded hover:bg-yellow-900/20 transition-colors tracking-widest"
            >
              TRÁFICO NAVAL ↗
            </a>
            <a
              href="https://www.flightradar24.com"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-yellow-700/50 text-yellow-400 text-xs font-bold px-3 py-1.5 rounded hover:bg-yellow-900/20 transition-colors tracking-widest"
            >
              FLIGHTRADAR24 ↗
            </a>
          </div>
        </div>
      </div>

      {/* ── Noticias internacionales ─────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="label-mono mb-3 text-[var(--gold)]">Noticias internacionales en español</div>
        {monitorNewsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card h-20 animate-pulse" />
            ))}
          </div>
        ) : monitorArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {monitorArticles.map((item, i) => (
              <a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="card p-3.5 hover:border-[var(--gold-dark)] transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="label-mono text-[9px] text-[var(--gold)]">{item.source}</span>
                  <span className="label-mono text-[9px] text-[var(--text-muted)]">
                    {timeAgo(item.pubDate)}
                  </span>
                </div>
                <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--gold)] transition-colors leading-snug line-clamp-2">
                  {item.title}
                </p>
                {item.description && (
                  <p className="text-xs text-[var(--text-muted)] mt-1.5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </a>
            ))}
          </div>
        ) : (
          <div className="card text-center py-10">
            <p className="text-[var(--text-muted)] text-sm">Sin noticias disponibles</p>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="label-mono text-[9px] text-[var(--text-muted)] text-center border-t border-[var(--border)] pt-4 pb-2">
        Información con fines educativos · Fuente: GDELT Project (gdeltproject.org) ·
        Los eventos geopolíticos impactan la volatilidad de los mercados · No es asesoramiento de inversión
      </div>

    </div>
  )
}
