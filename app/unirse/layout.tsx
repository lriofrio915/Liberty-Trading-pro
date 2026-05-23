import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Únete al Club Liberty Trading | Plan Pro $29/mes',
  description:
    'Accede a toda la formación, herramientas y comunidad de Liberty Trading Pro. Day Trading NQ/MNQ, Vinces IA, Academia completa y track record real. $29/mes, cancela cuando quieras.',
  keywords: 'club trading, Liberty Trading Pro, unirse trading, 29 dólares mensual, Vinces IA, NQ MNQ futuros, Luis Riofrio',
  openGraph: {
    title: 'Únete al Club Liberty Trading Pro — $29/mes',
    description: 'Formación completa, señales en vivo, Vinces IA y comunidad privada. $29/mes, sin permanencia.',
    url: 'https://libertytrading.pro/unirse',
  },
}

export default function UnirseLayout({ children }: { children: React.ReactNode }) {
  return children
}
