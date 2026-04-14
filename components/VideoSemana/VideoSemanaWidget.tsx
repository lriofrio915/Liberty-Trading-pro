'use client'

import { useState } from 'react'

interface VideoSemana {
  id: string
  titulo: string
  descripcion: string | null
  youtubeUrl: string
  semana: string
  publicado: boolean
}

interface FormState {
  titulo: string
  descripcion: string
  youtubeUrl: string
  semana: string
  publicado: boolean
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  return m ? m[1] : null
}

function formatSemana(d: string) {
  return new Date(d).toLocaleDateString('es-EC', {
    timeZone: 'America/Guayaquil',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function thisMonday(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

export default function VideoSemanaWidget({
  initialVideo,
  isAdmin,
  appUrl,
}: {
  initialVideo: VideoSemana | null
  isAdmin: boolean
  appUrl: string
}) {
  const [video, setVideo] = useState<VideoSemana | null>(initialVideo)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState<FormState>({
    titulo: '',
    descripcion: '',
    youtubeUrl: '',
    semana: thisMonday(),
    publicado: true,
  })

  const set = (k: keyof FormState, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  function openNew() {
    setForm({ titulo: '', descripcion: '', youtubeUrl: '', semana: thisMonday(), publicado: true })
    setShowForm(true)
  }

  function openEdit() {
    if (!video) return
    setForm({
      titulo: video.titulo,
      descripcion: video.descripcion || '',
      youtubeUrl: video.youtubeUrl,
      semana: new Date(video.semana).toISOString().split('T')[0],
      publicado: video.publicado,
    })
    setShowForm(true)
  }

  async function save() {
    setSaving(true)
    try {
      const url = video ? `/api/video-semana/${video.id}` : '/api/video-semana'
      const method = video ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.video) {
        setVideo(json.video)
        setShowForm(false)
      }
    } finally {
      setSaving(false)
    }
  }

  async function deleteVideo() {
    if (!video || !confirm('¿Eliminar este video?')) return
    await fetch(`/api/video-semana/${video.id}`, { method: 'DELETE' })
    setVideo(null)
  }

  const shareUrl = video ? `${appUrl}/video-semana/${video.id}` : ''
  const shareText = video ? encodeURIComponent(`${video.titulo} — Liberty Trading Pro 📈`) : ''

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const ytId = video ? getYouTubeId(video.youtubeUrl) : null

  return (
    <div className="mb-10">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="label-mono text-[var(--gold)] mb-1">Video de la Semana</div>
          <h2 className="text-xl font-black text-white" style={{ fontFamily: 'Georgia, serif' }}>
            Entradas en vivo · Esta semana
          </h2>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            {video && (
              <>
                <button
                  onClick={openEdit}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#888' }}
                >
                  Editar
                </button>
                <button
                  onClick={deleteVideo}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors hover:bg-red-950"
                  style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}
                >
                  Eliminar
                </button>
              </>
            )}
            <button
              onClick={openNew}
              className="text-xs font-mono px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: '#C9A84C', color: '#080808', fontWeight: 700 }}
            >
              + Subir video
            </button>
          </div>
        )}
      </div>

      {/* Video card */}
      {!video ? (
        <div className="rounded-xl border p-10 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="text-4xl mb-3">🎬</div>
          <p className="text-sm" style={{ color: '#555' }}>
            {isAdmin ? 'Aún no hay video esta semana. Sube uno con el botón de arriba.' : 'El video de esta semana estará disponible pronto.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(201,168,76,0.2)' }}>

          {/* Video embed */}
          {ytId ? (
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={video.titulo}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center py-16 text-[#555] text-sm">
              URL de video no válida
            </div>
          )}

          {/* Info + share */}
          <div className="px-5 py-4">
            <div className="text-[10px] font-mono tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>
              Semana del {formatSemana(video.semana)}
            </div>
            <div className="font-bold text-white mb-1">{video.titulo}</div>
            {video.descripcion && (
              <p className="text-xs leading-relaxed mb-3" style={{ color: '#666' }}>{video.descripcion}</p>
            )}

            {/* Share bar */}
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-[10px] font-mono uppercase tracking-widest mr-1" style={{ color: '#444' }}>Compartir:</span>

              {/* Copy link */}
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg border transition-all"
                style={{
                  borderColor: '#C9A84C',
                  color: copied ? '#080808' : '#C9A84C',
                  background: copied ? '#C9A84C' : 'transparent',
                }}
              >
                {copied ? (
                  <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> Copiado</>
                ) : (
                  <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg> Copiar link</>
                )}
              </button>

              {/* X */}
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg transition-opacity hover:opacity-75"
                style={{ background: '#000', color: '#fff', border: '1px solid #333' }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                X
              </a>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/?text=${shareText}%20${encodeURIComponent(shareUrl)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg transition-opacity hover:opacity-75"
                style={{ background: '#25D366', color: '#fff' }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413A11.824 11.824 0 0012.05 0zm0 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884z" /></svg>
                WhatsApp
              </a>

              {/* LinkedIn */}
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg transition-opacity hover:opacity-75"
                style={{ background: '#0A66C2', color: '#fff' }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                LinkedIn
              </a>

              {/* Facebook */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg transition-opacity hover:opacity-75"
                style={{ background: '#1877F2', color: '#fff' }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                Facebook
              </a>

              {/* Ver página pública */}
              <a
                href={shareUrl}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg transition-opacity hover:opacity-75 ml-auto"
                style={{ color: '#555', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                Ver público
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Admin form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full max-w-lg rounded-2xl border p-6"
            style={{ background: '#0e0e0e', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white" style={{ fontFamily: 'Georgia, serif' }}>
                {video ? 'Editar video' : 'Subir video de la semana'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-[#555] hover:text-white text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label-mono text-[10px] mb-1 block" style={{ color: '#555' }}>Título *</label>
                <input
                  value={form.titulo}
                  onChange={e => set('titulo', e.target.value)}
                  placeholder="Entradas del lunes: NQ rompió resistencia clave"
                  className="w-full bg-transparent rounded-lg px-3 py-2 text-sm text-white border outline-none focus:border-[#C9A84C]"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                />
              </div>

              <div>
                <label className="label-mono text-[10px] mb-1 block" style={{ color: '#555' }}>URL de YouTube *</label>
                <input
                  value={form.youtubeUrl}
                  onChange={e => set('youtubeUrl', e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-transparent rounded-lg px-3 py-2 text-sm text-white border outline-none focus:border-[#C9A84C]"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                />
                {form.youtubeUrl && getYouTubeId(form.youtubeUrl) && (
                  <p className="text-[10px] mt-1" style={{ color: '#22c55e' }}>
                    ✓ URL válida · ID: {getYouTubeId(form.youtubeUrl)}
                  </p>
                )}
              </div>

              <div>
                <label className="label-mono text-[10px] mb-1 block" style={{ color: '#555' }}>Descripción (opcional)</label>
                <textarea
                  value={form.descripcion}
                  onChange={e => set('descripcion', e.target.value)}
                  rows={2}
                  placeholder="Breve descripción de lo que se ve en el video..."
                  className="w-full bg-transparent rounded-lg px-3 py-2 text-sm text-white border outline-none focus:border-[#C9A84C] resize-none"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                />
              </div>

              <div>
                <label className="label-mono text-[10px] mb-1 block" style={{ color: '#555' }}>Semana que cubre *</label>
                <input
                  type="date"
                  value={form.semana}
                  onChange={e => set('semana', e.target.value)}
                  className="w-full bg-transparent rounded-lg px-3 py-2 text-sm text-white border outline-none focus:border-[#C9A84C]"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', colorScheme: 'dark' }}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.publicado}
                  onChange={e => set('publicado', e.target.checked)}
                  className="accent-[#C9A84C]"
                />
                <span className="text-sm" style={{ color: '#888' }}>Publicado (visible para estudiantes)</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2 rounded-lg text-sm border transition-colors hover:bg-white/5"
                style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#888' }}
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving || !form.titulo || !form.youtubeUrl || !form.semana}
                className="flex-1 py-2 rounded-lg text-sm font-bold transition-opacity disabled:opacity-40"
                style={{ background: '#C9A84C', color: '#080808' }}
              >
                {saving ? 'Guardando...' : video ? 'Actualizar' : 'Publicar video'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
