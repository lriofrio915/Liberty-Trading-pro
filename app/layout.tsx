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
  title: 'Liberty Trading Pro — Operador Financiero Luis Riofrio',
  description:
    'Oportunidades de inversión en acciones y ETFs, coaching con IA, gestión de portafolio vía IBKR. Luis Riofrio, Operador Financiero en Emporium Quality Funds.',
  keywords: 'trading, futuros, inversión, acciones, ETFs, Luis Riofrio, Ecuador, IBKR, NinjaTrader',
  openGraph: {
    title: 'Liberty Trading Pro',
    description: 'Oportunidades de inversión con enfoque institucional — Luis Riofrio',
    url: 'https://libertytrading.pro',
    siteName: 'Liberty Trading Pro',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${cormorant.variable} ${dmMono.variable} ${syne.variable}`}>
      <head>
        <link rel="stylesheet" href="https://static.hotmart.com/css/hotmart-fb.min.css" />
      </head>
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
