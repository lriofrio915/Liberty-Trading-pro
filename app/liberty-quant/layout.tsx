import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Liberty Quant Club — Trading algorítmico cuantitativo | $1,500 lifetime',
  description:
    'Aprende trading algorítmico cuantitativo con Claude Code, NinjaTrader 8 y Obsidian. Incluye 6 bots del portafolio comunitario listos para instalar y un pase directo a cuenta fondeada de $200k en PJ Capital (valor $300). Pago único, acceso de por vida.',
  keywords: 'Liberty Quant Club, trading algorítmico, trading cuantitativo, NinjaTrader 8, Claude Code, Obsidian, cuenta fondeada 200k, PJ Capital, bots de trading, Luis Riofrio',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Liberty Quant Club — Convierte el trading algorítmico en tu negocio',
    description: 'Video clases + 6 bots para NinjaTrader 8 + cuenta fondeada de $200k incluida. $1,500, pago único.',
    url: 'https://libertytrading.pro/liberty-quant',
  },
}

export default function LibertyQuantLayout({ children }: { children: React.ReactNode }) {
  return children
}
