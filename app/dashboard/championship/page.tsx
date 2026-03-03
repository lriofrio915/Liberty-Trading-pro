import { prisma } from '@/lib/prisma'

const MENTOR_EMAIL = 'lriofrio915@gmail.com'
const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function calcMetrics(sessions: { resultado: string; pnlNeto: number; date: Date | string }[]) {
  const wins = sessions.filter(s => s.resultado === 'WIN')
  const losses = sessions.filter(s => s.resultado === 'LOSS')
  const pnl = sessions.reduce((sum, s) => sum + s.pnlNeto, 0)
  const pnlGan = wins.reduce((sum, s) => sum + s.pnlNeto, 0)
  const pnlPer = losses.reduce((sum, s) => sum + s.pnlNeto, 0)
  const pf = pnlPer !== 0 ? Math.abs(pnlGan / pnlPer) : pnlGan > 0 ? 99 : 0
  const avgWin = wins.length ? pnlGan / wins.length : 0
  const avgLoss = losses.length ? Math.abs(pnlPer / losses.length) : 0

  // Equity curve
  const sorted = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  let cum = 0
  const equity = sorted.map(s => { cum += s.pnlNeto; return cum })
  const maxEquity = Math.max(...equity, 0)
  const minEquity = Math.min(...equity, 0)

  // Best/worst month
  const byMonth: Record<string, number> = {}
  sorted.forEach(s => {
    const m = String(s.date).slice(0, 7)
    byMonth[m] = (byMonth[m] ?? 0) + s.pnlNeto
  })
  const months = Object.values(byMonth)
  const bestMonth = months.length ? Math.max(...months) : 0
  const worstMonth = months.length ? Math.min(...months) : 0

  return {
    trades: sessions.length, wins: wins.length, losses: losses.length,
    winRate: sessions.length ? (wins.length / sessions.length) * 100 : 0,
    pnl, profitFactor: pf,
    rrPromedio: avgLoss > 0 ? avgWin / avgLoss : 0,
    bestMonth, worstMonth,
    equityCurve: equity, maxEquity, minEquity,
  }
}

export default async function ChampionshipPage() {
  let mentor: any = null
  let mentorMetrics: any = null
  let topAlumnos: any[] = []

  try {
    const mentorUser = await prisma.user.findFirst({ where: { email: MENTOR_EMAIL } })

    if (mentorUser) {
      const mentorSessions = await prisma.tradingSession.findMany({
        where: { userId: mentorUser.id },
        select: { resultado: true, pnlNeto: true, date: true },
        orderBy: { date: 'asc' },
      })
      mentor = mentorUser
      mentorMetrics = calcMetrics(mentorSessions)
    }

    // Top 10 alumnos (min 10 trades)
    const grouped = await prisma.tradingSession.groupBy({
      by: ['userId'],
      _count: { _all: true },
      _sum: { pnlNeto: true },
      where: mentorUser ? { userId: { not: mentorUser.id } } : undefined,
    })

    const eligible = grouped
      .filter(g => (g._count._all ?? 0) >= 10)
      .sort((a, b) => (b._sum.pnlNeto ?? 0) - (a._sum.pnlNeto ?? 0))
      .slice(0, 10)

    const userIds = eligible.map(g => g.userId)
    const [users, allSessions] = await Promise.all([
      prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } }),
      prisma.tradingSession.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, resultado: true, pnlNeto: true },
      }),
    ])

    topAlumnos = eligible.map((g, idx) => {
      const user = users.find(u => u.id === g.userId)
      const sess = allSessions.filter(s => s.userId === g.userId)
      const wins = sess.filter(s => s.resultado === 'WIN')
      const losses = sess.filter(s => s.resultado === 'LOSS')
      const pnlGan = wins.reduce((s, t) => s + t.pnlNeto, 0)
      const pnlPer = losses.reduce((s, t) => s + t.pnlNeto, 0)
      const pf = pnlPer !== 0 ? Math.abs(pnlGan / pnlPer) : pnlGan > 0 ? 99 : 0
      return {
        rank: idx + 1,
        name: user?.name || 'Trader',
        trades: g._count._all,
        pnl: g._sum.pnlNeto ?? 0,
        winRate: sess.length ? (wins.length / sess.length) * 100 : 0,
        profitFactor: pf,
      }
    })
  } catch {}

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1"><span className="gradient-gold">Championship</span></h1>
        <p className="text-[var(--text-secondary)] text-sm">Track record verificado y ranking de alumnos</p>
      </div>

      {/* ── Mentor Section ── */}
      {mentorMetrics && (
        <div className="mb-12">
          <div className="card-gold mb-6" style={{ background: 'linear-gradient(135deg, #111 0%, #1a1400 100%)' }}>
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
              <div>
                <div className="label-mono text-[10px] text-[var(--gold)] mb-1">Trader Mentor</div>
                <h2 className="text-2xl font-black">{mentor?.name || 'Luis Riofrio'}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-green-950 text-green-400 px-2 py-0.5 rounded-full font-bold">VERIFICADO ✓</span>
                  <span className="text-xs text-[var(--text-muted)]">Operador Financiero de Futuros</span>
                </div>
              </div>
              <div className="text-4xl">🏅</div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Win Rate', value: `${mentorMetrics.winRate.toFixed(1)}%`, color: 'var(--green)' },
                { label: 'PnL Total', value: `${mentorMetrics.pnl >= 0 ? '+' : ''}$${mentorMetrics.pnl.toFixed(0)}`, color: mentorMetrics.pnl >= 0 ? 'var(--green)' : 'var(--red)' },
                { label: 'Profit Factor', value: mentorMetrics.profitFactor >= 99 ? '∞' : mentorMetrics.profitFactor.toFixed(2), color: 'var(--gold)' },
                { label: 'Trades', value: mentorMetrics.trades, color: 'var(--text-primary)' },
                { label: 'Ganadores', value: mentorMetrics.wins, color: 'var(--green)' },
                { label: 'Perdedores', value: mentorMetrics.losses, color: 'var(--red)' },
                { label: 'Mejor Mes', value: `+$${mentorMetrics.bestMonth.toFixed(0)}`, color: 'var(--green)' },
                { label: 'Peor Mes', value: `$${mentorMetrics.worstMonth.toFixed(0)}`, color: 'var(--red)' },
              ].map(s => (
                <div key={s.label} className="bg-black/40 rounded-lg py-3 px-4">
                  <div className="label-mono text-[9px] mb-1">{s.label}</div>
                  <div className="text-lg font-black" style={{ color: s.color, fontFamily: 'var(--font-serif)' }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Equity curve — simple bar chart */}
            {mentorMetrics.equityCurve.length > 1 && (
              <div>
                <div className="label-mono text-[9px] mb-2">Equity Curve</div>
                <div className="h-16 flex items-end gap-[1px]">
                  {mentorMetrics.equityCurve.map((val: number, i: number) => {
                    const range = (mentorMetrics.maxEquity - mentorMetrics.minEquity) || 1
                    const heightPct = ((val - mentorMetrics.minEquity) / range) * 100
                    return (
                      <div
                        key={i}
                        style={{
                          height: `${Math.max(2, heightPct)}%`,
                          flex: 1,
                          background: val >= 0 ? 'var(--green)' : 'var(--red)',
                          opacity: 0.8,
                          borderRadius: '1px 1px 0 0',
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Top 10 Alumnos ── */}
      <div>
        <h2 className="text-xl font-black mb-4">
          <span className="gradient-gold">Top 10</span> Alumnos
        </h2>
        <p className="text-xs text-[var(--text-muted)] mb-6">Usuarios con mínimo 10 operaciones registradas, ordenados por PnL total</p>

        {topAlumnos.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-[var(--text-muted)] text-sm">Aun no hay suficientes datos para el ranking</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                  {['#', 'Trader', 'Trades', 'Win Rate', 'PnL Total', 'Prof. Factor'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topAlumnos.map((a, i) => (
                  <tr key={i} className={`border-b border-[var(--border)] transition-colors ${i === 0 ? 'bg-yellow-950/20' : 'hover:bg-[var(--bg-hover)]'}`}>
                    <td className="py-3 px-4 text-lg">{MEDALS[a.rank] || `#${a.rank}`}</td>
                    <td className="py-3 px-4 font-bold">{a.name}</td>
                    <td className="py-3 px-4 text-[var(--text-secondary)]">{a.trades}</td>
                    <td className="py-3 px-4">
                      <span style={{ color: a.winRate >= 50 ? 'var(--green)' : 'var(--red)' }} className="font-bold">
                        {a.winRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold" style={{ color: a.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {a.pnl >= 0 ? '+' : ''}${a.pnl.toFixed(0)}
                    </td>
                    <td className="py-3 px-4" style={{ color: a.profitFactor >= 1.5 ? 'var(--green)' : 'var(--text-muted)' }}>
                      {a.profitFactor >= 99 ? '∞' : a.profitFactor.toFixed(2)}x
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
