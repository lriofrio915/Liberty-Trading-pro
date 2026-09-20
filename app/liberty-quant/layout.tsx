import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Liberty Quant — Trading Cuantitativo de Futuros | $1,000 pago único',
  description:
    'Especialización en trading algorítmico y cuantitativo de futuros con NinjaTrader 8 y Claude. Incluye el código de 6 estrategias del portafolio real y un pase directo a cuenta fondeada de $200,000. Pago único, sin mensualidad.',
  keywords: 'Liberty Quant, trading cuantitativo, NinjaTrader 8, cuenta fondeada, futuros NQ MNQ, Walk-Forward Optimization, Luis Riofrio',
  openGraph: {
    title: 'Liberty Quant — De la especulación al portafolio cuantitativo',
    description: 'Código de 6 estrategias reales + cuenta fondeada de $200k. $1,000, pago único.',
    url: 'https://libertytrading.pro/liberty-quant',
  },
}

export default function LibertyQuantLayout({ children }: { children: React.ReactNode }) {
  return children
}
