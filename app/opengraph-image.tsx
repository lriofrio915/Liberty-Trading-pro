import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'
import { BRAND } from '@/lib/brand'

export const runtime = 'nodejs'
export const revalidate = 86400
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = `${BRAND.legalName} — por ${BRAND.name}, ${BRAND.role}`

/**
 * OG image de la home. Antes no existía: los links compartidos por WhatsApp
 * —canal principal del negocio— salían sin preview.
 *
 * Se dibuja con tipografía del sistema en vez de cargar Cormorant/DM Mono
 * remotas: mismo criterio que las otras OG del proyecto, y evita una descarga
 * de fuente en cada regeneración.
 */
/** Logo con texto en trazos: no necesita cargar fuentes en el render. */
function logoDataUri() {
  const svg = readFileSync(join(process.cwd(), 'public', BRAND.logos.respaldo), 'utf-8')
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

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
          alignItems: 'center',
          background: '#080808',
          padding: '56px 72px 44px',
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

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoDataUri()} width={612} height={247} alt="" />

        <div
          style={{
            fontSize: 44,
            fontStyle: 'italic',
            color: '#f0ece4',
            fontFamily: 'serif',
            marginTop: -8,
          }}>
          Monta tu negocio de trading algorítmico
        </div>

        <div style={{ display: 'flex', gap: 14 }}>
          {['Video clases', `Pase a cuenta fondeada de ${BRAND.price.fundingAccountLabel}`, 'Bots con código completo'].map((s) => (
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
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #1e1e1e',
            paddingTop: 20,
          }}>
          <div style={{ fontSize: 24, color: '#8a8480', fontFamily: 'monospace' }}>
            {BRAND.domain}
          </div>
          <div style={{ fontSize: 24, color: '#8a8480', fontFamily: 'monospace' }}>
            {BRAND.location}
          </div>
        </div>
      </div>
    ),
    size
  )
}
