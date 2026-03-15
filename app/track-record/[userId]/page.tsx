import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 1800

export async function generateMetadata(
  { params }: { params: { userId: string } }
): Promise<Metadata> {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { name: true },
  })
  const sessions = await prisma.tradingSession.findMany({
    where: { userId: params.userId },
    select: { resultado: true, pnlNeto: true },
  })

  const name = user?.name?.includes('@') ? 'Trader' : (user?.name ?? 'Trader')
  const total = sessions.length
  const wins = sessions.filter(s => s.resultado === 'WIN').length
  const winRate = total > 0 ? Math.round((wins / total) * 10) / 10 : 0
  const pnl = sessions.reduce((a, s) => a + s.pnlNeto, 0)
  const pnlStr = pnl >= 0 ? `+$${Math.round(pnl).toLocaleString()}` : `-$${Math.round(Math.abs(pnl)).toLocaleString()}`

  const title = `Track Record de ${name} · Liberty Trading Pro`
  const description = `${winRate}% Win Rate · ${pnlStr} P&L Neto · ${total} operaciones reales registradas. Datos verificables, sin filtros.`
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/track-record/${params.userId}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Liberty Trading Pro',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

interface Session {
  id: string
  date: Date
  instrumento: string
  direccion: string
  resultado: string
  pnlNeto: number
  contratos: number
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('es-EC', {
    timeZone: 'America/Guayaquil',
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  })
}

function formatPnl(pnl: number) {
  const abs = Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  return pnl >= 0 ? `+$${abs}` : `-$${abs}`
}

async function getTrackRecord(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  })

  if (!user) return null

  const sessions: Session[] = await prisma.tradingSession.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    select: {
      id: true,
      date: true,
      instrumento: true,
      direccion: true,
      resultado: true,
      pnlNeto: true,
      contratos: true,
    },
  })

  if (sessions.length === 0) {
    return { user, sessions: [], metrics: null }
  }

  const wins = sessions.filter((s) => s.resultado === 'WIN')
  const losses = sessions.filter((s) => s.resultado === 'LOSS')
  const winRate = (wins.length / sessions.length) * 100
  const grossWins = wins.reduce((sum, s) => sum + Math.abs(s.pnlNeto), 0)
  const grossLosses = losses.reduce((sum, s) => sum + Math.abs(s.pnlNeto), 0)
  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? 999 : 0
  const totalNetPnl = sessions.reduce((sum, s) => sum + s.pnlNeto, 0)
  const firstTrade = sessions[sessions.length - 1].date
  const lastTrade = sessions[0].date

  return {
    user,
    sessions,
    metrics: {
      totalTrades: sessions.length,
      wins: wins.length,
      losses: losses.length,
      winRate: Math.round(winRate * 10) / 10,
      profitFactor: Math.round(profitFactor * 100) / 100,
      totalNetPnl: Math.round(totalNetPnl * 100) / 100,
      firstTrade,
      lastTrade,
    },
  }
}

export default async function PublicTrackRecordPage({
  params,
}: {
  params: { userId: string }
}) {
  const data = await getTrackRecord(params.userId)
  if (!data) notFound()

  const { user, sessions, metrics } = data

  const displayName = user.name.includes('@') ? 'Trader' : user.name

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary, #080808)' }}>

      {/* Header */}
      <div className="border-b border-[var(--border,#1a1a1a)] px-4 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="headline text-lg gradient-gold">Liberty Trading Pro</Link>
        <span className="label-mono text-[10px] text-[var(--text-muted,#555)]">Track Record Público</span>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Title */}
        <div className="mb-10">
          <div className="label-mono mb-2 text-[var(--gold,#C9A84C)]">Track Record Verificable</div>
          <h1 className="headline text-4xl sm:text-5xl text-white mb-2">
            {displayName}
          </h1>
          {metrics && (
            <p className="text-sm text-[var(--text-muted,#555)]">
              {formatDate(metrics.firstTrade)} → {formatDate(metrics.lastTrade)} · {metrics.totalTrades} operaciones registradas
            </p>
          )}
        </div>

        {!metrics ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-[var(--text-muted,#555)]">Aún no hay operaciones registradas.</p>
          </div>
        ) : (
          <>
            {/* Metrics grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                {
                  label: 'Win Rate',
                  value: `${metrics.winRate}%`,
                  sub: `${metrics.wins}/${metrics.totalTrades} trades`,
                  color: metrics.winRate >= 50 ? '#22c55e' : '#ef4444',
                },
                {
                  label: 'Profit Factor',
                  value: `${metrics.profitFactor}x`,
                  sub: 'Ganancias / Pérdidas',
                  color: '#C9A84C',
                },
                {
                  label: 'P&L Total Neto',
                  value: formatPnl(metrics.totalNetPnl),
                  sub: 'Suma de todas las operaciones',
                  color: metrics.totalNetPnl >= 0 ? '#22c55e' : '#ef4444',
                },
                {
                  label: 'Total Operaciones',
                  value: String(metrics.totalTrades),
                  sub: `${metrics.wins} ganadoras · ${metrics.losses} perdedoras`,
                  color: '#C9A84C',
                },
              ].map((m) => (
                <div key={m.label}
                  className="rounded-xl border p-5"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    borderColor: 'rgba(255,255,255,0.07)',
                  }}>
                  <div className="text-[10px] font-mono tracking-widest uppercase mb-2"
                    style={{ color: '#555' }}>
                    {m.label}
                  </div>
                  <div className="text-3xl font-black mb-1"
                    style={{ color: m.color, fontFamily: 'Georgia, serif' }}>
                    {m.value}
                  </div>
                  <div className="text-[10px] font-mono" style={{ color: '#444' }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Sessions table */}
            <div className="rounded-xl border overflow-hidden"
              style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="px-5 py-3 border-b flex items-center gap-2"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <span className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #22c55e' }} />
                <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: '#555' }}>
                  Historial completo de operaciones
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {['Fecha', 'Instrumento', 'Dirección', 'Resultado', 'P&L Neto', 'Contratos'].map((h) => (
                        <th key={h}
                          className="text-left py-3 px-4 text-[10px] font-mono tracking-widest uppercase"
                          style={{ color: '#444' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s, i) => (
                      <tr key={s.id}
                        style={{
                          borderBottom: i < sessions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        }}>
                        <td className="py-3 px-4 font-mono text-xs" style={{ color: '#666' }}>
                          {formatDate(s.date)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          {s.instrumento}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            s.direccion === 'LONG'
                              ? 'bg-green-950 text-green-400'
                              : 'bg-red-950 text-red-400'
                          }`}>
                            {s.direccion}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            s.resultado === 'WIN'
                              ? 'bg-green-950 text-green-400'
                              : s.resultado === 'LOSS'
                              ? 'bg-red-950 text-red-400'
                              : 'bg-yellow-950 text-yellow-400'
                          }`}>
                            {s.resultado}
                          </span>
                        </td>
                        <td className={`py-3 px-4 font-mono font-bold ${
                          s.pnlNeto >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatPnl(s.pnlNeto)}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs" style={{ color: '#666' }}>
                          {s.contratos}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer note */}
            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-xs font-mono" style={{ color: '#444' }}>
                Datos en tiempo real · Generado por{' '}
                <Link href="/" className="hover:text-[#C9A84C] transition-colors" style={{ color: '#666' }}>
                  Liberty Trading Pro
                </Link>
              </p>
              <Link href="/#precios"
                className="text-xs font-mono px-4 py-2 rounded-lg border transition-colors"
                style={{
                  borderColor: '#C9A84C',
                  color: '#C9A84C',
                }}>
                Unirme al Club →
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
