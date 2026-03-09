'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

interface GdeltFeature {
  geometry: {
    coordinates: [number, number] // [lng, lat]
  }
  properties: {
    name?: string
    SOURCEURL?: string
    DATEADDED?: string
    url?: string
    dateadded?: string
    tone?: number
    domain?: string
    sourcecountry?: string
    themes?: string
  }
}

interface GdeltMapProps {
  timespan?: string
}

export default function GdeltMap({ timespan = '24h' }: GdeltMapProps) {
  const [events, setEvents] = useState<GdeltFeature[]>([])
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/monitor/events?timespan=${timespan}`)
      .then((r) => r.json())
      .then((data) => {
        const features: GdeltFeature[] = data.features || []
        setEvents(features)
        setCount(features.length)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [timespan])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>

      {/* Loading overlay */}
      {loading && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.8)',
          }}
        >
          <p
            style={{
              color: '#C9A84C', fontFamily: 'monospace', fontSize: 12,
              letterSpacing: '0.15em', textTransform: 'uppercase',
            }}
          >
            CARGANDO EVENTOS GLOBALES...
          </p>
        </div>
      )}

      {/* Event count badge */}
      {!loading && count > 0 && (
        <div
          style={{
            position: 'absolute', top: 10, left: 10, zIndex: 1000,
            background: 'rgba(0,0,0,0.85)', border: '1px solid #C9A84C',
            padding: '5px 12px', fontFamily: 'monospace', fontSize: 11,
            color: '#C9A84C', letterSpacing: '0.12em', pointerEvents: 'none',
          }}
        >
          {count} EVENTOS · ÚLTIMAS {timespan.toUpperCase()}
        </div>
      )}

      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        scrollWheelZoom
        style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="©OpenStreetMap ©CartoDB"
        />

        {events.map((event, i) => {
          const coords = event.geometry?.coordinates
          if (!coords || coords[0] === 0 || coords[1] === 0) return null
          const [lng, lat] = coords
          if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null

          const srcUrl = event.properties?.SOURCEURL || event.properties?.url || ''
          const rawDate = event.properties?.DATEADDED || event.properties?.dateadded || ''
          const domain = event.properties?.domain || (srcUrl ? srcUrl.split('/')[2] : '')
          const country = event.properties?.sourcecountry || ''
          const title = event.properties?.name || ''

          let displayDate = ''
          try {
            if (rawDate) {
              displayDate = new Date(rawDate).toLocaleString('es', {
                day: '2-digit', month: 'short',
                hour: '2-digit', minute: '2-digit',
              })
            }
          } catch { /* leave blank */ }

          return (
            <CircleMarker
              key={i}
              center={[lat, lng]}
              radius={6}
              pathOptions={{
                fillColor: '#C9A84C',
                color: '#9A7A30',
                weight: 1.5,
                opacity: 0.9,
                fillOpacity: 0.55,
              }}
            >
              <Popup>
                <div
                  style={{
                    background: '#111111', color: '#E8E4DC',
                    padding: '10px 12px', minWidth: '240px', maxWidth: '300px',
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  {/* Source + country */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: '#C9A84C', fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {domain}
                    </span>
                    {country && (
                      <span style={{ fontSize: 10, color: '#8a8480', fontFamily: 'monospace' }}>
                        {country}
                      </span>
                    )}
                  </div>

                  {/* Article title */}
                  {title && (
                    <p style={{ fontSize: 12, lineHeight: 1.45, marginBottom: 8, color: '#E8E4DC' }}>
                      {title}
                    </p>
                  )}

                  {/* Date + link */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {displayDate && (
                      <span style={{ fontSize: 10, color: '#4a4642', fontFamily: 'monospace' }}>
                        {displayDate}
                      </span>
                    )}
                    {srcUrl && (
                      <a
                        href={srcUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#C9A84C', fontSize: 11, textDecoration: 'none', fontFamily: 'monospace' }}
                      >
                        Leer →
                      </a>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}
