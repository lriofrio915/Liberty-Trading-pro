'use client'

import { useEffect, useState, useCallback } from 'react'

interface NewsItem {
  title: string
  description: string
  link: string
  pubDate: string
  source: string
}

interface PriceItem {
  symbol: string
  name: string
  price: number
  change: number
  changePct: number
  up: boolean
}

const STRESS_LABELS: Record<string, { label: string; desc: string; invert?: boolean }> = {
  '%5EVIX': { label: 'VIX', desc: 'Índice de Volatilidad — miedo del mercado', invert: true },
  '^VIX':   { label: 'VIX', desc: 'Índice de Volatilidad — miedo del mercado', invert: true },
  'DX=F':   { label: 'DXY', desc: 'Dólar Index — fortaleza del USD' },
  'GC=F':   { label: 'Oro', desc: 'Activo refugio — stress geopolítico' },
  'NQ=F':   { label: 'NQ Fut', desc: 'Futuros Nasdaq — apetito de riesgo' },
}

function formatPrice(sym: string, price: number): string {
  if (!price || isNaN(price)) return '—'
  if (sym === 'EURUSD=X') return price.toFixed(4)
  if (sym === '%5EVIX' || sym === '^VIX') return price.toFixed(2)
  return price.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'Hace un momento'
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`
  return `Hace ${Math.floor(diff / 86400)}d`
}

export default function MonitorPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [prices, setPrices] = useState<PriceItem[]>([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [pricesLoading, setPricesLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/prices', { cache: 'no-store' })
      const data = await res.json()
      if (data.prices?.length) {
        setPrices(data.prices)
        setLastUpdate(new Date())
      }
    } finally {
      setPricesLoading(false)
    }
  }, [])

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch('/api/news', { cache: 'no-store' })
      const data = await res.json()
      if (data.news?.length) setNews(data.news)
    } finally {
      setNewsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrices()
    fetchNews()
    const p = setInterval(fetchPrices, 30_000)
    const n = setInterval(fetchNews, 120_000)
    return () => { clearInterval(p); clearInterval(n) }
  }, [fetchPrices, fetchNews])

  const stressIndicators = prices.filter(p =>
    ['%5EVIX', '^VIX', 'DX=F', 'GC=F', 'NQ=F'].includes(p.symbol)
  )

  return (
    <div className="animate-fadeIn space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black mb-1">
            <span className="gradient-gold">Monitor de Mercados</span> <span className="text-[var(--text-secondary)] text-2xl">Globales</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Eventos geopolíticos · Indicadores de stress · Noticias en tiempo real
          </p>
        </div>
        {lastUpdate && (
          <div className="text-right">
            <div className="label-mono text-[9px]">Actualizado</div>
            <div className="label-mono text-[10px] text-[var(--gold)]">
              {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )}
      </div>

      {/* Stress Indicators */}
      <div>
        <div className="label-mono mb-3 text-[var(--gold)]">Indicadores de stress del mercado</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {pricesLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card animate-pulse h-20" />
              ))
            : stressIndicators.length > 0
              ? stressIndicators.map((p) => {
                  const info = STRESS_LABELS[p.symbol] ?? { label: p.name, desc: '' }
                  const stressUp = info.invert ? !p.up : p.up
                  return (
                    <div key={p.symbol} className="card flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="label-mono text-[10px]">{info.label}</span>
                        <span className={`text-[10px] font-mono-custom font-bold px-1.5 py-0.5 rounded ${
                          stressUp ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'
                        }`}>
                          {p.changePct >= 0 ? '+' : ''}{p.changePct.toFixed(2)}%
                        </span>
                      </div>
                      <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: stressUp ? 'var(--green)' : 'var(--red)' }}>
                        {formatPrice(p.symbol, p.price)}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] leading-tight">{info.desc}</div>
                    </div>
                  )
                })
              : (
                <div className="col-span-4 text-center py-4 text-sm text-[var(--text-muted)]">
                  Cargando indicadores...
                </div>
              )
          }
        </div>
      </div>

      {/* Two-column layout: map + news */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Mapa geopolítico */}
        <div className="lg:col-span-3 flex flex-col">
          <div className="label-mono mb-3 text-[var(--gold)]">Mapa de eventos globales</div>
          <div className="rounded-xl overflow-hidden border border-[var(--border)] flex-1" style={{ minHeight: 360 }}>
            <iframe
              src="https://liveuamap.com/embed"
              className="w-full h-full"
              style={{ minHeight: 360, border: 0 }}
              title="Mapa de eventos globales"
              loading="lazy"
            />
          </div>
          <p className="text-[9px] text-[var(--text-muted)] mt-1.5 label-mono">
            Fuente: LiveUAMap · Eventos geopolíticos en tiempo real
          </p>
        </div>

        {/* News feed */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="label-mono mb-3 text-[var(--gold)]">Noticias internacionales</div>
          <div className="space-y-2 flex-1 overflow-y-auto" style={{ maxHeight: 420 }}>
            {newsLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card p-3 animate-pulse h-16" />
                ))
              : news.length > 0
                ? news.map((item, i) => (
                    <a
                      key={i}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block card p-3 hover:border-[var(--gold-dark)] transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="label-mono text-[9px] text-[var(--gold)]">{item.source}</span>
                        <span className="label-mono text-[9px] shrink-0">{timeAgo(item.pubDate)}</span>
                      </div>
                      <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--gold)] transition-colors leading-tight line-clamp-2">
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </a>
                  ))
                : (
                  <div className="text-center py-8 text-sm text-[var(--text-muted)]">
                    Cargando noticias...
                  </div>
                )
            }
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="label-mono text-[9px] text-[var(--text-muted)] text-center border-t border-[var(--border)] pt-4">
        Información con fines educativos · Los eventos geopolíticos pueden impactar los mercados con alta volatilidad · No es asesoramiento de inversión
      </div>

    </div>
  )
}
