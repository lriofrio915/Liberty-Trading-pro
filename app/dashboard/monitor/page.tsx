'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import type { GDELTEvent } from '@/components/Monitor/LeafletMap'

// ── Dynamic import (Leaflet must not run on server) ───────────────────────────
const LeafletMap = dynamic(() => import('@/components/Monitor/LeafletMap'), {
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
  image?: string
}

type Timespan = '1h' | '6h' | '24h' | '7d'
type EventType = 'conflict' | 'protest' | 'disaster' | 'economic' | 'other'

// ── Constants ─────────────────────────────────────────────────────────────────

const TIMESPANS: { value: Timespan; label: string }[] = [
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
]

const EVENT_TYPES: { type: EventType; label: string; color: string; emoji: string }[] = [
  { type: 'conflict', label: 'Conflicto', color: '#ef4444', emoji: '💥' },
  { type: 'protest', label: 'Protesta', color: '#f97316', emoji: '✊' },
  { type: 'disaster', label: 'Desastre', color: '#a855f7', emoji: '🌊' },
  { type: 'economic', label: 'Económico', color: '#eab308', emoji: '📉' },
  { type: 'other', label: 'Otros', color: '#60a5fa', emoji: '🌐' },
]

const STRESS_CONFIG: Record<string, { label: string; desc: string; dangerIfHigh?: boolean }> = {
  'VIX': { label: 'VIX', desc: 'Volatilidad — miedo del mercado', dangerIfHigh: true },
  '^VIX': { label: 'VIX', desc: 'Volatilidad — miedo del mercado', dangerIfHigh: true },
  'DXY': { label: 'DXY', desc: 'Fortaleza del dólar USD' },
  'NQ Futures': { label: 'NQ', desc: 'Apetito de riesgo' },
  'Oro': { label: 'Oro', desc: 'Refugio seguro — stress global', dangerIfHigh: true },
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

function toneLabel(tone: number): { text: string; color: string } {
  if (tone < -8) return { text: 'Muy negativo', color: '#ef4444' }
  if (tone < -4) return { text: 'Negativo', color: '#f97316' }
  if (tone < -1) return { text: 'Levemente neg.', color: '#eab308' }
  if (tone < 1) return { text: 'Neutral', color: '#8a8480' }
  return { text: 'Positivo', color: '#22c55e' }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MonitorPage() {
  const [timespan, setTimespan] = useState<Timespan>('24h')
  const [events, setEvents] = useState<GDELTEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventCount, setEventCount] = useState(0)

  const [articles, setArticles] = useState<Article[]>([])
  const [newsLoading, setNewsLoading] = useState(true)

  const [prices, setPrices] = useState<PriceItem[]>([])
  const [pricesLoading, setPricesLoading] = useState(true)

  const [selectedEvent, setSelectedEvent] = useState<GDELTEvent | null>(null)
  const [activeTypes, setActiveTypes] = useState<Set<EventType>>(
    new Set<EventType>(['conflict', 'protest', 'disaster', 'economic', 'other'])
  )

  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const eventsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Fetch events ────────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async (ts: Timespan) => {
    setEventsLoading(true)
    try {
      const res = await fetch(`/api/monitor/events?timespan=${ts}`, { cache: 'no-store' })
      const data = await res.json()
      setEvents(data.events ?? [])
      setEventCount(data.count ?? 0)
      setLastUpdate(new Date())
    } catch {
      // keep previous events
    } finally {
      setEventsLoading(false)
    }
  }, [])

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
    fetchEvents(timespan)
    fetchNews()
    fetchPrices()

    const newsTimer = setInterval(fetchNews, 120_000)
    const pricesTimer = setInterval(fetchPrices, 30_000)

    return () => {
      clearInterval(newsTimer)
      clearInterval(pricesTimer)
    }
  }, [fetchEvents, fetchNews, fetchPrices, timespan])

  // Auto-refresh events every 5 min
  useEffect(() => {
    if (eventsTimerRef.current) clearInterval(eventsTimerRef.current)
    eventsTimerRef.current = setInterval(() => fetchEvents(timespan), 300_000)
    return () => { if (eventsTimerRef.current) clearInterval(eventsTimerRef.current) }
  }, [fetchEvents, timespan])

  // Re-fetch when timespan changes
  const handleTimespanChange = (ts: Timespan) => {
    setTimespan(ts)
    setSelectedEvent(null)
    fetchEvents(ts)
  }

  // ── Filtered events (by type) ───────────────────────────────────────────────

  const filteredEvents = useMemo(
    () => events.filter((e) => activeTypes.has(e.eventType)),
    [events, activeTypes]
  )

  // ── Type counts ─────────────────────────────────────────────────────────────

  const typeCounts = useMemo(() => {
    const c: Partial<Record<EventType, number>> = {}
    for (const e of events) {
      c[e.eventType] = (c[e.eventType] ?? 0) + 1
    }
    return c
  }, [events])

  // ── Stress indicators ───────────────────────────────────────────────────────

  const stressIndicators = useMemo(
    () => prices.filter((p) => ['VIX', 'DXY', 'Oro', 'NQ Futures', '^VIX'].includes(p.name)),
    [prices]
  )

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fadeIn space-y-5 pb-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black mb-1">
            <span className="gradient-gold">Monitor</span>
            <span className="text-[var(--text-secondary)] text-2xl"> de Mercados Globales</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Eventos geopolíticos en tiempo real · GDELT · Noticias en español
          </p>
        </div>
        <div className="text-right shrink-0">
          {lastUpdate && (
            <>
              <div className="label-mono text-[9px]">Última actualización</div>
              <div className="label-mono text-[10px] text-[var(--gold)]">
                {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </>
          )}
          <div className="label-mono text-[9px] mt-1 text-[var(--text-muted)]">
            Eventos auto-refresh: 5min
          </div>
        </div>
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

      {/* ── Timeline + Legend row ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">

        {/* Timeline buttons */}
        <div className="flex items-center gap-1">
          <span className="label-mono text-[10px] mr-2">Período:</span>
          {TIMESPANS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleTimespanChange(value)}
              disabled={eventsLoading}
              className={`px-3 py-1 rounded-md text-xs font-mono-custom transition-all border ${
                timespan === value
                  ? 'border-[var(--gold)] text-[var(--gold)] bg-[rgba(201,168,76,0.08)]'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--gold-dark)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {label}
            </button>
          ))}
          {eventsLoading && (
            <span className="label-mono text-[10px] text-[var(--text-muted)] ml-2 animate-pulse">
              cargando...
            </span>
          )}
        </div>

        {/* Event count */}
        {!eventsLoading && (
          <div className="label-mono text-[10px] text-[var(--gold)]">
            {filteredEvents.length} eventos
            {filteredEvents.length !== eventCount && ` de ${eventCount} totales`}
            {' '}· últimas {timespan}
          </div>
        )}
      </div>

      {/* ── Type filter legend ── */}
      <div className="flex flex-wrap gap-2">
        {EVENT_TYPES.map(({ type, label, color, emoji }) => {
          const active = activeTypes.has(type)
          const count = typeCounts[type] ?? 0
          return (
            <button
              key={type}
              onClick={() => {
                setActiveTypes((prev) => {
                  const next = new Set(prev)
                  if (next.has(type)) next.delete(type)
                  else next.add(type)
                  return next
                })
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono-custom transition-all"
              style={{
                borderColor: active ? color : 'var(--border)',
                background: active ? `${color}18` : 'transparent',
                color: active ? color : 'var(--text-muted)',
                opacity: count === 0 ? 0.4 : 1,
              }}
            >
              <span>{emoji}</span>
              <span>{label}</span>
              {count > 0 && <span className="opacity-70">({count})</span>}
            </button>
          )
        })}
      </div>

      {/* ── Main grid: Map + Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ minHeight: 480 }}>

        {/* Map */}
        <div className="lg:col-span-3 relative rounded-xl overflow-hidden border border-[var(--border)]">
          <div style={{ height: 480 }}>
            <LeafletMap
              events={filteredEvents}
              onEventClick={setSelectedEvent}
              selectedId={selectedEvent?.id}
            />
          </div>
          {/* No-data overlay */}
          {!eventsLoading && filteredEvents.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-[rgba(8,8,8,0.75)] pointer-events-none">
              <div className="text-center">
                <div className="text-4xl mb-2">🌐</div>
                <p className="label-mono text-[11px] text-[var(--text-muted)]">
                  Sin eventos para los filtros seleccionados
                </p>
              </div>
            </div>
          )}
          {/* Attribution */}
          <div className="absolute bottom-1 left-1 z-[1000] pointer-events-none">
            <span className="label-mono text-[8px] text-[var(--text-muted)] bg-[rgba(8,8,8,0.7)] px-1.5 py-0.5 rounded">
              Datos: GDELT Project · Mapa: © OpenStreetMap / CARTO
            </span>
          </div>
        </div>

        {/* Event detail sidebar */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {selectedEvent ? (
            <EventSidebar event={selectedEvent} onClose={() => setSelectedEvent(null)} />
          ) : (
            <div className="card flex-1 flex flex-col items-center justify-center text-center py-12">
              <div className="text-4xl mb-3">👆</div>
              <p className="label-mono text-[11px] text-[var(--text-muted)] max-w-[180px]">
                Haz clic en un marcador del mapa para ver los detalles del evento
              </p>
            </div>
          )}
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

// ── Event Sidebar sub-component ───────────────────────────────────────────────

function EventSidebar({
  event,
  onClose,
}: {
  event: GDELTEvent
  onClose: () => void
}) {
  const typeInfo = EVENT_TYPES.find((t) => t.type === event.eventType)
  const tone = toneLabel(event.tone)
  const dateStr = event.isoDate
    ? new Date(event.isoDate).toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

  return (
    <div className="card flex flex-col gap-4 h-full">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {typeInfo && (
            <span
              className="text-[10px] font-mono-custom font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${typeInfo.color}20`, color: typeInfo.color, border: `1px solid ${typeInfo.color}40` }}
            >
              {typeInfo.emoji} {typeInfo.label.toUpperCase()}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-[var(--text-muted)] hover:text-white transition-colors text-sm flex-shrink-0"
        >
          ✕
        </button>
      </div>

      <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug">
        {event.title}
      </p>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
          <span className="text-[var(--text-muted)]">Fuente</span>
          <span className="font-mono-custom text-[var(--text-secondary)]">{event.domain || '—'}</span>
        </div>
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
          <span className="text-[var(--text-muted)]">Fecha</span>
          <span className="text-[var(--text-secondary)]">{dateStr}</span>
        </div>
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
          <span className="text-[var(--text-muted)]">País fuente</span>
          <span className="text-[var(--text-secondary)]">{event.sourcecountry || '—'}</span>
        </div>
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
          <span className="text-[var(--text-muted)]">Coordenadas</span>
          <span className="font-mono-custom text-[var(--text-muted)] text-[10px]">
            {event.lat.toFixed(2)}°, {event.lng.toFixed(2)}°
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-muted)]">Tono GDELT</span>
          <span className="font-mono-custom font-bold" style={{ color: tone.color }}>
            {event.tone.toFixed(1)} — {tone.text}
          </span>
        </div>
      </div>

      {event.themes && (
        <div>
          <div className="label-mono text-[9px] mb-1.5">Temas detectados</div>
          <div className="flex flex-wrap gap-1">
            {event.themes.split(/[;,\s]+/).filter(Boolean).slice(0, 8).map((t) => (
              <span key={t} className="text-[9px] font-mono-custom px-1.5 py-0.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded text-[var(--text-muted)]">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {event.url && (
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline text-xs py-2.5 px-4 rounded-lg text-center mt-auto"
        >
          Leer artículo original →
        </a>
      )}

      <div className="label-mono text-[8px] text-[var(--text-muted)] text-center">
        Datos: GDELT Project
      </div>
    </div>
  )
}
