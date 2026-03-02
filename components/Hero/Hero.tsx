'use client'

import Link from 'next/link'
import { useLang } from '@/contexts/LanguageContext'

export default function Hero() {
  const { t } = useLang()

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          linear-gradient(rgba(212,175,55,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(212,175,55,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px'
      }} />

      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)' }} />

      <div className="relative z-10 text-center max-w-5xl mx-auto px-4">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 border border-[var(--gold-dark)] rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
          <span className="text-xs font-semibold text-[var(--gold)]">
            {t('Operador Junior — Emporium Quality Funds', 'Junior Trader — Emporium Quality Funds')}
          </span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight tracking-tight">
          {t('Opera como', 'Trade like the')}{' '}
          <span className="gradient-gold">
            {t('los Institucionales', 'Institutions')}
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
          {t(
            'Accede a señales en tiempo real, análisis con inteligencia artificial y mentoring directo con Luis Riofrio. Resultados comprobados en mercados reales.',
            'Access real-time signals, AI-powered analysis, and direct mentoring with Luis Riofrio. Proven results in real markets.'
          )}
        </p>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-10">
          {[
            { value: '+11.94%', label: t('Rendimiento 2026', '2026 Return') },
            { value: '71.4%', label: t('Win Rate', 'Win Rate') },
            { value: '2.55x', label: t('Profit Factor', 'Profit Factor') },
          ].map((stat) => (
            <div key={stat.label} className="card-gold text-center py-3">
              <div className="text-2xl font-black text-[var(--gold)]">{stat.value}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register?plan=club" className="btn-gold text-base py-4 px-8 rounded-xl inline-block">
            {t('Comenzar Ahora', 'Start Now')} →
          </Link>
          <a
            href="https://wa.me/593996691586?text=Hola%20Luis%2C%20quiero%20información%20sobre%20Liberty%20Trading%20Pro"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline text-base py-4 px-8 rounded-xl inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488" />
            </svg>
            WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
