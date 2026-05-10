'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import ResearchTab from './ResearchTab'
import TauricResearchTab from './TauricResearchTab'
import DailySignalsTab from './DailySignalsTab'

const OportunidadesClient = dynamic(
  () => import('@/app/dashboard/oportunidades/OportunidadesClient'),
  { ssr: false },
) as React.ComponentType<{
  initialOpportunities: never[]
  plan: string
  isAdmin: boolean
}>

type Tab = 'recomendaciones' | 'research' | 'tauric' | 'signals'

export default function AccionesClient({
  initialOpportunities,
  plan,
  isAdmin,
}: {
  initialOpportunities: never[]
  plan: string
  isAdmin: boolean
}) {
  const [tab, setTab] = useState<Tab>('recomendaciones')
  const [video, setVideo] = useState<{ youtubeUrl: string; title: string | null }>({ youtubeUrl: '', title: null })
  const [editMode, setEditMode] = useState(false)
  const [editUrl, setEditUrl] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const loadVideo = useCallback(async () => {
    try {
      const res = await fetch('/api/section-video?section=acciones')
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
        body: JSON.stringify({ section: 'acciones', youtubeUrl: editUrl, title: editTitle }),
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

  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-black mb-2">
        <span className="gradient-gold">Acciones</span>
      </h1>
      <p className="text-[var(--text-secondary)] text-sm max-w-2xl mb-6">
        Invertir en acciones significa comprar una participación en una empresa real.
        Aquí encuentras recomendaciones profesionales basadas en análisis fundamental
        y un screener avanzado con los criterios de Peter Lynch para filtrar las mejores
        oportunidades del S&P 500 y NASDAQ 100.
      </p>

      {/* Video admin */}
      <div className="mb-6 rounded-xl border p-5" style={{ borderColor: 'rgba(201,168,76,0.18)', background: 'linear-gradient(135deg, rgba(201,168,76,0.04) 0%, transparent 70%)' }}>
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
              placeholder="URL de YouTube (ej: https://youtube.com/watch?v=...)"
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
              title={video.title || 'Video de Acciones'}
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

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setTab('signals')}
          className={`px-4 py-2 text-xs font-mono tracking-widest rounded-lg border ${
            tab === 'signals'
              ? 'bg-[var(--gold)] text-black border-[var(--gold)]'
              : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)]'
          }`}
        >
          DAILY SCANNER
        </button>
        <button
          onClick={() => setTab('recomendaciones')}
          className={`px-4 py-2 text-xs font-mono tracking-widest rounded-lg border ${
            tab === 'recomendaciones'
              ? 'bg-[var(--gold)] text-black border-[var(--gold)]'
              : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)]'
          }`}
        >
          RECOMENDACIONES
        </button>
        <button
          onClick={() => setTab('research')}
          className={`px-4 py-2 text-xs font-mono tracking-widest rounded-lg border ${
            tab === 'research'
              ? 'bg-[var(--gold)] text-black border-[var(--gold)]'
              : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)]'
          }`}
        >
          LINCH RESEARCH
        </button>
        <button
          onClick={() => setTab('tauric')}
          className={`px-4 py-2 text-xs font-mono tracking-widest rounded-lg border ${
            tab === 'tauric'
              ? 'bg-[var(--gold)] text-black border-[var(--gold)]'
              : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)]'
          }`}
        >
          TAURIC RESEARCH
        </button>
      </div>

      {tab === 'recomendaciones' && (
        <OportunidadesClient initialOpportunities={initialOpportunities} plan={plan} isAdmin={isAdmin} />
      )}
      {tab === 'research' && <ResearchTab />}
      {tab === 'tauric' && <TauricResearchTab />}
      {tab === 'signals' && <DailySignalsTab />}
    </div>
  )
}