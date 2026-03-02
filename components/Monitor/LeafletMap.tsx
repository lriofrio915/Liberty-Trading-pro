'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ── Types ────────────────────────────────────────────────────────────────────

export interface GDELTEvent {
  id: string
  lat: number
  lng: number
  title: string
  url: string
  domain: string
  sourcecountry: string
  dateadded: string
  isoDate: string
  tone: number
  themes: string
  eventType: 'conflict' | 'protest' | 'disaster' | 'economic' | 'other'
  color: string
}

// ── Icon factories ────────────────────────────────────────────────────────────

function markerIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:10px;height:10px;border-radius:50%;
      background:${color};
      border:1.5px solid rgba(255,255,255,0.55);
      box-shadow:0 0 6px ${color}99;
    "></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
    popupAnchor: [0, -7],
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clusterIcon(cluster: any) {
  const n: number = cluster.getChildCount()
  const sz = n < 10 ? 30 : n < 50 ? 38 : 46
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${sz}px;height:${sz}px;border-radius:50%;
      background:rgba(201,168,76,0.13);
      border:1px solid rgba(201,168,76,0.45);
      display:flex;align-items:center;justify-content:center;
      font-size:11px;font-family:monospace;
      color:#C9A84C;font-weight:700;letter-spacing:-0.5px;
    ">${n}</div>`,
    iconSize: [sz, sz],
    iconAnchor: [sz / 2, sz / 2],
  })
}

// ── Fit-bounds helper (when events change) ──────────────────────────────────

function FitBounds({ events }: { events: GDELTEvent[] }) {
  const map = useMap()
  const didFit = useRef(false)

  useEffect(() => {
    if (!didFit.current && events.length > 0) {
      const bounds = L.latLngBounds(events.map((e) => [e.lat, e.lng]))
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 5 })
      didFit.current = true
    }
  }, [events, map])

  return null
}

// ── Props ────────────────────────────────────────────────────────────────────

interface LeafletMapProps {
  events: GDELTEvent[]
  onEventClick: (event: GDELTEvent) => void
  selectedId?: string | null
}

// ── Component ────────────────────────────────────────────────────────────────

export default function LeafletMap({ events, onEventClick, selectedId }: LeafletMapProps) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      maxBoundsViscosity={1}
      style={{ height: '100%', width: '100%', background: '#0d0d0d' }}
      attributionControl={false}
    >
      {/* Dark tiles */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution="© <a href='https://www.openstreetmap.org/copyright'>OSM</a> © <a href='https://carto.com/attributions'>CARTO</a>"
      />

      {/* Fit to data on first load */}
      <FitBounds events={events} />

      {/* Clustered markers */}
      <MarkerClusterGroup
        chunkedLoading
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        iconCreateFunction={clusterIcon as any}
        maxClusterRadius={50}
        disableClusteringAtZoom={7}
        showCoverageOnHover={false}
        spiderfyOnMaxZoom
      >
        {events.map((evt) => (
          <Marker
            key={evt.id}
            position={[evt.lat, evt.lng]}
            icon={markerIcon(selectedId === evt.id ? '#ffffff' : evt.color)}
            eventHandlers={{
              click: () => onEventClick(evt),
            }}
          />
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  )
}
