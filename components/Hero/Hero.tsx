'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import TickerBar from '@/components/TickerBar/TickerBar'

const VINCES_WA = 'https://wa.me/18287149177?text=Hola%2C%20quiero%20información%20sobre%20Liberty%20Trading%20Club'

interface TrackRecord {
  totalTrades: number
  wins: number
  losses: number
  winRate: number
  profitFactor: number
  totalNetPnl: number
  rendimientoYTD: number
  recentSessions: {
    date: string
    instrumento: string
    direccion: string
    resultado: string
    pnlNeto: number
  }[]
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })
}

function formatPnl(pnl: number) {
  const abs = Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  return pnl >= 0 ? `+$${abs}` : `-$${abs}`
}

export default function Hero() {
  const [data, setData] = useState<TrackRecord | null>(null)

  useEffect(() => {
    fetch('/api/public-track-record')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
  }, [])

  const ytd = data ? (data.rendimientoYTD >= 0 ? `+${data.rendimientoYTD.toFixed(2)}%` : `${data.rendimientoYTD.toFixed(2)}%`) : '—'
  const winRate = data ? `${data.winRate}%` : '—'
  const pf = data ? `${data.profitFactor}x` : '—'
  const tradesStr = data ? `${data.wins}/${data.totalTrades}` : '—'

  return (
    <>
      {/* Ticker */}
      <div className="pt-16">
        <TickerBar />
      </div>

      <section className="relative min-h-screen flex items-center overflow-hidden grid-bg">
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* LEFT: Headline + Subscription pitch */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2.5 border border-[var(--gold-dark)] rounded-full px-4 py-1.5 mb-10"
                style={{ background: 'rgba(201,168,76,0.06)' }}>
                <span className="w-2 h-2 rounded-full bg-[var(--green)] pulse-dot" />
                <span className="font-mono-custom text-[11px] text-[var(--gold)] tracking-wider">
                  Operador Financiero — Emporium Quality Funds
                </span>
              </div>

              <h1 className="headline text-6xl sm:text-7xl lg:text-8xl text-[var(--text-primary)] mb-6">
                Trading real<br />
                <span className="gradient-gold">con quien opera<br />de verdad</span>
              </h1>

              <p className="text-base text-[var(--text-secondary)] max-w-lg mb-8 leading-relaxed"
                style={{ fontFamily: 'var(--font-sans)' }}>
                Formación completa de cero a trader profesional, track record verificable, trading de futuros NQ/MNQ,
                mentorías 1:1 con Luis Riofrio, reportes de oportunidades en acciones y ETFs,
                y coaching con IA. Todo en una sola membresía.
              </p>

              {/* Value props */}
              <div className="flex flex-wrap gap-2 mb-8">
                {[
                  { icon: '🎓', label: 'Mentoría 1:1 con Luis' },
                  { icon: '📋', label: 'Reportes de oportunidades' },
                  { icon: '🤖', label: 'IA Vinces — coaching 24/7' },
                  { icon: '📈', label: 'Trading de Futuros NQ/MNQ' },
                ].map((v) => (
                  <div key={v.label}
                    className="flex items-center gap-1.5 border border-[var(--border)] rounded-full px-3 py-1.5"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <span className="text-sm">{v.icon}</span>
                    <span className="text-xs text-[var(--text-secondary)] font-mono">{v.label}</span>
                  </div>
                ))}
              </div>

              {/* Price teaser */}
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-serif)' }}>$79</span>
                <span className="label-mono">/mes</span>
                <span className="text-[var(--text-muted)] text-sm ml-1">· o $649/año y ahorra $300</span>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="https://pay.hotmart.com/R104900326X?checkoutMode=2"
                  onClick={() => false}
                  className="hotmart-fb hotmart__button-checkout btn-gold text-sm py-3.5 px-7 rounded-lg text-center">
                  Unirme al Club →
                </a>
                <a href={VINCES_WA} target="_blank" rel="noopener noreferrer"
                  className="btn-outline text-sm py-3.5 px-7 rounded-lg inline-flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488" />
                  </svg>
                  Hablar con Vinces
                </a>
              </div>

              <p className="label-mono text-[10px] mt-4 text-[var(--text-muted)]">
                Sin compromisos — cancela cuando quieras
              </p>
            </div>

            {/* RIGHT: Track Record Panel — Real Data */}
            <div className="hidden lg:block">
              <div className="track-panel p-0 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--green)] pulse-dot" />
                    <span className="label-mono">Track Record Luis Riofrio — YTD {new Date().getFullYear()}</span>
                  </div>
                  <span className="label-mono text-[10px]">Tiempo Real</span>
                </div>

                {/* KPI grid */}
                <div className="grid grid-cols-2 border-b border-[var(--border)]">
                  {[
                    { metric: 'Rendimiento YTD', value: ytd, sub: `${new Date().getFullYear()} · Capital propio`, positive: data ? data.rendimientoYTD >= 0 : null },
                    { metric: 'Win Rate', value: winRate, sub: `${tradesStr} trades ganados`, positive: true },
                    { metric: 'Profit Factor', value: pf, sub: 'Gross P/L ratio', positive: true },
                    { metric: 'Instrumento', value: 'MNQ', sub: 'Futuros CME Nasdaq', positive: null },
                  ].map((k, i) => (
                    <div key={i}
                      className={`px-5 py-4 ${i % 2 === 0 ? 'border-r border-[var(--border)]' : ''} ${i < 2 ? 'border-b border-[var(--border)]' : ''}`}>
                      <div className="label-mono mb-1.5">{k.metric}</div>
                      <div className={`text-2xl font-bold ${k.positive === true ? 'text-[var(--gold)]' : k.positive === false ? 'text-[var(--red)]' : 'text-[var(--text-primary)]'}`}
                        style={{ fontFamily: 'var(--font-serif)' }}>
                        {k.value}
                      </div>
                      <div className="label-mono mt-1">{k.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Trade log */}
                <div className="px-5 py-3 border-b border-[var(--border)]">
                  <span className="label-mono">Últimas Operaciones Reales</span>
                </div>
                <div>
                  {!data ? (
                    // Skeleton
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between px-5 py-2.5 border-b border-[var(--border)] last:border-b-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-3 rounded bg-[var(--bg-hover)] animate-pulse" />
                          <div className="w-14 h-4 rounded bg-[var(--bg-hover)] animate-pulse" />
                          <div className="w-10 h-4 rounded bg-[var(--bg-hover)] animate-pulse" />
                        </div>
                        <div className="w-16 h-4 rounded bg-[var(--bg-hover)] animate-pulse" />
                      </div>
                    ))
                  ) : (
                    data.recentSessions.map((t, i) => (
                      <div key={i}
                        className={`flex items-center justify-between px-5 py-2.5 ${i < data.recentSessions.length - 1 ? 'border-b border-[var(--border)]' : ''} hover:bg-[var(--bg-hover)] transition-colors`}>
                        <div className="flex items-center gap-3">
                          <span className="label-mono text-[9px]">{formatDate(t.date)}</span>
                          <span className="font-mono-custom text-sm font-medium">{t.instrumento}</span>
                          <span className={`text-[10px] font-mono-custom px-1.5 py-0.5 rounded ${t.direccion === 'LONG' ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'}`}>
                            {t.direccion}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-mono-custom font-bold ${t.resultado === 'WIN' ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                            {t.resultado}
                          </span>
                          <span className={`font-mono-custom text-sm font-bold ${t.pnlNeto >= 0 ? 'positive' : 'negative'}`}>
                            {formatPnl(t.pnlNeto)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-[var(--border)] space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
                    <span className="label-mono text-[9px]">Datos de BD — se actualizan con cada operación</span>
                  </div>
                  <Link
                    href="/track-record/cmmjkgdt800004kjq1zep8qc9"
                    className="label-mono text-[10px] text-[var(--gold)] hover:underline block">
                    Ver historial completo de Luis Riofrio →
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
