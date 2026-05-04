import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const revalidate = 1800
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

async function findUser(slugOrId: string) {
  const bySlug = await prisma.user.findUnique({
    where: { slug: slugOrId },
    select: { id: true, name: true },
  })
  if (bySlug) return bySlug
  return prisma.user.findUnique({
    where: { id: slugOrId },
    select: { id: true, name: true },
  })
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const user = await findUser(slug)

  const sessions = user
    ? await prisma.tradingSession.findMany({
        where: { userId: user.id },
        select: { resultado: true, pnlNeto: true },
      })
    : []

  const name = user?.name?.includes('@') ? 'Trader' : (user?.name ?? 'Trader')
  const total = sessions.length
  const wins = sessions.filter(s => s.resultado === 'WIN').length
  const winRate = total > 0 ? Math.round((wins / total) * 1000) / 10 : 0
  const grossWins = sessions.filter(s => s.resultado === 'WIN').reduce((a, s) => a + Math.abs(s.pnlNeto), 0)
  const grossLoss = sessions.filter(s => s.resultado === 'LOSS').reduce((a, s) => a + Math.abs(s.pnlNeto), 0)
  const pf = grossLoss > 0 ? Math.round((grossWins / grossLoss) * 100) / 100 : grossWins > 0 ? 999 : 0
  const pnl = sessions.reduce((a, s) => a + s.pnlNeto, 0)
  const pnlStr = pnl >= 0 ? `+$${Math.round(pnl).toLocaleString()}` : `-$${Math.round(Math.abs(pnl)).toLocaleString()}`

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#080808',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 72px',
          fontFamily: 'serif',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: '#C9A84C', display: 'flex' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 14, color: '#4a4642', letterSpacing: 4, textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
              LIBERTY TRADING PRO · TRACK RECORD VERIFICABLE
            </div>
            <div style={{ fontSize: 52, fontWeight: 900, color: '#f0ece4', lineHeight: 1.1 }}>
              {name}
            </div>
            <div style={{ fontSize: 15, color: '#555', fontFamily: 'sans-serif' }}>
              {total} operaciones registradas · datos reales
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: 12, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}>
            <div style={{ fontSize: 36 }}>📈</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          {[
            { label: 'WIN RATE', value: `${winRate}%`, color: winRate >= 50 ? '#22c55e' : '#ef4444' },
            { label: 'PROFIT FACTOR', value: `${pf}x`, color: '#C9A84C' },
            { label: 'P&L TOTAL NETO', value: pnlStr, color: pnl >= 0 ? '#22c55e' : '#ef4444' },
            { label: 'OPERACIONES', value: String(total), color: '#C9A84C' },
          ].map(stat => (
            <div key={stat.label} style={{
              flex: 1,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16,
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              <div style={{ fontSize: 11, color: '#444', letterSpacing: 3, fontFamily: 'sans-serif' }}>{stat.label}</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: '#333', fontFamily: 'sans-serif' }}>
            libertytrading.pro
          </div>
          <div style={{ fontSize: 13, color: '#C9A84C', letterSpacing: 2, fontFamily: 'sans-serif' }}>
            OPERACIONES REALES · SIN FILTROS
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
