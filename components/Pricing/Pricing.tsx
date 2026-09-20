'use client'

import { BRAND, wa } from '@/lib/brand'

const QUANT_FEATURES = [
  'Metodología completa: de la idea al bot validado con WFO y Montecarlo',
  'Código de las 6 estrategias del portafolio cuantitativo real',
  'Pase directo a cuenta fondeada de $200k (PJ Capital)',
  'Trading algorítmico con NinjaTrader 8 y Claude',
  'Curso gratuito de acciones y opciones vía IBKR incluido',
  'Comunidad de Liberty Quant — el portafolio sigue creciendo con cada alumno',
]

const PORTFOLIO_POINTS = [
  { title: 'Tu cuenta, tu dinero', desc: 'El capital nunca sale de tu cuenta IBKR' },
  { title: `${BRAND.price.successFee} de éxito`, desc: 'Gano cuando tú ganas, no antes' },
  { title: 'Sin mensualidad', desc: `Empieza con lo que tengas — ${BRAND.price.portfolioReference} es el punto ideal` },
]

export default function Pricing() {
  return (
    <section id="precios" className="py-20 px-4">
      <div className="max-w-5xl mx-auto">

        <div className="mb-10 text-center">
          <div className="label-mono mb-3">Especialización</div>
          <h2 className="headline text-4xl sm:text-5xl text-[var(--text-primary)]">
            Un solo pago, <span className="gradient-gold">acceso de por vida</span>
          </h2>
        </div>

        {/* Liberty Quant */}
        <div className="relative rounded-2xl overflow-hidden border border-[var(--gold)] glow-gold-sm max-w-2xl mx-auto mb-14"
          style={{ background: 'rgba(201,168,76,0.04)' }}>
          <div className="p-7">
            <div className="flex items-start justify-between mb-5 gap-3">
              <div>
                <div className="label-mono text-[var(--gold)] mb-1">{BRAND.products.quant}</div>
                <h3 className="headline text-3xl text-[var(--text-primary)]">Trading cuantitativo de futuros</h3>
              </div>
              <div className="flex items-baseline gap-1 flex-shrink-0">
                <span className="text-5xl font-bold text-white" style={{ fontFamily: 'var(--font-serif)' }}>
                  {BRAND.price.quantLabel}
                </span>
                <span className="label-mono text-sm">pago único</span>
              </div>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-7">
              {QUANT_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <span className="text-[var(--gold)] mt-0.5 flex-shrink-0">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <a href={BRAND.hotmart.quant || wa('Hola Luis, quiero información sobre Liberty Quant')}
              {...(BRAND.hotmart.quant
                ? { className: 'hotmart-fb hotmart__button-checkout btn-gold text-sm py-3.5 px-6 rounded-lg w-full text-center block' }
                : { target: '_blank', rel: 'noopener noreferrer', className: 'btn-gold text-sm py-3.5 px-6 rounded-lg w-full text-center block' })}>
              {BRAND.hotmart.quant ? `Quiero Liberty Quant — ${BRAND.price.quantLabel} →` : 'Consultar Liberty Quant →'}
            </a>
            <p className="text-center label-mono text-[10px] mt-3">Sin mensualidad · Acceso de por vida a la comunidad y el portafolio</p>
          </div>
        </div>

        {/* Portfolio IBKR */}
        <div className="rounded-2xl border border-[var(--gold-dark)] p-7 relative overflow-hidden"
          style={{ background: 'rgba(201,168,76,0.03)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none"
            style={{ background: 'radial-gradient(circle, var(--gold) 0%, transparent 70%)' }} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative">
            <div>
              <div className="label-mono mb-2 text-[var(--gold)]">{BRAND.products.portfolio}</div>
              <div className="headline text-3xl text-[var(--text-primary)] mb-3">
                Acciones de EEUU <span className="gradient-gold">vía Interactive Brokers</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                Te asesoro en la compra de acciones y opciones dentro de tu propia cuenta IBKR.
                Mis honorarios salen de tus ganancias: si no las hay, no hay comisión.
              </p>
              <a href={wa('Hola Luis, me interesa la asesoría de acciones en EEUU vía IBKR')}
                target="_blank" rel="noopener noreferrer"
                className="btn-gold text-sm py-3 px-7 rounded-lg inline-block">
                Consultar disponibilidad →
              </a>
            </div>
            <div className="space-y-3">
              {PORTFOLIO_POINTS.map((item) => (
                <div key={item.title} className="card p-4">
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
