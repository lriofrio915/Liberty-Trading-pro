'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState, useMemo, useCallback } from 'react'

// ── Dynamic import (Leaflet must not run on server) ───────────────────────────
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

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Constants ─────────────────────────────────────────────────────────────────

const TIMESPANS: { value: Timespan; label: string }[] = [
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
]

const STRESS_CONFIG: Record<string, { label: string; desc: string; dangerIfHigh?: boolean }> = {
  'VIX':        { label: 'VIX', desc: 'Volatilidad — miedo del mercado', dangerIfHigh: true },
  '^VIX':       { label: 'VIX', desc: 'Volatilidad — miedo del mercado', dangerIfHigh: true },
  'DXY':        { label: 'DXY', desc: 'Fortaleza del dólar USD' },
  'NQ Futures': { label: 'NQ',  desc: 'Apetito de riesgo' },
  'Oro':        { label: 'Oro', desc: 'Refugio seguro — stress global', dangerIfHigh: true },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
    if (diff < 60) return 'Hace un momento'
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`
    return `Hace ${Math.floor(diff / 86400)}d`
  } catch {
    return ''
  }
}

function fmtPrice(price: number, name: string): string {
  if (!price || isNaN(price)) return '—'
  if (name === 'VIX') return price.toFixed(2)
  if (name.includes('/')) return price.toFixed(2)
  return price.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MonitorPage() {
  const [timespan, setTimespan] = useState<Timespan>('24h')

  const [articles, setArticles] = useState<Article[]>([])
  const [newsLoading, setNewsLoading] = useState(true)

  const [prices, setPrices] = useState<PriceItem[]>([])
  const [pricesLoading, setPricesLoading] = useState(true)

  // ── Fetch news ──────────────────────────────────────────────────────────────

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch('/api/monitor/news', { cache: 'no-store' })
      const data = await res.json()
      setArticles(data.articles ?? [])
    } finally {
      setNewsLoading(false)
    }
  }, [])

  // ── Fetch prices ────────────────────────────────────────────────────────────

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/prices', { cache: 'no-store' })
      const data = await res.json()
      if (data.prices?.length) setPrices(data.prices)
    } finally {
      setPricesLoading(false)
    }
  }, [])

  // ── Initial load + intervals ────────────────────────────────────────────────

  useEffect(() => {
    fetchNews()
    fetchPrices()
    const newsTimer = setInterval(fetchNews, 120_000)
    const pricesTimer = setInterval(fetchPrices, 30_000)
    return () => {
      clearInterval(newsTimer)
      clearInterval(pricesTimer)
    }
  }, [fetchNews, fetchPrices])

  // ── Stress indicators ───────────────────────────────────────────────────────

  const stressIndicators = useMemo(
    () => prices.filter((p) => ['VIX', 'DXY', 'Oro', 'NQ Futures', '^VIX'].includes(p.name)),
    [prices]
  )

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fadeIn space-y-5 pb-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-black mb-1">
          <span className="gradient-gold">Monitor</span>
          <span className="text-[var(--text-secondary)] text-2xl"> de Mercados Globales</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Eventos geopolíticos en tiempo real · BBC Mundo · El País · DW · France 24
        </p>
      </div>

      {/* ── Stress Indicators ── */}
      <div>
        <div className="label-mono mb-2.5 text-[var(--gold)]">Indicadores de stress del mercado</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {pricesLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card h-20 animate-pulse" />
              ))
            : stressIndicators.map((p) => {
                const cfg = STRESS_CONFIG[p.name] ?? { label: p.name, desc: '' }
                const bad = cfg.dangerIfHigh ? p.up : !p.up
                return (
                  <div key={p.symbol} className="card flex flex-col gap-1 py-3">
                    <div className="flex items-center justify-between">
                      <span className="label-mono text-[10px]">{cfg.label}</span>
                      <span
                        className="text-[10px] font-mono-custom font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background: bad ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                          color: bad ? '#ef4444' : '#22c55e',
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

      {/* ── Timeline selector ── */}
      <div className="flex items-center gap-1">
        <span className="label-mono text-[10px] mr-2">Período:</span>
        {TIMESPANS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTimespan(value)}
            className={`px-3 py-1 rounded-md text-xs font-mono-custom transition-all border ${
              timespan === value
                ? 'border-[var(--gold)] text-[var(--gold)] bg-[rgba(201,168,76,0.08)]'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--gold-dark)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Map ── */}
      <div>
        <div
          className="rounded-xl overflow-hidden border border-[var(--border)]"
          style={{ height: 500 }}
        >
          <GdeltMap timespan={timespan} />
        </div>

        {/* ── External links banner ── */}
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

      {/* ── News feed ── */}
      <div>
        <div className="label-mono mb-3 text-[var(--gold)]">Noticias internacionales en español</div>
        {newsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card h-20 animate-pulse" />
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {articles.map((item, i) => (
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

      {/* ── Disclaimer ── */}
      <div className="label-mono text-[9px] text-[var(--text-muted)] text-center border-t border-[var(--border)] pt-4">
        Información con fines educativos · Fuente: GDELT Project (gdeltproject.org) ·
        Los eventos geopolíticos impactan la volatilidad de los mercados · No es asesoramiento de inversión
      </div>

    </div>
  )
}
