'use client'

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

interface Leccion {
  id: string
  titulo: string
  descripcion: string
  contenido: string
  videoUrl: string | null
  orden: number
  categoria: string
  publicado: boolean
  creadoEn: string
}

interface FormState {
  titulo: string
  descripcion: string
  contenido: string
  videoUrl: string
  orden: string
  categoria: string
  publicado: boolean
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  return m ? m[1] : null
}

function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/)
  return m ? m[1] : null
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[10000] animate-fadeIn">
      <div className="card border-[var(--gold-dark)] px-5 py-3 flex items-center gap-3 shadow-xl">
        <span className="text-[var(--green)] text-lg">✓</span>
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white text-xs ml-2">✕</button>
      </div>
    </div>
  )
}

export default function AcademiaClient({
  initialLecciones,
  completados: initialCompletados,
  isAdmin,
  categorias,
}: {
  initialLecciones: Leccion[]
  completados: string[]
  isAdmin: boolean
  categorias: string[]
}) {
  const [lecciones, setLecciones] = useState<Leccion[]>(initialLecciones)
  const [completados, setCompletados] = useState<Set<string>>(new Set(initialCompletados))
  const [selected, setSelected] = useState<Leccion | null>(null)
  const [modalMode, setModalMode] = useState<'new' | 'edit' | null>(null)
  const [editingLeccion, setEditingLeccion] = useState<Leccion | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const blank = (): FormState => ({
    titulo: '', descripcion: '', contenido: '', videoUrl: '',
    orden: '0', categoria: categorias[0], publicado: false,
  })
  const [form, setForm] = useState<FormState>(blank())
  const set = (k: keyof FormState, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000) }

  const byCategoria = useMemo(() => {
    const map = new Map<string, Leccion[]>()
    categorias.forEach(c => map.set(c, []))
    lecciones.forEach(l => {
      if (!map.has(l.categoria)) map.set(l.categoria, [])
      map.get(l.categoria)!.push(l)
    })
    return map
  }, [lecciones, categorias])

  const totalPublicadas = lecciones.filter(l => l.publicado).length
  const totalCompletadas = completados.size

  const toggleProgreso = async (leccionId: string) => {
    const esCompletada = completados.has(leccionId)
    try {
      await fetch('/api/academia/progreso', {
        method: esCompletada ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leccionId }),
      })
      setCompletados(prev => {
        const next = new Set(prev)
        if (esCompletada) { next.delete(leccionId) } else { next.add(leccionId) }
        return next
      })
    } catch { showToast('Error al guardar progreso') }
  }

  const openNew = () => { setForm(blank()); setEditingLeccion(null); setModalMode('new') }
  const openEdit = (l: Leccion) => {
    setForm({ titulo: l.titulo, descripcion: l.descripcion, contenido: l.contenido, videoUrl: l.videoUrl || '', orden: String(l.orden), categoria: l.categoria, publicado: l.publicado })
    setEditingLeccion(l)
    setModalMode('edit')
  }
  const closeModal = () => { setModalMode(null); setEditingLeccion(null) }

  const handleSubmit = async () => {
    if (!form.titulo.trim()) return
    setSaving(true)
    try {
      const body = { ...form, orden: parseInt(form.orden) || 0, videoUrl: form.videoUrl || null }
      if (modalMode === 'edit' && editingLeccion) {
        const res = await fetch(`/api/academia/${editingLeccion.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        const data = await res.json()
        if (data.leccion) { setLecciones(prev => prev.map(l => l.id === editingLeccion.id ? data.leccion : l)); closeModal(); showToast('Leccion actualizada') }
      } else {
        const res = await fetch('/api/academia', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        const data = await res.json()
        if (data.leccion) { setLecciones(prev => [...prev, data.leccion]); closeModal(); showToast('Leccion creada') }
      }
    } catch { showToast('Error al guardar') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta leccion?')) return
    await fetch(`/api/academia/${id}`, { method: 'DELETE' })
    setLecciones(prev => prev.filter(l => l.id !== id))
    if (selected?.id === id) setSelected(null)
    showToast('Leccion eliminada')
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1"><span className="gradient-gold">Academia</span></h1>
          <p className="text-[var(--text-secondary)] text-sm">
            {isAdmin ? `${lecciones.length} lecciones en total` : `${totalCompletadas}/${totalPublicadas} lecciones completadas`}
          </p>
        </div>
        {isAdmin && (
          <button onClick={openNew} className="btn-gold py-2.5 px-5 rounded-lg text-sm">+ Nueva Leccion</button>
        )}
      </div>

      {/* Progress bar for students */}
      {!isAdmin && totalPublicadas > 0 && (
        <div className="card mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--text-muted)]">Tu progreso</span>
            <span className="font-bold text-[var(--gold)]">{totalCompletadas}/{totalPublicadas}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div style={{ width: `${(totalCompletadas / totalPublicadas) * 100}%`, background: 'var(--gold)' }} className="h-full rounded-full transition-all duration-500" />
          </div>
        </div>
      )}

      {lecciones.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🎓</div>
          <h2 className="text-xl font-bold mb-2">Academia en construccion</h2>
          <p className="text-[var(--text-secondary)] text-sm">Pronto habra contenido disponible</p>
        </div>
      ) : (
        <div className="space-y-8">
          {categorias.map(cat => {
            const cats = byCategoria.get(cat) || []
            const visible = isAdmin ? cats : cats.filter(l => l.publicado)
            if (!visible.length) return null
            return (
              <div key={cat}>
                <div className="label-mono text-[10px] text-[var(--gold)] mb-3 border-b border-[var(--border)] pb-2">{cat}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visible.map(l => (
                    <div
                      key={l.id}
                      className={`card cursor-pointer transition-all hover:border-[var(--gold-dark)] ${completados.has(l.id) ? 'border-green-900/50' : ''} ${!l.publicado ? 'opacity-60' : ''}`}
                      onClick={() => setSelected(l)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold">{l.titulo}</h3>
                            {completados.has(l.id) && <span className="text-green-400 text-xs">✓</span>}
                            {!l.publicado && <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">BORRADOR</span>}
                          </div>
                          {l.videoUrl && <span className="text-[10px] text-[var(--text-muted)]">▶ Video</span>}
                        </div>
                        {isAdmin && (
                          <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                            <button onClick={() => openEdit(l)} className="text-gray-500 hover:text-yellow-400 text-xs p-1">✏️</button>
                            <button onClick={() => handleDelete(l.id)} className="text-gray-500 hover:text-red-400 text-xs p-1">🗑️</button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2">{l.descripcion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Leccion viewer */}
      {mounted && selected && createPortal(
        <div
          onClick={e => e.target === e.currentTarget && setSelected(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px' }}
        >
          <div style={{ backgroundColor: '#111', border: '1px solid rgba(201,168,76,0.2)', width: '100%', maxWidth: '800px', position: 'relative', padding: '1.25rem', marginBottom: '16px', borderRadius: '12px' }}>
            <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', color: '#666', fontSize: '1.25rem' }}>✕</button>
            <div className="label-mono text-[10px] text-[var(--gold)] mb-1">{selected.categoria}</div>
            <h2 className="headline text-2xl text-[var(--text-primary)] mb-4">{selected.titulo}</h2>
            {selected.descripcion && <p className="text-[var(--text-secondary)] text-sm mb-6">{selected.descripcion}</p>}

            {/* Video embed */}
            {selected.videoUrl && (() => {
              const ytId = getYouTubeId(selected.videoUrl)
              const vimeoId = getVimeoId(selected.videoUrl)
              if (ytId) return (
                <div className="mb-6 aspect-video">
                  <iframe src={`https://www.youtube.com/embed/${ytId}`} className="w-full h-full rounded-lg" allowFullScreen />
                </div>
              )
              if (vimeoId) return (
                <div className="mb-6 aspect-video">
                  <iframe src={`https://player.vimeo.com/video/${vimeoId}`} className="w-full h-full rounded-lg" allowFullScreen />
                </div>
              )
              return null
            })()}

            {/* Contenido */}
            {selected.contenido && (
              <div
                className="prose prose-invert max-w-none text-sm text-[var(--text-secondary)] leading-relaxed mb-8 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: selected.contenido.replace(/\n/g, '<br/>') }}
              />
            )}

            {/* Mark complete */}
            <div className="pt-4 border-t border-[var(--border)]">
              <button
                onClick={() => toggleProgreso(selected.id)}
                className={`text-sm font-bold px-6 py-2.5 rounded-lg border transition-all ${
                  completados.has(selected.id)
                    ? 'bg-green-950 border-green-700 text-green-400'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:border-green-700 hover:text-green-400'
                }`}
              >
                {completados.has(selected.id) ? '✓ Completada' : 'Marcar como completada'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Admin form modal */}
      {mounted && modalMode !== null && createPortal(
        <div
          onClick={e => e.target === e.currentTarget && closeModal()}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10000, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px' }}
        >
          <div style={{ backgroundColor: '#111', border: '1px solid rgba(201,168,76,0.2)', width: '100%', maxWidth: '680px', padding: '1.25rem', position: 'relative', marginBottom: '16px', borderRadius: '12px' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '1rem', right: '1rem', color: '#666', fontSize: '1.25rem' }}>✕</button>
            <div className="label-mono mb-1 text-[var(--gold)]">{modalMode === 'edit' ? 'Editar Leccion' : 'Nueva Leccion'}</div>
            <h2 className="headline text-2xl text-[var(--text-primary)] mb-6">
              {modalMode === 'edit' ? form.titulo || 'Leccion' : 'Crear Leccion'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label-mono text-[10px] block mb-1.5">Titulo *</label>
                <input type="text" value={form.titulo} onChange={e => set('titulo', e.target.value)} className="input text-sm" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-mono text-[10px] block mb-1.5">Categoria</label>
                  <select value={form.categoria} onChange={e => set('categoria', e.target.value)} className="input text-sm">
                    {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-mono text-[10px] block mb-1.5">Orden</label>
                  <input type="number" min="0" value={form.orden} onChange={e => set('orden', e.target.value)} className="input text-sm" />
                </div>
              </div>
              <div>
                <label className="label-mono text-[10px] block mb-1.5">Descripcion corta</label>
                <input type="text" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} className="input text-sm" placeholder="Resumen breve de la leccion" />
              </div>
              <div>
                <label className="label-mono text-[10px] block mb-1.5">URL de video (YouTube / Vimeo)</label>
                <input type="text" value={form.videoUrl} onChange={e => set('videoUrl', e.target.value)} className="input text-sm" placeholder="https://youtube.com/watch?v=..." />
              </div>
              <div>
                <label className="label-mono text-[10px] block mb-1.5">Contenido (HTML o texto)</label>
                <textarea rows={8} value={form.contenido} onChange={e => set('contenido', e.target.value)} className="input text-sm resize-none w-full" placeholder="Contenido de la leccion..." />
              </div>
              <div>
                <label className="label-mono text-[10px] block mb-1.5">Estado</label>
                <div className="flex gap-2">
                  {([true, false] as const).map(v => (
                    <button key={String(v)} onClick={() => set('publicado', v)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${form.publicado === v ? v ? 'bg-green-950 border-green-700 text-green-400' : 'bg-gray-900 border-gray-600 text-gray-400' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>
                      {v ? 'Publicar' : 'Borrador'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-5 border-t border-[var(--border)]">
              <button onClick={handleSubmit} disabled={saving || !form.titulo.trim()} className="btn-gold py-3 px-7 rounded-lg flex-1 disabled:opacity-50">
                {saving ? 'Guardando...' : modalMode === 'edit' ? 'Guardar cambios' : 'Crear leccion'}
              </button>
              <button onClick={closeModal} className="btn-outline py-3 px-5 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
