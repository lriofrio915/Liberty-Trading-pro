import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { BRAND } from '@/lib/brand'

/**
 * Página de enlaces de Luis para compartir en redes. Existe porque la vista
 * previa de un link de Facebook/Instagram la genera Meta con la foto de perfil;
 * esta URL sí controla su imagen de vista previa (/brand/og-luis.png).
 */
const TITLE = `${BRAND.name} — ${BRAND.role}`
const DESCRIPTION = 'Mercados, bots y estrategias algorítmicas. Curso gratis, redes y Liberty Trading Club.'

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: '/luis' },
  openGraph: {
    type: 'profile',
    locale: 'es_EC',
    url: '/luis',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/brand/og-luis.png', width: 1200, height: 630, alt: TITLE }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/brand/og-luis.png'] },
}

const LINKS = [
  { label: 'Curso gratis de trading', href: '/unirse', primary: true },
  { label: BRAND.legalName, href: '/' },
  { label: 'Página de Facebook', href: BRAND.social.luisFacebook },
  { label: 'Instagram @luisriofrioec', href: BRAND.social.luisInstagram },
  { label: 'Escríbeme por WhatsApp', href: BRAND.social.whatsapp },
]

export default function LuisPage() {
  return (
    <main className="min-h-screen grid-bg flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm text-center">
        <Image src="/brand/luis-retrato.jpg" alt={BRAND.name} width={128} height={128} priority
          className="mx-auto rounded-full border border-[var(--gold-dark)] object-cover" />
        <h1 className="headline text-5xl gradient-gold mt-6">{BRAND.name}</h1>
        <div className="label-mono mt-3">{BRAND.role}</div>
        <p className="text-sm text-[var(--text-secondary)] mt-3">Mercados · Bots · Estrategias algorítmicas</p>

        <ul className="mt-10 flex flex-col gap-3">
          {LINKS.map((l) => {
            const external = l.href.startsWith('http')
            const cls = l.primary
              ? 'btn-gold block w-full py-3.5'
              : 'block w-full py-3.5 rounded-lg border border-[var(--border)] label-mono text-[11px] text-[var(--text-primary)] hover:border-[var(--gold)] transition-colors'
            return (
              <li key={l.href}>
                {external
                  ? <a href={l.href} target="_blank" rel="noopener noreferrer" className={cls}>{l.label}</a>
                  : <Link href={l.href} className={cls}>{l.label}</Link>}
              </li>
            )
          })}
        </ul>

        <Image src={BRAND.logos.respaldo} alt={`${BRAND.legalName} por ${BRAND.name}`} width={220} height={89}
          className="mx-auto mt-12 h-16 w-auto opacity-80" unoptimized />
      </div>
    </main>
  )
}
