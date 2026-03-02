import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function ReportesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  let weeklyReports: any[] = []
  let monthlyReports: any[] = []

  try {
    const dbUser = await prisma.user.findUnique({ where: { authId: user?.id } })
    if (dbUser) {
      ;[weeklyReports, monthlyReports] = await Promise.all([
        prisma.weeklyReport.findMany({ where: { userId: dbUser.id }, orderBy: { weekStart: 'desc' }, take: 5 }),
        prisma.monthlyReport.findMany({ where: { userId: dbUser.id }, orderBy: { year: 'desc' }, take: 6 }),
      ])
    }
  } catch {}

  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1">
          <span className="gradient-gold">Reportes</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">Análisis semanal y mensual de tu rendimiento</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly */}
        <div>
          <h2 className="text-lg font-bold mb-4">📅 Reportes Semanales</h2>
          {weeklyReports.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-[var(--text-muted)] text-sm">Sin reportes semanales aún</p>
            </div>
          ) : (
            <div className="space-y-4">
              {weeklyReports.map((r) => (
                <div key={r.id} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium">
                      {new Date(r.weekStart).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} —{' '}
                      {new Date(r.weekEnd).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </div>
                    <span className={`text-sm font-bold ${r.totalPnl >= 0 ? 'positive' : 'negative'}`}>
                      {r.totalPnl >= 0 ? '+' : ''}${r.totalPnl.toFixed(2)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-bold">{r.totalTrades}</div>
                      <div className="text-[var(--text-muted)]">Trades</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{r.winRate.toFixed(1)}%</div>
                      <div className="text-[var(--text-muted)]">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{r.disciplineScore.toFixed(0)}/100</div>
                      <div className="text-[var(--text-muted)]">Disciplina</div>
                    </div>
                  </div>
                  {r.feedback && (
                    <p className="mt-3 text-xs text-[var(--text-secondary)] border-t border-[var(--border)] pt-3 line-clamp-2">
                      {r.feedback}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly */}
        <div>
          <h2 className="text-lg font-bold mb-4">📊 Reportes Mensuales</h2>
          {monthlyReports.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-[var(--text-muted)] text-sm">Sin reportes mensuales aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {monthlyReports.map((r) => {
                const m = r.metrics as any
                return (
                  <div key={r.id} className="card flex items-center justify-between">
                    <div>
                      <div className="font-bold">{months[r.month - 1]} {r.year}</div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">
                        {m?.totalOperaciones || 0} trades · {m?.winRate?.toFixed(1) || 0}% WR
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-bold text-sm ${(m?.pnlNeto || 0) >= 0 ? 'positive' : 'negative'}`}>
                        {(m?.pnlNeto || 0) >= 0 ? '+' : ''}${(m?.pnlNeto || 0).toFixed(2)}
                      </span>
                      {r.pdfUrl && (
                        <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-[var(--gold)] hover:underline">
                          PDF ↗
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
