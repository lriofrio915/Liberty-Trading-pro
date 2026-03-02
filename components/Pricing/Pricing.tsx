'use client'

import Link from 'next/link'

const PRO_FEATURES = [
  'Vinces IA — coaching personalizado diario',
  'Revisión 1:1 con Luis cada 15 días (2 veces al mes)',
  'Acceso completo a tu historial operativo',
  'Reportes PDF semanales y mensuales',
  'Oportunidades de inversión en acciones',
  'Monitor Mundial — geopolítica en tiempo real',
  'Acceso de por vida a la comunidad',
]

export default function Pricing() {
  return (
    <section id="precios" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">

        {/* ── SECCIÓN 1: PROGRAMAS DE FORMACIÓN ──────── */}
        <div className="mb-20">
          <div className="mb-12">
            <div className="label-mono mb-3">Programas de Formación</div>
            <h2 className="headline text-5xl sm:text-6xl text-[var(--text-primary)]">
              Formación <span className="gradient-gold">con Luis</span>
            </h2>
            <p className="text-[var(--text-secondary)] mt-4 max-w-lg">
              Comienza con uno de los programas de formación. Pago único, acceso completo.
              Disponibles en Hotmart.
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
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                Para inversores que quieren aprender acciones, ETFs y cripto desde cero
                con acompañamiento directo de Luis.
              </p>
              <ul className="space-y-1.5 mb-6 text-sm text-[var(--text-secondary)]">
                {[
                  'Clases 1:1 personalizadas con Luis',
                  'Acciones, ETFs y criptoactivos',
                  'Análisis fundamental y técnico',
                  '2 meses de acceso + revisiones',
                  'Apertura de cuenta IBKR paso a paso',
                  'Acceso al mercado americano desde Latam',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-[var(--gold)] text-xs">✓</span>{f}
                  </li>
                ))}
              </ul>
              <div className="flex items-end justify-between mb-5">
                <div>
                  <div className="label-mono mb-1">Inversión</div>
                  <div className="text-4xl font-bold text-white"
                    style={{ fontFamily: 'var(--font-serif)' }}>
                    $489 <span className="text-base font-normal text-[var(--text-muted)]">USD</span>
                  </div>
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
                  Especialización en<br />Trading Intradía NQ/MNQ
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                  Para traders que quieren profesionalizarse en futuros de Nasdaq (NQ/MNQ)
                  con operativa institucional real. El camino completo.
                </p>
                <ul className="space-y-1.5 mb-6 text-sm text-[var(--text-secondary)]">
                  {[
                    'Futuros NQ/MNQ — CME',
                    'Price Action + gestión de riesgo',
                    'Vinces IA incluido',
                    'Coaching diario con Luis',
                    '12 meses de acceso completo',
                    'Comunidad y seguimiento continuo',
                  ].map(f => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="text-[var(--gold)] text-xs">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-end justify-between mb-5">
                  <div>
                    <div className="label-mono mb-1">Inversión</div>
                    <div className="text-4xl font-bold text-white"
                      style={{ fontFamily: 'var(--font-serif)' }}>
                      $1,049 <span className="text-base font-normal text-[var(--text-muted)]">USD</span>
                    </div>
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
        <div className="flex items-center gap-4 mb-14">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <div className="text-center px-6">
            <div className="label-mono mb-2 text-[var(--gold)]">Plan de Continuidad</div>
            <p className="text-sm text-[var(--text-secondary)] max-w-sm">
              ¿Ya completaste tu programa? Continúa con acceso
              mensual a todas las herramientas y coaching continuo.
            </p>
          </div>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        {/* ── SECCIÓN 2: PLAN DE CONTINUIDAD ─────────── */}
        <div className="mb-16 flex justify-center">
          <div className="w-full max-w-md relative rounded-2xl overflow-hidden border border-[var(--gold)] glow-gold-sm"
            style={{ background: 'rgba(201,168,76,0.04)' }}>
            <div className="absolute top-4 right-4">
              <span className="btn-gold text-[10px] py-1 px-3 rounded-full tracking-widest">
                MÁS POPULAR
              </span>
            </div>
            <div className="p-8">
              <div className="label-mono mb-2 text-[var(--gold)]">PRO + VINCES</div>
              <div className="headline text-2xl text-[var(--text-primary)] mb-1">
                Para alumnos que completaron un programa
              </div>
              <div className="flex items-baseline gap-1 mt-4 mb-6">
                <span className="text-5xl font-bold text-white"
                  style={{ fontFamily: 'var(--font-serif)' }}>$49</span>
                <span className="label-mono text-sm">/mes</span>
              </div>
              <ul className="space-y-3 mb-8">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className="text-[var(--gold)] mt-0.5 text-sm flex-shrink-0">✓</span>
                    <span className="text-sm text-[var(--text-secondary)]">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register?plan=pro"
                className="btn-gold text-sm py-3.5 px-6 rounded-lg w-full text-center block">
                Activar Plan PRO →
              </Link>
            </div>
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
