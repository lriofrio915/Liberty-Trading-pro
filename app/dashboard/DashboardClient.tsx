'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useCallback } from 'react'
import TickerBar from '@/components/TickerBar/TickerBar'

// Recharts usa APIs del navegador — sin SSR
const PortafolioQuant = dynamic(() => import('@/components/PortafolioQuant/PortafolioQuant'), {
  ssr: false,
  loading: () => <div className="card h-96 animate-pulse" />,
})

// ── Types ──────────────────────────────────────────────────────────────────────

interface Article {
  title: string
  description: string
  link: string
  pubDate: string
  source: string
}

// ── Constants ──────────────────────────────────────────────────────────────────

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
  const [monitorArticles, setMonitorArticles]           = useState<Article[]>([])
  const [monitorNewsLoading, setMonitorNewsLoading]     = useState(true)

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
    fetchMonitorNews()
    const monitorTimer = setInterval(fetchMonitorNews, 120_000)
    return () => clearInterval(monitorTimer)
  }, [fetchMonitorNews])

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
            <span className="gradient-gold">Tu panel</span> cuantitativo
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

      {/* ── Portafolio comunitario ───────────────────────────────────────────── */}
      <div className="mb-10">
        <PortafolioQuant />
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
        Información con fines educativos · No es asesoramiento de inversión
      </div>

    </div>
  )
}
