import type { Metadata } from 'next'
import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm'
import PersonalContactForm from '@/components/PersonalContactForm/PersonalContactForm'
import VincesWidget from '@/components/VincesWidget/VincesWidget'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const metadata: Metadata = {
  title: 'Maestría en Futuros NQ/MNQ | Liberty Trading Pro — $29/mes',
  description:
    'Aprende a operar futuros del Nasdaq (NQ/MNQ) con Luis Riofrio. Sistema completo de rompimiento y consecución, NinjaTrader 8, gestión de riesgo y psicología. Plan Pro $29/mes.',
  keywords: 'futuros Nasdaq NQ MNQ, trading futuros Ecuador, NinjaTrader 8, Luis Riofrio, day trading, plan mensual 29 dólares',
  openGraph: {
    title: 'Maestría en Futuros NQ/MNQ — $29/mes | Liberty Trading Pro',
    description: 'Sistema completo para operar futuros Nasdaq con Luis Riofrio. NinjaTrader 8, rompimiento y consecución. $29/mes.',
    url: 'https://libertytrading.pro/maestria-futuros',
  },
}

const HOTMART_MENSUAL = process.env.HOTMART_LINK_MENSUAL || ''

export default async function MaestriaFuturosPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <main className="relative noise">
      <Navbar initialUser={session?.user ?? null} />

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
                Plan Pro Mensual · $29/mes · Futuros NQ/MNQ · Sin permanencia
              </span>
            </div>

            <h1 className="headline text-6xl sm:text-7xl text-[var(--text-primary)] mb-6">
              Conviértete en<br />
              <span className="gradient-gold">trader profesional</span>
            </h1>

            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mb-10 leading-relaxed">
              Accede al Club Liberty Trading Pro con el <strong className="text-[var(--text-primary)]">Plan Pro Mensual</strong> —
              el sistema completo de Luis para operar Futuros Nasdaq (NQ/MNQ), mentoría 1 a 1,
              Vinces IA y todo el contenido de inversión. Sin contratos, cancela cuando quieras.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mb-12">
              {[
                { val: '$29', lbl: 'por mes' },
                { val: 'Mensual', lbl: 'Sin permanencia' },
                { val: 'Cancela', lbl: 'cuando quieras' },
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
              <a href={HOTMART_MENSUAL} target="_blank" rel="noopener noreferrer"
                className="btn-gold text-sm py-4 px-8 rounded-lg">
                Suscribirme al Plan Pro — $29/mes →
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
            <div className="label-mono mb-2">Plan Pro Mensual — $29/mes · Cancela cuando quieras</div>
            <h2 className="headline text-4xl text-[var(--text-primary)]">
              Todo incluido.<br /><span className="gradient-gold">Sin excepciones.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: '📈', title: 'Sistema NQ/MNQ completo', desc: 'El sistema real de Luis: rompimiento y consecución en Futuros Nasdaq. Clases 1 a 1.' },
              { icon: '🎓', title: 'Mentoría Integral incluida', desc: 'Portafolio en acciones, ETFs y cripto. Todo el contenido de inversión sin costo adicional.' },
              { icon: '🤖', title: 'Vinces IA como coach diario', desc: 'Registra tus trades, calcula métricas y genera reportes de coaching personalizados cada semana.' },
              { icon: '👥', title: 'Mentoring grupal + 1a1', desc: 'Sesiones grupales de análisis de mercado y revisiones 1 a 1 con Luis cada mes.' },
              { icon: '🌐', title: 'Comunidad + Monitor Mundial', desc: 'Acceso a la comunidad privada activa y al monitor geopolítico y macro de Luis.' },
              { icon: '💰', title: 'Precio accesible', desc: 'Acceso completo a todo el sistema y la comunidad por $29/mes. Sin contratos ni permanencia mínima.' },
            ].map((f) => (
              <div key={f.title} className="card py-7">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-sm mb-2">{f.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 rounded-xl border border-[var(--gold-dark)] text-center"
            style={{ background: 'rgba(201,168,76,0.04)' }}>
            <p className="text-sm text-[var(--text-secondary)]">
              ¿Quieres enfocarte en inversión en acciones y ETFs?{' '}
              <a href="/mentoria-integral" className="text-[var(--gold)] hover:underline font-semibold">
                Ver la Mentoría Integral →
              </a>
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
                Quieres vivir del<br />trading como profesión
              </h2>
              <div className="space-y-3">
                {[
                  'Quieres hacer del trading tu medio de vida o cambiar de carrera',
                  'Tienes tiempo para practicar y operar (al menos en la apertura del mercado)',
                  'Estás dispuesto a construir un track record profesional verificable',
                  'Buscas disciplina, método y sistema — no señales ni atajos',
                  'Quieres ser considerado como operador en fondos o prop trading',
                  'Ya sabes que esto es tu camino y quieres el mejor precio posible',
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
      <section className="py-24 px-4 border-y border-[var(--border)]"
        style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-14 text-center">
            <div className="label-mono mb-3">Sistema completo — incluido en tu suscripción</div>
            <h2 className="headline text-5xl text-[var(--text-primary)]">
              Lo que construirás<br />con tu <span className="gradient-gold">membresía anual</span>
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
                desc: 'Todo el contenido de inversión (DCA, IBKR, portafolio) está incluido en tu suscripción sin costo adicional.',
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
                Luis Riofrio —<br /><span className="gradient-gold">Trader Profesional</span>
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                Trader activo en futuros del Nasdaq (NQ/MNQ), acciones y opciones financieras.
                Estrategias de rompimiento y consecución. Resultados documentados con capturas reales,
                incluyendo las pérdidas. No hay filtros.
              </p>
              <div className="space-y-2.5 mb-8">
                {[
                  '🏛 Operador Financiero en Emporium Quality Funds',
                  '📈 Trader intradia NQ/MNQ — apertura mercado americano (9:30 NY)',
                  '🤖 Creador de Vinces IA — mentor de métricas y track record',
                  '🏦 Gestión de portafolios de acciones y opciones en IBKR',
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
                q: '¿Cuánto cuesta el Plan Pro?',
                a: '$29 al mes, sin contratos ni permanencia. Cancelas cuando quieras desde tu cuenta de Hotmart.',
              },
              {
                q: '¿Necesito experiencia previa en trading?',
                a: 'No necesariamente. La suscripción incluye el contenido de Mentoría Integral, así que empieza desde bases sólidas y avanza hasta trading intradia profesional.',
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
                q: '¿Qué es Vinces IA y cómo me ayuda?',
                a: 'Vinces es el agente de IA integrado en la plataforma que registra tus operaciones, calcula métricas (win rate, profit factor, drawdown) y genera reportes de coaching semanales.',
              },
              {
                q: '¿Necesito NinjaTrader 8 para empezar?',
                a: 'NinjaTrader 8 tiene cuenta demo gratuita. Puedes practicar con dinero simulado desde el primer día sin necesidad de capital real hasta que estés listo.',
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
                evalúa tu perfil y te dice si el Plan Pro Anual es lo que necesitas —
                y si no, te redirige al plan correcto.
              </p>
              <div className="space-y-2">
                {[
                  '✓ Responde en segundos, cualquier hora',
                  '✓ Evalúa si tienes el perfil para trading profesional',
                  '✓ Si el Plan Mensual se adapta mejor, te lo dice',
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
            El sistema completo<br />de futuros NQ/MNQ.<br />
            <span className="gradient-gold">$29/mes</span>
          </h2>
          <p className="text-[var(--text-secondary)] mb-4 max-w-lg mx-auto leading-relaxed">
            El sistema real de Luis. Clases 1 a 1. Vinces IA como mentor de métricas.
            Track record verificable desde el primer día.
          </p>
          <p className="text-sm text-[var(--text-muted)] mb-10">
            Sin contratos · Sin permanencia · Cancela cuando quieras
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <a href={HOTMART_MENSUAL} target="_blank" rel="noopener noreferrer"
              className="btn-gold text-sm py-4 px-10 rounded-xl">
              Suscribirme al Plan Pro — $29/mes →
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
                Si tienes preguntas específicas sobre el Plan Pro Anual o quieres
                una orientación personalizada antes de comprometerte,
                <strong className="text-[var(--text-primary)]"> Luis Riofrio te contactará directamente</strong>{' '}
                por WhatsApp o email. Sin automatizaciones.
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
