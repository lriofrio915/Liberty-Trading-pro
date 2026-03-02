import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  let dbUser = null
  let sessions: any[] = []

  try {
    dbUser = await prisma.user.findUnique({ where: { authId: user?.id } })
    if (dbUser) {
      sessions = await prisma.tradingSession.findMany({
        where: { userId: dbUser.id },
        orderBy: { date: 'desc' },
        take: 10,
      })
    }
  } catch {}

  // Calculate KPIs
  const totalTrades = sessions.length
  const wins = sessions.filter((s) => s.resultado === 'WIN').length
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0
  const totalPnl = sessions.reduce((sum, s) => sum + s.pnlNeto, 0)
  const grossProfit = sessions.filter((s) => s.pnlNeto > 0).reduce((sum, s) => sum + s.pnlNeto, 0)
  const grossLoss = Math.abs(sessions.filter((s) => s.pnlNeto < 0).reduce((sum, s) => sum + s.pnlNeto, 0))
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0

  const kpis = [
    { label: 'Trades Totales', value: totalTrades.toString(), icon: '📊', color: 'var(--gold)' },
    { label: 'Win Rate', value: `${winRate.toFixed(1)}%`, icon: '🎯', color: winRate >= 50 ? 'var(--green)' : 'var(--red)' },
    { label: 'PnL Neto', value: `$${totalPnl.toFixed(2)}`, icon: '💰', color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' },
    { label: 'Profit Factor', value: profitFactor.toFixed(2) + 'x', icon: '📈', color: profitFactor >= 1.5 ? 'var(--green)' : 'var(--gold)' },
  ]

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1">
          Dashboard <span className="gradient-gold">Trading</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">
          {dbUser?.name || user?.email} — Plan{' '}
          <span className="text-[var(--gold)] font-bold">{dbUser?.plan || 'FREE'}</span>
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider">{kpi.label}</span>
              <span className="text-xl">{kpi.icon}</span>
            </div>
            <div className="text-2xl font-black" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Sessions */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Últimas Operaciones</h2>
          <a href="/dashboard/track-record" className="text-xs text-[var(--gold)] hover:underline">
            Ver todas →
          </a>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-sm">No hay operaciones registradas aún</p>
            <a href="/dashboard/track-record" className="text-xs text-[var(--gold)] hover:underline mt-2 inline-block">
              Registrar primera operación →
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Fecha', 'Instrumento', 'Dirección', 'Resultado', 'PnL'].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3 px-3 text-[var(--text-secondary)]">
                      {new Date(s.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="py-3 px-3 font-medium">{s.instrumento}</td>
                    <td className="py-3 px-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${s.direccion === 'LONG' ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'}`}>
                        {s.direccion}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={s.resultado === 'WIN' ? 'positive font-bold' : s.resultado === 'LOSS' ? 'negative font-bold' : 'text-[var(--text-muted)]'}>
                        {s.resultado}
                      </span>
                    </td>
                    <td className={`py-3 px-3 font-bold ${s.pnlNeto >= 0 ? 'positive' : 'negative'}`}>
                      {s.pnlNeto >= 0 ? '+' : ''}{s.pnlNeto.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
