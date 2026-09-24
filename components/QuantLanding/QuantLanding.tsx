import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'
import PersonalContactForm from '@/components/PersonalContactForm/PersonalContactForm'
import { BRAND, RISK_DISCLAIMER, wa } from '@/lib/brand'

/**
 * Landing de venta de Liberty Trading Club — el único producto que empuja la home.
 * Se usa en `/` y en `/liberty-quant`. Precio, nombre y link de checkout salen
 * de lib/brand.ts: no hardcodear aquí.
 */

const NAME = BRAND.products.quant
const PRICE = BRAND.price.quantLabel
const FUNDING = BRAND.price.fundingValueLabel
const ACCOUNT = BRAND.price.fundingAccountLabel
const PROVIDER = BRAND.price.fundingProvider
const QUANT_HREF = BRAND.hotmart.quant || wa(`Hola Luis, quiero información sobre ${NAME}`)
const QUANT_IS_HOTMART = Boolean(BRAND.hotmart.quant)
const CTA_LABEL = QUANT_IS_HOTMART ? `Quiero entrar al club — ${PRICE} →` : `Quiero entrar al club →`

const PILARES = [
  {
    n: '01',
    tag: 'Video clases paso a paso',
    title: 'Monta la infraestructura de un negocio de trading',
    desc: 'Te enseño a configurar Claude Code y a construir tu propio panel web para administrar tu negocio de trading: conectado a tu cuenta en NinjaTrader, muestra solo ingresos, egresos y métricas.',
    bullets: [
      'Claude Code configurado desde cero',
      'Tu panel de negocio conectado a NinjaTrader y Supabase',
      'Claude Code + NinjaTrader 8 + Obsidian para crear estrategias desde cero',
    ],
  },
  {
    n: '02',
    tag: 'Portafolio comunitario',
    title: '6 bots listos para descargar e instalar',
    desc: 'Mientras ves las clases, pones a trabajar en NinjaTrader 8 los bots que la comunidad ya optimizó. No esperas a terminar el curso para operar.',
    bullets: [
      'Código completo, no cajas negras',
      'Validados con Walk-Forward y Montecarlo',
      'El portafolio crece con cada alumno',
    ],
  },
  {
    n: '03',
    tag: `Incluido · valor ${FUNDING}`,
    title: `Tu cuenta fondeada de ${ACCOUNT}`,
    desc: `Te entrego un pase directo a una cuenta fondeada de ${ACCOUNT} en ${PROVIDER}, sin prueba de evaluación. Tienes capital y data para operar las estrategias sin arriesgar tus ahorros.`,
    bullets: [
      `Pase directo ${PROVIDER} incluido en tu inscripción`,
      'Datos de mercado para NinjaTrader',
      'Los bots respetan los límites de drawdown',
    ],
  },
]

const STACK = [
  { name: 'Claude Code', role: 'Tu desarrollador cuantitativo', desc: 'Escribe, depura y documenta el código de tus estrategias contigo.' },
  { name: 'NinjaTrader 8', role: 'Backtest y ejecución', desc: 'Strategy Analyzer, optimización, Walk-Forward y operación automática.' },
  { name: 'Obsidian', role: 'Tu laboratorio de ideas', desc: 'Cada hipótesis, backtest y decisión queda registrada y enlazada.' },
  { name: 'Tu panel de negocio', role: 'La administración de tu negocio', desc: 'Una web tuya, conectada a tu cuenta, con ingresos, egresos y riesgo en automático.' },
]

const RUTA = [
  { when: 'Día 1', title: `Activa tu cuenta de ${ACCOUNT}`, desc: `Recibes tu pase directo de ${PROVIDER}, instalas NinjaTrader 8 y conectas la cuenta.` },
  { when: 'Semana 1', title: 'Pon a trabajar los bots', desc: 'Descargas el portafolio comunitario y lo instalas en tu plataforma.' },
  { when: 'Semanas 2–8', title: 'Aprende y construye', desc: 'Tu panel de negocio conectado a NinjaTrader, Claude Code, Obsidian y desarrollo de estrategias.' },
  { when: 'Proyecto final', title: 'Tu estrategia al portafolio', desc: 'Creas una estrategia validada y la compartes: el portafolio de todos crece.' },
]

const ESTRATEGIAS = [
  { nombre: 'RSI(2) Reversion', tipo: 'Mean reversion', dato: '68.7% aciertos · PF 2.5' },
  { nombre: 'Weekend Effect', tipo: 'Estacional', dato: 'PF 1.52 · 443 operaciones' },
  { nombre: 'Zigzag Breakout', tipo: 'Breakout', dato: '11.5 años de histórico' },
  { nombre: 'Overnight Drift', tipo: 'Estacional', dato: '2,076 operaciones' },
  { nombre: 'IBS Reversion', tipo: 'Mean reversion', dato: '10.8 años de histórico' },
  { nombre: 'Momentum Apertura', tipo: 'Momentum', dato: 'PF 1.59' },
]

const MODULOS = [
  { n: '01', title: 'Infraestructura del negocio', desc: 'Instalación y configuración de Claude Code, repositorio, variables de entorno y buenas prácticas de trabajo con IA.' },
  { n: '02', title: 'Tu panel de negocio de trading', desc: 'Creas con Claude Code una web conectada a Supabase y a tu cuenta de PJ Capital en NinjaTrader: ingresos, egresos y métricas en automático.' },
  { n: '03', title: 'NinjaTrader 8 + portafolio comunitario', desc: 'Instalación de la plataforma, conexión de tu cuenta fondeada e instalación de los 6 bots.' },
  { n: '04', title: 'Obsidian como laboratorio quant', desc: 'Tu bóveda de investigación: hipótesis, notas de backtest y decisiones enlazadas.' },
  { n: '05', title: 'Fundamentos cuantitativos', desc: 'De discrecional a sistemático. Anatomía de un edge: momentum, mean reversion, estacional, breakout.' },
  { n: '06', title: 'De la idea al código', desc: 'El proceso de 9 pasos y el desarrollo de estrategias en NinjaScript con Claude Code como copiloto.' },
  { n: '07', title: 'Los 4 Mandamientos', desc: 'El filtro de fiabilidad antes de optimizar: stop loss, barras por trade, velas válidas y cero look-ahead.' },
  { n: '08', title: 'Optimización, WFO y Montecarlo', desc: 'Elegir la meseta y no el pico. El número que decide es el del Walk-Forward. Riesgo de ruina.' },
  { n: '09', title: 'Gestión de portafolio', desc: 'Correr varios bots sin pisarse: sizing, correlación y reglas de la cuenta fondeada.' },
  { n: '10', title: 'Proyecto final', desc: 'Creas tu propia estrategia rentable, la validas y la compartes con el portafolio comunitario.' },
]

/**
 * Valores de referencia del stack. Son estimaciones de mercado, no precios de
 * venta por separado. Revisar si cambia la oferta.
 */
const VALOR = [
  { item: 'Video clases: infraestructura + desarrollo de estrategias con IA', ref: '$800' },
  { item: 'Código de los 6 bots del portafolio comunitario', ref: '$1,500' },
  { item: 'Tu panel de negocio conectado a NinjaTrader, paso a paso', ref: '$300' },
  { item: 'Comunidad y actualizaciones del portafolio de por vida', ref: '$600' },
  { item: `Pase directo a cuenta fondeada de ${ACCOUNT} (${PROVIDER})`, ref: FUNDING },
]
const VALOR_TOTAL = '$3,500'

type Cell = boolean | string
const COMPARATIVA: { label: string; club: Cell; curso: Cell; software: Cell; workshop: Cell }[] = [
  { label: 'Video clases paso a paso', club: true, curso: true, software: false, workshop: true },
  { label: 'Te enseña a programar con Claude Code (IA)*', club: true, curso: false, software: false, workshop: false },
  { label: 'Obsidian como laboratorio de investigación', club: true, curso: false, software: false, workshop: false },
  { label: 'Tu propio panel de negocio conectado a tu cuenta', club: true, curso: false, software: false, workshop: false },
  { label: 'Bots validados listos para instalar', club: '6 + creciendo', curso: false, software: 'Genéricos', workshop: false },
  { label: 'Cuenta fondeada incluida', club: `${ACCOUNT}`, curso: false, software: false, workshop: false },
  { label: 'Comunidad que comparte estrategias', club: true, curso: false, software: 'Foro', workshop: false },
  { label: 'En español', club: true, curso: true, software: false, workshop: false },
  { label: 'Precio', club: `${PRICE} único`, curso: '$400–950', software: '$1,290–2,900', workshop: '$3,199+' },
]

const FAQS = [
  {
    q: `¿Cuánto cuesta ${NAME}?`,
    a: `${PRICE}, pago único y acceso de por vida. No es una suscripción: pagas una vez y tienes las video clases, el portafolio comunitario, sus actualizaciones y la comunidad.`,
  },
  {
    q: '¿Cuánto voy a ganar al mes con los robots?',
    a: 'Nadie puede prometerte una cifra mensual, y desconfía de quien lo haga. Lo que ganes depende del capital, del número de contratos, de las reglas de tu cuenta fondeada y de cómo se comporte el mercado. Los bots tienen meses buenos y meses en pérdida: en el histórico del portafolio, alrededor de 2 de cada 3 meses cerraron en positivo, y eso también significa que 1 de cada 3 no. Lo que sí te llevas es el método para medir, validar y ajustar tu portafolio con datos reales, y un track record propio para saber exactamente dónde estás.',
  },
  {
    q: '¿Necesito saber programar?',
    a: 'No. Claude Code es tu copiloto: te enseño a describir tu estrategia y a revisar el código que genera. Aprendes a programar en el proceso, no antes de empezar.',
  },
  {
    q: `¿Cómo funciona la cuenta fondeada de ${ACCOUNT}?`,
    a: `Al entrar al club compro para ti un pase directo a una cuenta fondeada de ${ACCOUNT} en ${PROVIDER} (su precio es ${FUNDING} y va incluido en tu pago). Es directo: no tienes que pasar una prueba de evaluación. Operas respetando las reglas de drawdown y consistencia de la mesa. Si en el futuro el proveedor cambia, recibes una alternativa equivalente.`,
  },
  {
    q: '¿Puedo usar los bots desde el primer día?',
    a: 'Sí. Descargas el código del portafolio comunitario y lo instalas en NinjaTrader 8 mientras avanzas con las clases. Te recomiendo empezar en simulación o en la cuenta fondeada, nunca con capital que no puedas perder.',
  },
  {
    q: '¿Qué es el proyecto final?',
    a: 'Creas tu propia estrategia siguiendo el proceso completo — idea, código, Walk-Forward, Montecarlo. Si pasa el filtro de fiabilidad, se suma al portafolio comunitario y todos los miembros se benefician.',
  },
  {
    q: '¿Qué pasa si mi backtest no da buenos números?',
    a: 'Es un resultado normal, no un fracaso. La mayoría de ideas se descartan en la optimización — te enseño a reconocerlo a tiempo en vez de forzar una estrategia sin ventaja estadística.',
  },
  {
    q: '¿Qué necesito para empezar?',
    a: 'Una computadora con Windows (o una VPS) para correr NinjaTrader 8 y tu propia suscripción a Claude para usar Claude Code. No está incluida en el club; el plan Pro de $20/mes es suficiente. Todo lo demás lo montamos juntos en las clases.',
  },
]

function Check({ v }: { v: Cell }) {
  if (v === true) return <span className="text-[var(--green)] font-bold">✓</span>
  if (v === false) return <span className="text-[var(--text-muted)]">—</span>
  return <span className="text-[11px] text-[var(--text-secondary)]">{v}</span>
}

function CtaButton({ className = '' }: { className?: string }) {
  return (
    <a href={QUANT_HREF}
      {...(QUANT_IS_HOTMART
        ? { className: `hotmart-fb hotmart__button-checkout btn-gold text-sm py-4 px-8 rounded-lg text-center ${className}` }
        : { target: '_blank', rel: 'noopener noreferrer', className: `btn-gold text-sm py-4 px-8 rounded-lg text-center ${className}` })}>
      {CTA_LABEL}
    </a>
  )
}

export default function QuantLanding({ initialUser = null }: { initialUser?: User | null }) {
  return (
    <main className="relative noise">
      <Navbar initialUser={initialUser} />

      {/* ─── HERO ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden grid-bg pt-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/3 right-1/4 w-[700px] h-[700px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-20 lg:py-28 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2.5 border border-[var(--gold-dark)] rounded-full px-4 py-1.5 mb-7"
                style={{ background: 'rgba(201,168,76,0.06)' }}>
                <span className="w-2 h-2 rounded-full bg-[var(--green)] pulse-dot" />
                <span className="font-mono-custom text-[11px] text-[var(--gold)] tracking-wider uppercase">
                  {NAME} · Trading algorítmico cuantitativo
                </span>
              </div>

              <h1 className="headline text-5xl sm:text-6xl lg:text-7xl text-[var(--text-primary)] mb-6">
                Convierte el trading algorítmico<br />
                <span className="gradient-gold">en tu negocio</span>
              </h1>

              <p className="text-lg text-[var(--text-secondary)] max-w-xl mb-8 leading-relaxed">
                Aprende a crear estrategias desde cero con <strong className="text-[var(--text-primary)]">Claude Code, NinjaTrader 8 y Obsidian</strong>.
                Mientras aprendes, pones a trabajar los <strong className="text-[var(--text-primary)]">6 bots del portafolio comunitario</strong> en
                tu <strong className="text-[var(--text-primary)]">cuenta fondeada de {ACCOUNT} incluida</strong>.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <CtaButton />
                <a href="#incluye"
                  className="btn-outline text-sm py-4 px-8 rounded-lg text-center">
                  Ver todo lo que incluye
                </a>
              </div>
              <p className="label-mono text-[10px]">Pago único · Acceso de por vida · Sin mensualidad</p>
            </div>

            {/* Tarjeta resumen de la oferta */}
            <div className="card glow-gold-sm border-[var(--gold)] p-7" style={{ background: 'rgba(201,168,76,0.04)' }}>
              <div className="label-mono text-[var(--gold)] mb-4">Lo que recibes hoy</div>
              <div className="space-y-4 mb-6">
                {[
                  { val: '10', lbl: 'módulos en video' },
                  { val: '6', lbl: 'bots listos para NinjaTrader 8' },
                  { val: ACCOUNT, lbl: `cuenta fondeada ${PROVIDER} incluida` },
                  { val: '∞', lbl: 'acceso y actualizaciones de por vida' },
                ].map((s) => (
                  <div key={s.lbl} className="flex items-baseline gap-4 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
                    <div className="text-3xl font-bold text-[var(--gold)] w-20 flex-shrink-0" style={{ fontFamily: 'var(--font-serif)' }}>
                      {s.val}
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">{s.lbl}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-baseline justify-between pt-4 border-t border-[var(--gold-dark)]">
                <div>
                  <div className="label-mono text-[10px] line-through text-[var(--text-muted)]">Valor {VALOR_TOTAL}</div>
                  <div className="text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-serif)' }}>{PRICE}</div>
                </div>
                <div className="label-mono text-[10px] text-right">pago único<br />lifetime</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LOS 3 PILARES ──────────────────────────────────────── */}
      <section id="incluye" className="py-24 px-4 border-y border-[var(--border)]" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="label-mono mb-3 text-[var(--gold)]">Tres pilares, un solo pago</div>
            <h2 className="headline text-4xl sm:text-5xl text-[var(--text-primary)]">
              Aprendes, operas y <span className="gradient-gold">construyes</span> a la vez
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {PILARES.map((p) => (
              <div key={p.n} className="card p-7 flex flex-col hover:border-[var(--gold-dark)] transition-colors">
                <div className="flex items-center justify-between mb-5">
                  <span className="headline text-5xl gradient-gold">{p.n}</span>
                  <span className="label-mono text-[9px] text-[var(--gold)] text-right">{p.tag}</span>
                </div>
                <h3 className="headline text-2xl text-[var(--text-primary)] mb-3">{p.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5">{p.desc}</p>
                <ul className="space-y-2 mt-auto">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <span className="text-[var(--gold)] mt-0.5 flex-shrink-0">✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── EL STACK ───────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="label-mono mb-3">El stack del trader cuantitativo moderno</div>
            <h2 className="headline text-4xl sm:text-5xl text-[var(--text-primary)]">
              Tu mesa de trading, <span className="gradient-gold">impulsada por IA</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STACK.map((s, i) => (
              <div key={s.name} className="relative">
                <div className="card p-6 h-full">
                  <div className="label-mono text-[9px] text-[var(--gold)] mb-2">Paso {i + 1}</div>
                  <h3 className="headline text-2xl text-[var(--text-primary)] mb-1">{s.name}</h3>
                  <div className="text-xs font-bold text-[var(--text-secondary)] mb-3">{s.role}</div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{s.desc}</p>
                </div>
                {i < STACK.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10 w-6 h-6 rounded-full items-center justify-center text-xs text-[var(--gold)] border border-[var(--gold-dark)]"
                    style={{ background: 'var(--bg-primary)' }}>
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── RUTA: MIENTRAS APRENDES, LOS BOTS TRABAJAN ─────────── */}
      <section className="py-24 px-4 border-y border-[var(--border)]" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="label-mono mb-3 text-[var(--gold)]">Tu ruta dentro del club</div>
            <h2 className="headline text-4xl sm:text-5xl text-[var(--text-primary)]">
              Mientras aprendes,<br /><span className="gradient-gold">tus bots trabajan</span>
            </h2>
          </div>

          <ol className="relative border-l border-[var(--gold-dark)] ml-3 space-y-8">
            {RUTA.map((r) => (
              <li key={r.when} className="pl-8 relative">
                <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-[var(--gold)]" />
                <div className="label-mono text-[10px] text-[var(--gold)] mb-1">{r.when}</div>
                <h3 className="font-bold text-lg text-[var(--text-primary)] mb-1">{r.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{r.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── PORTAFOLIO COMUNITARIO ─────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <div className="label-mono mb-3">Portafolio comunitario</div>
            <h2 className="headline text-4xl sm:text-5xl text-[var(--text-primary)]">
              6 bots hoy.<br /><span className="gradient-gold">Más con cada alumno.</span>
            </h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto mt-4 leading-relaxed">
              Código completo para NinjaTrader 8, con su tesis y sus métricas. Cada proyecto final
              aprobado se suma al portafolio: un portafolio más grande y diversificado para todos.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ESTRATEGIAS.map((e) => (
              <div key={e.nombre} className="card p-5">
                <div className="label-mono text-[9px] text-[var(--gold)] mb-1">{e.tipo}</div>
                <h3 className="font-bold text-sm mb-2">{e.nombre}</h3>
                <p className="text-xs text-[var(--text-secondary)]">{e.dato}</p>
              </div>
            ))}
            <div className="card p-5 border-dashed border-[var(--gold-dark)] flex flex-col justify-center"
              style={{ background: 'rgba(201,168,76,0.04)' }}>
              <div className="label-mono text-[9px] text-[var(--gold)] mb-1">Proyecto final</div>
              <h3 className="font-bold text-sm mb-2">+ Tu estrategia</h3>
              <p className="text-xs text-[var(--text-secondary)]">La que construyas y valides dentro del club.</p>
            </div>
          </div>
          <p className="text-xs text-center mt-6 text-[var(--text-muted)]">
            Métricas de backtest y operación de las estrategias. Resultados pasados no garantizan rendimientos futuros.
          </p>
        </div>
      </section>

      {/* ─── TEMARIO ────────────────────────────────────────────── */}
      <section className="py-24 px-4 border-y border-[var(--border)]" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-14 text-center">
            <div className="label-mono mb-3">{MODULOS.length} módulos en video</div>
            <h2 className="headline text-4xl sm:text-5xl text-[var(--text-primary)]">
              De cero a tu <span className="gradient-gold">propia estrategia</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {MODULOS.map((m) => (
              <div key={m.n} className="card hover:border-[var(--gold-dark)] transition-all group">
                <div className="label-mono text-[10px] text-[var(--gold)] mb-2">{m.n}</div>
                <h3 className="font-bold text-sm mb-2 group-hover:text-[var(--gold)] transition-colors">{m.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMPARATIVA ────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="label-mono mb-3 text-[var(--gold)]">Compara antes de decidir</div>
            <h2 className="headline text-4xl sm:text-5xl text-[var(--text-primary)]">
              Lo que ofrece el mercado <span className="gradient-gold">vs. el club</span>
            </h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]" style={{ background: 'var(--bg-secondary)' }}>
                  <th className="text-left p-4 label-mono text-[10px] font-normal">Incluye</th>
                  <th className="p-4 text-center" style={{ background: 'rgba(201,168,76,0.08)' }}>
                    <span className="label-mono text-[10px] text-[var(--gold)]">{NAME}</span>
                  </th>
                  <th className="p-4 text-center label-mono text-[10px] font-normal">Curso NinjaTrader en español</th>
                  <th className="p-4 text-center label-mono text-[10px] font-normal">Software generador de estrategias</th>
                  <th className="p-4 text-center label-mono text-[10px] font-normal">Workshop premium en inglés</th>
                </tr>
              </thead>
              <tbody>
                {COMPARATIVA.map((row) => (
                  <tr key={row.label} className="border-b border-[var(--border)] last:border-0">
                    <td className="p-4 text-[var(--text-secondary)]">{row.label}</td>
                    <td className="p-4 text-center" style={{ background: 'rgba(201,168,76,0.05)' }}><Check v={row.club} /></td>
                    <td className="p-4 text-center"><Check v={row.curso} /></td>
                    <td className="p-4 text-center"><Check v={row.software} /></td>
                    <td className="p-4 text-center"><Check v={row.workshop} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-center mt-4 text-[var(--text-muted)]">
            Rangos de precio públicos de productos comparables, septiembre 2026, en dólares. Referencia orientativa.<br />
            * El club te enseña a usar Claude Code; la suscripción a Claude es tuya y no está incluida (el plan Pro de $20/mes es suficiente).
          </p>
        </div>
      </section>

      {/* ─── VALOR vs PRECIO ────────────────────────────────────── */}
      <section id="precio" className="py-24 px-4 border-y border-[var(--border)]" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="label-mono mb-3">Todo lo que recibes</div>
            <h2 className="headline text-4xl sm:text-5xl text-[var(--text-primary)]">
              Un solo pago, <span className="gradient-gold">acceso de por vida</span>
            </h2>
          </div>

          <div className="rounded-2xl border border-[var(--gold)] glow-gold-sm p-7" style={{ background: 'rgba(201,168,76,0.04)' }}>
            <div className="space-y-3 mb-6">
              {VALOR.map((v) => (
                <div key={v.item} className="flex items-start justify-between gap-4 text-sm border-b border-[var(--border)] pb-3">
                  <span className="flex items-start gap-2 text-[var(--text-secondary)]">
                    <span className="text-[var(--gold)] flex-shrink-0">✓</span>{v.item}
                  </span>
                  <span className="font-mono-custom text-[var(--text-muted)] flex-shrink-0">{v.ref}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-1">
                <span className="label-mono text-[10px]">Valor de referencia</span>
                <span className="font-mono-custom line-through text-[var(--text-muted)]">{VALOR_TOTAL}</span>
              </div>
            </div>

            <div className="text-center mb-6">
              <div className="label-mono text-[10px] text-[var(--gold)] mb-1">Tu inversión hoy</div>
              <div className="text-6xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-serif)' }}>{PRICE}</div>
              <div className="label-mono text-[10px] mt-1">Pago único · Lifetime · Sin mensualidad</div>
              <p className="text-[11px] text-[var(--text-muted)] mt-3">
                Requisito aparte: tu propia suscripción a Claude (plan Pro, $20/mes) para usar Claude Code.
              </p>
            </div>

            <CtaButton className="w-full block" />
            <p className="text-center text-xs text-[var(--text-muted)] mt-4">
              ¿Dudas antes de pagar? <a href="#contacto-luis" className="text-[var(--gold)] hover:underline">Habla primero con Luis</a>
            </p>
          </div>
        </div>
      </section>

      {/* ─── PARA QUIÉN ES ──────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
            <div>
              <div className="label-mono mb-3 text-[var(--gold)]">El club es para ti si…</div>
              <h2 className="headline text-4xl text-[var(--text-primary)] mb-8">
                Quieres un sistema,<br />no solo operar
              </h2>
              <div className="space-y-3">
                {[
                  'Quieres pasar de operar manual a gestionar un portafolio de bots',
                  'Te interesa usar IA (Claude Code) para programar sin ser programador',
                  'Buscas método y validación estadística — no señales ni atajos',
                  'Quieres operar con capital de una mesa de fondeo desde el inicio',
                  'Estás dispuesto a aportar tu propia estrategia a la comunidad',
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
                  'Buscas ingresos inmediatos — validar una estrategia toma semanas',
                  'No tienes una computadora (o VPS) para correr NinjaTrader 8',
                  'Tienes deudas graves y necesitas el trading como solución urgente',
                  'No aceptas que un backtest te diga que tu idea no sirve',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                    <span className="text-[var(--red)] mt-0.5 flex-shrink-0 text-base">✗</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-xl border border-[var(--gold-dark)]" style={{ background: 'rgba(201,168,76,0.05)' }}>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic">
                  &ldquo;Un backtest bonito no es un backtest fiable. Si los números no dan, te lo digo —
                  no maquillo resultados para venderte una estrategia.&rdquo; — {BRAND.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SOBRE LUIS ─────────────────────────────────────────── */}
      <section className="py-24 px-4 border-y border-[var(--border)]" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
            <div>
              <div className="label-mono mb-3">Tu mentor</div>
              <h2 className="headline text-5xl text-[var(--text-primary)] mb-5">
                {BRAND.name} —<br /><span className="gradient-gold">Trader Cuantitativo</span>
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                Hace 8 años era profesor de química con un trabajo estable. En 2019 descubrí los mercados
                financieros y el desarrollo de software. A finales de 2024 renuncié a mi empleo seguro para
                dedicarme 100% a las finanzas tecnológicas.
              </p>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                Hoy trabajo a tiempo completo invirtiendo en acciones, opciones y futuros financieros, y opero
                un portafolio de estrategias algorítmicas en NinjaTrader 8 con el mismo stack que te enseño:
                Claude Code, Obsidian y un track record público. No enseño solo desde la teoría: te entrego
                el código y el método que uso cada día.
              </p>
              <div className="card border-l-2 border-[var(--gold)] pl-5 mb-6">
                <p className="headline text-base text-[var(--text-secondary)] italic mb-2">
                  &ldquo;El éxito no lo mido en dinero. Lo mido en tiempo.&rdquo;
                </p>
                <div className="label-mono text-[10px]">— {BRAND.name}</div>
              </div>
              <Link href={`/track-record/${BRAND.trackRecordSlug}`}
                className="btn-outline text-sm py-3 px-6 rounded-lg inline-flex items-center gap-2">
                Ver mi track record público →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '$89,340', label: 'Neto del portafolio desde 2015', color: 'var(--gold)' },
                { value: '1.88', label: 'Calmar Ratio', color: 'var(--green)' },
                { value: '65.7%', label: 'Meses en positivo', color: 'var(--gold)' },
                { value: '6', label: 'Estrategias activas', color: 'var(--green)' },
              ].map((s) => (
                <div key={s.label} className="card text-center py-6">
                  <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-serif)', color: s.color }}>
                    {s.value}
                  </div>
                  <div className="label-mono text-[10px]">{s.label}</div>
                </div>
              ))}
              <div className="col-span-2 card text-center py-4">
                <div className="label-mono text-[10px] mb-1">Reducción de drawdown</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-serif)' }}>-74.4%</div>
                <div className="label-mono text-[10px] mt-1">vs. la suma de los drawdowns individuales — el poder de diversificar</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <div className="label-mono mb-3">Preguntas frecuentes</div>
            <h2 className="headline text-4xl text-[var(--text-primary)]">Lo que más nos preguntan</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.q} className="card">
                <h3 className="font-bold text-sm mb-2 text-[var(--text-primary)]">{faq.q}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ──────────────────────────────────────────── */}
      <section className="py-24 px-4 border-y border-[var(--border)]" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="label-mono mb-4 text-[var(--gold)]">{NAME}</div>
          <h2 className="headline text-5xl sm:text-6xl text-[var(--text-primary)] mb-6">
            Video clases. 6 bots.<br />Cuenta fondeada de {ACCOUNT}.<br />
            <span className="gradient-gold">{PRICE} una sola vez.</span>
          </h2>
          <p className="text-[var(--text-secondary)] mb-10 max-w-lg mx-auto leading-relaxed">
            Monta tu infraestructura, pon a trabajar el portafolio comunitario y construye tu propia
            estrategia — con acceso de por vida.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <CtaButton />
            <a href={wa(`Hola Luis, tengo dudas sobre ${NAME}`)} target="_blank" rel="noopener noreferrer"
              className="btn-outline text-sm py-4 px-8 rounded-lg">
              Escribir a Luis por WhatsApp
            </a>
          </div>
          <p className="label-mono text-[10px]">{BRAND.phoneDisplay} · {BRAND.location}</p>
        </div>
      </section>

      {/* ─── CONTACTO PERSONAL ──────────────────────────────────── */}
      <section id="contacto-luis" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="label-mono mb-3 text-[var(--gold)]">Trato personal</div>
              <h2 className="headline text-4xl text-[var(--text-primary)] mb-5">
                ¿Prefieres hablar<br />conmigo primero?
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                Déjame tus datos y te escribo personalmente por WhatsApp o email. Te digo con
                honestidad si el club es para ti en este momento.
              </p>
              <div className="space-y-2">
                {['✓ Reviso tu caso personalmente', '✓ Sin bots ni automatizaciones', '✓ Respuesta en menos de 24 horas'].map((item) => (
                  <p key={item} className="text-sm text-[var(--text-secondary)] font-mono">{item}</p>
                ))}
              </div>
            </div>
            <PersonalContactForm
              plan="QUANT"
              title="Quiero que Luis me contacte"
              subtitle={`Deja tus datos y ${BRAND.name} se pondrá en contacto contigo personalmente.`}
            />
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed max-w-3xl mx-auto mt-16 pt-6 border-t border-[var(--border)]">
            {RISK_DISCLAIMER} Las cuentas fondeadas están sujetas a las reglas del proveedor. Los bots
            del portafolio comunitario se entregan con fines educativos; cada alumno decide y es
            responsable de cómo y dónde los opera.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
