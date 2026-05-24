'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'

const FuturosSesgoTab = dynamic(() => import('./FuturosSesgoTab'), { ssr: false })
const MiCuentaTab = dynamic(() => import('./MiCuentaTab'), { ssr: false })
const PlanesClient = dynamic(() => import('../planes/PlanesClient'), { ssr: false })
const TrackRecordClient = dynamic(() => import('@/components/TrackRecord/TrackRecordClient'), { ssr: false })
const ReportesClient = dynamic(() => import('../reportes/ReportesClient'), { ssr: false })

type Tab = 'overview' | 'sesgo' | 'cuenta' | 'plan' | 'track' | 'reportes'

interface Session {
  id: string; date: string; instrumento: string; direccion: string; resultado: string
  pnlBruto: number; comisiones: number; pnlNeto: number; contratos: number
  entryPrice: number | null; exitPrice: number | null; siguioPlan: boolean
  sentimiento: string | null; notas: string | null; planId: string | null
}

interface Plan {
  id: string; name: string; capitalInicial: number; createdAt: string
  dataFeedMensual: number | null; comisionPorTrade: number | null
}

const NAV_TABS: [Tab, string][] = [
  ['overview', 'OVERVIEW'],
  ['sesgo', 'SESGO INTRADÍA'],
  ['cuenta', 'MI CUENTA'],
  ['plan', 'PLAN'],
]

export default function FuturosClient({
  isAdmin,
  sessions = [],
  plans = [],
  fullPlans = [],
  retiros = [],
  userId = '',
  userName = null,
  userPlan = null,
}: {
  isAdmin: boolean
  sessions?: Session[]
  plans?: Plan[]
  fullPlans?: any[]
  retiros?: any[]
  userId?: string
  userName?: string | null
  userPlan?: string | null
}) {
  const [tab, setTab] = useState<Tab>('overview')
  const [video, setVideo] = useState<{ youtubeUrl: string; title: string | null }>({ youtubeUrl: '', title: null })
  const [editMode, setEditMode] = useState(false)
  const [editUrl, setEditUrl] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const loadVideo = useCallback(async () => {
    try {
      const res = await fetch('/api/section-video?section=futuros')
      if (res.ok) {
        const data = await res.json()
        if (data.youtubeUrl) setVideo(data)
      }
    } catch {}
  }, [])

  useEffect(() => { loadVideo() }, [loadVideo])

  const saveVideo = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/section-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'futuros', youtubeUrl: editUrl, title: editTitle }),
      })
      if (res.ok) {
        setVideo({ youtubeUrl: editUrl, title: editTitle })
        setEditMode(false)
      }
    } catch {} finally { setSaving(false) }
  }

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    return match?.[1] || ''
  }

  // MI CUENTA se resalta también cuando estamos en sub-tabs track/reportes
  const isActiveCuenta = tab === 'cuenta' || tab === 'track' || tab === 'reportes'

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black mb-2">
          <span className="gradient-gold">Futuros</span>
        </h1>
      </div>

      {/* Nav unificada */}
      <div className="overflow-x-auto scrollbar-none mb-8">
        <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {NAV_TABS.map(([id, label]) => {
            const isActive = id === 'cuenta' ? isActiveCuenta : tab === id
            return (
              <button
                key={id}
                onClick={() => setTab(id === 'cuenta' && isActiveCuenta && tab !== 'cuenta' ? 'cuenta' : id)}
                className="px-5 py-2 rounded-lg text-xs font-mono tracking-widest transition-all whitespace-nowrap"
                style={isActive
                  ? { background: 'var(--gold-dark)', color: '#000', fontWeight: 700 }
                  : { color: 'var(--text-secondary)' }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {tab === 'sesgo' && <FuturosSesgoTab isAdmin={isAdmin} />}

      {tab === 'cuenta' && (
        <MiCuentaTab
          sessions={sessions}
          plans={plans}
          userName={userName}
          userPlan={userPlan}
          onSwitchTab={setTab}
        />
      )}

      {tab === 'plan' && (
        <PlanesClient initialPlans={fullPlans} initialRetiros={retiros} />
      )}

      {tab === 'track' && (
        <div>
          <button
            onClick={() => setTab('cuenta')}
            className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest mb-6 transition-colors hover:text-[var(--gold)]"
            style={{ color: 'var(--text-muted)' }}
          >
            ← MI CUENTA
          </button>
          <TrackRecordClient
            initialSessions={sessions as any}
            initialPlans={plans.map(p => ({ id: p.id, name: p.name }))}
            userId={userId}
          />
        </div>
      )}

      {tab === 'reportes' && (
        <div>
          <button
            onClick={() => setTab('cuenta')}
            className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest mb-6 transition-colors hover:text-[var(--gold)]"
            style={{ color: 'var(--text-muted)' }}
          >
            ← MI CUENTA
          </button>
          <ReportesClient />
        </div>
      )}

      {tab === 'overview' && (
        <div>
          {/* Hero description */}
          <div className="mb-8">
            <p className="text-[var(--text-secondary)] text-sm max-w-2xl">
              Los futuros son contratos financieros que te permiten especular sobre el precio de un activo subyacente
              (índices, commodities, divisas) sin poseerlo directamente. Operas con apalancamiento, lo que amplifica
              tanto ganancias como riesgos. Los futuros del NASDAQ (NQ) y S&P 500 (ES) son los más líquidos del mundo.
            </p>
          </div>

          {/* Video admin — ahora encima de las tarjetas */}
          <div className="mb-8 rounded-xl border p-5" style={{ borderColor: 'rgba(201,168,76,0.18)', background: 'linear-gradient(135deg, rgba(201,168,76,0.04) 0%, transparent 70%)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-mono tracking-widest" style={{ color: 'var(--gold)' }}>VIDEO DEL PROFESIONAL</p>
              {isAdmin && (
                <button
                  onClick={() => { setEditMode(!editMode); if (!editMode) { setEditUrl(video.youtubeUrl); setEditTitle(video.title || '') } }}
                  className="text-[10px] font-mono tracking-widest px-3 py-1 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--gold)]"
                >
                  {editMode ? 'CANCELAR' : 'EDITAR'}
                </button>
              )}
            </div>

            {editMode && (
              <div className="space-y-3 mb-4">
                <input
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="URL de YouTube"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] text-xs px-4 py-2 rounded-lg focus:outline-none focus:border-[var(--gold-dark)] font-mono"
                />
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Título del video (opcional)"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] text-xs px-4 py-2 rounded-lg focus:outline-none focus:border-[var(--gold-dark)] font-mono"
                />
                <button
                  onClick={saveVideo}
                  disabled={!editUrl || saving}
                  className="px-4 py-2 text-xs font-mono tracking-widest rounded-lg bg-[var(--gold)] text-black disabled:opacity-50"
                >
                  {saving ? 'GUARDANDO…' : 'GUARDAR'}
                </button>
              </div>
            )}

            {video.youtubeUrl ? (
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeId(video.youtubeUrl)}`}
                  title={video.title || 'Video de Futuros'}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed rounded-lg" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs text-[var(--text-muted)]">El administrador aún no ha publicado un video para esta sección.</p>
              </div>
            )}
          </div>

          {/* Features — ahora al final */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: '⚡', title: 'Alto apalancamiento', desc: 'Controla grandes contratos con poco capital. Opera NQ desde $500 de margen intradía.' },
              { icon: '🌍', title: 'Mercado 24h', desc: 'Opera casi 24 horas al día, 5 días a la semana. Liquidez constante en horario US.' },
              { icon: '📉', title: 'Bidireccional', desc: 'Gana tanto en subidas (LONG) como en bajadas (SHORT). Sin restricciones de day trading.' },
            ].map((f, i) => (
              <div
                key={i}
                className="rounded-xl border p-5"
                style={{
                  background: 'linear-gradient(135deg, rgba(201,168,76,0.06) 0%, transparent 80%)',
                  borderColor: 'rgba(201,168,76,0.15)',
                  animation: `fadeInUp 0.5s ${i * 0.1}s both`,
                }}
              >
                <div className="text-2xl mb-2">{f.icon}</div>
                <p className="text-xs font-bold text-white mb-1">{f.title}</p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
