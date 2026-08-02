import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm'
import PersonalContactForm from '@/components/PersonalContactForm/PersonalContactForm'
import VincesWidget from '@/components/VincesWidget/VincesWidget'

const HOTMART_MENSUAL = 'https://pay.hotmart.com/R104900326X?checkoutMode=2'

export default function MentoriaIntegralPage() {
  return (
    <main className="relative noise">
      <Navbar />

      {/* ─── HERO ───────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden grid-bg pt-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-24 w-full">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 border border-[var(--gold-dark)] rounded-full px-4 py-1.5 mb-8"
              style={{ background: 'rgba(201,168,76,0.06)' }}>
              <span className="w-2 h-2 rounded-full bg-[var(--green)] pulse-dot" />
              <span className="font-mono-custom text-[11px] text-[var(--gold)] tracking-wider uppercase">
                Mentoría Mensual · Trading Algorítmico · NinjaTrader 8
              </span>
            </div>

            <h1 className="headline text-6xl sm:text-7xl text-[var(--text-primary)] mb-6">
              De trader manual<br />
              <span className="gradient-gold">a trader algorítmico</span>
            </h1>

            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mb-10 leading-relaxed">
              Aprende el sistema de trading de Luis en NQ Futures, conviértelo en un algoritmo
              y <strong className="text-[var(--text-primary)]">recibe el código NinjaScript listo para operar</strong>.
              Sin contratos. Cancela cuando quieras.
            </p>

            {/* Stats rápidas */}
            <div className="flex flex-wrap gap-8 mb-12">
              {[
                { val: '$79', lbl: 'por mes' },
                { val: 'NinjaTrader 8', lbl: 'Plataforma' },
                { val: 'Código', lbl: 'NinjaScript entregado' },
                { val: 'Bot propio', lbl: 'Lo construyes tú' },
              ].map((s) => (
                <div key={s.lbl}>
                  <div className="text-2xl font-bold text-[var(--gold)]" style={{ fontFamily: 'var(--font-serif)' }}>
                    {s.val}
                  </div>
                  <div className="label-mono mt-0.5">{s.lbl}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a href={HOTMART_MENSUAL} target="_blank" rel="noopener noreferrer"
                className="btn-gold text-sm py-4 px-8 rounded-lg">
                Empezar ahora — $79/mes →
              </a>
              <a href="#contacto-vinces"
                className="btn-outline text-sm py-4 px-8 rounded-lg inline-flex items-center justify-center gap-2">
                <svg viewBox="0 0 36 36" fill="none" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                  <rect x="7" y="7" width="22" height="16" rx="4" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="13" cy="15" r="2.5" fill="currentColor"/>
                  <circle cx="23" cy="15" r="2.5" fill="currentColor"/>
                </svg>
                Hablar con Vinces primero
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── QUÉ INCLUYE EL PLAN ────────────────────────────────── */}
      <section className="py-16 px-4 border-y border-[var(--border)]"
        style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="label-mono mb-2">Plan Pro Mensual — $79/mes</div>
            <h2 className="headline text-4xl text-[var(--text-primary)]">
              Todo lo que incluye<br /><span className="gradient-gold">tu membresía</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '📊', title: 'Sistema de Trading Manual', desc: 'Aprende el método de Luis en NQ Futures: rompimiento, gestión de riesgo y consistencia.' },
              { icon: '💻', title: 'Estrategia → Algoritmo', desc: 'Conviertes tu estrategia manual en un bot con código NinjaScript entregado y funcional.' },
              { icon: '🤖', title: 'NinjaTrader 8 + Backtesting', desc: 'Strategy Analyzer para optimizar y validar tu bot con datos históricos reales.' },
              { icon: '🧠', title: 'Crea tus propios bots', desc: 'Aprende a programar estrategias algorítmicas propias en NinjaScript desde cero.' },
            ].map((f) => (
              <div key={f.title} className="card text-center py-7">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-sm mb-2">{f.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 rounded-xl border border-[var(--gold-dark)] text-center"
            style={{ background: 'rgba(201,168,76,0.04)' }}>
            <p className="text-sm text-[var(--text-secondary)]">
              ¿Quieres el máximo valor? El{' '}
              <a href="/maestria-futuros" className="text-[var(--gold)] hover:underline font-semibold">
                Plan Pro Anual ($649/año)
              </a>{' '}
              te da todo esto más ahorras $299 vs pagar mes a mes.
            </p>
          </div>
        </div>
      </section>

      {/* ─── PARA QUIÉN ES ──────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">

            <div>
              <div className="label-mono mb-3 text-[var(--gold)]">Este plan es para ti si…</div>
              <h2 className="headline text-4xl text-[var(--text-primary)] mb-8">
                Quieres automatizar<br />tu trading con<br />un bot propio
              </h2>
              <div className="space-y-3">
                {[
                  'Quieres operar NQ Futures con un sistema definido y replicable',
                  'Nunca has programado pero quieres entender cómo funciona un bot',
                  'Eres trader manual y quieres dar el salto a lo algorítmico',
                  'Buscas un mentor que te entregue el código, no solo teoría',
                  'Quieres construir tu propio bot y no depender de señales externas',
                  'Buscas flexibilidad: empezar, pausar o cancelar cuando quieras',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                    <span className="text-[var(--gold)] mt-0.5 flex-shrink-0 text-base">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="label-mono mb-3 text-[var(--red)]">No es para ti si…</div>
              <h2 className="headline text-4xl text-[var(--text-primary)] mb-8">
                Honestidad antes<br />que todo
              </h2>
              <div className="space-y-3">
                {[
                  'Buscas ingresos inmediatos o "resultados ya" — invertir toma tiempo',
                  'Tienes deudas graves y dependes del trading para solucionarlas',
                  'No estás dispuesto a comprometerte con el proceso de aprendizaje',
                  'Quieres fórmulas mágicas o señales sin entender qué estás haciendo',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                    <span className="text-[var(--red)] mt-0.5 flex-shrink-0 text-base">✗</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-xl border border-[var(--gold-dark)]"
                style={{ background: 'rgba(201,168,76,0.05)' }}>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic">
                  &ldquo;No vendo sueños. Si tu situación no es la adecuada para este programa,
                  te lo digo antes de que inviertas un peso.&rdquo; — Luis Riofrio
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── QUÉ APRENDERÁS ─────────────────────────────────────── */}
      <section className="py-24 px-4 border-y border-[var(--border)]"
        style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-14 text-center">
            <div className="label-mono mb-3">Contenido incluido</div>
            <h2 className="headline text-5xl text-[var(--text-primary)]">
              Lo que dominarás<br />con tu <span className="gradient-gold">membresía</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                n: '01',
                title: 'Trading manual en NQ Futures',
                desc: 'El sistema de Luis: lectura de precio, zonas clave, rompimientos y ejecución en NQ/MNQ con disciplina.',
              },
              {
                n: '02',
                title: 'Gestión de riesgo cuantitativa',
                desc: 'Stop loss, take profit, tamaño de posición y métricas de rendimiento: win rate, profit factor, drawdown.',
              },
              {
                n: '03',
                title: 'NinjaTrader 8 y Strategy Analyzer',
                desc: 'Domina la plataforma, configura tu entorno y usa el backtester para validar estrategias con datos reales.',
              },
              {
                n: '04',
                title: 'De estrategia manual a algoritmo',
                desc: 'Conviertes las reglas de tu sistema en lógica de programación: condiciones, entradas, salidas y filtros.',
              },
              {
                n: '05',
                title: 'NinjaScript — tu primer bot',
                desc: 'Escribes en NinjaScript el código de tu estrategia. Luis te entrega el bot funcional y lo revisamos juntos.',
              },
              {
                n: '06',
                title: 'Crea tus propios bots desde cero',
                desc: 'Aprende la lógica algorítmica para diseñar, programar y optimizar estrategias automatizadas por tu cuenta.',
              },
            ].map((m) => (
              <div key={m.n} className="card hover:border-[var(--gold-dark)] transition-all group">
                <div className="label-mono text-[10px] text-[var(--gold)] mb-2">{m.n}</div>
                <h3 className="font-bold text-sm mb-2 group-hover:text-[var(--gold)] transition-colors">{m.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SOBRE LUIS ─────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
            <div>
              <div className="label-mono mb-3">Tu mentor</div>
              <h2 className="headline text-5xl text-[var(--text-primary)] mb-5">
                Luis Riofrio —<br /><span className="gradient-gold">Trader Cuantitativo</span>
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                Trader cuantitativo especializado en NQ/MNQ Futures. Luis crea estrategias algorítmicas
                y bots en NinjaTrader 8 — no enseña desde la teoría, entrega el código funcional
                y te enseña a construir el tuyo propio.
              </p>
              <div className="space-y-2.5 mb-8">
                {[
                  '📊 Trader cuantitativo — NQ/MNQ Futures (CME)',
                  '🤖 Crea estrategias algorítmicas y bots en NinjaTrader 8',
                  '🔬 Strategy Analyzer para backtesting y optimización real',
                  '💻 Entrega código NinjaScript funcional a sus alumnos',
                  '🎓 Fundador de Liberty Trading Pro',
                ].map((c) => (
                  <div key={c} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '+11.94%', label: 'Rendimiento YTD 2026', color: 'var(--gold)' },
                { value: '71.4%', label: 'Win Rate verificado', color: 'var(--green)' },
                { value: '2.55x', label: 'Profit Factor', color: 'var(--gold)' },
                { value: '10/14', label: 'Trades ganados 2026', color: 'var(--green)' },
              ].map((s) => (
                <div key={s.label} className="card text-center py-6">
                  <div className="text-3xl font-bold mb-1"
                    style={{ fontFamily: 'var(--font-serif)', color: s.color }}>
                    {s.value}
                  </div>
                  <div className="label-mono text-[10px]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────── */}
      <section className="py-24 px-4 border-y border-[var(--border)]"
        style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="mb-14 text-center">
            <div className="label-mono mb-3">Preguntas frecuentes</div>
            <h2 className="headline text-4xl text-[var(--text-primary)]">Lo que más nos preguntan</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: '¿Cuánto cuesta la mentoría mensual?',
                a: '$79 al mes, sin contratos ni permanencia. Puedes cancelar en cualquier momento desde tu cuenta de Hotmart.',
              },
              {
                q: '¿Necesito saber programar para aprender a hacer bots?',
                a: 'No. Luis te lleva paso a paso desde la estrategia manual hasta el código. Aprenderás NinjaScript desde cero y recibirás el bot funcional entregado.',
              },
              {
                q: '¿Qué plataforma usamos?',
                a: 'NinjaTrader 8 con Strategy Analyzer. Es la plataforma de futuros preferida para trading algorítmico. Luis te guía en la configuración completa.',
              },
              {
                q: '¿Recibiré el código NinjaScript de la estrategia?',
                a: 'Sí. Una parte clave del programa es que Luis te entrega el código NinjaScript de la estrategia aprendida, listo para operar y optimizar.',
              },
              {
                q: '¿Cuánto tiempo necesito dedicarle por semana?',
                a: 'Con 3-5 horas semanales avanzas bien. Las sesiones con Luis se agendan según tu disponibilidad y el ritmo lo marcas tú.',
              },
              {
                q: '¿Hay algún compromiso de permanencia?',
                a: 'Ninguno. Es mes a mes. Si decides cancelar, pierdes el acceso al terminar el período ya pagado. Sin penalizaciones.',
              },
              {
                q: '¿Cuál es la diferencia con el Plan Anual?',
                a: 'El contenido es el mismo. El Plan Anual ($649/año) te sale a ~$54/mes y te ahorras $299 frente al pago mensual. Ideal si ya sabes que esto es para ti.',
              },
            ].map((faq) => (
              <div key={faq.q} className="card">
                <h3 className="font-bold text-sm mb-2 text-[var(--text-primary)]">{faq.q}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FORMULARIO VINCES ──────────────────────────────────── */}
      <section id="contacto-vinces" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="label-mono mb-3 text-[var(--gold)]">Sin compromiso</div>
              <h2 className="headline text-4xl text-[var(--text-primary)] mb-5">
                ¿Tienes dudas?<br />Vinces IA te orienta<br />
                <span className="gradient-gold">en segundos</span>
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                Deja tu nombre y número. Vinces IA te escribe por WhatsApp,
                entiende tu situación y te dice si el Plan Pro Mensual es para ti —
                sin presión y sin venderte nada que no necesites.
              </p>
              <div className="space-y-2">
                {[
                  '✓ Responde en segundos, cualquier hora',
                  '✓ Analiza tu perfil y te da una recomendación real',
                  '✓ Si no eres el perfil ideal, te lo dice con honestidad',
                ].map((item) => (
                  <p key={item} className="text-sm text-[var(--text-secondary)] font-mono">{item}</p>
                ))}
              </div>
            </div>
            <LeadCaptureForm
              plan="MENSUAL"
              title="Habla con Vinces IA ahora"
              subtitle="Deja tus datos y Vinces te contacta por WhatsApp en segundos."
            />
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ──────────────────────────────────────────── */}
      <section className="py-24 px-4 border-y border-[var(--border)]"
        style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="label-mono mb-4 text-[var(--gold)]">Plan Pro Mensual · Liberty Trading Pro</div>
          <h2 className="headline text-5xl sm:text-6xl text-[var(--text-primary)] mb-6">
            Empieza hoy<br />por solo<br />
            <span className="gradient-gold">$79/mes</span>
          </h2>
          <p className="text-[var(--text-secondary)] mb-10 max-w-lg mx-auto leading-relaxed">
            De la estrategia manual al bot algorítmico. Código NinjaScript entregado.
            Aprende a crear tus propios bots en NinjaTrader 8. Sin contratos, cancela cuando quieras.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <a href={HOTMART_MENSUAL} target="_blank" rel="noopener noreferrer"
              className="btn-gold text-sm py-4 px-10 rounded-xl">
              Suscribirme ahora — $79/mes →
            </a>
            <a href="#contacto-luis"
              className="btn-outline text-sm py-4 px-8 rounded-xl">
              Prefiero que Luis me contacte
            </a>
          </div>

          <p className="label-mono text-[10px] text-[var(--text-muted)]">
            Las inversiones implican riesgo. Resultados pasados no garantizan rendimientos futuros.
          </p>
        </div>
      </section>

      {/* ─── CONTACTO PERSONAL LUIS ─────────────────────────────── */}
      <section id="contacto-luis" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="label-mono mb-3 text-[var(--gold)]">Trato personal</div>
              <h2 className="headline text-4xl text-[var(--text-primary)] mb-5">
                ¿Prefieres hablar<br />directamente con Luis?
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                Si tienes preguntas específicas o quieres una orientación más personalizada,
                deja tus datos y <strong className="text-[var(--text-primary)]">Luis Riofrio te contactará
                directamente</strong> por WhatsApp o email. Sin automatizaciones, sin bots.
              </p>
              <div className="space-y-2">
                {[
                  '✓ Luis revisa tu caso personalmente',
                  '✓ Te orienta sobre qué plan se adapta mejor a ti',
                  '✓ Respuesta en menos de 24 horas',
                ].map((item) => (
                  <p key={item} className="text-sm text-[var(--text-secondary)] font-mono">{item}</p>
                ))}
              </div>
            </div>
            <PersonalContactForm
              plan="MENSUAL"
              title="Quiero que Luis me contacte"
              subtitle="Deja tus datos y Luis Riofrio se pondrá en contacto contigo personalmente."
            />
          </div>
        </div>
      </section>

      <Footer />

      {/* ─── VINCES WIDGET FLOTANTE ─────────────────────────────── */}
      <VincesWidget mode="landing" />
    </main>
  )
}
