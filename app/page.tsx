import Navbar from '@/components/Navbar/Navbar'
import Hero from '@/components/Hero/Hero'
import Pricing from '@/components/Pricing/Pricing'
import Footer from '@/components/Footer/Footer'

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />

      {/* Servicios */}
      <section id="servicios" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Todo lo que necesitas para{' '}
              <span className="gradient-gold">operar con ventaja</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '📊',
                title: 'Señales en Tiempo Real',
                desc: 'Recibe alertas de entradas y salidas basadas en análisis institucional. Niveles de precio precisos con gestión de riesgo incluida.',
              },
              {
                icon: '🤖',
                title: 'Vinces AI',
                desc: 'Asistente de trading con inteligencia artificial. Analiza tus operaciones, identifica patrones y sugiere mejoras personalizadas.',
              },
              {
                icon: '📈',
                title: 'Track Record Público',
                desc: 'Transparencia total. Todas las operaciones de Luis documentadas con capturas de pantalla verificadas y métricas reales.',
              },
              {
                icon: '🎯',
                title: 'Gestión de Riesgo',
                desc: 'Aprende a dimensionar posiciones, gestionar drawdowns y proteger tu capital con métodos institucionales probados.',
              },
              {
                icon: '📋',
                title: 'Reportes Automáticos',
                desc: 'Reportes semanales y mensuales generados automáticamente con tus métricas, patrones y áreas de mejora.',
              },
              {
                icon: '💱',
                title: 'P2P Crypto',
                desc: 'Compra y vende USDT de forma segura directamente con Luis. Proceso simple, tarifas competitivas, confianza garantizada.',
              },
            ].map((service) => (
              <div key={service.title} className="card hover:border-[var(--gold-dark)] transition-colors group">
                <div className="text-3xl mb-4">{service.icon}</div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-[var(--gold)] transition-colors">
                  {service.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sobre Luis */}
      <section id="sobre-luis" className="py-24 px-4 border-y border-[var(--border)]"
        style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-6">👤</div>
          <h2 className="text-4xl font-black mb-6">
            Luis Riofrio —{' '}
            <span className="gradient-gold">Operador Verificado</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-8 max-w-2xl mx-auto">
            Operador Junior en Emporium Quality Funds. Especializado en futuros y forex con enfoque
            institucional. Resultados documentados y verificables. YTD 2026: +11.94% con Profit Factor 2.55x.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '10/14', label: 'Trades Ganados 2026' },
              { value: '+11.94%', label: 'Rendimiento YTD' },
              { value: '2.55x', label: 'Profit Factor' },
              { value: '71.4%', label: 'Win Rate' },
            ].map((s) => (
              <div key={s.label} className="card-gold text-center">
                <div className="text-2xl font-black text-[var(--gold)]">{s.value}</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Pricing />
      <Footer />
    </main>
  )
}
