'use client'

import Link from 'next/link'

const plans = [
  {
    name: 'FREE',
    label: 'Liberty Club',
    price: '$0',
    period: '',
    badge: null,
    highlighted: false,
    features: [
      'Curso: Estrategia Nasdaq en YouTube',
      'Monitor Mundial — geopolítica en tiempo real',
      'Comunidad Liberty Trading Club',
      'Track record público de Luis',
    ],
    cta: 'Acceder Gratis',
    href: '/register?plan=free',
  },
  {
    name: 'CLUB',
    label: 'Club de Inversión',
    price: '$19',
    period: '/mes',
    badge: 'Más Popular',
    highlighted: true,
    features: [
      'Todo lo de Free',
      'Oportunidades en Acciones y ETFs',
      'Informes fundamentales de empresas',
      'Sesgo diario NQ y ES',
      'Análisis a mediano y largo plazo',
    ],
    cta: 'Unirme al Club',
    href: '/register?plan=club',
  },
  {
    name: 'PRO',
    label: 'PRO + Vinces IA',
    price: '$49',
    period: '/mes',
    badge: null,
    highlighted: false,
    features: [
      'Todo lo de Club',
      'Vinces IA — coaching personalizado',
      'Revisión mensual 1:1 con Luis',
      'Data histórica completa',
      'Reportes PDF semanales y mensuales',
      'Track récord verificable',
    ],
    cta: 'Activar PRO',
    href: '/register?plan=pro',
  },
]

export default function Pricing() {
  return (
    <section id="precios" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="label-mono mb-4">Membresías</div>
          <h2 className="headline text-5xl sm:text-6xl text-[var(--text-primary)] mb-4">
            Planes <span className="gradient-gold">transparentes</span>
          </h2>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
            Sin contratos. Sin permanencia. Solo pagas lo que usas.
          </p>
        </div>

        {/* Subscriptions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <div key={plan.name}
              className={`relative rounded-2xl p-7 flex flex-col ${
                plan.highlighted
                  ? 'border border-[var(--gold)] glow-gold-sm'
                  : 'border border-[var(--border)]'
              }`}
              style={{ background: plan.highlighted ? 'rgba(201,168,76,0.04)' : 'var(--bg-card)' }}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="btn-gold text-[10px] py-1 px-4 rounded-full whitespace-nowrap tracking-widest">
                    {plan.badge.toUpperCase()}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div className="label-mono mb-2">{plan.name}</div>
                <div className="headline text-xl text-[var(--text-primary)] mb-3">{plan.label}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white"
                    style={{ fontFamily: 'var(--font-serif)' }}>{plan.price}</span>
                  {plan.period && (
                    <span className="label-mono text-sm">{plan.period}</span>
                  )}
                </div>
              </div>

              <ul className="flex-1 space-y-2.5 mb-7">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className="text-[var(--gold)] mt-0.5 text-sm flex-shrink-0">✓</span>
                    <span className="text-sm text-[var(--text-secondary)]">{f}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.href}
                className={`text-center py-3 px-5 rounded-lg font-bold text-sm transition-all ${
                  plan.highlighted ? 'btn-gold' : 'btn-outline'
                }`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Portfolio management — special card */}
        <div className="rounded-2xl border border-[var(--gold-dark)] p-7 relative overflow-hidden"
          style={{ background: 'rgba(201,168,76,0.03)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 opacity-5"
            style={{ background: 'radial-gradient(circle, var(--gold) 0%, transparent 70%)' }} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative">
            <div>
              <div className="label-mono mb-2 text-[var(--gold)]">Sin mensualidad</div>
              <div className="headline text-3xl text-[var(--text-primary)] mb-3">
                Gestión de Portafolio<br />
                <span className="gradient-gold">vía Interactive Brokers</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                Luis replica su operativa en tu cuenta de IBKR en tiempo real a través de NinjaTrader 8.
                Solo pagas cuando ganas. Capital mínimo recomendado: <strong className="text-white">$10,000 USD</strong>
              </p>
              <Link href="/register?plan=portfolio"
                className="btn-gold text-sm py-3 px-7 rounded-lg inline-block">
                Consultar disponibilidad →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: '🏦', title: 'Apertura guiada', desc: 'Luis te acompaña en la apertura de cuenta IBKR' },
                { icon: '🔗', title: 'Conexión NinjaTrader 8', desc: 'Tu cuenta conectada en tiempo real' },
                { icon: '💼', title: '1% gestión', desc: 'Comisión sobre cada depósito realizado' },
                { icon: '🎯', title: '30% éxito', desc: 'Solo pagas sobre las ganancias generadas' },
                { icon: '📅', title: 'Retiro anual', desc: 'Ganancias disponibles a fin de año' },
                { icon: '🚫', title: 'Sin mensualidades', desc: 'Cero costo fijo — solo resultados' },
              ].map((item) => (
                <div key={item.title} className="card p-4">
                  <div className="text-xl mb-1.5">{item.icon}</div>
                  <div className="text-sm font-bold text-[var(--text-primary)] mb-0.5">{item.title}</div>
                  <div className="text-xs text-[var(--text-muted)]">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
