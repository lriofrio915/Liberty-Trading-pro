'use client'

import AgentePeter from './AgentePeter'

export default function AgentesClient({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-black mb-2">
        <span className="gradient-gold">Agentes IA</span>
      </h1>
      <p className="text-[var(--text-secondary)] text-sm max-w-2xl mb-8">
        Agentes automatizados que orquestan los filtros del sistema para identificar,
        confirmar y publicar recomendaciones de inversión.
      </p>

      <div className="space-y-6">
        <AgentePeter isAdmin={isAdmin} />
      </div>
    </div>
  )
}
