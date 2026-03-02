import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/contexts/LanguageContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Liberty Trading Pro — Trading Institucional con Luis Riofrio',
  description:
    'Aprende a operar como los institucionales. Señales en tiempo real, análisis con IA, mentoring personalizado.',
  keywords: 'trading, forex, futuros, señales, Luis Riofrio, Ecuador',
  openGraph: {
    title: 'Liberty Trading Pro',
    description: 'Trading Institucional con Luis Riofrio',
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
    <html lang="es">
      <body className={inter.className}>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  )
}
