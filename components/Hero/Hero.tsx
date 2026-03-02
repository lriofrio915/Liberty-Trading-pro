'use client'

import Link from 'next/link'
import TickerBar from '@/components/TickerBar/TickerBar'

const WA_LINK = 'https://wa.me/+593996691586?text=Hola%20Luis%2C%20quiero%20información%20sobre%20Liberty%20Trading%20Pro'

const TRACK_RECORD = [
  { metric: 'Rendimiento YTD', value: '+11.94%', sub: '2026', positive: true },
  { metric: 'Win Rate', value: '71.4%', sub: '10/14 trades', positive: true },
  { metric: 'Profit Factor', value: '2.55x', sub: 'Gross P/L ratio', positive: true },
  { metric: 'Instrumento', value: 'NQ / ES', sub: 'Futuros CME', positive: null },
]

const TRADE_LOG = [
  { date: '28 Feb', sym: 'NQ1!', dir: 'LONG', res: 'WIN', pnl: '+$1,240' },
  { date: '27 Feb', sym: 'ES1!', dir: 'SHORT', res: 'WIN', pnl: '+$860' },
  { date: '26 Feb', sym: 'NQ1!', dir: 'LONG', res: 'LOSS', pnl: '-$480' },
  { date: '25 Feb', sym: 'NQ1!', dir: 'LONG', res: 'WIN', pnl: '+$2,100' },
  { date: '24 Feb', sym: 'ES1!', dir: 'SHORT', res: 'WIN', pnl: '+$620' },
]

export default function Hero() {
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

            {/* LEFT: Headline + CTAs */}
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
                Invierte como<br />
                <span className="gradient-gold">los que saben</span>
              </h1>

              <p className="text-base text-[var(--text-secondary)] max-w-lg mb-8 leading-relaxed"
                style={{ fontFamily: 'var(--font-sans)' }}>
                Oportunidades de inversión en acciones y ETFs, coaching personalizado con IA
                y gestión directa de tu portafolio en Interactive Brokers.
                Resultados verificables. Transparencia total.
              </p>

              {/* Mini stats */}
              <div className="flex gap-6 mb-10">
                {[
                  { val: '+11.94%', lbl: 'YTD 2026' },
                  { val: '71.4%', lbl: 'Win Rate' },
                  { val: '2.55x', lbl: 'Profit Factor' },
                ].map((s) => (
                  <div key={s.lbl}>
                    <div className="text-2xl font-bold text-[var(--gold)] font-serif"
                      style={{ fontFamily: 'var(--font-serif)' }}>
                      {s.val}
                    </div>
                    <div className="label-mono mt-0.5">{s.lbl}</div>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/register?plan=club"
                  className="btn-gold text-sm py-3.5 px-7 rounded-lg">
                  Comenzar Ahora →
                </Link>
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
                  className="btn-outline text-sm py-3.5 px-7 rounded-lg inline-flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488" />
                  </svg>
                  Hablar con Luis
                </a>
              </div>
            </div>

            {/* RIGHT: Track Record Panel */}
            <div className="hidden lg:block">
              <div className="track-panel p-0 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--green)] pulse-dot" />
                    <span className="label-mono">Track Record — YTD 2026</span>
                  </div>
                  <span className="label-mono text-[10px]">Verificado</span>
                </div>

                {/* KPI grid */}
                <div className="grid grid-cols-2 border-b border-[var(--border)]">
                  {TRACK_RECORD.map((k, i) => (
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
                  <span className="label-mono">Últimas Operaciones</span>
                </div>
                <div>
                  {TRADE_LOG.map((t, i) => (
                    <div key={i}
                      className={`flex items-center justify-between px-5 py-2.5 ${i < TRADE_LOG.length - 1 ? 'border-b border-[var(--border)]' : ''} hover:bg-[var(--bg-hover)] transition-colors`}>
                      <div className="flex items-center gap-3">
                        <span className="label-mono text-[9px]">{t.date}</span>
                        <span className="font-mono-custom text-sm font-medium">{t.sym}</span>
                        <span className={`text-[10px] font-mono-custom px-1.5 py-0.5 rounded ${t.dir === 'LONG' ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'}`}>
                          {t.dir}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-mono-custom font-bold ${t.res === 'WIN' ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                          {t.res}
                        </span>
                        <span className={`font-mono-custom text-sm font-bold ${t.pnl.startsWith('+') ? 'positive' : 'negative'}`}>
                          {t.pnl}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 flex items-center justify-between">
                  <span className="label-mono text-[9px]">Datos YTD — Actualizados mensualmente</span>
                  <Link href="/register" className="label-mono text-[10px] text-[var(--gold)] hover:underline">
                    Ver completo →
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
