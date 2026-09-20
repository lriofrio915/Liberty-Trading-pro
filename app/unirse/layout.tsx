import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Curso gratuito de trading | Liberty Trading Pro',
  description:
    'Aprende gratis a abrir tu cuenta en Interactive Brokers, analizar acciones con Claude y entender opciones. Con Luis Riofrio, trader cuantitativo con track record público verificable.',
  keywords: 'curso gratis trading, Liberty Trading Pro, IBKR, análisis de acciones, opciones, Luis Riofrio',
  openGraph: {
    title: 'Curso gratuito de trading — Liberty Trading Pro',
    description: 'De cero a tu primera cuenta en acciones y opciones. 100% gratis, sin tarjeta.',
    url: 'https://libertytrading.pro/unirse',
  },
}

export default function UnirseLayout({ children }: { children: React.ReactNode }) {
  return children
}
