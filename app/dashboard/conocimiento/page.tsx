'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Doc {
  id: string
  title: string
  description: string | null
  fileUrl: string | null
  fileType: string
  tags: string | null
  source: string | null
  createdAt: string
}

interface DocFull extends Doc {
  content: string | null
}

const FILE_ICONS: Record<string, string> = {
  pdf: '📄', image: '🖼️', link: '🔗', text: '📝',
}

const FILE_TYPES = [
  { value: 'text', label: 'Texto / Notas' },
  { value: 'pdf', label: 'PDF' },
  { value: 'image', label: 'Imagen' },
  { value: 'link', label: 'Enlace web' },
]

// ── Empty form ────────────────────────────────────────────────────────────────

const EMPTY = {
  title: '', description: '', content: '',
  fileUrl: '', fileType: 'text', tags: '', source: '',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ConocimientoPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [viewDoc, setViewDoc] = useState<DocFull | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const searchTimer = useRef<NodeJS.Timeout>()

  const fetchDocs = useCallback(async (q = '') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/knowledge${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      const data = await res.json()
      setDocs(data.docs ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  // Debounced search
  const handleSearch = (val: string) => {
    setSearch(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchDocs(val), 400)
  }

  const handleUploadFile = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        const type = file.type.startsWith('image/') ? 'image' : 'pdf'
        setForm(f => ({ ...f, fileUrl: data.url, fileType: type }))
      }
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!form.title.trim()) { setError('El título es requerido'); return }
    setSaving(true)
    setError('')
    try {
      const url = editId ? `/api/knowledge/${editId}` : '/api/knowledge'
      const method = editId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setShowForm(false)
      setEditId(null)
      setForm(EMPTY)
      fetchDocs(search)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (doc: Doc) => {
    const res = await fetch(`/api/knowledge/${doc.id}`)
    const data = await res.json()
    if (data.doc) {
      setForm({
        title: data.doc.title || '',
        description: data.doc.description || '',
        content: data.doc.content || '',
        fileUrl: data.doc.fileUrl || '',
        fileType: data.doc.fileType || 'text',
        tags: data.doc.tags || '',
        source: data.doc.source || '',
      })
      setEditId(doc.id)
      setShowForm(true)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este documento?')) return
    await fetch(`/api/knowledge/${id}`, { method: 'DELETE' })
    fetchDocs(search)
  }

  const handleView = async (doc: Doc) => {
    const res = await fetch(`/api/knowledge/${doc.id}`)
    const data = await res.json()
    setViewDoc(data.doc)
  }

  const openForm = () => { setForm(EMPTY); setEditId(null); setShowForm(true) }

  return (
    <div className="animate-fadeIn">

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-black mb-1">
            <span className="gradient-gold">Conocimiento</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Base de conocimiento financiero · informes, papers, investigaciones y notas
          </p>
        </div>
        <button
          onClick={openForm}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--gold)] text-black text-sm font-bold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          + Agregar documento
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Buscar en título, contenido, tags..."
          className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-dark)]"
        />
      </div>

      {/* Vinces RAG notice */}
      <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl border border-[var(--gold-dark)]/30 bg-[var(--gold)]/5">
        <span className="text-xl">🤖</span>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          <strong className="text-[var(--gold)]">Vinces AI</strong> tiene acceso a esta base de conocimiento.
          Cuando le hagas preguntas, buscará automáticamente en tus documentos para darte respuestas más precisas.
        </p>
      </div>

      {/* Docs grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-28 animate-pulse" />)}
        </div>
      ) : docs.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📚</div>
          <p className="text-[var(--text-muted)] text-sm mb-4">
            {search ? 'No se encontraron documentos para esa búsqueda' : 'Tu base de conocimiento está vacía'}
          </p>
          {!search && (
            <button onClick={openForm} className="text-[var(--gold)] text-sm hover:underline">
              Agregar tu primer documento →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map(doc => (
            <div key={doc.id} className="card hover:border-[var(--gold-dark)]/50 transition-colors flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg flex-shrink-0">{FILE_ICONS[doc.fileType] || '📝'}</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{doc.title}</span>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => handleView(doc)} className="p-1 text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors" title="Ver">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <button onClick={() => handleEdit(doc)} className="p-1 text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors" title="Editar">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => handleDelete(doc.id)} className="p-1 text-[var(--text-muted)] hover:text-[var(--red)] transition-colors" title="Eliminar">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  </button>
                </div>
              </div>

              {doc.description && (
                <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">{doc.description}</p>
              )}

              <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
                {doc.source && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)]">
                    {doc.source}
                  </span>
                )}
                {doc.tags?.split(',').filter(Boolean).map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold-dark)]/30">
                    {tag.trim()}
                  </span>
                ))}
                {doc.fileUrl && (
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors ml-auto">
                    Archivo ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add/Edit modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="min-h-full flex justify-center px-4 py-16">
          <div className="w-full max-w-2xl h-fit rounded-2xl border border-[var(--border)] shadow-2xl" style={{ background: 'var(--bg-card)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="font-bold text-[var(--text-primary)]">{editId ? 'Editar documento' : 'Nuevo documento'}</h2>
              <button onClick={() => { setShowForm(false); setEditId(null) }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {error && <div className="text-red-400 text-xs px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">{error}</div>}

              {/* Title */}
              <div>
                <label className="label-mono text-[9px] block mb-1">TÍTULO *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ej: Análisis Fundamental de Apple Q4 2024"
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-dark)]"
                />
              </div>

              {/* Type */}
              <div>
                <label className="label-mono text-[9px] block mb-1">TIPO DE DOCUMENTO</label>
                <div className="flex flex-wrap gap-2">
                  {FILE_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setForm(f => ({ ...f, fileType: t.value }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        form.fileType === t.value
                          ? 'bg-[var(--gold)]/15 text-[var(--gold)] border-[var(--gold-dark)]'
                          : 'bg-black/20 text-[var(--text-muted)] border-[var(--border)] hover:text-white'
                      }`}
                    >
                      {FILE_ICONS[t.value]} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-mono text-[9px] block mb-1">FUENTE / AUTOR</label>
                  <input
                    value={form.source}
                    onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    placeholder="Ej: Goldman Sachs, 2024"
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-dark)]"
                  />
                </div>
                <div>
                  <label className="label-mono text-[9px] block mb-1">TAGS (separados por coma)</label>
                  <input
                    value={form.tags}
                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="Ej: AAPL, fundamental, earnings"
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-dark)]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="label-mono text-[9px] block mb-1">DESCRIPCIÓN / RESUMEN</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Breve descripción de qué contiene este documento..."
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-dark)] resize-none"
                />
              </div>

              {/* Content */}
              <div>
                <label className="label-mono text-[9px] block mb-1">
                  CONTENIDO / TEXTO EXTRAÍDO
                  <span className="text-[var(--text-muted)] ml-1 normal-case">— Vinces AI lo leerá para responder tus preguntas</span>
                </label>
                <textarea
                  rows={7}
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Pega aquí el texto del documento, informe, paper o investigación..."
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-dark)] resize-y font-mono"
                />
              </div>

              {/* File upload */}
              <div>
                <label className="label-mono text-[9px] block mb-1">ARCHIVO ADJUNTO (opcional)</label>
                <div
                  className="border border-dashed border-[var(--border)] rounded-lg p-4 text-center cursor-pointer hover:border-[var(--gold-dark)] transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={e => e.target.files?.[0] && handleUploadFile(e.target.files[0])}
                  />
                  {uploading ? (
                    <span className="text-xs text-[var(--gold)] animate-pulse">Subiendo archivo...</span>
                  ) : form.fileUrl ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-green-400 text-xs">✓ Archivo subido</span>
                      <a href={form.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] text-xs hover:underline">Ver ↗</a>
                      <button onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, fileUrl: '' })) }} className="text-[var(--text-muted)] text-xs hover:text-[var(--red)]">✕</button>
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">Clic para subir imagen o PDF</span>
                  )}
                </div>
                {/* Or URL */}
                <input
                  value={form.fileUrl}
                  onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
                  placeholder="O pega una URL directa (link web, Google Drive, etc.)"
                  className="mt-2 w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-dark)]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
              <button
                onClick={() => { setShowForm(false); setEditId(null) }}
                className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-[var(--gold)] text-black text-sm font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* ── View modal ── */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-[var(--border)] shadow-2xl" style={{ background: 'var(--bg-card)' }}>
            <div className="flex items-start justify-between px-6 py-4 border-b border-[var(--border)]">
              <div>
                <h2 className="font-bold text-[var(--text-primary)]">{viewDoc.title}</h2>
                {viewDoc.source && <p className="text-xs text-[var(--text-muted)] mt-0.5">{viewDoc.source}</p>}
              </div>
              <button onClick={() => setViewDoc(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] mt-0.5">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {viewDoc.description && (
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed border-l-2 border-[var(--gold-dark)] pl-3">{viewDoc.description}</p>
              )}
              {viewDoc.tags && (
                <div className="flex flex-wrap gap-1.5">
                  {viewDoc.tags.split(',').filter(Boolean).map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold-dark)]/30">{tag.trim()}</span>
                  ))}
                </div>
              )}
              {viewDoc.content && (
                <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed font-mono bg-black/30 rounded-xl p-4 overflow-auto max-h-64 border border-[var(--border)]">
                  {viewDoc.content}
                </pre>
              )}
              {viewDoc.fileUrl && (
                <a href={viewDoc.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--gold-dark)]/40 text-[var(--gold)] text-sm hover:bg-[var(--gold)]/5 transition-colors w-fit">
                  {FILE_ICONS[viewDoc.fileType]} Abrir archivo ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
