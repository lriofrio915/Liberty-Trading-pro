import Navbar from '@/components/Navbar/Navbar'
import Hero from '@/components/Hero/Hero'
import Pricing from '@/components/Pricing/Pricing'
import Footer from '@/components/Footer/Footer'
import CustomCursor from '@/components/CustomCursor/CustomCursor'
import Link from 'next/link'

const WA = 'https://wa.me/+593996691586?text=Hola%20Luis%2C%20me%20interesa%20el%20servicio%20P2P%20de%20USDT%2FBTC'

export default function LandingPage() {
  return (
    <main className="relative noise">
      <CustomCursor />
      <Navbar />
      <Hero />

      {/* ─── SERVICIOS ──────────────────────────────────────── */}
      <section id="servicios" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <div className="label-mono mb-3">Lo que ofrecemos</div>
            <h2 className="headline text-5xl sm:text-6xl text-[var(--text-primary)]">
              Todo lo que necesitas para<br />
              <span className="gradient-gold">operar con ventaja</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                num: '01',
                icon: '🎓',
                title: 'Liberty Academy',
                desc: 'Especialización en Trading de Futuros (12 meses) y Mentoría Integral de Mercados Financieros (2 meses). Formación estructurada con Luis Riofrio.',
                badge: 'Formación',
              },
              {
                num: '02',
                icon: '🤖',
                title: 'Vinces Coach IA',
                desc: 'Tu mentor de trading personal con inteligencia artificial. Analiza tu operativa diaria, detecta patrones y genera reportes personalizados de coaching.',
                badge: 'IA',
              },
              {
                num: '03',
                icon: '📊',
                title: 'Club de Inversión',
                desc: 'Oportunidades en acciones y ETFs para inversión a mediano y largo plazo. Análisis fundamental de empresas, no señales de day trading.',
                badge: 'Club',
              },
              {
                num: '04',
                icon: '🏦',
                title: 'Gestión de Portafolio IBKR',
                desc: 'Luis replica su operativa en tu cuenta de Interactive Brokers mediante NinjaTrader 8. Sin mensualidad — 1% gestión + 30% sobre ganancias.',
                badge: 'Premium',
              },
              {
                num: '05',
                icon: '💱',
                title: 'P2P Cripto',
                desc: 'Compra y vende USDT y BTC directamente con Luis por WhatsApp. Disponible en Ecuador y Latinoamérica. Rápido, seguro, sin intermediarios.',
                badge: 'P2P',
              },
              {
                num: '06',
                icon: '🌐',
                title: 'Monitor Mundial',
                desc: 'Seguimiento de eventos geopolíticos y macroeconómicos que impactan los mercados. Información en tiempo real para tomar mejores decisiones.',
                badge: 'Free',
              },
            ].map((s) => (
              <div key={s.num}
                className="card hover:border-[var(--gold-dark)] transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-4 right-4 label-mono text-[9px] px-2 py-0.5 border border-[var(--border)] rounded-full">
                  {s.badge}
                </div>
                <div className="label-mono text-[10px] mb-3 text-[var(--gold-dark)]">{s.num}</div>
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="text-base font-bold mb-2 group-hover:text-[var(--gold)] transition-colors">
                  {s.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LIBERTY ACADEMY ────────────────────────────────── */}
      <section id="academia" className="py-24 px-4 border-y border-[var(--border)]"
        style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-14 text-center">
            <div className="label-mono mb-3">Formación estructurada</div>
            <h2 className="headline text-5xl sm:text-6xl text-[var(--text-primary)]">
              Liberty <span className="gradient-gold">Academy</span>
            </h2>
            <p className="text-[var(--text-secondary)] mt-4 max-w-lg mx-auto">
              Programas de formación intensiva en trading de futuros con Luis Riofrio como mentor directo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Curso 1 */}
            <div className="card-panel relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 opacity-5"
                style={{ background: 'radial-gradient(circle, var(--gold) 0%, transparent 70%)' }} />
              <div className="label-mono mb-2 text-[var(--gold)]">12 Meses</div>
              <h3 className="headline text-3xl text-[var(--text-primary)] mb-2">
                Especialización en<br />Trading de Futuros
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-5 leading-relaxed">
                Programa completo de formación en operativa de futuros Nasdaq y SP500.
                Estrategia, gestión de riesgo, psicología y operativa en tiempo real.
              </p>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="label-mono mb-1">Inversión</div>
                  <div className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-serif)' }}>
                    €840
                  </div>
                </div>
                <div className="text-right">
                  <div className="label-mono mb-1">Duración</div>
                  <div className="text-sm font-medium">12 meses · Online</div>
                </div>
              </div>
              <a href="https://go.hotmart.com/R33067457O" target="_blank" rel="noopener noreferrer"
                className="btn-gold text-sm py-3 px-6 rounded-lg w-full text-center block">
                Ver Especialización en Hotmart →
              </a>
            </div>

            {/* Curso 2 */}
            <div className="card-panel relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 opacity-5"
                style={{ background: 'radial-gradient(circle, var(--gold) 0%, transparent 70%)' }} />
              <div className="label-mono mb-2 text-[var(--gold)]">2 Meses</div>
              <h3 className="headline text-3xl text-[var(--text-primary)] mb-2">
                Mentoría Integral de<br />Mercados Financieros
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-5 leading-relaxed">
                Mentoría intensiva personalizada. Análisis de mercados, estrategia individual,
                revisiones de operativa y acceso directo a Luis durante 2 meses.
              </p>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="label-mono mb-1">Inversión</div>
                  <div className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-serif)' }}>
                    $489
                  </div>
                </div>
                <div className="text-right">
                  <div className="label-mono mb-1">Duración</div>
                  <div className="text-sm font-medium">2 meses · Online</div>
                </div>
              </div>
              <a href="https://go.hotmart.com/R104429889B" target="_blank" rel="noopener noreferrer"
                className="btn-outline text-sm py-3 px-6 rounded-lg w-full text-center block">
                Ver Mentoría en Hotmart →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── VINCES IA ──────────────────────────────────────── */}
      <section id="vinces" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
            <div>
              <div className="label-mono mb-3 text-[var(--gold)]">Coaching con IA</div>
              <h2 className="headline text-5xl sm:text-6xl text-[var(--text-primary)] mb-5">
                Vinces Coach<br /><span className="gradient-gold">Inteligencia Artificial</span>
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-8">
                Vinces analiza tu operativa diaria, identifica patrones de error recurrentes,
                evalúa tu disciplina y genera reportes de coaching personalizados. Es tu mentor
                disponible las 24 horas.
              </p>
              <Link href="/register?plan=pro" className="btn-gold text-sm py-3.5 px-7 rounded-lg">
                Activar Vinces IA →
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
                  title: 'Revisión 1:1 con Luis (PRO)',
                  desc: 'Una vez al mes, revisión en vivo de tu operativa con Luis Riofrio.',
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
                Trader de Futuros Nasdaq y SP500 con operativa institucional verificable.
                Resultados documentados con capturas de pantalla. Transparencia total en
                cada operación — ganadores y perdedores.
              </p>

              {/* Credentials */}
              <div className="space-y-2.5 mb-8">
                {[
                  '🏛 Operador Financiero en Emporium Quality Funds',
                  '📈 Trader de Futuros Nasdaq (NQ) y SP500 (ES)',
                  '🤝 Fundador de Liberty Trading Club',
                  '🏦 Gestor de portafolios vía IBKR + NinjaTrader 8',
                  '💱 Operador P2P USDT y BTC — Ecuador y Latinoamérica',
                  '🎓 Mentor con 2 programas activos en Hotmart',
                ].map((c) => (
                  <div key={c} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <span>{c}</span>
                  </div>
                ))}
              </div>

              <a href={WA} target="_blank" rel="noopener noreferrer"
                className="btn-outline text-sm py-3 px-6 rounded-lg inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488" />
                </svg>
                Contactar directamente
              </a>
            </div>

            {/* Stats grid */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: '+11.94%', label: 'Rendimiento YTD 2026', color: 'var(--gold)' },
                  { value: '71.4%', label: 'Win Rate verificado', color: 'var(--green)' },
                  { value: '2.55x', label: 'Profit Factor', color: 'var(--gold)' },
                  { value: '10/14', label: 'Trades ganados 2026', color: 'var(--green)' },
                ].map((s) => (
                  <div key={s.label} className="card text-center py-5">
                    <div className="text-3xl font-bold mb-1"
                      style={{ fontFamily: 'var(--font-serif)', color: s.color }}>
                      {s.value}
                    </div>
                    <div className="label-mono text-[10px]">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Quote */}
              <div className="card border-l-2 border-[var(--gold)] rounded-xl pl-5">
                <p className="headline text-lg text-[var(--text-secondary)] italic mb-2">
                  &ldquo;Publicar mis resultados, incluyendo las pérdidas, es mi compromiso con la transparencia.
                  No vendo sueños — muestro datos reales.&rdquo;
                </p>
                <div className="label-mono text-[10px]">— Luis Riofrio, Emporium Quality Funds</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── P2P CRIPTO ─────────────────────────────────────── */}
      <section id="p2p" className="py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="label-mono mb-3 text-[var(--gold)]">Ecuador · Latinoamérica</div>
          <h2 className="headline text-5xl sm:text-6xl text-[var(--text-primary)] mb-5">
            Compra y vende<br /><span className="gradient-gold">USDT y BTC</span>
          </h2>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto mb-12">
            Servicio P2P directo con Luis. Sin intermediarios, sin complicaciones.
            Disponible en Ecuador y toda Latinoamérica.
          </p>

          {/* Process */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { n: '01', icon: '💬', title: 'Contáctanos', desc: 'Escríbenos por WhatsApp indicando monto y operación' },
              { n: '02', icon: '🤝', title: 'Acordamos precio', desc: 'Revisamos la tasa del mercado y acordamos el precio' },
              { n: '03', icon: '💸', title: 'Realizas el pago', desc: 'Transferencia bancaria o efectivo según tu preferencia' },
              { n: '04', icon: '✅', title: 'Recibes tu cripto', desc: 'Enviamos a tu wallet en minutos, con comprobante' },
            ].map((step) => (
              <div key={step.n} className="card text-left">
                <div className="label-mono text-[10px] text-[var(--gold)] mb-2">{step.n}</div>
                <div className="text-2xl mb-2">{step.icon}</div>
                <div className="font-bold text-sm mb-1">{step.title}</div>
                <div className="text-xs text-[var(--text-muted)]">{step.desc}</div>
              </div>
            ))}
          </div>

          <a href={WA} target="_blank" rel="noopener noreferrer"
            className="btn-gold text-sm py-4 px-10 rounded-xl inline-flex items-center gap-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488" />
            </svg>
            Iniciar P2P por WhatsApp
          </a>
          <p className="label-mono mt-3 text-[10px]">+593 99 669 1586</p>
        </div>
      </section>

      <Pricing />
      <Footer />
    </main>
  )
}
