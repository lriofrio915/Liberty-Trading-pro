'use client'

import Link from 'next/link'

const ALL_FEATURES = [
  { icon: '🎓', text: 'Mentoría Integral de Mercados Financieros (desde cero)' },
  { icon: '📈', text: 'Especialización en Day Trading — Futuros NQ/MNQ Nasdaq' },
  { icon: '🤝', text: 'Mentorías 1:1 personalizadas con Luis cada mes' },
  { icon: '🤖', text: 'Vinces IA — coaching diario personalizado con IA' },
  { icon: '💡', text: 'Reportes de oportunidades en acciones y ETFs' },
  { icon: '🌐', text: 'Monitor Mundial — geopolítica y macro en tiempo real' },
  { icon: '📊', text: 'Track record verificable — operaciones reales de Luis' },
  { icon: '📄', text: 'Reportes de rendimiento semanales y mensuales' },
  { icon: '👥', text: 'Comunidad privada activa — acceso mientras seas miembro' },
]

export default function Pricing() {
  return (
    <section id="precios" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-14 text-center">
          <div className="label-mono mb-3">Club Liberty Trading</div>
          <h2 className="headline text-5xl sm:text-6xl text-[var(--text-primary)]">
            Una suscripción,<br />
            <span className="gradient-gold">acceso a todo</span>
          </h2>
          <p className="text-[var(--text-secondary)] mt-4 max-w-xl mx-auto">
            Aprende trading de cero a profesional con Luis Riofrio. Paga mientras quieras pertenecer al club —
            sin compromisos, sin contratos largos.
          </p>
        </div>

        {/* ── SUBSCRIPTION CARDS ───────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 max-w-3xl mx-auto">

          {/* Card 1 — Mensual */}
          <div className="card-panel relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none opacity-5"
              style={{ background: 'radial-gradient(circle, var(--gold) 0%, transparent 70%)' }} />

            <div className="label-mono mb-2">Mensual · Cancela cuando quieras</div>
            <h3 className="headline text-3xl text-[var(--text-primary)] mb-1">Club Mensual</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-5 leading-relaxed">
              Ideal si quieres probar el trading sin comprometer demasiado. Con un solo mes ya sabrás si esto es para ti —
              y si decides quedarte, sigue pagando mes a mes.
            </p>

            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-bold text-white" style={{ fontFamily: 'var(--font-serif)' }}>$79</span>
              <span className="label-mono text-sm">/mes</span>
            </div>

            <ul className="space-y-2 mb-8">
              {ALL_FEATURES.map((f) => (
                <li key={f.text} className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]">
                  <span className="flex-shrink-0 mt-0.5">{f.icon}</span>
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>

            <a
              href="https://pay.hotmart.com/R104900326X?checkoutMode=2"
              onClick={() => false}
              className="hotmart-fb hotmart__button-checkout btn-outline text-sm py-3.5 px-6 rounded-lg w-full text-center block">
              Empezar por $79/mes →
            </a>
            <p className="text-center label-mono text-[10px] mt-3">Sin permanencia · Cancela cuando quieras</p>
          </div>

          {/* Card 2 — Anual DESTACADO */}
          <div className="relative rounded-2xl overflow-hidden border border-[var(--gold)] glow-gold-sm"
            style={{ background: 'rgba(201,168,76,0.04)' }}>
            <div className="absolute top-3 right-3">
              <span className="btn-gold text-[10px] py-1 px-3 rounded-full tracking-widest">MEJOR VALOR</span>
            </div>
            <div className="p-7">
              <div className="label-mono mb-2 text-[var(--gold)]">Anual · Pago único al año</div>
              <h3 className="headline text-3xl text-[var(--text-primary)] mb-1">Club Anual</h3>
              <p className="text-xs text-[var(--text-secondary)] mb-5 leading-relaxed">
                Para quien ya decidió que el trading es su camino. Paga una vez al año y
                accede a todo sin interrupciones — te ahorras $299 vs el plan mensual.
              </p>

              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-5xl font-bold text-white" style={{ fontFamily: 'var(--font-serif)' }}>$649</span>
                <span className="label-mono text-sm">/año</span>
              </div>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-[var(--text-muted)] text-sm line-through">$948</span>
                <span className="text-[10px] font-mono text-green-400 border border-green-800 rounded-full px-2 py-0.5">
                  Ahorras $299
                </span>
                <span className="label-mono text-[10px]">≈ $54/mes</span>
              </div>

              <ul className="space-y-2 mb-8">
                {ALL_FEATURES.map((f) => (
                  <li key={f.text} className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]">
                    <span className="flex-shrink-0 mt-0.5">{f.icon}</span>
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>

              <a
                href="https://pay.hotmart.com/L104900408S?checkoutMode=2"
                onClick={() => false}
                className="hotmart-fb hotmart__button-checkout btn-gold text-sm py-3.5 px-6 rounded-lg w-full text-center block">
                Unirme al Club Anual →
              </a>
              <p className="text-center label-mono text-[10px] mt-3">Pago único por 12 meses completos</p>
            </div>
          </div>

        </div>

        {/* ── FAQ OBJECIONES ───────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16 max-w-4xl mx-auto">
          {[
            {
              q: '¿Y si no me gusta?',
              a: 'Con un mes ($79) ya tienes suficiente para saber si el trading es para ti. Nada que perder vs un curso de $1,000+ sin garantía.',
            },
            {
              q: '¿Sirve si soy completamente nuevo?',
              a: 'Sí, la formación empieza desde cero. La Mentoría Integral te lleva desde abrir tu primera cuenta hasta entender el mercado.',
            },
            {
              q: '¿Y si ya sé trading?',
              a: 'Las señales reales, el track record de Luis, el coaching con Vinces IA y las mentorías 1:1 te dan ventaja operativa inmediata.',
            },
          ].map((item) => (
            <div key={item.q} className="card p-5">
              <div className="text-sm font-bold text-[var(--text-primary)] mb-2">{item.q}</div>
              <div className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.a}</div>
            </div>
          ))}
        </div>

        {/* ── PORTFOLIO IBKR ─────────────────────────── */}
        <div className="rounded-2xl border border-[var(--gold-dark)] p-7 relative overflow-hidden"
          style={{ background: 'rgba(201,168,76,0.03)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none"
            style={{ background: 'radial-gradient(circle, var(--gold) 0%, transparent 70%)' }} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative">
            <div>
              <div className="label-mono mb-2 text-[var(--gold)]">Sin mensualidad — Solo para capital propio</div>
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
