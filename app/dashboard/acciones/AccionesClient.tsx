'use client'

import dynamic from 'next/dynamic'
import SectionVideo from '@/components/SectionVideo/SectionVideo'

const OportunidadesClient = dynamic(
  () => import('@/app/dashboard/oportunidades/OportunidadesClient'),
  { ssr: false },
) as React.ComponentType<{
  initialOpportunities: never[]
  plan: string
  isAdmin: boolean
}>

export default function AccionesClient({
  initialOpportunities,
  plan,
  isAdmin,
}: {
  initialOpportunities: never[]
  plan: string
  isAdmin: boolean
}) {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-black mb-2">
        <span className="gradient-gold">Acciones</span>
      </h1>
      <p className="text-[var(--text-secondary)] text-sm max-w-2xl mb-6">
        Recomendaciones del Agente Peter: cada mañana analiza el S&P 500 y el NASDAQ 100
        con los criterios de Peter Lynch, confirma la tendencia con un pronóstico de 30 días
        y publica aquí solo las empresas que pasan todos los filtros.
      </p>

      <SectionVideo
        section="acciones"
        isAdmin={isAdmin}
        label="VIDEO DEL PROFESIONAL"
        emptyText="El administrador aún no ha publicado un video para esta sección."
      />

      <OportunidadesClient initialOpportunities={initialOpportunities} plan={plan} isAdmin={isAdmin} />
    </div>
  )
}