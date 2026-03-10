import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm'

const HOTMART = 'https://go.hotmart.com/R104429889B'
const VINCES_WA = 'https://wa.me/18287149177?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20la%20Mentor%C3%ADa%20Integral%20de%20Inversi%C3%B3n'

const WA_ICON = (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/>
  </svg>
)

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
                2 Meses · Clases 1 a 1 · Online
              </span>
            </div>

            <h1 className="headline text-6xl sm:text-7xl text-[var(--text-primary)] mb-6">
              Aprende a invertir<br />
              <span className="gradient-gold">sin dejar tu trabajo</span>
            </h1>

            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mb-10 leading-relaxed">
              Mentoría Integral de Inversión — el programa de 2 meses donde Luis Riofrio
              te enseña a construir tu primer portafolio diversificado en acciones, ETFs
              y cripto, con ritmo adaptado a tu agenda.
            </p>

            {/* Stats rápidas */}
            <div className="flex flex-wrap gap-8 mb-12">
              {[
                { val: '2 meses', lbl: 'Duración' },
                { val: '1 a 1', lbl: 'Clases personalizadas' },
                { val: '$489', lbl: 'Inversión única' },
                { val: 'Vitalicio', lbl: 'Acceso comunidad' },
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
              <a href={HOTMART} target="_blank" rel="noopener noreferrer"
                className="btn-gold text-sm py-4 px-8 rounded-lg">
                Quiero inscribirme — $489 →
              </a>
              <a href={VINCES_WA} target="_blank" rel="noopener noreferrer"
                className="btn-outline text-sm py-4 px-8 rounded-lg inline-flex items-center justify-center gap-2">
                {WA_ICON}
                Tengo dudas, quiero hablar
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PARA QUIÉN ES ──────────────────────────────────────── */}
      <section className="py-24 px-4 border-y border-[var(--border)]"
        style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">

            <div>
              <div className="label-mono mb-3 text-[var(--gold)]">Este programa es para ti si…</div>
              <h2 className="headline text-4xl text-[var(--text-primary)] mb-8">
                Tienes ingresos estables<br />y quieres hacer crecer<br />tu capital
              </h2>
              <div className="space-y-3">
                {[
                  'Tienes trabajo o negocio y no quieres dejarlo para invertir',
                  'Nunca has invertido o tienes conocimientos básicos',
                  'Quieres diversificar tus ahorros con método y seguridad',
                  'Tienes poco tiempo libre pero te comprometes a aprender',
                  'Buscas un mentor real que te guíe paso a paso, no un curso grabado',
                  'Quieres entender cómo funcionan los mercados financieros de verdad',
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
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-14 text-center">
            <div className="label-mono mb-3">Contenido del programa</div>
            <h2 className="headline text-5xl text-[var(--text-primary)]">
              Lo que dominarás<br />en <span className="gradient-gold">2 meses</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                n: '01',
                title: 'Bases del mercado financiero',
                desc: 'Cómo funcionan las bolsas, brokers, tipos de activos y cómo leer los mercados sin perderte.',
              },
              {
                n: '02',
                title: 'Apertura de cuenta IBKR',
                desc: 'Paso a paso para abrir tu cuenta en Interactive Brokers desde Ecuador o Latinoamérica.',
              },
              {
                n: '03',
                title: 'Acciones y ETFs',
                desc: 'Cómo seleccionar empresas sólidas y ETFs diversificados para construir tu portafolio.',
              },
              {
                n: '04',
                title: 'Estrategia Dollar Cost Average',
                desc: 'El método que usan los grandes inversores para acumular capital con bajo riesgo en el tiempo.',
              },
              {
                n: '05',
                title: 'Cripto: exchanges y custodia',
                desc: 'Cómo operar en exchanges, custodiar tus activos digitales y convertir USD/cripto.',
              },
              {
                n: '06',
                title: 'Gestión de capital y portafolio',
                desc: 'Cómo distribuir tu capital entre activos, diversificar y gestionar el riesgo de tu portafolio.',
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

      {/* ─── FORMATO ────────────────────────────────────────────── */}
      <section className="py-24 px-4 border-y border-[var(--border)]"
        style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-14 text-center">
            <div className="label-mono mb-3">Cómo funciona</div>
            <h2 className="headline text-5xl text-[var(--text-primary)]">
              Formato del <span className="gradient-gold">programa</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '🎯', title: 'Clases 1 a 1', desc: 'Cada sesión es contigo y Luis. Sin grupos. El ritmo lo pones tú.' },
              { icon: '💬', title: 'Soporte WhatsApp', desc: 'Acceso directo a Luis durante todo el programa para dudas y seguimiento.' },
              { icon: '📹', title: 'Clases en vivo', desc: 'Sesiones online con pantalla compartida, material y ejercicios prácticos.' },
              { icon: '🌐', title: 'Comunidad vitalicia', desc: 'Acceso de por vida a la comunidad privada con análisis y oportunidades.' },
            ].map((f) => (
              <div key={f.title} className="card text-center py-8">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-sm mb-2">{f.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
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
                Luis Riofrio —<br /><span className="gradient-gold">Operador Financiero</span>
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                Trader de Futuros Nasdaq (NQ/MNQ) con resultados verificables y transparentes.
                Luis no enseña desde la teoría — enseña desde la operativa diaria real,
                con capturas, datos y track record públicos.
              </p>
              <div className="space-y-2.5 mb-8">
                {[
                  '🏛 Operador Financiero en Emporium Quality Funds',
                  '📈 Trader de Futuros Nasdaq (NQ/MNQ) — intradia',
                  '🏦 Gestión de portafolios vía IBKR + NinjaTrader 8',
                  '🎓 Fundador de Liberty Trading Pro',
                  '💱 Operador P2P USDT/BTC — Ecuador y Latinoamérica',
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
                q: '¿Necesito experiencia previa?',
                a: 'No. El programa está diseñado desde cero. Luis adapta el contenido y el ritmo según tu nivel de conocimiento.',
              },
              {
                q: '¿Cuánto tiempo necesito dedicarle por semana?',
                a: 'Con 2-4 horas semanales es suficiente para avanzar bien. Las clases 1 a 1 se agendan según tu disponibilidad.',
              },
              {
                q: '¿Cuánto capital necesito para empezar a invertir?',
                a: 'Puedes empezar con cualquier monto. Interactive Brokers no tiene mínimo. Lo importante es aprender el método antes de invertir capital importante.',
              },
              {
                q: '¿Esto funciona desde cualquier país?',
                a: 'Sí. Las clases son online y el programa funciona para cualquier país de Latinoamérica. IBKR acepta clientes de la región.',
              },
              {
                q: '¿Qué pasa si tengo dudas fuera de las clases?',
                a: 'Tienes acceso a Luis por WhatsApp durante todo el programa. No estás solo entre sesión y sesión.',
              },
              {
                q: '¿Hay garantía?',
                a: 'La garantía es la transparencia de Luis: sus resultados son públicos. Si después de hablar con él no te convence, no te inscribas.',
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

      {/* ─── FORMULARIO CAPTACIÓN ───────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="label-mono mb-3 text-[var(--gold)]">Sin compromiso</div>
              <h2 className="headline text-4xl text-[var(--text-primary)] mb-5">
                ¿Tienes dudas?<br />Vinces IA te orienta<br />
                <span className="gradient-gold">gratis por WhatsApp</span>
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                Deja tu nombre y número. Vinces IA te escribe en segundos,
                entiende tu situación y te dice si este programa es para ti —
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
              programa="INTEGRAL"
              title="Habla con Vinces IA ahora"
              subtitle="Deja tus datos y te contactamos por WhatsApp en segundos."
            />
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ──────────────────────────────────────────── */}
      <section className="py-32 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="label-mono mb-4 text-[var(--gold)]">Mentoría Integral de Inversión</div>
          <h2 className="headline text-5xl sm:text-6xl text-[var(--text-primary)] mb-6">
            El mejor momento<br />para empezar<br />
            <span className="gradient-gold">es ahora</span>
          </h2>
          <p className="text-[var(--text-secondary)] mb-10 max-w-lg mx-auto leading-relaxed">
            2 meses. Clases 1 a 1 con Luis. Tu portafolio construido con método real.
            Invierte en tu educación financiera — $489 únicos.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <a href={HOTMART} target="_blank" rel="noopener noreferrer"
              className="btn-gold text-sm py-4 px-10 rounded-xl">
              Inscribirme ahora — $489 →
            </a>
            <a href={VINCES_WA} target="_blank" rel="noopener noreferrer"
              className="btn-outline text-sm py-4 px-8 rounded-xl inline-flex items-center justify-center gap-2">
              {WA_ICON}
              Hablar con Vinces IA
            </a>
          </div>

          <p className="label-mono text-[10px] text-[var(--text-muted)]">
            Las inversiones implican riesgo. Resultados pasados no garantizan rendimientos futuros.
          </p>
        </div>
      </section>

      <Footer />

      {/* ─── BOTÓN FLOTANTE VINCES ──────────────────────────────── */}
      <a href={VINCES_WA} target="_blank" rel="noopener noreferrer"
        title="Hablar con Vinces IA" className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 group">
        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
          Hablar con Vinces IA
        </span>
        <div className="relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center"
          style={{ background: '#25D366' }}>
          <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: '#25D366' }} />
          <svg className="w-7 h-7 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/>
          </svg>
        </div>
      </a>
    </main>
  )
}
