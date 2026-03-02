import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function PlanesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  let plans: any[] = []

  try {
    const dbUser = await prisma.user.findUnique({ where: { authId: user?.id } })
    if (dbUser) {
      plans = await prisma.tradingPlan.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: 'desc' },
      })
    }
  } catch {}

  return (
    <div className="animate-fadeIn">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black mb-1">
            <span className="gradient-gold">Planes de Trading</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">Define tus reglas y gestión de riesgo</p>
        </div>
        <button className="btn-gold py-2 px-4 rounded-lg text-sm">+ Nuevo Plan</button>
      </div>

      {plans.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-bold mb-2">Sin planes de trading</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-md mx-auto">
            Crea tu plan de trading para definir tus reglas, gestión de riesgo y objetivos.
          </p>
          <button className="btn-gold inline-block py-3 px-8 rounded-xl">Crear Plan</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className={`card-gold ${!plan.active ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${plan.active ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'}`}>
                  {plan.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Broker', value: plan.broker },
                  { label: 'Cuenta', value: plan.accountName },
                  { label: 'Capital', value: `$${plan.capitalInicial.toLocaleString()}` },
                  { label: 'Riesgo/Trade', value: `${plan.riesgo}%` },
                  { label: 'R:R Objetivo', value: `${plan.rrRatio}:1` },
                  { label: 'Instrumento', value: plan.instrumento },
                  { label: 'Horario', value: `${plan.horaInicio} - ${plan.horaFin}` },
                  { label: 'Stop', value: plan.gestionStop },
                ].map((item) => (
                  <div key={item.label}>
                    <span className="text-[var(--text-muted)] text-xs">{item.label}</span>
                    <div className="font-medium text-sm">{item.value}</div>
                  </div>
                ))}
              </div>

              {plan.reglas && (
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <div className="text-xs text-[var(--text-muted)] mb-1">Reglas</div>
                  <p className="text-sm text-[var(--text-secondary)] line-clamp-3">{plan.reglas}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
