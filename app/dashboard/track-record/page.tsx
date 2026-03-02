import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function TrackRecordPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  let sessions: any[] = []

  try {
    const dbUser = await prisma.user.findUnique({ where: { authId: user?.id } })
    if (dbUser) {
      sessions = await prisma.tradingSession.findMany({
        where: { userId: dbUser.id },
        orderBy: { date: 'desc' },
      })
    }
  } catch {}

  const wins = sessions.filter((s) => s.resultado === 'WIN').length
  const totalPnl = sessions.reduce((sum, s) => sum + s.pnlNeto, 0)
  const winRate = sessions.length > 0 ? (wins / sessions.length) * 100 : 0

  return (
    <div className="animate-fadeIn">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black mb-1">
            <span className="gradient-gold">Track Record</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">Historial completo de operaciones</p>
        </div>
        <button className="btn-gold py-2 px-4 rounded-lg text-sm">+ Nueva Operación</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Trades', value: sessions.length, color: 'var(--gold)' },
          { label: 'Win Rate', value: `${winRate.toFixed(1)}%`, color: winRate >= 50 ? 'var(--green)' : 'var(--red)' },
          { label: 'Ganadoras', value: wins, color: 'var(--green)' },
          { label: 'PnL Total', value: `$${totalPnl.toFixed(2)}`, color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' },
        ].map((stat) => (
          <div key={stat.label} className="card text-center">
            <div className="text-2xl font-black mb-1" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs text-[var(--text-muted)]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-[var(--text-muted)] text-sm">No hay operaciones registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Fecha', 'Instrumento', 'Dir.', 'Contratos', 'Entrada', 'Salida', 'PnL Bruto', 'Comis.', 'PnL Neto', 'R:R', 'Resultado'].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3 px-3 text-[var(--text-secondary)] whitespace-nowrap">
                      {new Date(s.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 font-medium whitespace-nowrap">{s.instrumento}</td>
                    <td className="py-3 px-3">
                      <span className={`text-xs font-bold ${s.direccion === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                        {s.direccion}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[var(--text-secondary)]">{s.contratos}</td>
                    <td className="py-3 px-3 text-[var(--text-secondary)]">{s.entryPrice || '-'}</td>
                    <td className="py-3 px-3 text-[var(--text-secondary)]">{s.exitPrice || '-'}</td>
                    <td className={`py-3 px-3 font-medium ${s.pnlBruto >= 0 ? 'positive' : 'negative'}`}>
                      {s.pnlBruto >= 0 ? '+' : ''}{s.pnlBruto.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-[var(--text-muted)]">{s.comisiones.toFixed(2)}</td>
                    <td className={`py-3 px-3 font-bold ${s.pnlNeto >= 0 ? 'positive' : 'negative'}`}>
                      {s.pnlNeto >= 0 ? '+' : ''}{s.pnlNeto.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-[var(--text-secondary)]">
                      {s.rrReal ? `${s.rrReal.toFixed(2)}R` : '-'}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        s.resultado === 'WIN' ? 'bg-green-950 text-green-400' :
                        s.resultado === 'LOSS' ? 'bg-red-950 text-red-400' :
                        'bg-yellow-950 text-yellow-400'
                      }`}>
                        {s.resultado}
                      </span>
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
