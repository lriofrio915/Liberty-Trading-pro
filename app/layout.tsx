import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Mono, Syne } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/contexts/LanguageContext'
import ScrollToTop from '@/components/ScrollToTop'
import Script from 'next/script'

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

export const metadata: Metadata = {
  title: 'Liberty Trading Club — Club de Trading con Luis Riofrio',
  description:
    'Aprende Day Trading en futuros NQ/MNQ, invierte en acciones y ETFs, y opera con Vinces IA como tu coach. Club de trading con Luis Riofrio desde $29/mes. Cancela cuando quieras.',
  keywords: 'trading, futuros, inversión, acciones, ETFs, Luis Riofrio, Ecuador, IBKR, NinjaTrader, club trading, 29 dólares, plan mensual, NQ MNQ Nasdaq',
  openGraph: {
    title: 'Liberty Trading Club — Club de Trading | $29/mes',
    description: 'Day Trading NQ/MNQ, inversión en acciones y ETFs, Vinces IA y comunidad privada. Luis Riofrio — $29/mes, cancela cuando quieras.',
    url: 'https://libertytrading.pro',
    siteName: 'Liberty Trading Club',
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
