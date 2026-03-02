'use client'

import Link from 'next/link'

const subscriptions = [
  {
    name: 'CLUB',
    label: 'Club de Inversión',
    price: '$19',
    period: '/mes',
    badge: 'Más Popular',
    highlighted: true,
    features: [
      'Oportunidades en Acciones y ETFs',
      'Informes fundamentales de empresas',
      'Sesgo diario NQ y ES',
      'Análisis a mediano y largo plazo',
      'Comunidad Liberty Trading Club',
      'Monitor Mundial — geopolítica',
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

        {/* ── FORMACIÓN ──────────────────────────────── */}
        <div className="mb-20">
          <div className="mb-12">
            <div className="label-mono mb-3">Paso 1</div>
            <h2 className="headline text-5xl sm:text-6xl text-[var(--text-primary)]">
              Formación <span className="gradient-gold">con Luis</span>
            </h2>
            <p className="text-[var(--text-secondary)] mt-4 max-w-lg">
              Comienza con uno de los programas de formación. Pago único, acceso completo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Card 1 — Mentoría */}
            <div className="card-panel relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none opacity-5"
                style={{ background: 'radial-gradient(circle, var(--gold) 0%, transparent 70%)' }} />
              <div className="label-mono mb-2">2 meses · Pago único</div>
              <h3 className="headline text-3xl text-[var(--text-primary)] mb-3">
                Mentoría Integral de<br />Mercados Financieros
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-2">
                Para inversores que quieren aprender acciones, ETFs y cripto desde cero
                con acompañamiento directo de Luis.
              </p>
              <ul className="space-y-1.5 mb-6 text-sm text-[var(--text-secondary)]">
                {['Acciones, ETFs y criptoactivos', 'Análisis fundamental y técnico', '2 meses de acceso + revisiones'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-[var(--gold)] text-xs">✓</span>{f}
                  </li>
                ))}
              </ul>
              <div className="flex items-end justify-between mb-5">
                <div>
                  <div className="label-mono mb-1">Inversión</div>
                  <div className="text-4xl font-bold text-white"
                    style={{ fontFamily: 'var(--font-serif)' }}>$489 <span className="text-base font-normal text-[var(--text-muted)]">USD</span></div>
                </div>
              </div>
              <a href="https://go.hotmart.com/R104429889B" target="_blank" rel="noopener noreferrer"
                className="btn-outline text-sm py-3 px-6 rounded-lg w-full text-center block">
                Ver en Hotmart →
              </a>
            </div>

            {/* Card 2 — Especialización DESTACADO */}
            <div className="relative rounded-2xl overflow-hidden border border-[var(--gold)] glow-gold-sm"
              style={{ background: 'rgba(201,168,76,0.04)' }}>
              <div className="absolute top-3 right-3">
                <span className="btn-gold text-[10px] py-1 px-3 rounded-full tracking-widest">DESTACADO</span>
              </div>
              <div className="p-7">
                <div className="label-mono mb-2 text-[var(--gold)]">12 meses · Acceso anual</div>
                <h3 className="headline text-3xl text-[var(--text-primary)] mb-3">
                  Especialización en<br />Trading de Futuros
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-2">
                  Para traders que quieren profesionalizarse en Nasdaq y SP500 con operativa
                  institucional real. El camino completo.
                </p>
                <ul className="space-y-1.5 mb-6 text-sm text-[var(--text-secondary)]">
                  {['Futuros NQ y ES — CME', 'Smart Money Concepts + gestión de riesgo', '12 meses de acceso completo', 'Comunidad y seguimiento continuo'].map(f => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="text-[var(--gold)] text-xs">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-end justify-between mb-5">
                  <div>
                    <div className="label-mono mb-1">Inversión</div>
                    <div className="text-4xl font-bold text-white"
                      style={{ fontFamily: 'var(--font-serif)' }}>€840 <span className="text-base font-normal text-[var(--text-muted)]">EUR</span></div>
                  </div>
                </div>
                <a href="https://go.hotmart.com/R33067457O" target="_blank" rel="noopener noreferrer"
                  className="btn-gold text-sm py-3 px-6 rounded-lg w-full text-center block">
                  Ver Especialización en Hotmart →
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* ── DIVIDER + BRIDGE TEXT ───────────────────── */}
        <div className="flex items-center gap-4 mb-12">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <div className="text-center px-4">
            <div className="label-mono mb-1">Paso 2</div>
            <p className="text-sm text-[var(--text-secondary)] max-w-xs">
              ¿Ya eres alumno? Continúa tu formación con acceso
              mensual a herramientas exclusivas.
            </p>
          </div>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        {/* ── SUSCRIPCIÓN MENSUAL ─────────────────────── */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="label-mono">Suscripción mensual</div>
            <div className="px-3 py-1 rounded-full border border-[var(--gold-dark)] text-[10px] font-mono-custom text-[var(--gold)]"
              style={{ background: 'rgba(201,168,76,0.06)' }}>
              Para alumnos activos y egresados
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {subscriptions.map((plan) => (
              <div key={plan.name}
                className={`relative rounded-2xl p-7 flex flex-col ${
                  plan.highlighted
                    ? 'border border-[var(--gold)] glow-gold-sm'
                    : 'border border-[var(--border)]'
                }`}
                style={{ background: plan.highlighted ? 'rgba(201,168,76,0.04)' : 'var(--bg-card)' }}>
                {plan.badge && (
                  <div className="absolute -top-3 left-6">
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
                    <span className="label-mono text-sm">{plan.period}</span>
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
        </div>

        {/* ── PORTFOLIO IBKR ─────────────────────────── */}
        <div className="rounded-2xl border border-[var(--gold-dark)] p-7 relative overflow-hidden"
          style={{ background: 'rgba(201,168,76,0.03)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none"
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
                Solo pagas cuando ganas. Capital mínimo recomendado:{' '}
                <strong className="text-white">$10,000 USD</strong>
              </p>
              <a href="https://wa.me/+593996691586?text=Hola%20Luis%2C%20me%20interesa%20la%20gesti%C3%B3n%20de%20portafolio%20IBKR"
                target="_blank" rel="noopener noreferrer"
                className="btn-gold text-sm py-3 px-7 rounded-lg inline-block">
                Consultar disponibilidad →
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: '🏦', title: 'Apertura guiada', desc: 'Luis te acompaña en la apertura de cuenta IBKR' },
                { icon: '🔗', title: 'NinjaTrader 8', desc: 'Tu cuenta conectada en tiempo real' },
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
