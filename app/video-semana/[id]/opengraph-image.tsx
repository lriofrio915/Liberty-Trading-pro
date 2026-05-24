import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const revalidate = 1800
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function formatSemana(d: Date) {
  return new Date(d).toLocaleDateString('es-EC', {
    timeZone: 'America/Guayaquil',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const video = await prisma.videoSemana.findUnique({ where: { id } })

  const titulo = video?.titulo ?? 'Video de la Semana'
  const descripcion = video?.descripcion ?? 'Trading real, entradas válidas, resultados verificables.'
  const semana = video ? `Semana del ${formatSemana(video.semana)}` : 'Liberty Trading Club'

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
        {/* Top gold bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: '#C9A84C', display: 'flex' }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 13, color: '#4a4642', letterSpacing: 4, textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
              LIBERTY TRADING PRO · VIDEO DE LA SEMANA
            </div>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#f0ece4', lineHeight: 1.15, maxWidth: 900 }}>
              {titulo}
            </div>
            <div style={{ fontSize: 16, color: '#777', fontFamily: 'sans-serif', maxWidth: 820, marginTop: 4 }}>
              {descripcion}
            </div>
          </div>
        </div>

        {/* Play button badge + semana */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(201,168,76,0.15)',
            border: '2px solid rgba(201,168,76,0.5)',
          }}>
            {/* Play triangle */}
            <div style={{
              width: 0,
              height: 0,
              borderTop: '14px solid transparent',
              borderBottom: '14px solid transparent',
              borderLeft: '24px solid #C9A84C',
              marginLeft: 5,
            }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#C9A84C', fontFamily: 'sans-serif' }}>
              {semana}
            </div>
            <div style={{ fontSize: 14, color: '#555', fontFamily: 'sans-serif' }}>
              Entradas válidas · Resultados reales · Sin filtros
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: '#333', fontFamily: 'sans-serif' }}>
            libertytrading.pro
          </div>
          <div style={{ fontSize: 13, color: '#C9A84C', letterSpacing: 2, fontFamily: 'sans-serif' }}>
            TRADING EN VIVO · MERCADO REAL
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
