import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import PublicChart from '@/components/TrackRecord/PublicChart'

export const revalidate = 1800

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Busca usuario por slug (ej: "luis-riofrio") o por ID como fallback (URLs antiguas) */
async function findUser(slugOrId: string) {
  const bySlug = await prisma.user.findUnique({
    where: { slug: slugOrId },
    select: { id: true, name: true, slug: true, createdAt: true, avatarUrl: true, bio: true, country: true, tradingStyle: true, tradingSince: true },
  })
  if (bySlug) return bySlug

  return prisma.user.findUnique({
    where: { id: slugOrId },
    select: { id: true, name: true, slug: true, createdAt: true, avatarUrl: true, bio: true, country: true, tradingStyle: true, tradingSince: true },
  })
}

// ── Meta ──────────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const user = await findUser(params.slug)
  const sessions = user
    ? await prisma.tradingSession.findMany({
        where: { userId: user.id },
        select: { resultado: true, pnlNeto: true },
      })
    : []

  const name = user?.name?.includes('@') ? 'Trader' : (user?.name ?? 'Trader')
  const total = sessions.length
  const wins = sessions.filter(s => s.resultado === 'WIN').length
  const winRate = total > 0 ? Math.round((wins / total) * 10) / 10 : 0
  const pnl = sessions.reduce((a, s) => a + s.pnlNeto, 0)
  const pnlStr = pnl >= 0 ? `+$${Math.round(pnl).toLocaleString()}` : `-$${Math.round(Math.abs(pnl)).toLocaleString()}`

  const title = `${name} — Perfil Público del Operador · Liberty Trading Pro`
  const description = user?.bio
    ? `${user.bio} · ${winRate}% Win Rate · ${pnlStr} P&L Neto · ${total} operaciones verificadas.`
    : `${winRate}% Win Rate · ${pnlStr} P&L Neto · ${total} operaciones reales verificadas. Sin filtros.`
  const urlSlug = user?.slug ?? params.slug
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/track-record/${urlSlug}`

  const ogImage = {
    url: `${process.env.NEXT_PUBLIC_APP_URL}/track-record/${urlSlug}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: `Track Record de ${name} — Liberty Trading Pro`,
  }

  return {
    title,
    description,
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://libertytrading.pro'),
    openGraph: {
      title,
      description,
      url,
      siteName: 'Liberty Trading Pro',
      type: 'profile',
      locale: 'es_EC',
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage.url],
    },
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Session {
  id: string
  date: Date
  instrumento: string
  direccion: string
  resultado: string
  pnlNeto: number
  contratos: number
  accountName: string | null
}

interface Certificate {
  id: string
  title: string
  category: string
  fileUrl: string
  fileType: string
  issuedBy?: string | null
  issuedDate?: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('es-EC', {
    timeZone: 'America/Guayaquil', day: '2-digit', month: 'short', year: '2-digit',
  })
}

function formatPnl(pnl: number) {
  const abs = Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  return pnl >= 0 ? `+$${abs}` : `-$${abs}`
}

const MONTHS_ES: Record<string, number> = {
  ene:1, enero:1, jan:1, january:1,
  feb:2, febrero:2, february:2,
  mar:3, marzo:3, march:3,
  abr:4, abril:4, apr:4, april:4,
  may:5, mayo:5,
  jun:6, junio:6, june:6,
  jul:7, julio:7, july:7,
  ago:8, agosto:8, aug:8, august:8,
  sep:9, sept:9, septiembre:9, september:9,
  oct:10, octubre:10, october:10,
  nov:11, noviembre:11, november:11,
  dic:12, diciembre:12, dec:12, december:12,
}

function parseIssuedDate(str?: string | null): number {
  if (!str) return 0
  const s = str.trim()
  // Solo año: "2026"
  if (/^\d{4}$/.test(s)) return parseInt(s) * 100
  // "Mes Año" o "Mes. Año" (con posible texto extra): "Jun 2022", "Mayo 2025 I", "Ene. 2024"
  const m = s.toLowerCase().replace('.', '').match(/([a-záéíóúü]+)\s+(\d{4})/)
  if (m) {
    const month = MONTHS_ES[m[1]] ?? 0
    return parseInt(m[2]) * 100 + month
  }
  // Fallback: intentar Date.parse
  const d = Date.parse(s)
  return isNaN(d) ? 0 : Math.floor(d / 1000)
}

const CAT_META: Record<string, { icon: string; label: string }> = {
  FONDEO:    { icon: '🏆', label: 'Prueba de Fondeo' },
  RETIRO:    { icon: '💰', label: 'Retiro de Fondos' },
  MERITO:    { icon: '⭐', label: 'Mérito / Distinción' },
  ACADEMICO: { icon: '📜', label: 'Certificado Académico' },
  DIPLOMA:   { icon: '🎓', label: 'Diploma' },
  OTRO:      { icon: '📄', label: 'Logro' },
}

// ── Data fetch ────────────────────────────────────────────────────────────────

async function getTraderProfile(slugOrId: string) {
  const user = await findUser(slugOrId)
  if (!user) return null

  const rawSessions = await prisma.tradingSession.findMany({
    where: { userId: user.id },
    orderBy: { date: 'asc' },
    select: {
      id: true, date: true, instrumento: true, direccion: true,
      resultado: true, pnlNeto: true, contratos: true,
      plan: { select: { accountName: true } },
    },
  })
  const sessions: Session[] = rawSessions.map(s => ({
    ...s,
    date: new Date(s.date),
    accountName: s.plan?.accountName ?? null,
    plan: undefined,
  }))

  const certificates: Certificate[] = await prisma.certificate.findMany({
    where: { userId: user.id, public: true },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, category: true, fileUrl: true, fileType: true, issuedBy: true, issuedDate: true },
  })

  if (sessions.length === 0) {
    return { user, sessions: [], metrics: null, monthlyData: [], certificates }
  }

  // ── Core metrics ─────────────────────────────────────────────────────────
  const wins = sessions.filter(s => s.resultado === 'WIN')
  const losses = sessions.filter(s => s.resultado === 'LOSS')
  const winRate = (wins.length / sessions.length) * 100
  const grossWins = wins.reduce((sum, s) => sum + Math.abs(s.pnlNeto), 0)
  const grossLosses = losses.reduce((sum, s) => sum + Math.abs(s.pnlNeto), 0)
  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? 999 : 0
  const totalNetPnl = sessions.reduce((sum, s) => sum + s.pnlNeto, 0)
  const bestTrade = Math.max(...sessions.map(s => s.pnlNeto))
  const worstTrade = Math.min(...sessions.map(s => s.pnlNeto))
  const avgWin = wins.length ? grossWins / wins.length : 0
  const avgLoss = losses.length ? grossLosses / losses.length : 0
  const rrPromedio = avgLoss > 0 ? avgWin / avgLoss : 0

  // ── Max Drawdown ─────────────────────────────────────────────────────────
  let peak = 0, maxDrawdown = 0, balance = 0
  for (const s of sessions) {
    balance += s.pnlNeto
    if (balance > peak) peak = balance
    const dd = peak - balance
    if (dd > maxDrawdown) maxDrawdown = dd
  }

  // ── Streaks (máximo histórico) ────────────────────────────────────────────
  const sessionsByDate = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  let winStreak = 0, curWin = 0
  let lossStreak = 0, curLoss = 0
  for (const s of [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())) {
    if (s.resultado === 'WIN') { curWin++; curLoss = 0; if (curWin > winStreak) winStreak = curWin }
    else if (s.resultado === 'LOSS') { curLoss++; curWin = 0; if (curLoss > lossStreak) lossStreak = curLoss }
    else { curWin = 0; curLoss = 0 }
  }

  // ── Monthly data for chart ────────────────────────────────────────────────
  const monthlyMap: Record<string, { month: string; pnl: number; trades: number; wins: number }> = {}
  for (const s of sessions) {
    const d = new Date(s.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!monthlyMap[key]) {
      monthlyMap[key] = {
        month: d.toLocaleDateString('es-EC', { month: 'short', year: '2-digit', timeZone: 'America/Guayaquil' }),
        pnl: 0, trades: 0, wins: 0,
      }
    }
    monthlyMap[key].pnl += s.pnlNeto
    monthlyMap[key].trades++
    if (s.resultado === 'WIN') monthlyMap[key].wins++
  }

  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({ ...v, pnl: Math.round(v.pnl * 100) / 100 }))
    .slice(-12)

  return {
    user,
    sessions: sessionsByDate,
    metrics: {
      totalTrades: sessions.length,
      wins: wins.length,
      losses: losses.length,
      winRate: Math.round(winRate * 10) / 10,
      profitFactor: Math.round(profitFactor * 100) / 100,
      totalNetPnl: Math.round(totalNetPnl * 100) / 100,
      bestTrade: Math.round(bestTrade * 100) / 100,
      worstTrade: Math.round(worstTrade * 100) / 100,
      firstTrade: sessions[0].date.toISOString(),
      lastTrade: sessions[sessions.length - 1].date.toISOString(),
      winStreak,
      lossStreak,
      rrPromedio: Math.round(rrPromedio * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    },
    monthlyData,
    certificates,
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PublicTrackRecordPage({ params }: { params: { slug: string } }) {
  const data = await getTraderProfile(params.slug)
  if (!data) notFound()

  const { user, sessions, metrics, monthlyData, certificates } = data
  const displayName = user.name?.includes('@') ? 'Trader' : (user.name ?? 'Trader')
  const memberSince = new Date(user.createdAt).toLocaleDateString('es-EC', {
    year: 'numeric', month: 'long',
  })

  return (
    <main className="min-h-screen" style={{ background: '#080808', color: '#f0ece4' }}>
      <style>{`.cert-card:hover { border-color: rgba(201,168,76,0.4) !important; }`}</style>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav style={{ borderBottom: '1px solid #141414' }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#C9A84C', letterSpacing: 1 }}>
            Liberty Trading Pro
          </Link>
          <div className="flex items-center gap-2">
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', display: 'inline-block' }} />
            <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: 2, color: '#444', textTransform: 'uppercase' }}>
              Perfil Público Verificado
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 40 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            {/* Avatar */}
            <div style={{
              width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
              border: '2px solid #C9A84C', overflow: 'hidden',
              background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt={displayName} width={80} height={80} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 32, fontWeight: 900, color: '#C9A84C', fontFamily: 'Georgia, serif' }}>
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(24px, 5vw, 42px)', fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: 0 }}>
                  {displayName}
                </h1>
                <span style={{
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                  color: '#22c55e', fontSize: 10, fontFamily: 'monospace', padding: '3px 10px',
                  borderRadius: 20, letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap',
                }}>
                  ✓ Verificado
                </span>
                {user.tradingSince && (() => {
                  const years = new Date().getFullYear() - user.tradingSince
                  return (
                    <span style={{
                      background: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))',
                      border: '1px solid rgba(201,168,76,0.35)',
                      color: '#C9A84C', fontSize: 10, fontFamily: 'monospace', padding: '3px 10px',
                      borderRadius: 20, letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap',
                    }}>
                      ◆ {years === 1 ? '1 año' : `${years} años`} de experiencia
                    </span>
                  )
                })()}
              </div>

              {(user.tradingStyle || user.country) && (
                <p style={{ color: '#888', fontSize: 13, marginBottom: 6, fontFamily: 'monospace', margin: '0 0 6px 0' }}>
                  {user.tradingStyle}{user.tradingStyle && user.country ? ' · ' : ''}{user.country}
                </p>
              )}

              {user.bio && (
                <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.7, marginBottom: 10, margin: '0 0 10px 0' }}>
                  {user.bio}
                </p>
              )}

              <p style={{ color: '#444', fontSize: 11, fontFamily: 'monospace', margin: 0, wordBreak: 'break-word' }}>
                Miembro desde {memberSince}
                {metrics && ` · ${metrics.totalTrades} operaciones · Última op. ${formatDate(metrics.lastTrade)}`}
              </p>
            </div>
          </div>
        </div>

        {!metrics ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <p style={{ color: '#555' }}>Aún no hay operaciones registradas.</p>
          </div>
        ) : (
          <>
            {/* ── Key metrics ─────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12 }}>
              {[
                // Row 1
                {
                  label: 'Win Rate',
                  value: `${metrics.winRate}%`,
                  sub: `${metrics.wins} de ${metrics.totalTrades} trades`,
                  color: metrics.winRate >= 50 ? '#22c55e' : '#ef4444',
                },
                {
                  label: 'R:R Promedio',
                  value: `1:${metrics.rrPromedio.toFixed(2)}`,
                  sub: 'Ganancia media / Pérdida media',
                  color: metrics.rrPromedio >= 1 ? '#22c55e' : '#C9A84C',
                },
                // Row 2
                {
                  label: 'Total Operaciones',
                  value: String(metrics.totalTrades),
                  sub: `${metrics.wins} wins · ${metrics.losses} losses`,
                  color: '#C9A84C',
                },
                {
                  label: 'Profit Factor',
                  value: metrics.profitFactor === 999 ? '∞' : `${metrics.profitFactor}x`,
                  sub: 'Ganancias / Pérdidas',
                  color: '#C9A84C',
                },
                // Row 3
                {
                  label: 'P&L Neto Total',
                  value: formatPnl(metrics.totalNetPnl),
                  sub: 'Suma real de operaciones',
                  color: metrics.totalNetPnl >= 0 ? '#22c55e' : '#ef4444',
                },
                {
                  label: 'Drawdown Máx.',
                  value: `-$${metrics.maxDrawdown.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
                  sub: 'Caída máx. desde pico',
                  color: '#ef4444',
                },
              ].map(m => (
                <div key={m.label} style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 16, padding: '16px 14px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                  overflow: 'hidden',
                }}>
                  <div style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: 2, color: '#444', textTransform: 'uppercase', marginBottom: 8 }}>
                    {m.label}
                  </div>
                  <div style={{
                    fontFamily: 'Georgia, serif', fontSize: 'clamp(20px, 5vw, 30px)', fontWeight: 900,
                    color: m.color, marginBottom: 4, lineHeight: 1,
                    wordBreak: 'break-all', maxWidth: '100%',
                  }}>
                    {m.value}
                  </div>
                  <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#444', wordBreak: 'break-word' }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Secondary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 32 }}>
              {[
                { label: 'Mejor Trade', value: formatPnl(metrics.bestTrade), color: '#22c55e' },
                { label: 'Peor Trade', value: formatPnl(metrics.worstTrade), color: '#ef4444' },
                { label: 'Racha Ganadora', value: `${metrics.winStreak} trades seguidos`, color: '#C9A84C' },
                { label: 'Racha Perdedora', value: `${metrics.lossStreak} trades seguidos`, color: '#ef4444' },
              ].map(m => (
                <div key={m.label} style={{
                  background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 10, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#444', letterSpacing: 2, textTransform: 'uppercase' }}>{m.label}</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: m.color, fontSize: 14 }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* ── Monthly chart ────────────────────────────────────────────── */}
            {monthlyData.length > 1 && (
              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16, padding: '24px', marginBottom: 32,
              }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: 2, color: '#444', textTransform: 'uppercase', marginBottom: 4 }}>
                    Rendimiento Mensual
                  </div>
                  <div style={{ fontSize: 13, color: '#888' }}>
                    Últimos {monthlyData.length} meses · P&L neto por período
                  </div>
                </div>
                <PublicChart data={monthlyData} />
              </div>
            )}

            {/* ── Certificates ─────────────────────────────────────────────── */}
            {certificates.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: 2, color: '#444', textTransform: 'uppercase', marginBottom: 4 }}>
                    Credenciales & Logros
                  </div>
                  <div style={{ fontSize: 13, color: '#888' }}>
                    Certificados verificados del operador
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                  {[...certificates].sort((a, b) => parseIssuedDate(b.issuedDate) - parseIssuedDate(a.issuedDate)).map(cert => {
                    const cat = CAT_META[cert.category] ?? CAT_META.OTRO
                    const isPdf = cert.fileType === 'pdf'
                    return (
                      <a
                        key={cert.id}
                        href={cert.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cert-card"
                        style={{
                          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 12, overflow: 'hidden', display: 'block',
                          textDecoration: 'none', transition: 'border-color 0.2s',
                          cursor: 'pointer', width: 220, flexShrink: 0,
                        }}
                      >
                        <div style={{
                          height: 110, background: '#111',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          overflow: 'hidden', position: 'relative',
                        }}>
                          {!isPdf && cert.fileUrl ? (
                            <Image
                              src={cert.fileUrl}
                              alt={cert.title}
                              width={200}
                              height={110}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span style={{ fontSize: 40 }}>{cat.icon}</span>
                          )}
                          {isPdf && (
                            <div style={{
                              position: 'absolute', top: 8, right: 8,
                              background: 'rgba(0,0,0,0.6)', borderRadius: 4,
                              padding: '2px 6px', fontSize: 9, fontFamily: 'monospace', color: '#888',
                            }}>
                              PDF
                            </div>
                          )}
                        </div>
                        <div style={{ padding: '12px 14px' }}>
                          <div style={{
                            display: 'inline-block', fontSize: 9, fontFamily: 'monospace',
                            padding: '2px 8px', borderRadius: 10, marginBottom: 6,
                            background: 'rgba(201,168,76,0.1)', color: '#C9A84C',
                          }}>
                            {cat.icon} {cat.label}
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#e0dcd4', lineHeight: 1.4, marginBottom: 4 }}>
                            {cert.title}
                          </p>
                          {(cert.issuedBy || cert.issuedDate) && (
                            <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#555' }}>
                              {cert.issuedBy}{cert.issuedBy && cert.issuedDate ? ' · ' : ''}{cert.issuedDate}
                            </p>
                          )}
                        </div>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Trade history ─────────────────────────────────────────────── */}
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, overflow: 'hidden', marginBottom: 32,
            }}>
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: 2, color: '#555', textTransform: 'uppercase' }}>
                  Historial completo · {sessions.length} operaciones registradas
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {['Fecha', 'P&L Neto', 'Cuenta'].map(h => (
                        <th key={h} style={{
                          textAlign: 'center', padding: '12px 16px',
                          fontSize: 9, fontFamily: 'monospace', letterSpacing: 2,
                          color: '#3a3a3a', textTransform: 'uppercase', whiteSpace: 'nowrap',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s, i) => (
                      <tr key={s.id} style={{ borderBottom: i < sessions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 11, color: '#555', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {formatDate(s.date)}
                        </td>
                        <td style={{
                          padding: '10px 16px', fontFamily: 'monospace', fontWeight: 700,
                          color: s.pnlNeto >= 0 ? '#22c55e' : '#ef4444',
                          textAlign: 'center', whiteSpace: 'nowrap',
                        }}>
                          {formatPnl(s.pnlNeto)}
                        </td>
                        <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 11, color: '#888', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {s.accountName ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── Footer ──────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#333' }}>
              Datos en tiempo real · Verificado por{' '}
              <Link href="/" style={{ color: '#555', textDecoration: 'none' }} className="hover:text-[#C9A84C]">
                Liberty Trading Pro
              </Link>
              {' · '}Las inversiones implican riesgo. Resultados pasados no garantizan rendimientos futuros.
            </p>
            <Link
              href="/unirse"
              style={{
                border: '1px solid #C9A84C', color: '#C9A84C', borderRadius: 8,
                padding: '8px 20px', fontSize: 12, fontFamily: 'monospace',
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              Unirme al Club →
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}
