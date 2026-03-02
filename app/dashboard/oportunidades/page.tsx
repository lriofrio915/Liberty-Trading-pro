import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function OportunidadesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  let opportunities: any[] = []
  let userPlan = 'FREE'

  try {
    const dbUser = await prisma.user.findUnique({ where: { authId: user?.id } })
    userPlan = dbUser?.plan || 'FREE'

    const planOrder = { FREE: 0, CLUB: 1, PRO: 2, PORTFOLIO: 3 }
    const userPlanLevel = planOrder[userPlan as keyof typeof planOrder] || 0

    opportunities = await prisma.opportunity.findMany({
      where: { active: true },
      orderBy: { publishedAt: 'desc' },
    })

    // Filter by plan
    opportunities = opportunities.filter(
      (o) => planOrder[o.minPlan as keyof typeof planOrder] <= userPlanLevel
    )
  } catch {}

  return (
    <div className="animate-fadeIn">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black mb-1">
            <span className="gradient-gold">Oportunidades</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Señales y análisis de inversión — Plan <span className="text-[var(--gold)] font-bold">{userPlan}</span>
          </p>
        </div>
      </div>

      {opportunities.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2">Contenido Premium</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-md mx-auto">
            Las oportunidades de inversión están disponibles para miembros Club y superiores.
          </p>
          <a href="/dashboard/planes" className="btn-gold inline-block py-3 px-8 rounded-xl">
            Ver Planes →
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opp) => (
            <div key={opp.id} className="card hover:border-[var(--gold-dark)] transition-all group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
                  {opp.tipo}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {new Date(opp.publishedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <h3 className="text-lg font-bold mb-1 group-hover:text-[var(--gold)] transition-colors">
                {opp.title}
              </h3>
              <div className="text-sm text-[var(--gold)] font-medium mb-3">{opp.instrumento}</div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                {opp.description}
              </p>

              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  opp.active ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'
                }`}>
                  {opp.active ? '● Activa' : '○ Cerrada'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
