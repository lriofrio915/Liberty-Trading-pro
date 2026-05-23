'use client'

export default function Pricing() {
  return (
    <section id="precios" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-14 text-center">
          <div className="label-mono mb-3">Planes · Liberty Trading Pro</div>
          <h2 className="headline text-5xl sm:text-6xl text-[var(--text-primary)]">
            Empieza gratis,<br />
            <span className="gradient-gold">sube cuando estés listo</span>
          </h2>
          <p className="text-[var(--text-secondary)] mt-4 max-w-xl mx-auto">
            Dos planes simples. Sin contratos, sin sorpresas.
            El plan PRO desbloquea todo — cancela cuando quieras.
          </p>
        </div>

        {/* ── PLANES ───────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 max-w-3xl mx-auto">

          {/* Plan FREE */}
          <div className="card-panel relative overflow-hidden">
            <div className="label-mono mb-2">Gratis · Siempre</div>
            <h3 className="headline text-3xl text-[var(--text-primary)] mb-1">Plan Free</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-5 leading-relaxed">
              Crea tu perfil, compite en el Championship y explora la plataforma sin pagar nada.
            </p>

            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-bold text-white" style={{ fontFamily: 'var(--font-serif)' }}>$0</span>
              <span className="label-mono text-sm">/siempre</span>
            </div>

            <ul className="space-y-2 mb-8">
              {[
                { icon: '👤', text: 'Perfil del trader — configura tu cuenta' },
                { icon: '🏆', text: 'Championship — torneo de trading entre usuarios' },
                { icon: '🔍', text: 'Vista del catálogo de planes y herramientas' },
              ].map((f) => (
                <li key={f.text} className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]">
                  <span className="flex-shrink-0 mt-0.5">{f.icon}</span>
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>

            <a href="/login"
              className="btn-outline text-sm py-3.5 px-6 rounded-lg w-full text-center block">
              Crear cuenta gratis →
            </a>
            <p className="text-center label-mono text-[10px] mt-3">Sin tarjeta · Sin compromiso</p>
          </div>

          {/* Plan PRO DESTACADO */}
          <div className="relative rounded-2xl overflow-hidden border border-[var(--gold)] glow-gold-sm"
            style={{ background: 'rgba(201,168,76,0.04)' }}>
            <div className="p-7">
              <div className="flex items-center justify-between mb-2">
                <div className="label-mono text-[var(--gold)]">Mensual · Cancela cuando quieras</div>
                <span className="btn-gold text-[10px] py-1 px-3 rounded-full tracking-widest flex-shrink-0 ml-2">TODO INCLUIDO</span>
              </div>
              <h3 className="headline text-3xl text-[var(--text-primary)] mb-1">Plan Pro</h3>
              <p className="text-xs text-[var(--text-secondary)] mb-5 leading-relaxed">
                Acceso completo a todas las herramientas, formación, señales y comunidad.
                Sin contratos — paga mientras perteneces.
              </p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-bold text-white" style={{ fontFamily: 'var(--font-serif)' }}>$29</span>
                <span className="label-mono text-sm">/mes</span>
              </div>

              <ul className="space-y-2 mb-8">
                {[
                  { icon: '🎓', text: 'Academia completa — 17+ lecciones desde cero' },
                  { icon: '📈', text: 'Day Trading NQ/MNQ — señales y sesgo intradía' },
                  { icon: '🤝', text: 'Mentorías 1:1 personalizadas con Luis cada mes' },
                  { icon: '🤖', text: 'Vinces IA — coaching diario personalizado 24/7' },
                  { icon: '💡', text: 'Oportunidades en acciones, ETFs y opciones' },
                  { icon: '🌐', text: 'Monitor Mundial — geopolítica y macro en tiempo real' },
                  { icon: '📊', text: 'Track record verificable — operaciones reales de Luis' },
                  { icon: '📄', text: 'Reportes de rendimiento semanales y mensuales' },
                  { icon: '👥', text: 'Comunidad privada activa de traders' },
                  { icon: '🎬', text: 'Video de la semana — entradas en vivo' },
                  { icon: '🤖', text: 'Agentes IA (Peter Lynch y más)' },
                  { icon: '🏦', text: 'Brokers integrados — MT5 + IBKR' },
                ].map((f) => (
                  <li key={f.text} className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]">
                    <span className="flex-shrink-0 mt-0.5">{f.icon}</span>
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>

              <a
                href="https://pay.hotmart.com/R104900326X?checkoutMode=2"
                onClick={() => false}
                className="hotmart-fb hotmart__button-checkout btn-gold text-sm py-3.5 px-6 rounded-lg w-full text-center block">
                Activar Plan Pro — $29/mes →
              </a>
              <p className="text-center label-mono text-[10px] mt-3">Sin permanencia · Cancela cuando quieras</p>
            </div>
          </div>

        </div>

        {/* ── FAQ OBJECIONES ───────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16 max-w-4xl mx-auto">
          {[
            {
              q: '¿Y si no me gusta?',
              a: 'Con $29 ya tienes acceso completo durante un mes. Cancelas cuando quieras desde tu cuenta de Hotmart — sin penalizaciones.',
            },
            {
              q: '¿Sirve si soy completamente nuevo?',
              a: 'Sí, la formación empieza desde cero. La Academia te lleva desde abrir tu primera cuenta hasta entender el mercado y operar con disciplina.',
            },
            {
              q: '¿Y si ya sé trading?',
              a: 'El track record real de Luis, los reportes de oportunidades, el coaching con Vinces IA y las mentorías 1:1 te dan ventaja operativa inmediata.',
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
