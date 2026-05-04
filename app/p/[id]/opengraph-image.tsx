import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const revalidate = 3600
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const TIPO_META: Record<string, { label: string; icon: string; color: string }> = {
  OPERATIVA:    { label: 'Operativa',    icon: '📊', color: '#3b82f6' },
  TRACK_RECORD: { label: 'Track Record', icon: '📈', color: '#22c55e' },
  EXITO:        { label: 'Éxito',        icon: '🏆', color: '#C9A84C' },
  RETIRO:       { label: 'Retiro',       icon: '💰', color: '#a855f7' },
  ANALISIS:     { label: 'Análisis',     icon: '🔍', color: '#f97316' },
}

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await prisma.post.findUnique({
    where: { id },
    include: { user: { select: { name: true } } },
  })

  const authorName = !post || post.user.name.includes('@') ? 'Trader' : post.user.name
  const tipo = post ? (TIPO_META[post.tipo] ?? { label: post.tipo, icon: '💬', color: '#555' }) : { label: 'Post', icon: '💬', color: '#555' }
  const contenido = post ? post.contenido.slice(0, 280) : ''
  const hasMore = post && post.contenido.length > 280

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
          fontFamily: 'sans-serif',
        }}
      >
        {/* Gold top bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: '#C9A84C', display: 'flex' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 13, color: '#444', letterSpacing: 4, textTransform: 'uppercase' }}>
              LIBERTY TRADING PRO · COMUNIDAD
            </div>
            <div style={{ fontSize: 40, fontWeight: 900, color: '#f0ece4' }}>
              {authorName}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 12,
              background: `${tipo.color}18`,
              border: `1px solid ${tipo.color}40`,
            }}
          >
            <div style={{ fontSize: 28 }}>{tipo.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: tipo.color }}>{tipo.label}</div>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            margin: '32px 0',
            padding: '32px 40px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20,
          }}
        >
          <p style={{ fontSize: 26, color: '#ccc', lineHeight: 1.5, margin: 0 }}>
            {contenido}{hasMore ? '…' : ''}
          </p>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, color: '#333' }}>libertytrading.pro</div>
          <div style={{ fontSize: 14, color: '#C9A84C', letterSpacing: 2, textTransform: 'uppercase' }}>
            Comunidad de Traders
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
