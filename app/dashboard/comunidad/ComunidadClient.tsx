'use client'

import { useState } from 'react'
import Image from 'next/image'

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

// ─── Share Modal ──────────────────────────────────────────────────────────────

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://libertytrading.pro'

function ShareModal({ post, onClose }: { post: Post; onClose: () => void }) {
  const postUrl = `${APP_URL}/p/${post.id}`
  const [copied, setCopied] = useState(false)

  // Fire-and-forget: registra el share en la DB para notificar al autor
  function trackShare(platform: string) {
    fetch(`/api/comunidad/${post.id}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    }).catch(() => {})
  }

  function copyLink() {
    navigator.clipboard.writeText(postUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      trackShare('COPY')
    })
  }

  const authorName = post.user.name.includes('@') ? 'Trader' : post.user.name
  const preview = post.contenido.slice(0, 100) + (post.contenido.length > 100 ? '...' : '')
  const text = encodeURIComponent(`${authorName} en Liberty Trading Pro:\n"${preview}"\n`)

  const networks = [
    {
      label: 'Facebook',
      color: '#1877F2',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      label: 'WhatsApp',
      color: '#25D366',
      href: `https://wa.me/?text=${text}${encodeURIComponent(postUrl)}`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
    },
    {
      label: 'LinkedIn',
      color: '#0A66C2',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 .774 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border overflow-hidden"
        style={{ background: '#0e0e0e', borderColor: 'rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <h3 className="text-sm font-bold text-white">Compartir post</h3>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors text-lg">✕</button>
        </div>

        {/* Preview */}
        {post.imageUrl && (
          <div className="mx-5 mt-4 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)', maxHeight: 180 }}>
            <Image src={post.imageUrl} alt="preview" width={800} height={180} className="w-full object-cover" style={{ maxHeight: 180 }} unoptimized />
          </div>
        )}
        <div className="px-5 py-3">
          <p className="text-xs leading-relaxed" style={{ color: '#777' }}>
            {post.contenido.slice(0, 120)}{post.contenido.length > 120 ? '…' : ''}
          </p>
        </div>

        {/* Network buttons */}
        <div className="px-5 pb-2 flex flex-col gap-2">
          {networks.map(n => (
            <a
              key={n.label}
              href={n.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackShare(n.label.toUpperCase())}
              className="flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
              style={{ background: `${n.color}18`, color: n.color, border: `1px solid ${n.color}30` }}
            >
              {n.icon}
              Compartir en {n.label}
            </a>
          ))}

          {/* Instagram — copy link */}
          <button
            onClick={copyLink}
            className="flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
            style={{
              background: 'rgba(188,24,136,0.1)',
              color: copied ? '#22c55e' : '#e1306c',
              border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(225,48,108,0.3)'}`,
            }}
          >
            {copied ? (
              <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg> Enlace copiado</>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                Copiar enlace para Instagram
              </>
            )}
          </button>
        </div>

        {/* Note about OG preview */}
        <p className="px-5 py-3 pb-4 text-[10px] text-center" style={{ color: '#3a3a3a' }}>
          El link incluye imagen preview para Facebook y LinkedIn
        </p>
      </div>
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
  const [showShare, setShowShare] = useState(false)
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
          <Image src={post.imageUrl} alt="post" width={800} height={384} className="w-full object-cover max-h-96" unoptimized />
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

        {/* Share */}
        <button
          onClick={() => setShowShare(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ml-auto hover:text-[#C9A84C]"
          style={{ color: '#555' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Compartir
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

      {/* Share modal */}
      {showShare && <ShareModal post={post} onClose={() => setShowShare(false)} />}
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
