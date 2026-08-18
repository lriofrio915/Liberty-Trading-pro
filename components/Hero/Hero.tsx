'use client'

import Link from 'next/link'
import TickerBar from '@/components/TickerBar/TickerBar'
import BrandPhoto from '@/components/BrandPhoto/BrandPhoto'
import { BRAND, wa } from '@/lib/brand'

const LUIS_WA = wa('Hola Luis, quiero información sobre tus servicios de inversión')

/**
 * Señales de confianza cualitativas. Sustituyen a los KPI numéricos: la landing
 * vende criterio y cercanía, las métricas viven en /track-record.
 */
const TRUST = [
  'Cuenta real, no simulador',
  'Cada operación publicada',
  'Acompañamiento 1 a 1',
]

export default function Hero() {
  return (
    <>
      <div className="pt-16">
        <TickerBar />
      </div>

      <section className="relative overflow-hidden grid-bg">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-24 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">

            {/* Texto */}
            <div>
              <div
                className="inline-flex items-center gap-2.5 border border-[var(--gold-dark)] rounded-full px-4 py-1.5 mb-6"
                style={{ background: 'rgba(201,168,76,0.06)' }}>
                <span className="w-2 h-2 rounded-full bg-[var(--green)] pulse-dot" />
                <span className="font-mono-custom text-[11px] text-[var(--gold)] tracking-wider">
                  {BRAND.credential}
                </span>
              </div>

              <h1 className="headline text-5xl sm:text-6xl lg:text-7xl text-[var(--text-primary)] mb-5">
                Invierte con quien <span className="gradient-gold">opera de verdad</span>
              </h1>

              <p className="text-base text-[var(--text-secondary)] max-w-md mb-8 leading-relaxed">
                Educación, bots, cripto y asesoría en acciones de EEUU. Con cada operación mía
                publicada — ganadoras y perdedoras.
              </p>

              {/* Señales de confianza */}
              <div className="flex flex-wrap gap-2 mb-8 max-w-md">
                {TRUST.map((t) => (
                  <span key={t}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3.5 py-1.5 text-[12px] text-[var(--text-secondary)]"
                    style={{ background: 'var(--bg-card)' }}>
                    <span className="text-[var(--gold)]">✓</span>
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a href="#servicios" className="btn-gold text-sm py-3.5 px-7 rounded-lg text-center">
                  Ver mis servicios →
                </a>
                <a href={LUIS_WA} target="_blank" rel="noopener noreferrer"
                  className="btn-outline text-sm py-3.5 px-7 rounded-lg inline-flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488" />
                  </svg>
                  Hablar con Luis
                </a>
              </div>
            </div>

            {/* Foto */}
            {/* En móvil va debajo del titular: el mensaje vende más que la foto */}
            <div className="relative max-w-xs sm:max-w-sm mx-auto lg:max-w-none w-full mb-4 lg:mb-0">
              <div className="relative rounded-2xl overflow-hidden border border-[var(--border)]">
                <BrandPhoto
                  src={BRAND.photos.hero}
                  alt={`${BRAND.name}, ${BRAND.role}`}
                  width={1200}
                  height={1500}
                  priority
                  sizes="(max-width: 1024px) 384px, 480px"
                  className="w-full h-auto"
                />
                {/* Degradado inferior para fundir la foto con la página */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4"
                  style={{ background: 'linear-gradient(to top, var(--bg-primary), transparent)' }} />
              </div>

              <div className="absolute -bottom-3 left-4 right-4 card px-4 py-3 flex items-center justify-between"
                style={{ background: 'var(--bg-card)' }}>
                <div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">{BRAND.name}</div>
                  <div className="label-mono text-[9px]">{BRAND.role}</div>
                </div>
                <Link href={`/track-record/${BRAND.trackRecordSlug}`}
                  className="label-mono text-[9px] text-[var(--gold)] hover:underline flex-shrink-0">
                  Track record →
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
