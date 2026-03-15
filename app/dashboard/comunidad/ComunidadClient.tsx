'use client'

import { useState, useRef, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PostUser { id: string; name: string }

interface Post {
  id: string
  userId: string
  tipo: string
  contenido: string
  imageUrl: string | null
  creadoEn: string
  user: PostUser
  likeCount: number
  commentCount: number
  likedByMe: boolean
}

interface Comment {
  id: string
  userId: string
  contenido: string
  creadoEn: string
  user: PostUser
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPOS = [
  { key: 'OPERATIVA',    label: 'Operativa',     icon: '📊', color: '#3b82f6' },
  { key: 'TRACK_RECORD', label: 'Track Record',  icon: '📈', color: '#22c55e' },
  { key: 'EXITO',        label: 'Éxito',         icon: '🏆', color: '#C9A84C' },
  { key: 'RETIRO',       label: 'Retiro',        icon: '💰', color: '#a855f7' },
  { key: 'ANALISIS',     label: 'Análisis',      icon: '🔍', color: '#f97316' },
]

function getTipo(key: string) {
  return TIPOS.find(t => t.key === key) ?? { key, label: key, icon: '💬', color: '#555' }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'ahora'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`
  return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })
}

function initials(name: string) {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function avatarColor(name: string) {
  const colors = ['#C9A84C', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ec4899', '#14b8a6']
  let hash = 0
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const bg = avatarColor(name)
  const displayName = name.includes('@') ? 'Trader' : name
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 800, color: '#fff', flexShrink: 0,
      fontFamily: 'sans-serif',
    }}>
      {initials(displayName)}
    </div>
  )
}

// ─── Comment section ──────────────────────────────────────────────────────────

function CommentSection({
  postId,
  currentUserId,
  currentUserName,
  isAdmin,
  onCountChange,
}: {
  postId: string
  currentUserId: string | null
  currentUserName: string | null
  isAdmin: boolean
  onCountChange: (delta: number) => void
}) {
  const [comments, setComments] = useState<Comment[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)

  async function load() {
    if (comments !== null) return
    setLoading(true)
    const res = await fetch(`/api/comunidad/${postId}/comments`)
    const json = await res.json()
    setComments(json.comments ?? [])
    setLoading(false)
  }

  // Load on first mount
  if (comments === null && !loading) { load() }

  async function submit() {
    if (!text.trim() || posting) return
    setPosting(true)
    const res = await fetch(`/api/comunidad/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenido: text.trim() }),
    })
    const json = await res.json()
    if (json.comment) {
      setComments(c => [...(c ?? []), json.comment])
      onCountChange(1)
      setText('')
    }
    setPosting(false)
  }

  async function deleteComment(commentId: string) {
    await fetch(`/api/comunidad/${postId}/comments/${commentId}`, { method: 'DELETE' })
    setComments(c => (c ?? []).filter(x => x.id !== commentId))
    onCountChange(-1)
  }

  return (
    <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      {loading && <p className="text-xs text-center py-2" style={{ color: '#555' }}>Cargando...</p>}

      {comments && comments.length === 0 && (
        <p className="text-xs text-center py-2" style={{ color: '#555' }}>Sin comentarios aún. Sé el primero.</p>
      )}

      {comments && comments.map(c => {
        const displayName = c.user.name.includes('@') ? 'Trader' : c.user.name
        const canDelete = isAdmin || c.userId === currentUserId
        return (
          <div key={c.id} className="flex gap-2 mb-3">
            <Avatar name={c.user.name} size={26} />
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-white">{displayName}</span>
                <span className="text-[10px]" style={{ color: '#444' }}>{timeAgo(c.creadoEn)}</span>
                {canDelete && (
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="text-[10px] ml-auto hover:text-red-400 transition-colors"
                    style={{ color: '#333' }}
                  >
                    eliminar
                  </button>
                )}
              </div>
              <p className="text-sm mt-0.5 leading-snug" style={{ color: '#bbb' }}>{c.contenido}</p>
            </div>
          </div>
        )
      })}

      {currentUserId && (
        <div className="flex gap-2 mt-2">
          <Avatar name={currentUserName ?? 'Trader'} size={26} />
          <div className="flex-1 flex gap-2">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submit()}
              placeholder="Escribe un comentario..."
              className="flex-1 bg-transparent rounded-lg px-3 py-1.5 text-sm text-white border outline-none focus:border-[#C9A84C]"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            />
            <button
              onClick={submit}
              disabled={!text.trim() || posting}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-opacity disabled:opacity-30"
              style={{ background: '#C9A84C', color: '#080808' }}
            >
              {posting ? '...' : 'Enviar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({
  post,
  currentUserId,
  currentUserName,
  isAdmin,
  onDelete,
}: {
  post: Post
  currentUserId: string | null
  currentUserName: string | null
  isAdmin: boolean
  onDelete: (id: string) => void
}) {
  const [liked, setLiked] = useState(post.likedByMe)
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [commentCount, setCommentCount] = useState(post.commentCount)
  const [showComments, setShowComments] = useState(false)
  const [copied, setCopied] = useState(false)
  const tipo = getTipo(post.tipo)
  const displayName = post.user.name.includes('@') ? 'Trader' : post.user.name

  async function toggleLike() {
    if (!currentUserId) return
    const prev = liked
    setLiked(!prev)
    setLikeCount(c => prev ? c - 1 : c + 1)
    const res = await fetch(`/api/comunidad/${post.id}/like`, { method: 'POST' })
    const json = await res.json()
    setLiked(json.liked)
    setLikeCount(json.likeCount)
  }

  async function deletePost() {
    if (!confirm('¿Eliminar esta publicación?')) return
    await fetch(`/api/comunidad/${post.id}`, { method: 'DELETE' })
    onDelete(post.id)
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/dashboard/comunidad#post-${post.id}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  }

  return (
    <div id={`post-${post.id}`} className="rounded-xl border p-4 transition-all"
      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={post.user.name} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{displayName}</span>
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: `${tipo.color}18`, color: tipo.color, border: `1px solid ${tipo.color}30` }}
              >
                {tipo.icon} {tipo.label}
              </span>
            </div>
            <span className="text-[11px]" style={{ color: '#555' }}>{timeAgo(post.creadoEn)}</span>
          </div>
        </div>
        {(isAdmin || post.userId === currentUserId) && (
          <button onClick={deletePost} className="text-[11px] hover:text-red-400 transition-colors" style={{ color: '#333' }}>
            ✕
          </button>
        )}
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3" style={{ color: '#ccc' }}>
        {post.contenido}
      </p>

      {/* Image */}
      {post.imageUrl && (
        <div className="mb-3 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <img src={post.imageUrl} alt="post" className="w-full object-cover max-h-96" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        {/* Like */}
        <button
          onClick={toggleLike}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
          style={{
            background: liked ? 'rgba(239,68,68,0.12)' : 'transparent',
            color: liked ? '#ef4444' : '#555',
            border: `1px solid ${liked ? 'rgba(239,68,68,0.3)' : 'transparent'}`,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {likeCount > 0 && <span>{likeCount}</span>}
          <span>Me gusta</span>
        </button>

        {/* Comment */}
        <button
          onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
          style={{
            background: showComments ? 'rgba(201,168,76,0.08)' : 'transparent',
            color: showComments ? '#C9A84C' : '#555',
            border: `1px solid ${showComments ? 'rgba(201,168,76,0.2)' : 'transparent'}`,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {commentCount > 0 && <span>{commentCount}</span>}
          <span>Comentar</span>
        </button>

        {/* Share / Copy link */}
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ml-auto"
          style={{ color: copied ? '#22c55e' : '#555' }}
        >
          {copied ? (
            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg> Copiado</>
          ) : (
            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg> Compartir</>
          )}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <CommentSection
          postId={post.id}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          isAdmin={isAdmin}
          onCountChange={delta => setCommentCount(c => c + delta)}
        />
      )}
    </div>
  )
}

// ─── New Post Form ────────────────────────────────────────────────────────────

function NewPostForm({
  currentUserName,
  onCreated,
  onClose,
}: {
  currentUserName: string
  onCreated: (post: Post) => void
  onClose: () => void
}) {
  const [tipo, setTipo] = useState('OPERATIVA')
  const [contenido, setContenido] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!contenido.trim()) { setError('Escribe algo antes de publicar.'); return }
    setSaving(true)
    setError('')
    const res = await fetch('/api/comunidad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, contenido, imageUrl: imageUrl.trim() || undefined }),
    })
    const json = await res.json()
    if (json.post) {
      onCreated(json.post)
      onClose()
    } else {
      setError(json.error ?? 'Error al publicar')
      setSaving(false)
    }
  }

  const selectedTipo = getTipo(tipo)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-lg rounded-2xl border overflow-hidden"
        style={{ background: '#0e0e0e', borderColor: 'rgba(255,255,255,0.08)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5">
            <Avatar name={currentUserName} size={32} />
            <span className="text-sm font-bold text-white">
              {currentUserName.includes('@') ? 'Trader' : currentUserName}
            </span>
          </div>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors text-lg">✕</button>
        </div>

        {/* Type selector */}
        <div className="px-5 pt-4 pb-2">
          <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: '#555' }}>¿Qué tipo de publicación?</p>
          <div className="flex flex-wrap gap-2">
            {TIPOS.map(t => (
              <button
                key={t.key}
                onClick={() => setTipo(t.key)}
                className="text-xs font-mono px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: tipo === t.key ? `${t.color}18` : 'transparent',
                  color: tipo === t.key ? t.color : '#555',
                  border: `1px solid ${tipo === t.key ? `${t.color}40` : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-3">
          <textarea
            value={contenido}
            onChange={e => setContenido(e.target.value)}
            rows={5}
            autoFocus
            placeholder={placeholderFor(tipo)}
            className="w-full bg-transparent text-white text-sm leading-relaxed resize-none outline-none"
            style={{ color: '#ccc' }}
          />
        </div>

        {/* Image URL (optional) */}
        <div className="px-5 pb-3">
          <input
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="URL de imagen / screenshot (opcional)"
            className="w-full bg-transparent rounded-lg px-3 py-2 text-xs text-white border outline-none focus:border-[#C9A84C]"
            style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#888' }}
          />
        </div>

        {error && <p className="px-5 pb-2 text-xs text-red-400">{error}</p>}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
          <span className="text-xs" style={{ color: '#444' }}>
            Solo contenido relacionado con la operativa en NQ
          </span>
          <button
            onClick={submit}
            disabled={saving || !contenido.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-opacity disabled:opacity-30"
            style={{ background: selectedTipo.color, color: '#fff' }}
          >
            {saving ? 'Publicando...' : `${selectedTipo.icon} Publicar`}
          </button>
        </div>
      </div>
    </div>
  )
}

function placeholderFor(tipo: string) {
  switch (tipo) {
    case 'OPERATIVA': return 'Describe tu operación: entrada, salida, qué viste en el gráfico, si siguió el plan...'
    case 'TRACK_RECORD': return 'Comparte tus resultados de la semana o del mes...'
    case 'EXITO': return 'Comparte tu logro: cuenta fondeada, primera semana verde, meta alcanzada...'
    case 'RETIRO': return 'Comparte tu retiro: ¿cuánto fue? ¿cómo fue el proceso?'
    case 'ANALISIS': return 'Comparte tu análisis del NQ: niveles clave, sesgo del día, zonas de interés...'
    default: return 'Escribe tu publicación...'
  }
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

function FilterBar({ active, onChange }: { active: string; onChange: (t: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        onClick={() => onChange('ALL')}
        className="flex-shrink-0 text-xs font-mono px-3 py-1.5 rounded-lg transition-all"
        style={{
          background: active === 'ALL' ? 'rgba(201,168,76,0.12)' : 'transparent',
          color: active === 'ALL' ? '#C9A84C' : '#555',
          border: `1px solid ${active === 'ALL' ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.08)'}`,
        }}
      >
        🌐 Todo
      </button>
      {TIPOS.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className="flex-shrink-0 text-xs font-mono px-3 py-1.5 rounded-lg transition-all"
          style={{
            background: active === t.key ? `${t.color}18` : 'transparent',
            color: active === t.key ? t.color : '#555',
            border: `1px solid ${active === t.key ? `${t.color}40` : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ComunidadClient({
  initialPosts,
  currentUserId,
  currentUserName,
  isAdmin,
}: {
  initialPosts: Post[]
  currentUserId: string | null
  currentUserName: string | null
  isAdmin: boolean
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [cursor, setCursor] = useState<string | null>(
    initialPosts.length === 15 ? initialPosts[initialPosts.length - 1].id : null
  )
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('ALL')
  const [showForm, setShowForm] = useState(false)

  async function loadMore() {
    if (!cursor || loading) return
    setLoading(true)
    const res = await fetch(`/api/comunidad?cursor=${cursor}`)
    const json = await res.json()
    setPosts(p => [...p, ...(json.posts ?? [])])
    setCursor(json.nextCursor ?? null)
    setLoading(false)
  }

  function handleCreated(post: Post) {
    setPosts(p => [post, ...p])
  }

  function handleDelete(id: string) {
    setPosts(p => p.filter(x => x.id !== id))
  }

  const filtered = filter === 'ALL' ? posts : posts.filter(p => p.tipo === filter)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="label-mono text-[var(--gold)] mb-1">Comunidad</div>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Georgia, serif' }}>
              Feed de Traders
            </h1>
            <p className="text-xs mt-1" style={{ color: '#555' }}>
              Comparte operativas, análisis y logros con la comunidad
            </p>
          </div>
          {currentUserId && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
              style={{ background: '#C9A84C', color: '#080808' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Publicar
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="mb-5">
        <FilterBar active={filter} onChange={setFilter} />
      </div>

      {/* Empty composer prompt */}
      {currentUserId && filtered.length === 0 && filter === 'ALL' && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-xl border p-4 text-left mb-4 flex items-center gap-3 transition-colors hover:border-[#C9A84C]/30"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <Avatar name={currentUserName ?? 'Trader'} size={36} />
          <span className="text-sm" style={{ color: '#444' }}>¿Qué operación tomaste hoy?</span>
        </button>
      )}

      {/* Posts */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm" style={{ color: '#555' }}>
              {filter !== 'ALL' ? 'No hay publicaciones de este tipo aún.' : 'Sin publicaciones aún. ¡Sé el primero!'}
            </p>
          </div>
        ) : (
          filtered.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              isAdmin={isAdmin}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Load more */}
      {cursor && filter === 'ALL' && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="text-sm font-mono px-6 py-2.5 rounded-xl border transition-colors hover:bg-white/5 disabled:opacity-30"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#888' }}
          >
            {loading ? 'Cargando...' : 'Cargar más'}
          </button>
        </div>
      )}

      {/* New post modal */}
      {showForm && currentUserName && (
        <NewPostForm
          currentUserName={currentUserName}
          onCreated={handleCreated}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
