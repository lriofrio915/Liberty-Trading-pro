'use client'

import Link from 'next/link'
import { useLang } from '@/contexts/LanguageContext'

const plans = [
  {
    name: 'FREE',
    price: '$0',
    period: '/mes',
    badge: null,
    features: [
      { text: 'Track Record público de Luis', included: true },
      { text: 'Indicadores básicos', included: true },
      { text: 'Comunidad básica', included: true },
      { text: 'Señales en tiempo real', included: false },
      { text: 'Chat con Vinces AI', included: false },
      { text: 'Reportes automáticos', included: false },
    ],
    cta: 'Crear Cuenta Gratis',
    href: '/register?plan=free',
    highlighted: false,
  },
  {
    name: 'CLUB',
    price: '$47',
    period: '/mes',
    badge: 'Más Popular',
    features: [
      { text: 'Todo lo de Free', included: true },
      { text: 'Señales en tiempo real', included: true },
      { text: 'Oportunidades de inversión', included: true },
      { text: 'Chat con Vinces AI', included: true },
      { text: 'Reportes semanales', included: true },
      { text: 'Gestión de portafolio', included: false },
    ],
    cta: 'Comenzar con Club',
    href: '/register?plan=club',
    highlighted: true,
  },
  {
    name: 'PRO',
    price: '$97',
    period: '/mes',
    badge: null,
    features: [
      { text: 'Todo lo de Club', included: true },
      { text: 'Mentoría personalizada', included: true },
      { text: 'Reportes mensuales PDF', included: true },
      { text: 'Análisis Vinces ilimitado', included: true },
      { text: 'Acceso a nuevas funciones', included: true },
      { text: 'Gestión de portafolio', included: true },
    ],
    cta: 'Comenzar PRO',
    href: '/register?plan=pro',
    highlighted: false,
  },
]

export default function Pricing() {
  const { t } = useLang()

  return (
    <section id="precios" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            {t('Planes ', 'Plans ')}<span className="gradient-gold">{t('Transparentes', 'Transparent')}</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
            {t(
              'Elige el plan que se adapta a tu nivel. Sin contratos, sin permanencia.',
              'Choose the plan that fits your level. No contracts, no lock-in.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 flex flex-col ${
                plan.highlighted
                  ? 'border-2 border-[var(--gold)] glow-gold'
                  : 'border border-[var(--border)]'
              }`}
              style={{ background: plan.highlighted ? '#0d0d00' : 'var(--bg-card)' }}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="btn-gold text-xs py-1 px-4 rounded-full whitespace-nowrap">
                    {t(plan.badge, plan.badge)}
                  </span>
                </div>
              )}

              <div className="mb-8">
                <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white">{plan.price}</span>
                  <span className="text-[var(--text-muted)]">{plan.period}</span>
                </div>
              </div>

              <ul className="flex-1 space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-3">
                    <span className={feature.included ? 'text-[var(--green)]' : 'text-[var(--text-muted)]'}>
                      {feature.included ? '✓' : '✗'}
                    </span>
                    <span className={`text-sm ${feature.included ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)] line-through'}`}>
                      {t(feature.text, feature.text)}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`text-center py-3 px-6 rounded-xl font-bold text-sm transition-all ${
                  plan.highlighted
                    ? 'btn-gold'
                    : 'btn-outline'
                }`}
              >
                {t(plan.cta, plan.cta)}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
