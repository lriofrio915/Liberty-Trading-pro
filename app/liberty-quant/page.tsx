import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'
import PersonalContactForm from '@/components/PersonalContactForm/PersonalContactForm'
import VincesWidget from '@/components/VincesWidget/VincesWidget'
import { BRAND, wa } from '@/lib/brand'

const QUANT_HREF = BRAND.hotmart.quant || wa('Hola Luis, quiero información sobre Liberty Quant')
const QUANT_IS_HOTMART = Boolean(BRAND.hotmart.quant)

const ESTRATEGIAS = [
  { nombre: 'RSI(2) Reversion', tipo: 'Mean reversion', dato: '68.7% aciertos · PF 2.5' },
  { nombre: 'Weekend Effect', tipo: 'Estacional', dato: 'PF 1.52 · 443 operaciones' },
  { nombre: 'Zigzag Breakout', tipo: 'Breakout', dato: '11.5 años de histórico' },
  { nombre: 'Overnight Drift', tipo: 'Estacional', dato: '2,076 operaciones' },
  { nombre: 'IBS Reversion', tipo: 'Mean reversion', dato: '10.8 años de histórico' },
  { nombre: 'Momentum Apertura', tipo: 'Momentum', dato: 'PF 1.59' },
]

export default function LibertyQuantPage() {
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
                Liberty Quant · Pago único · Cuenta fondeada $200k incluida
              </span>
            </div>

            <h1 className="headline text-6xl sm:text-7xl text-[var(--text-primary)] mb-6">
              De la especulación<br />
              <span className="gradient-gold">al portafolio cuantitativo</span>
            </h1>

            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mb-10 leading-relaxed">
              Te enseño mi metodología completa —de la idea discrecional al bot validado con
              Walk-Forward Optimization y Montecarlo— en NinjaTrader 8 con Claude como asistente.
              Sales con el código de <strong className="text-[var(--text-primary)]">6 estrategias del portafolio cuantitativo real</strong> y
              un <strong className="text-[var(--text-primary)]">pase directo a cuenta fondeada de $200,000</strong> para operarlas desde el día uno.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mb-12">
              {[
                { val: '$1,000', lbl: 'pago único' },
                { val: '11', lbl: 'módulos' },
                { val: '6', lbl: 'estrategias con código' },
                { val: '$200k', lbl: 'cuenta fondeada' },
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
              <div className="label-mono text-[10px] w-full mb-1 text-[var(--gold)]">Portafolio cuantitativo — histórico real</div>
              {[
                { val: '$89,340', lbl: 'Neto desde 2015' },
                { val: '1.88', lbl: 'Calmar' },
                { val: '65.7%', lbl: 'Meses en positivo' },
              ].map((s) => (
                <div key={s.lbl} className="text-center">
                  <div className="text-xl font-bold text-[var(--gold)]" style={{ fontFamily: 'var(--font-serif)' }}>{s.val}</div>
                  <div className="label-mono text-[9px]">{s.lbl}</div>
                </div>
              ))}
              <div className="label-mono text-[9px] text-[var(--text-muted)] self-end ml-auto">Datos reales del portafolio, no una promesa</div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a href={QUANT_HREF} target={QUANT_IS_HOTMART ? undefined : '_blank'} rel={QUANT_IS_HOTMART ? undefined : 'noopener noreferrer'}
                className="btn-gold text-sm py-4 px-8 rounded-lg">
                {QUANT_IS_HOTMART ? 'Quiero Liberty Quant — $1,000 →' : 'Consultar Liberty Quant →'}
              </a>
              <a href="#contacto-vinces"
                className="btn-outline text-sm py-4 px-8 rounded-lg inline-flex items-center justify-center gap-2">
                <svg viewBox="0 0 36 36" fill="none" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                  <rect x="7" y="7" width="22" height="16" rx="4" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="13" cy="15" r="2.5" fill="currentColor"/>
                  <circle cx="23" cy="15" r="2.5" fill="currentColor"/>
                </svg>
                Hablar con Luis primero
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MI HISTORIA ────────────────────────────────────────── */}
      <section className="py-20 px-4 border-y border-[var(--border)]" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="label-mono mb-3 text-[var(--gold)]">Por qué te enseño esto</div>
          <h2 className="headline text-4xl text-[var(--text-primary)] mb-6">
            Hace 8 años era profesor<br />de química con plaza fija
          </h2>
          <div className="card border-l-2 border-[var(--gold)] pl-6 text-left">
            <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
              Tenía nombramiento definitivo, ganado por concurso — el puesto asegurado hasta la
              jubilación. En 2019 descubrí los mercados financieros y el desarrollo de software.
              A finales de 2024 renuncié, con mi esposa apoyándome: &ldquo;juntos como familia podemos
              superar cualquier cosa&rdquo;, me dijo.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Hoy trabajo como operador financiero en una fintech, desarrollo los algoritmos que
              ves en este portafolio, y solo entre mayo y junio de este año retiré cerca de $6,000
              de trading de futuros — casi lo mismo que ganaba en un año entero de profesor. El
              éxito no lo mido en dinero. Lo mido en tiempo: desayunar con mi familia, llevar a mis
              hijos a la escuela, trabajar en lo que amo.
            </p>
            <div className="label-mono text-[10px] mt-4">— Luis Riofrio</div>
          </div>
          <p className="text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
            🎬 Historia completa en video — próximamente en el curso gratuito y aquí mismo.
          </p>
        </div>
      </section>

      {/* ─── QUÉ INCLUYE ────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="label-mono mb-2">Liberty Quant — $1,000 pago único</div>
            <h2 className="headline text-4xl text-[var(--text-primary)]">
              Todo incluido.<br /><span className="gradient-gold">Un solo pago, sin mensualidad.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: '🧠', title: 'Metodología completa', desc: 'De la idea discrecional al bot validado: los 9 pasos, los 4 Mandamientos de fiabilidad, WFO y Montecarlo.' },
              { icon: '💻', title: 'Código de 6 estrategias', desc: 'Las estrategias del portafolio cuantitativo real, con su tesis, métricas y resultados de Walk-Forward.' },
              { icon: '🏦', title: 'Cuenta fondeada de $200k', desc: 'Pase directo con PJ Capital para operar los bots en real desde el día uno, sin arriesgar tu propio capital.' },
              { icon: '🤖', title: 'NinjaTrader 8 + Claude', desc: 'Aprende a programar tus propias estrategias usando Claude como asistente de desarrollo cuantitativo.' },
              { icon: '🎓', title: 'Curso gratuito incluido', desc: 'Acciones, opciones y apertura de cuenta IBKR — la base antes de llegar a lo cuantitativo.' },
              { icon: '👥', title: 'Comunidad Liberty Quant', desc: 'El portafolio sigue creciendo: cada alumno aporta su propia estrategia validada.' },
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

      {/* ─── LAS 6 ESTRATEGIAS ──────────────────────────────────── */}
      <section className="py-20 px-4 border-y border-[var(--border)]" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 text-center">
            <div className="label-mono mb-3">El portafolio que recibes</div>
            <h2 className="headline text-4xl sm:text-5xl text-[var(--text-primary)]">
              6 estrategias.<br /><span className="gradient-gold">Código real, no una promesa.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ESTRATEGIAS.map((e) => (
              <div key={e.nombre} className="card p-5">
                <div className="label-mono text-[9px] text-[var(--gold)] mb-1">{e.tipo}</div>
                <h3 className="font-bold text-sm mb-2">{e.nombre}</h3>
                <p className="text-xs text-[var(--text-secondary)]">{e.dato}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-center mt-6" style={{ color: 'var(--text-muted)' }}>
            Métricas del portafolio real de Luis. Resultados pasados no garantizan rendimientos futuros.
          </p>
        </div>
      </section>

      {/* ─── PARA QUIÉN ES ──────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
            <div>
              <div className="label-mono mb-3 text-[var(--gold)]">Liberty Quant es para ti si…</div>
              <h2 className="headline text-4xl text-[var(--text-primary)] mb-8">
                Quieres construir un<br />sistema, no solo operar
              </h2>
              <div className="space-y-3">
                {[
                  'Ya sabes lo básico de mercados (o acabas de terminar el curso gratuito)',
                  'Quieres pasar de operar manual a gestionar un portafolio de bots',
                  'Buscas método y validación estadística — no señales ni atajos',
                  'Quieres operar con capital real desde el día uno, sin arriesgar el tuyo',
                  'Estás dispuesto a aportar tu propia estrategia a la comunidad',
                  'Ya sabes que esto es tu camino y quieres el sistema completo',
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
                  'Buscas ingresos inmediatos — validar una estrategia toma semanas de backtesting',
                  'No tienes computadora para correr NinjaTrader 8 con regularidad',
                  'Tienes deudas graves y necesitas el trading como solución urgente',
                  'No estás dispuesto a que un backtest te diga que tu idea no sirve',
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
                  &ldquo;Un backtest bonito no es un backtest fiable. Si los números no dan, te lo digo —
                  no maquillo resultados para venderte una estrategia.&rdquo; — Luis Riofrio
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
            <div className="label-mono mb-3">11 módulos — incluidos en tu pago único</div>
            <h2 className="headline text-5xl text-[var(--text-primary)]">
              De la idea<br />al <span className="gradient-gold">portafolio en real</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { n: '01', title: 'Fundamentos quant', desc: 'De discrecional a sistemático, anatomía de un edge (momentum, mean reversion, estacional, breakout), instalación de NinjaTrader 8.' },
              { n: '02', title: 'El proceso de 9 pasos', desc: 'El checklist de especificación obligatorio: instrumento, sesión RTH/ETH, zona horaria, Calculate mode.' },
              { n: '03', title: 'Bot #1 — Apertura + EMA200', desc: 'De la regla manual al código con Claude como asistente: plantilla, logging, stop loss obligatorio. Un bot didáctico: el backtest no muestra ventaja estadística real, pero sirve para practicar el proceso completo y es válido para intentar una prueba de fondeo.' },
              { n: '04', title: 'Los 4 Mandamientos', desc: 'El gate de fiabilidad antes de optimizar: SL, avg bars/trade, velas válidas, entrada sin look-ahead.' },
              { n: '05', title: 'Optimización', desc: 'Bruto vs fino, elegir la meseta y no el pico, descartar como resultado exitoso del proceso.' },
              { n: '06', title: 'Walk-Forward y Montecarlo', desc: 'La regla de oro: el número que decide es el del WFO. Drawdown peor caso y riesgo de ruina.' },
              { n: '07', title: 'Bot #2 — Zigzag Breakout', desc: 'El proceso completo con menos guía — incubación y criterio de paso a cuenta real. Igual que el Bot #1, es didáctico: sigue una lógica válida pero sin ventaja estadística probada en el backtest.' },
              { n: '08', title: 'El portafolio — 6 estrategias cuantitativas validadas', desc: 'Código completo de las 6 estrategias reales, con ventaja estadística probada — las que uso para capital real y cuentas fondeadas ya en operación. Taller de interpretación de métricas y mejora estadística.' },
              { n: '09', title: 'Gestión de portafolio', desc: 'Correr múltiples bots sin pisarse: sizing, capital, correlación entre estrategias.' },
              { n: '10', title: 'Tu cuenta fondeada', desc: 'Activación del pase directo de $200k con PJ Capital, reglas de la cuenta, operar en real.' },
              { n: '11', title: 'Proyecto final', desc: 'Tu propia estrategia, validada con WFO, evaluada para sumarse al portafolio comunitario.' },
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
                Trader cuantitativo especializado en futuros. Luis gestiona un portafolio real de
                6 estrategias algorítmicas en NinjaTrader 8 y desarrolla algoritmos para una
                empresa financiera tecnológica. No enseña desde la teoría — entrega el código
                funcional y la metodología completa para construir el tuyo.
              </p>
              <div className="space-y-2.5 mb-8">
                {[
                  '📊 Trader cuantitativo — futuros, acciones y opciones',
                  '🤖 Gestiona un portafolio real de 6 estrategias algorítmicas',
                  '🔬 Metodología propia: 9 pasos, WFO y Montecarlo antes de operar real',
                  '💻 Entrega código NinjaScript funcional a sus alumnos',
                  '🎓 Fundador de Liberty Trading Pro',
                ].map((c) => (
                  <div key={c} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <span>{c}</span>
                  </div>
                ))}
              </div>

              <div className="card border-l-2 border-[var(--gold)] pl-5">
                <p className="headline text-base text-[var(--text-secondary)] italic mb-2">
                  &ldquo;El éxito no lo mido en dinero. Lo mido en tiempo.&rdquo;
                </p>
                <div className="label-mono text-[10px]">— Luis Riofrio</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '$89,340', label: 'Neto del portafolio desde 2015', color: 'var(--gold)' },
                { value: '1.88', label: 'Calmar Ratio', color: 'var(--green)' },
                { value: '65.7%', label: 'Meses en positivo', color: 'var(--gold)' },
                { value: '6', label: 'Estrategias activas', color: 'var(--green)' },
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
                <div className="label-mono text-[10px] mb-1">Reducción de drawdown</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]"
                  style={{ fontFamily: 'var(--font-serif)' }}>-74.4%</div>
                <div className="label-mono text-[10px] mt-1">vs. la suma de los drawdowns individuales — el poder de diversificar edges</div>
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
                q: '¿Cuánto cuesta Liberty Quant?',
                a: '$1,000, pago único. No es una suscripción — pagas una vez y tienes acceso de por vida al curso, al código del portafolio y a la comunidad.',
              },
              {
                q: '¿Necesito saber programar?',
                a: 'No. Te llevo paso a paso desde la regla manual hasta el código en NinjaScript, usando Claude como asistente. Aprenderás a programar en el proceso, no antes de empezar.',
              },
              {
                q: '¿Cómo funciona la cuenta fondeada de $200k?',
                a: 'Recibes un pase directo con PJ Capital para operar los bots del portafolio en una cuenta de $200,000, respetando sus reglas de drawdown y consistencia. Es la vía de acceso a capital vigente al momento de tu compra — si en el futuro el proveedor cambia, la alternativa es una prueba de fondeo equivalente.',
              },
              {
                q: '¿Qué pasa si mi backtest no da buenos números?',
                a: 'Es un resultado normal del proceso, no un fracaso. La mayoría de ideas se descartan en la fase de optimización — te enseño a reconocerlo a tiempo en vez de forzar una estrategia que no tiene ventaja estadística real.',
              },
              {
                q: 'Los Bots #1 y #2 del curso — ¿son rentables?',
                a: 'Con honestidad: no, su backtest no muestra ventaja estadística real. Sirven para aprender el proceso completo de principio a fin y son válidos para intentar pasar una prueba de fondeo (donde la varianza puede jugar a tu favor). Para capital real o cuentas ya fondeadas, uso y recomiendo las 6 estrategias del portafolio cuantitativo — esas sí tienen ventaja estadística validada con Walk-Forward.',
              },
              {
                q: '¿Necesito el curso gratuito antes?',
                a: 'No es obligatorio, pero ayuda. Liberty Quant incluye acceso al curso gratuito de acciones y opciones por si quieres repasar los fundamentos primero.',
              },
              {
                q: '¿Qué es el proyecto final?',
                a: 'Construyes tu propia estrategia cuantitativa, validada con Walk-Forward Optimization, siguiendo el mismo proceso de los 2 bots del curso. Si pasa el gate de fiabilidad, se suma al portafolio comunitario.',
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

      {/* ─── CONTACTO DIRECTO CON LUIS ──────────────────────────── */}
      <section id="contacto-vinces" className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="label-mono mb-3 text-[var(--gold)]">Atención personalizada</div>
          <h2 className="headline text-4xl text-[var(--text-primary)] mb-5">
            ¿Tienes dudas?<br />
            <span className="gradient-gold">Escríbeme directo por WhatsApp</span>
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed mb-8 max-w-md mx-auto">
            Yo mismo reviso tu mensaje y te respondo — sin bots, sin automatizaciones.
            Te digo con honestidad si Liberty Quant es para ti o si es mejor que empieces
            por el curso gratuito.
          </p>
          <a href={wa('Hola Luis, tengo dudas sobre Liberty Quant')} target="_blank" rel="noopener noreferrer"
            className="btn-gold text-sm py-4 px-10 rounded-xl inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488" />
            </svg>
            Escribir a Luis por WhatsApp
          </a>
          <p className="label-mono mt-3 text-[10px]">{BRAND.phoneDisplay}</p>
        </div>
      </section>

      {/* ─── CTA FINAL ──────────────────────────────────────────── */}
      <section className="py-24 px-4 border-y border-[var(--border)]"
        style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="label-mono mb-4 text-[var(--gold)]">Liberty Quant · Liberty Trading Pro</div>
          <h2 className="headline text-5xl sm:text-6xl text-[var(--text-primary)] mb-6">
            Todo el sistema.<br />Un solo pago.<br />
            <span className="gradient-gold">$1,000</span>
          </h2>
          <p className="text-[var(--text-secondary)] mb-4 max-w-lg mx-auto leading-relaxed">
            Metodología completa, código de 6 estrategias y una cuenta fondeada de $200k
            para operarlas desde el día uno.
          </p>
          <p className="text-sm text-[var(--text-muted)] mb-10">
            Pago único · Sin mensualidad · Acceso de por vida
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <a href={QUANT_HREF} target={QUANT_IS_HOTMART ? undefined : '_blank'} rel={QUANT_IS_HOTMART ? undefined : 'noopener noreferrer'}
              className="btn-gold text-sm py-4 px-10 rounded-xl">
              {QUANT_IS_HOTMART ? 'Quiero Liberty Quant — $1,000 →' : 'Consultar Liberty Quant →'}
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
                Si tienes preguntas específicas sobre Liberty Quant o quieres
                una orientación personalizada antes de comprometerte,
                <strong className="text-[var(--text-primary)]"> Luis Riofrio te contactará directamente</strong>{' '}
                por WhatsApp o email. Sin automatizaciones.
              </p>
              <div className="space-y-2">
                {[
                  '✓ Luis revisa tu caso personalmente',
                  '✓ Te orienta sobre si estás listo para Liberty Quant',
                  '✓ Respuesta en menos de 24 horas',
                ].map((item) => (
                  <p key={item} className="text-sm text-[var(--text-secondary)] font-mono">{item}</p>
                ))}
              </div>
            </div>
            <PersonalContactForm
              plan="QUANT"
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
