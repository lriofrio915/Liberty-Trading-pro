import Navbar from '@/components/Navbar/Navbar'
import Hero from '@/components/Hero/Hero'
import Pricing from '@/components/Pricing/Pricing'
import Footer from '@/components/Footer/Footer'
import VincesWidget from '@/components/VincesWidget/VincesWidget'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const WA = `https://wa.me/+${process.env.LUIS_PHONE || ''}?text=Hola%20Luis%2C%20me%20interesa%20el%20servicio%20P2P%20de%20USDT%2FBTC`

interface TrackRecordData {
  totalTrades: number
  wins: number
  losses: number
  winRate: number
  profitFactor: number
  totalNetPnl: number
  rendimientoYTD: number
  recentSessions: { date: string; instrumento: string; direccion: string; resultado: string; pnlNeto: number }[]
}

export default async function LandingPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  let trackRecord: TrackRecordData | null = null
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const r = await fetch(`${base}/api/public-track-record`, { next: { revalidate: 3600 } })
    if (r.ok) trackRecord = await r.json()
  } catch { /* non-critical — page renders without live data */ }

  return (
    <main className="relative noise">
      <Navbar initialUser={session?.user ?? null} />
      <Hero />

      {/* ─── QUÉ INCLUYE LA SUSCRIPCIÓN ──────────────────────── */}
      <section id="servicios" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <div className="label-mono mb-3">Todo en una suscripción</div>
            <h2 className="headline text-5xl sm:text-6xl text-[var(--text-primary)]">
              Todo lo que necesitas para<br />
              <span className="gradient-gold">operar con ventaja</span>
            </h2>
            <p className="text-[var(--text-secondary)] mt-4 max-w-lg">
              Con tu membresía mensual accedes a cada una de estas herramientas desde el primer día.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                num: '01',
                title: 'Formación Completa',
                desc: 'Desde cero hasta trader profesional. Mentoría Integral de Mercados Financieros + Especialización en Day Trading de Futuros NQ/MNQ — con acceso a oportunidades en acciones y contratos de opciones. Todo incluido.',
                badge: 'Academia',
              },
              {
                num: '02',
                title: 'Mentorías 1:1 con Luis',
                desc: 'Sesiones personalizadas con Luis Riofrio cada mes mientras mantengas tu membresía activa. Revisión de tu operativa, dudas y estrategia en vivo.',
                badge: 'Mentoría',
              },
              {
                num: '03',
                title: 'Vinces Coach IA',
                desc: 'Tu mentor de trading con inteligencia artificial. Analiza tu operativa diaria, detecta patrones de error y genera reportes de coaching personalizados.',
                badge: 'IA',
              },
              {
                num: '04',
                title: 'Reportes de Inversión',
                desc: 'Reportes y análisis de oportunidades en acciones y ETFs — entrada sugerida, objetivo, stop loss y contexto fundamental para que tomes tu propia decisión.',
                badge: 'Club',
              },
              {
                num: '05',
                title: 'Track Record Real',
                desc: 'Accede al historial operativo completo de Luis Riofrio — cada operación con datos reales. Transparencia total, incluyendo pérdidas. Tú también construyes y registras tu propio track record verificable desde el primer día.',
                badge: 'Verificado',
              },
              {
                num: '06',
                title: 'Monitor Mundial',
                desc: 'Seguimiento de eventos geopolíticos y macroeconómicos que impactan los mercados en tiempo real para tomar mejores decisiones de trading.',
                badge: 'Live',
              },
            ].map((s) => (
              <div key={s.num}
                className="card hover:border-[var(--gold-dark)] group relative overflow-hidden">
                <div className="absolute top-4 right-4 label-mono text-[9px] px-2 py-0.5 border border-[var(--border)] rounded-full">
                  {s.badge}
                </div>
                <div className="w-8 h-8 rounded-lg border border-[var(--gold-dark)] flex items-center justify-center mb-3"
                  style={{ background: 'rgba(201,168,76,0.08)' }}>
                  <span className="font-mono-custom text-xs text-[var(--gold)]">{s.num}</span>
                </div>
                <h3 className="text-base font-bold mb-2 group-hover:text-[var(--gold)] transition-colors">
                  {s.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRACK RECORD EN VIVO ───────────────────────── */}
      <section id="track-record" className="py-24 px-4" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <div className="label-mono mb-3 text-[var(--gold)]">Transparencia total</div>
            <h2 className="headline text-5xl sm:text-6xl text-[var(--text-primary)]">
              Track Record<br /><span className="gradient-gold">de Luis Riofrio</span>
            </h2>
            <p className="text-[var(--text-secondary)] mt-4 max-w-lg">
              Operaciones reales — incluyendo pérdidas. Año {new Date().getFullYear()} en curso.
            </p>
          </div>

          {trackRecord ? (
            <>
              {/* Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {[
                  { label: 'Win Rate', value: `${trackRecord.winRate}%`, sub: `${trackRecord.wins}W / ${trackRecord.losses}L` },
                  { label: 'Profit Factor', value: trackRecord.profitFactor >= 999 ? '∞' : trackRecord.profitFactor.toFixed(2), sub: 'ganancias / pérdidas' },
                  { label: 'Rendimiento YTD', value: `${trackRecord.rendimientoYTD > 0 ? '+' : ''}${trackRecord.rendimientoYTD.toFixed(1)}%`, sub: 'sobre capital inicial' },
                  { label: 'Operaciones', value: String(trackRecord.totalTrades), sub: `YTD ${new Date().getFullYear()}` },
                ].map((s) => (
                  <div key={s.label} className="card p-5">
                    <div className="label-mono text-[10px] text-[var(--text-muted)] mb-1">{s.label}</div>
                    <div className="text-3xl font-black gradient-gold">{s.value}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Recent sessions table */}
              {trackRecord.recentSessions.length > 0 && (
                <div className="card p-0 overflow-hidden">
                  <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
                    <span className="label-mono text-[10px] text-[var(--text-muted)]">Últimas operaciones</span>
                    <Link href="/dashboard/track-record" className="label-mono text-[10px] text-[var(--gold)] hover:underline">
                      Ver historial completo →
                    </Link>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        {['Fecha', 'Instrumento', 'Dirección', 'Resultado', 'PnL'].map(h => (
                          <th key={h} className="px-5 py-3 text-left label-mono text-[10px] text-[var(--text-muted)]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {trackRecord.recentSessions.map((s, i) => (
                        <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[rgba(201,168,76,0.03)] transition-colors">
                          <td className="px-5 py-3 label-mono text-xs text-[var(--text-muted)]">
                            {new Date(s.date).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}
                          </td>
                          <td className="px-5 py-3 font-bold text-[var(--text-primary)] text-xs">{s.instrumento}</td>
                          <td className="px-5 py-3 label-mono text-xs text-[var(--text-secondary)]">{s.direccion}</td>
                          <td className="px-5 py-3">
                            <span className={`label-mono text-[10px] px-2 py-0.5 rounded-full ${
                              s.resultado === 'WIN'
                                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                                : s.resultado === 'LOSS'
                                  ? 'bg-red-950/40 text-red-400 border border-red-800/40'
                                  : 'text-[var(--text-muted)] border border-[var(--border)]'
                            }`}>
                              {s.resultado}
                            </span>
                          </td>
                          <td className={`px-5 py-3 label-mono text-xs font-bold ${s.pnlNeto >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {s.pnlNeto >= 0 ? '+' : ''}{s.pnlNeto.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="card p-8 text-center text-[var(--text-muted)] text-sm">
              Track record cargando...
            </div>
          )}
        </div>
      </section>

      {/* ─── PARA QUIÉN ES ────────────────────────────────── */}
      <section id="para-quien" className="py-24 px-4 border-y border-[var(--border)]"
        style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <div className="label-mono mb-3">¿Esto es para mí?</div>
            <h2 className="headline text-5xl sm:text-6xl text-[var(--text-primary)]">
              Para <span className="gradient-gold">cualquier punto de partida</span>
            </h2>
            <p className="text-[var(--text-secondary)] mt-4 max-w-lg mx-auto">
              No importa si nunca has invertido un dólar o si ya operas con cuenta propia.
              La suscripción se adapta a donde estás.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                tag: 'NUEVO EN INVERSIONES',
                title: 'El curioso que quiere probar',
                desc: [
                  'Pagas $29 y descubres en 1 mes si el trading es para ti',
                  'Si no te convence, cancelas — sin perder miles en un curso',
                  'Si te engancha, sigues: ya tienes las bases para avanzar',
                  'La formación empieza desde abrir tu primera cuenta de broker',
                  'Oportunidades identificadas en acciones y opciones para empezar a operar con contexto real',
                ],
              },
              {
                tag: 'QUIERO APRENDER EN SERIO',
                title: 'El que ya decidió aprender',
                desc: [
                  'Accedes a toda la formación desde cero hasta futuros Nasdaq',
                  'Mentorías 1:1 con Luis cada mes para avanzar más rápido',
                  'Reportes de oportunidades para aprender con contexto real del mercado',
                  'Coaching diario de Vinces IA para mejorar cada semana',
                  'Agentes de IA analizan el mercado en tiempo real y te entregan el resumen de las mejores oportunidades en acciones, opciones y futuros',
                ],
              },
              {
                tag: 'QUIERO SER TRADER PROFESIONAL',
                title: 'El que hace del trading su vida',
                desc: [
                  'Especialización profunda en futuros NQ/MNQ de Nasdaq',
                  'Revisión continua de tu operativa con Luis cada mes',
                  'Track record propio verificable para crecer como profesional',
                  'Señales y oportunidades en acciones y contratos de opciones — no solo futuros',
                  'Todo por $29/mes — cancela cuando quieras',
                ],
              },
            ].map((card) => (
              <div key={card.tag} className="card-panel relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 opacity-5"
                  style={{ background: 'radial-gradient(circle, var(--gold) 0%, transparent 70%)' }} />
                <div className="inline-block label-mono text-[9px] px-2 py-0.5 border border-[var(--gold-dark)] rounded-full text-[var(--gold)] mb-3">
                  {card.tag}
                </div>
                <h3 className="headline text-2xl text-[var(--text-primary)] mb-4">{card.title}</h3>
                <ul className="space-y-2">
                  {card.desc.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <span className="text-[var(--gold)] mt-0.5 flex-shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="#precios"
              className="btn-gold text-sm py-3.5 px-10 rounded-lg inline-block">
              Ver planes y precios →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── VINCES IA ──────────────────────────────────────── */}
      <section id="vinces" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
            <div>
              <div className="label-mono mb-3 text-[var(--gold)]">Incluido en tu membresía</div>
              <h2 className="headline text-5xl sm:text-6xl text-[var(--text-primary)] mb-5">
                Vinces Coach<br /><span className="gradient-gold">Inteligencia Artificial</span>
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-8">
                Vinces analiza tu operativa diaria, identifica patrones de error recurrentes,
                evalúa tu disciplina y genera reportes de coaching personalizados. Es tu mentor
                disponible las 24 horas.
              </p>
              <Link href="#precios" className="btn-gold text-sm py-3.5 px-7 rounded-lg">
                Incluido desde $29/mes →
              </Link>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              {[
                {
                  n: '01',
                  title: 'Registra tus operaciones',
                  desc: 'Ingresa cada trade con precio de entrada, salida, instrumento y notas.',
                },
                {
                  n: '02',
                  title: 'Vinces analiza tu data',
                  desc: 'La IA procesa tu historial, detecta patrones y áreas de mejora.',
                },
                {
                  n: '03',
                  title: 'Recibe tu reporte de coaching',
                  desc: 'Semanalmente recibes un informe con métricas, patrones y recomendaciones.',
                },
                {
                  n: '04',
                  title: 'Revisión 1:1 con Luis',
                  desc: 'Una vez al mes, revisión en vivo de tu operativa con Luis Riofrio — incluida en tu membresía.',
                },
              ].map((step) => (
                <div key={step.n} className="flex gap-4 card p-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg border border-[var(--gold-dark)] flex items-center justify-center"
                    style={{ background: 'rgba(201,168,76,0.08)' }}>
                    <span className="font-mono-custom text-xs text-[var(--gold)]">{step.n}</span>
                  </div>
                  <div>
                    <div className="font-bold text-sm mb-0.5">{step.title}</div>
                    <div className="text-sm text-[var(--text-secondary)]">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── LUIS BIO ───────────────────────────────────────── */}
      <section id="sobre-luis" className="py-24 px-4 border-y border-[var(--border)]"
        style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
            <div>
              <div className="label-mono mb-3">El Operador</div>
              <h2 className="headline text-5xl sm:text-6xl text-[var(--text-primary)] mb-5">
                Luis Riofrio —<br /><span className="gradient-gold">Operador Financiero</span>
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                Trader activo en Futuros Nasdaq (NQ/MNQ), acciones y opciones financieras con operativa institucional verificable.
                Resultados documentados con data real. Transparencia total en
                cada operación — ganadores y perdedores.
              </p>

              {/* Credentials */}
              <div className="space-y-2.5 mb-8">
                {[
                  'Operador Financiero en Emporium Quality Funds',
                  'Trader de Futuros NQ/MNQ, Acciones y Opciones Financieras',
                  'Fundador de Liberty Trading Club',
                  'Gestor de portafolios de acciones y opciones en IBKR',
                  'Operador P2P USDT y BTC — Ecuador y Latinoamérica',
                  'Mentor con más de 5 años formando traders en Latinoamérica',
                ].map((c) => (
                  <div key={c} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <span>{c}</span>
                  </div>
                ))}
              </div>

              <a href={WA} target="_blank" rel="noopener noreferrer"
                className="btn-outline text-sm py-3 px-6 rounded-lg flex items-center justify-center gap-2 w-full">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488" />
                </svg>
                Contactar directamente
              </a>
            </div>

            {/* Quote + commitment */}
            <div className="space-y-4">
              {/* Quote */}
              <div className="card border-l-2 border-[var(--gold)] rounded-xl pl-5">
                <p className="headline text-lg text-[var(--text-secondary)] italic mb-2">
                  &ldquo;Publicar mis resultados, incluyendo las pérdidas, es mi compromiso con la transparencia.
                  No vendo sueños — muestro datos reales.&rdquo;
                </p>
                <div className="label-mono text-[10px]">— Luis Riofrio, Emporium Quality Funds</div>
              </div>

              {/* Why subscription */}
              <div className="card p-5">
                <div className="label-mono mb-3 text-[var(--gold)]">¿Por qué suscripción y no un curso?</div>
                <ul className="space-y-2">
                  {[
                    'Los mercados cambian — tu formación debe actualizarse con ellos',
                    'Una mentoría mensual vale más que un curso grabado de hace 2 años',
                    'Pagas mientras aprendes — no un curso caro que quizás no terminas',
                    'Prueba con $29 en lugar de arriesgar $1,000 en algo desconocido',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <span className="text-[var(--gold)] mt-0.5 flex-shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── P2P CRIPTO ─────────────────────────────────────── */}
      <section id="p2p" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="label-mono mb-3 text-[var(--gold)]">Ecuador · Latinoamérica</div>
          <h2 className="headline text-5xl sm:text-6xl text-[var(--text-primary)] mb-5">
            Compra y vende<br /><span className="gradient-gold">USDT y BTC</span>
          </h2>
          <p className="text-[var(--text-secondary)] max-w-xl mb-12">
            Servicio P2P directo con Luis. Sin intermediarios, sin complicaciones.
            Disponible en Ecuador y toda Latinoamérica.
          </p>

          {/* Process */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { n: '01', title: 'Contáctanos', desc: 'Escríbenos por WhatsApp indicando monto y operación' },
              { n: '02', title: 'Acordamos precio', desc: 'Revisamos la tasa del mercado y acordamos el precio' },
              { n: '03', title: 'Realizas el pago', desc: 'Transferencia bancaria o efectivo según tu preferencia' },
              { n: '04', title: 'Recibes tu cripto', desc: 'Enviamos a tu wallet en minutos, con comprobante' },
            ].map((step) => (
              <div key={step.n} className="card text-left">
                <div className="label-mono text-[10px] text-[var(--gold)] mb-2">{step.n}</div>
                <div className="font-bold text-sm mb-1">{step.title}</div>
                <div className="text-xs text-[var(--text-muted)]">{step.desc}</div>
              </div>
            ))}
          </div>

          <a href={WA} target="_blank" rel="noopener noreferrer"
            className="btn-gold text-sm py-4 px-10 rounded-xl inline-flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488" />
            </svg>
            Iniciar P2P por WhatsApp
          </a>
          <p className="label-mono mt-3 text-[10px]">+593 99 669 1586</p>
        </div>
      </section>

      <Pricing />
      <Footer />

      <VincesWidget mode="landing" />
    </main>
  )
}
