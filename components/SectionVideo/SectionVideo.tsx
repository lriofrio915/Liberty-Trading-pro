'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Video fijo de una sección (Academia, Acciones…). El admin pega la URL de
 * YouTube con el botón EDITAR; se guarda en SectionVideo vía /api/section-video.
 */

const getYouTubeId = (url: string) =>
  url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1] ?? ''

export default function SectionVideo({
  section,
  isAdmin,
  label,
  emptyText,
}: {
  section: string
  isAdmin: boolean
  label: string
  emptyText: string
}) {
  const [video, setVideo] = useState<{ youtubeUrl: string; title: string | null }>({ youtubeUrl: '', title: null })
  const [editMode, setEditMode] = useState(false)
  const [editUrl, setEditUrl] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadVideo = useCallback(async () => {
    try {
      const res = await fetch(`/api/section-video?section=${section}`)
      if (res.ok) {
        const data = await res.json()
        if (data.youtubeUrl) setVideo(data)
      }
    } catch {}
  }, [section])

  useEffect(() => { loadVideo() }, [loadVideo])

  const saveVideo = async () => {
    if (!getYouTubeId(editUrl)) { setError('Pega un enlace de YouTube válido.'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/section-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, youtubeUrl: editUrl, title: editTitle }),
      })
      if (res.ok) {
        setVideo({ youtubeUrl: editUrl, title: editTitle || null })
        setEditMode(false)
      } else {
        setError('No se pudo guardar el video.')
      }
    } catch { setError('No se pudo guardar el video.') } finally { setSaving(false) }
  }

  // Sin video y sin ser admin: no ocupa espacio.
  if (!video.youtubeUrl && !isAdmin) return null

  return (
    <div className="mb-8 rounded-xl border p-5"
      style={{ borderColor: 'rgba(201,168,76,0.18)', background: 'linear-gradient(135deg, rgba(201,168,76,0.04) 0%, transparent 70%)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-mono tracking-widest" style={{ color: 'var(--gold)' }}>{label}</p>
        {isAdmin && (
          <button
            onClick={() => { setEditMode(!editMode); setError(''); if (!editMode) { setEditUrl(video.youtubeUrl); setEditTitle(video.title || '') } }}
            className="text-[10px] font-mono tracking-widest px-3 py-1 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--gold)]"
          >
            {editMode ? 'CANCELAR' : video.youtubeUrl ? 'EDITAR' : '+ SUBIR VIDEO'}
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
          {error && <p className="text-xs text-[var(--red)]">{error}</p>}
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
        <>
          {video.title && <p className="text-sm font-bold text-[var(--text-primary)] mb-3">{video.title}</p>}
          <div className="aspect-video rounded-lg overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeId(video.youtubeUrl)}`}
              title={video.title || label}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        </>
      ) : (
        <div className="text-center py-12 border border-dashed rounded-lg" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs text-[var(--text-muted)]">{emptyText}</p>
        </div>
      )}
    </div>
  )
}
