'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

interface GDELTEvent {
  id: string
  lat: number
  lng: number
  title: string
  url: string
  domain: string
  sourcecountry: string
  isoDate: string
  tone: number
  eventType: 'conflict' | 'protest' | 'disaster' | 'economic' | 'other'
  color: string
}

const EVENT_LABELS: Record<string, string> = {
  conflict: 'CONFLICTO',
  protest: 'PROTESTA',
  disaster: 'DESASTRE',
  economic: 'ECONÓMICO',
  other: 'OTRO',
}

interface GdeltMapProps {
  timespan?: string
}

export default function GdeltMap({ timespan = '24h' }: GdeltMapProps) {
  const [events, setEvents] = useState<GDELTEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/monitor/events?timespan=${timespan}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => setEvents(data.events || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [timespan])

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {/* Loading overlay */}
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(8,8,8,0.75)',
            zIndex: 1000,
            borderRadius: 12,
          }}
        >
          <span
            style={{
              color: '#C9A84C',
              fontFamily: 'monospace',
              fontSize: 11,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            Cargando eventos GDELT...
          </span>
        </div>
      )}

      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="©OpenStreetMap ©CartoDB"
        />

        {events.map((event) => (
          <CircleMarker
            key={event.id}
            center={[event.lat, event.lng]}
            radius={6}
            fillColor={event.color}
            color={event.color}
            weight={1.5}
            opacity={0.9}
            fillOpacity={0.45}
          >
            <Popup>
              <div
                style={{
                  background: '#111111',
                  color: '#E8E4DC',
                  padding: '10px 12px',
                  minWidth: '220px',
                  maxWidth: '280px',
                  fontFamily: 'system-ui, sans-serif',
                  borderRadius: 8,
                }}
              >
                {/* Type + country */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: event.color,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontFamily: 'monospace',
                    }}
                  >
                    {EVENT_LABELS[event.eventType] ?? event.eventType}
                  </span>
                  {event.sourcecountry && (
                    <span style={{ fontSize: 10, color: '#8a8480', fontFamily: 'monospace' }}>
                      {event.sourcecountry}
                    </span>
                  )}
                </div>

                {/* Date */}
                <p style={{ fontSize: 11, color: '#C9A84C', marginBottom: 6, fontFamily: 'monospace' }}>
                  {new Date(event.isoDate).toLocaleString('es', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>

                {/* Title */}
                <p style={{ fontSize: 13, lineHeight: 1.45, marginBottom: 8, color: '#f0ece4' }}>
                  {event.title?.length > 110
                    ? event.title.slice(0, 110) + '...'
                    : event.title}
                </p>

                {/* Tone */}
                <p style={{ fontSize: 10, color: '#4a4642', marginBottom: 8, fontFamily: 'monospace' }}>
                  Tono GDELT: {event.tone?.toFixed(1)} ·{' '}
                  {event.domain || ''}
                </p>

                {/* Link */}
                {event.url && (
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#C9A84C',
                      fontSize: 11,
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Ver fuente →
                  </a>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Event count badge */}
      {!loading && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            zIndex: 1000,
            background: 'rgba(8,8,8,0.85)',
            border: '1px solid rgba(201,168,76,0.25)',
            borderRadius: 6,
            padding: '3px 8px',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              color: '#C9A84C',
              fontSize: 9,
              fontFamily: 'monospace',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {events.length} eventos · GDELT · últimas {timespan}
          </span>
        </div>
      )}
    </div>
  )
}
