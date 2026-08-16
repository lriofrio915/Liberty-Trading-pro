import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Mono, Syne } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/contexts/LanguageContext'
import ScrollToTop from '@/components/ScrollToTop'
import Script from 'next/script'
import { BRAND } from '@/lib/brand'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['300', '400', '500'],
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const DESCRIPTION =
  'Educación en trading de futuros, bots para NinjaTrader, intercambio de cripto a dólares y ' +
  'asesoría para invertir en acciones de EEUU. Con cada operación publicada — ganadoras y perdedoras.'

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.url),
  title: {
    default: `${BRAND.name} — ${BRAND.role}`,
    template: `%s | ${BRAND.name}`,
  },
  description: DESCRIPTION,
  keywords:
    'Luis Riofrio, asesor de inversiones, trading futuros, NinjaTrader 8, bots de trading, ' +
    'pruebas de fondeo, comprar acciones EEUU, IBKR, Interactive Brokers, USDT Ecuador, ' +
    'intercambio cripto, NQ MNQ Nasdaq, trading algorítmico',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'es_EC',
    title: `${BRAND.name} — ${BRAND.role}`,
    description: DESCRIPTION,
    url: BRAND.url,
    siteName: BRAND.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND.name} — ${BRAND.role}`,
    description: DESCRIPTION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${cormorant.variable} ${dmMono.variable} ${syne.variable}`}>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
        <ScrollToTop />
        <Script
          src="https://static.hotmart.com/checkout/widget.min.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}
