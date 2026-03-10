import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm'

const HOTMART = 'https://go.hotmart.com/R33067457O'
const VINCES_WA = 'https://wa.me/18287149177?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20la%20Maestr%C3%ADa%20en%20Futuros%20NQ%2FMNQ'

const WA_ICON = (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/>
  </svg>
)

export default function MaestriaFuturosPage() {
  return (
    <main className="relative noise">
      <Navbar />

      {/* ─── HERO ───────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden grid-bg pt-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/3 right-1/4 w-[700px] h-[700px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-24 w-full">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 border border-[var(--gold-dark)] rounded-full px-4 py-1.5 mb-8"
              style={{ background: 'rgba(201,168,76,0.06)' }}>
              <span className="w-2 h-2 rounded-full bg-[var(--green)] pulse-dot" />
              <span className="font-mono-custom text-[11px] text-[var(--gold)] tracking-wider uppercase">
                12 Meses · Futuros NQ/MNQ · NinjaTrader 8
              </span>
            </div>

            <h1 className="headline text-6xl sm:text-7xl text-[var(--text-primary)] mb-6">
              Conviértete en<br />
              <span className="gradient-gold">trader profesional</span>
            </h1>

            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mb-10 leading-relaxed">
              Maestría en Trading Intradía de Futuros NQ/MNQ — el programa de 12 meses donde
              Luis Riofrio te entrena con su sistema real para operar el Nasdaq con disciplina,
              método y datos verificables.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mb-12">
              {[
                { val: '12 meses', lbl: 'Programa completo' },
                { val: '1 a 1', lbl: 'Con Luis' },
                { val: '$1,049', lbl: 'Inversión única' },
                { val: 'NQ/MNQ', lbl: 'Instrumento CME' },
              ].map((s) => (
                <div key={s.lbl}>
                  <div className="text-2xl font-bold text-[var(--gold)]" style={{ fontFamily: 'var(--font-serif)' }}>
                    {s.val}
                  </div>
                  <div className="label-mono mt-0.5">{s.lbl}</div>
                </div>
              ))}
            </div>

            {/* Track record mini */}
            <div className="flex flex-wrap gap-5 mb-10 p-4 rounded-xl border border-[var(--border)]"
              style={{ background: 'rgba(201,168,76,0.04)' }}>
              <div className="label-mono text-[10px] w-full mb-1 text-[var(--gold)]">Track Record de Luis — YTD 2026</div>
              {[
                { val: '+11.94%', lbl: 'Rendimiento' },
                { val: '71.4%', lbl: 'Win Rate' },
                { val: '2.55x', lbl: 'Profit Factor' },
              ].map((s) => (
                <div key={s.lbl} className="text-center">
                  <div className="text-xl font-bold text-[var(--gold)]" style={{ fontFamily: 'var(--font-serif)' }}>{s.val}</div>
                  <div className="label-mono text-[9px]">{s.lbl}</div>
                </div>
              ))}
              <div className="label-mono text-[9px] text-[var(--text-muted)] self-end ml-auto">Datos reales verificados</div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a href={HOTMART} target="_blank" rel="noopener noreferrer"
                className="btn-gold text-sm py-4 px-8 rounded-lg">
                Quiero inscribirme — $1,049 →
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
                Quieres vivir del<br />trading como profesión
              </h2>
              <div className="space-y-3">
                {[
                  'Quieres hacer del trading tu medio de vida o cambiar de carrera',
                  'Tienes tiempo para practicar y operar (al menos en la apertura del mercado)',
                  'Estás dispuesto a construir un track record profesional verificable',
                  'Buscas disciplina, método y sistema — no señales ni atajos',
                  'Quieres ser considerado como operador en fondos o empresas de prop trading',
                  'Te comprometes a un proceso serio de 12 meses con Luis como mentor',
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
                  'Buscas ingresos inmediatos — el trading profesional toma meses de práctica',
                  'No puedes dedicar tiempo real a practicar y revisar tus operaciones',
                  'Tienes deudas graves y necesitas el trading como solución urgente',
                  'No estás dispuesto a aceptar pérdidas como parte del aprendizaje',
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
                  &ldquo;El mercado no miente. Por eso publico mis resultados con pérdidas incluidas.
                  Eso es lo que te enseño a construir tú también.&rdquo; — Luis Riofrio
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
            <div className="label-mono mb-3">Sistema completo</div>
            <h2 className="headline text-5xl text-[var(--text-primary)]">
              Lo que construirás<br />en <span className="gradient-gold">12 meses</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                n: '01',
                title: 'Sistema de trading NQ/MNQ',
                desc: 'El sistema completo de Luis: rompimiento y consecución en futuros del Nasdaq intradia con reglas claras.',
              },
              {
                n: '02',
                title: 'NinjaTrader 8 profesional',
                desc: 'Configuración, indicadores, ejecución de órdenes y uso avanzado de la plataforma que usa Luis.',
              },
              {
                n: '03',
                title: 'Lectura de mercado',
                desc: 'Price action, estructura de mercado, niveles clave, volumen y contexto para tomar decisiones con criterio.',
              },
              {
                n: '04',
                title: 'Gestión de posición y riesgo',
                desc: 'Tamaño de posición, stops, take profits, gestión de drawdown y protección del capital en todo momento.',
              },
              {
                n: '05',
                title: 'Psicología y disciplina',
                desc: 'Los errores cognitivos que destruyen traders buenos. Protocolo mental para operar con consistencia bajo presión.',
              },
              {
                n: '06',
                title: 'Track record verificable',
                desc: 'Métricas reales: win rate, profit factor, RR promedio, drawdown máximo. Tu historial como activo profesional.',
              },
              {
                n: '07',
                title: 'Vinces IA — coaching diario',
                desc: 'El agente IA registra tus operaciones, detecta patrones y genera reportes semanales de coaching personalizados.',
              },
              {
                n: '08',
                title: 'Revisión semanal con Luis',
                desc: 'Cada semana revisas tus operaciones con Luis: qué hiciste bien, qué mejorar, ajustes al sistema.',
              },
              {
                n: '09',
                title: 'Mentoría Integral incluida',
                desc: 'Todo el contenido de inversión (DCA, IBKR, portafolio) está incluido en este programa sin costo adicional.',
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: '🎯', title: 'Clases 1 a 1 con Luis', desc: 'Sesiones personalizadas en vivo adaptadas a tu progreso y horario.' },
              { icon: '📚', title: 'Biblioteca de videos', desc: 'Acceso a todo el material grabado: teoría, análisis y revisiones de operativas.' },
              { icon: '🤖', title: 'Vinces IA diario', desc: 'El agente de IA analiza tus trades, métricas y genera reportes de coaching cada semana.' },
              { icon: '👥', title: 'Mentoring grupal', desc: 'Sesiones grupales para análisis de mercado, preguntas y revisión de trades en comunidad.' },
              { icon: '🌐', title: 'Comunidad privada', desc: 'Acceso a la comunidad con análisis diarios, oportunidades y traders en formación.' },
              { icon: '💬', title: 'Soporte WhatsApp', desc: 'Acceso directo a Luis durante todo el año. Dudas técnicas y seguimiento continuo.' },
            ].map((f) => (
              <div key={f.title} className="card py-7">
                <div className="text-3xl mb-3">{f.icon}</div>
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
                Luis Riofrio —<br /><span className="gradient-gold">Trader Profesional</span>
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                Trader intradia especializado en futuros del Nasdaq (NQ/MNQ) con NinjaTrader 8.
                Estrategias de rompimiento y consecución. Resultados documentados con capturas reales,
                incluyendo las pérdidas. No hay filtros.
              </p>
              <div className="space-y-2.5 mb-8">
                {[
                  '🏛 Operador Financiero en Emporium Quality Funds',
                  '📈 Trader intradia NQ/MNQ — apertura mercado americano (9:30 NY)',
                  '🤖 Creador de Vinces IA — mentor de métricas y track record',
                  '🏦 Gestión de portafolios vía IBKR + NinjaTrader 8',
                  '🎓 Fundador de Liberty Trading Pro',
                ].map((c) => (
                  <div key={c} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <span>{c}</span>
                  </div>
                ))}
              </div>

              <div className="card border-l-2 border-[var(--gold)] pl-5">
                <p className="headline text-base text-[var(--text-secondary)] italic mb-2">
                  &ldquo;El mercado opera en la apertura. Yo también. Y lo que enseño
                  es exactamente lo que hago — nada más, nada menos.&rdquo;
                </p>
                <div className="label-mono text-[10px]">— Luis Riofrio</div>
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
              <div className="col-span-2 card text-center py-4">
                <div className="label-mono text-[10px] mb-1">Instrumento</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]"
                  style={{ fontFamily: 'var(--font-serif)' }}>NQ / MNQ</div>
                <div className="label-mono text-[10px] mt-1">Futuros Nasdaq CME · Intradia</div>
              </div>
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
                q: '¿Necesito experiencia previa en trading?',
                a: 'No necesariamente. El programa incluye la Mentoría Integral, así que empieza desde bases sólidas y avanza hasta trading intradia profesional.',
              },
              {
                q: '¿Qué horario necesito tener disponible?',
                a: 'El mercado NQ abre a las 9:30am hora de Nueva York. El sistema opera en esa apertura, pero Luis te enseña a adaptarlo a tu zona horaria y disponibilidad.',
              },
              {
                q: '¿Qué necesito para empezar?',
                a: 'Computadora, conexión a internet y capital simulado para practicar. NinjaTrader 8 tiene cuenta demo gratuita. No necesitas capital real hasta que estés listo.',
              },
              {
                q: '¿Cuánto capital necesito para operar el NQ real?',
                a: 'El MNQ (micro) requiere menos capital que el NQ. Luis te guía en cuándo y cómo hacer la transición del simulador a cuenta real según tu desempeño.',
              },
              {
                q: '¿Qué es Vinces IA y cómo me ayuda?',
                a: 'Vinces es el agente de IA integrado en la plataforma que registra tus operaciones, calcula métricas (win rate, profit factor, drawdown) y genera reportes de coaching semanales.',
              },
              {
                q: '¿El programa realmente dura 12 meses?',
                a: 'Sí. Convertirse en trader profesional no es un proceso de semanas. 12 meses es el tiempo real que Luis considera necesario para desarrollar consistencia y criterio.',
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
                entiende tu perfil y te dice si la Maestría en Futuros es para ti —
                sin presión y sin venderte nada que no necesites.
              </p>
              <div className="space-y-2">
                {[
                  '✓ Responde en segundos, cualquier hora',
                  '✓ Evalúa si tienes el perfil para trading profesional',
                  '✓ Si no eres el perfil, te redirige al programa correcto',
                ].map((item) => (
                  <p key={item} className="text-sm text-[var(--text-secondary)] font-mono">{item}</p>
                ))}
              </div>
            </div>
            <LeadCaptureForm
              programa="FUTUROS"
              title="Habla con Vinces IA ahora"
              subtitle="Deja tus datos y te contactamos por WhatsApp en segundos."
            />
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ──────────────────────────────────────────── */}
      <section className="py-32 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="label-mono mb-4 text-[var(--gold)]">Maestría en Trading Intradía de Futuros NQ/MNQ</div>
          <h2 className="headline text-5xl sm:text-6xl text-[var(--text-primary)] mb-6">
            12 meses para<br />cambiar tu carrera<br />
            <span className="gradient-gold">para siempre</span>
          </h2>
          <p className="text-[var(--text-secondary)] mb-10 max-w-lg mx-auto leading-relaxed">
            El sistema real de Luis. Clases 1 a 1. Vinces IA como mentor de métricas.
            Track record verificable desde el primer día — $1,049 únicos.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <a href={HOTMART} target="_blank" rel="noopener noreferrer"
              className="btn-gold text-sm py-4 px-10 rounded-xl">
              Inscribirme ahora — $1,049 →
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
