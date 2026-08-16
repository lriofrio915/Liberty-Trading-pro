import { ImageResponse } from 'next/og'
import { BRAND } from '@/lib/brand'

export const runtime = 'nodejs'
export const revalidate = 86400
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = `${BRAND.name} — ${BRAND.role}`

/**
 * OG image de la home. Antes no existía: los links compartidos por WhatsApp
 * —canal principal del negocio— salían sin preview.
 *
 * Se dibuja con tipografía del sistema en vez de cargar Cormorant/DM Mono
 * remotas: mismo criterio que las otras OG del proyecto, y evita una descarga
 * de fuente en cada regeneración.
 */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#080808',
          padding: '64px 72px',
        }}>
        {/* Franja dorada superior */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 8,
            background: 'linear-gradient(90deg, #9A7A30, #C9A84C, #E8C96A)',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 22,
              letterSpacing: 8,
              textTransform: 'uppercase',
              color: '#C9A84C',
              fontFamily: 'monospace',
            }}>
            {BRAND.role}
          </div>
          <div
            style={{
              fontSize: 96,
              fontStyle: 'italic',
              fontWeight: 400,
              color: '#f0ece4',
              fontFamily: 'serif',
              marginTop: 12,
              lineHeight: 1.05,
            }}>
            {BRAND.name}
          </div>
          <div
            style={{
              fontSize: 34,
              color: '#8a8480',
              marginTop: 20,
              maxWidth: 820,
              lineHeight: 1.35,
            }}>
            Invierte con quien opera de verdad.
          </div>
        </div>

        {/* Servicios */}
        <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
          {['Educación', 'Bots de futuros', 'Cripto ↔ Fiat', 'Acciones EEUU'].map((s) => (
            <div
              key={s}
              style={{
                display: 'flex',
                fontSize: 22,
                color: '#C9A84C',
                border: '1px solid #9A7A30',
                borderRadius: 999,
                padding: '10px 22px',
                fontFamily: 'monospace',
              }}>
              {s}
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #1e1e1e',
            paddingTop: 24,
          }}>
          <div style={{ fontSize: 24, color: '#4a4642', fontFamily: 'monospace' }}>
            {BRAND.domain}
          </div>
          <div style={{ fontSize: 24, color: '#4a4642', fontFamily: 'monospace' }}>
            {BRAND.location}
          </div>
        </div>
      </div>
    ),
    size
  )
}
