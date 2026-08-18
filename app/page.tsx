import Navbar from '@/components/Navbar/Navbar'
import Hero from '@/components/Hero/Hero'
import Pricing from '@/components/Pricing/Pricing'
import Footer from '@/components/Footer/Footer'
import VincesWidget from '@/components/VincesWidget/VincesWidget'
import BrandPhoto from '@/components/BrandPhoto/BrandPhoto'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { BRAND, SERVICES, RISK_DISCLAIMER, wa } from '@/lib/brand'

const CREDENTIALS = [
  'Trader de Futuros NQ/MNQ, acciones y opciones',
  'Gestor de portafolios en Interactive Brokers',
  'Más de 5 años formando traders en Latinoamérica',
]

const FAQS = [
  {
    q: '¿Sirve si empiezo desde cero?',
    a: 'Sí. La formación arranca en la apertura de tu primera cuenta de broker y avanza hasta operar futuros.',
  },
  {
    q: '¿Puedo cancelar cuando quiera?',
    a: 'Sí. La suscripción se cancela desde tu cuenta de Hotmart, sin penalización.',
  },
  {
    q: '¿Los bots funcionan en pruebas de fondeo?',
    a: 'Sí. Están configurados para respetar los límites de drawdown de las mesas de fondeo y también operan en cuenta real.',
  },
]

/**
 * Cómo trabaja Luis. Reemplaza al bloque de métricas: la landing convence con
 * método y cercanía; las cifras operación por operación viven en /track-record.
 */
const METODO = [
  {
    title: 'Opero mi propio capital',
    desc: 'Lo que enseño es lo que hago cada mañana en cuenta real, no en simulador.',
  },
  {
    title: 'Publico ganadoras y perdedoras',
    desc: 'Mi historial de operaciones es público y verificable, sin filtros ni recortes.',
  },
  {
    title: 'Te acompaño uno a uno',
    desc: 'Desde abrir tu cuenta de broker hasta ejecutar tu primera operación.',
  },
]

export default async function LandingPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <main className="relative noise">
      <Navbar initialUser={session?.user ?? null} />
      <Hero />

      {/* ─── 1 · SERVICIOS ───────────────────────────────────── */}
      <section id="servicios" className="py-20 px-4 border-y border-[var(--border)]"
        style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <div className="label-mono mb-3 text-[var(--gold)]">Cuatro servicios</div>
            <h2 className="headline text-4xl sm:text-5xl text-[var(--text-primary)]">
              En qué te puedo <span className="gradient-gold">ayudar</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {SERVICES.map((s) => (
              <div key={s.id} className="card flex flex-col hover:border-[var(--gold-dark)] transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="label-mono text-[9px] text-[var(--gold)] mb-1">
                      {s.num} · {s.category}
                    </div>
                    <h3 className="headline text-2xl text-[var(--text-primary)]">{s.name}</h3>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <div className="font-mono-custom text-sm font-bold text-[var(--gold)]">{s.price}</div>
                    <div className="label-mono text-[9px]">{s.priceNote}</div>
                  </div>
                </div>

                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">{s.pitch}</p>

                <ul className="space-y-1.5 mb-6">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <span className="text-[var(--gold)] mt-0.5 flex-shrink-0">✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex items-center gap-3">
                  <a
                    href={s.href}
                    {...(s.hotmart
                      ? { className: 'hotmart-fb hotmart__button-checkout btn-gold text-sm py-3 px-6 rounded-lg' }
                      : { target: '_blank', rel: 'noopener noreferrer', className: 'btn-gold text-sm py-3 px-6 rounded-lg' })}>
                    {s.cta} →
                  </a>
                  {s.id === 'exchange' && (
                    <Link href="/p2p" className="label-mono text-[10px] text-[var(--gold)] hover:underline">
                      Cómo funciona
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 2 · PRUEBA: LUIS + MÉTODO ───────────────────────── */}
      <section id="metodo" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-12 items-start">

            {/* Luis */}
            <div id="sobre-luis">
              <div className="rounded-2xl overflow-hidden border border-[var(--border)] mb-6 max-w-xs">
                <BrandPhoto
                  src={BRAND.photos.portrait}
                  alt={`Retrato de ${BRAND.name}`}
                  width={1000}
                  height={1000}
                  sizes="(max-width: 1024px) 288px, 320px"
                  className="w-full h-auto"
                />
              </div>

              <div className="label-mono mb-2">Quién está detrás</div>
              <h2 className="headline text-4xl sm:text-5xl text-[var(--text-primary)] mb-4">
                {BRAND.name} — <span className="gradient-gold">{BRAND.role}</span>
              </h2>

              <ul className="space-y-2 mb-6">
                {CREDENTIALS.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="text-[var(--gold)] mt-0.5 flex-shrink-0">·</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>

              <div className="card border-l-2 border-[var(--gold)] rounded-xl pl-5">
                <p className="headline text-lg text-[var(--text-secondary)] italic mb-2">
                  &ldquo;Publico mis pérdidas igual que mis ganancias. No vendo sueños — muestro datos.&rdquo;
                </p>
                <div className="label-mono text-[10px]">— {BRAND.name}</div>
              </div>
            </div>

            {/* Método */}
            <div>
              <div className="label-mono mb-2 text-[var(--gold)]">Transparencia total</div>
              <h3 className="headline text-3xl sm:text-4xl text-[var(--text-primary)] mb-6">
                Así trabajo <span className="gradient-gold">contigo</span>
              </h3>

              {/* Foto placeholder — reemplazar la ruta en lib/brand.ts (photos.desk) */}
              <div className="rounded-2xl overflow-hidden border border-[var(--border)] mb-6">
                <BrandPhoto
                  src={BRAND.photos.desk}
                  alt={`${BRAND.name} operando en su escritorio`}
                  width={1800}
                  height={1200}
                  sizes="(max-width: 1024px) 100vw, 640px"
                  className="w-full h-auto"
                />
              </div>

              <div className="space-y-3 mb-6">
                {METODO.map((m) => (
                  <div key={m.title} className="card p-5">
                    <div className="text-sm font-bold text-[var(--text-primary)] mb-1">{m.title}</div>
                    <div className="text-sm text-[var(--text-secondary)] leading-relaxed">{m.desc}</div>
                  </div>
                ))}
              </div>

              <Link href={`/track-record/${BRAND.trackRecordSlug}`}
                className="btn-outline text-sm py-3 px-6 rounded-lg inline-flex items-center gap-2">
                Ver mi historial de operaciones →
              </Link>

            </div>

          </div>
        </div>
      </section>

      {/* ─── 3 · PRECIO ──────────────────────────────────────── */}
      <Pricing />

      {/* ─── 4 · CIERRE: FAQ + CTA + DISCLAIMER ──────────────── */}
      <section className="py-20 px-4 border-t border-[var(--border)]"
        style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-5xl mx-auto">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {FAQS.map((item) => (
              <div key={item.q} className="card p-5">
                <div className="text-sm font-bold text-[var(--text-primary)] mb-2">{item.q}</div>
                <div className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.a}</div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <h2 className="headline text-4xl sm:text-5xl text-[var(--text-primary)] mb-4">
              ¿Hablamos de <span className="gradient-gold">tu caso</span>?
            </h2>
            <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-8">
              Escríbeme y te digo cuál de los cuatro servicios encaja contigo. Sin compromiso.
            </p>
            <a href={wa('Hola Luis, quiero saber cuál de tus servicios encaja conmigo')}
              target="_blank" rel="noopener noreferrer"
              className="btn-gold text-sm py-4 px-10 rounded-xl inline-flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488" />
              </svg>
              Escribir por WhatsApp
            </a>
            <p className="label-mono mt-3 text-[10px]">{BRAND.phoneDisplay} · {BRAND.location}</p>
          </div>

          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed max-w-3xl mx-auto mt-14 pt-6 border-t border-[var(--border)]">
            {RISK_DISCLAIMER}
          </p>
        </div>
      </section>

      <Footer />
      <VincesWidget mode="landing" />
    </main>
  )
}
