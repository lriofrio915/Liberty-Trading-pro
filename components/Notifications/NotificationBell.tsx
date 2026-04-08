'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface Notif {
  id:          string
  type:        'LIKE' | 'COMMENT' | 'SHARE'
  read:        boolean
  creadoEn:    string
  postId:      string
  postSnippet: string
  actorName:   string
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function notifLabel(type: string, actorName: string): string {
  switch (type) {
    case 'LIKE':    return `${actorName} le dio Me gusta a tu publicación`
    case 'COMMENT': return `${actorName} comentó en tu publicación`
    case 'SHARE':   return `${actorName} compartió tu publicación`
    default:        return `${actorName} interactuó con tu publicación`
  }
}

function notifIcon(type: string): string {
  switch (type) {
    case 'LIKE':    return '❤️'
    case 'COMMENT': return '💬'
    case 'SHARE':   return '↗️'
    default:        return '🔔'
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 1)   return 'ahora'
  if (mins < 60)  return `${mins}m`
  if (hours < 24) return `${hours}h`
  return `${days}d`
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function NotificationBell({ initialCount }: { initialCount: number }) {
  const [unreadCount, setUnreadCount]     = useState(initialCount)
  const [notifications, setNotifications] = useState<Notif[]>([])
  const [open, setOpen]                   = useState(false)
  const [loading, setLoading]             = useState(false)
  const dropdownRef                       = useRef<HTMLDivElement>(null)
  const router                            = useRouter()

  // ── Polling cada 30s (consistente con TickerBar / Monitor del proyecto) ──
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res  = await fetch('/api/notifications')
        const data = await res.json()
        setUnreadCount(data.unreadCount ?? 0)
        if (open) setNotifications(data.notifications ?? [])
      } catch { /* silent */ }
    }, 30_000)
    return () => clearInterval(id)
  }, [open])

  // ── Cerrar al hacer click fuera ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Abrir dropdown y cargar lista ──
  async function handleOpen() {
    if (open) { setOpen(false); return }
    setOpen(true)
    setLoading(true)
    try {
      const res  = await fetch('/api/notifications')
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  // ── Click en una notificación: marca leída + navega ──
  function handleNotifClick(notif: Notif) {
    // Optimistic UI
    if (!notif.read) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
      fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [notif.id] }),
      }).catch(() => {})
    }
    setOpen(false)
    router.push(`/dashboard/comunidad#post-${notif.postId}`)
  }

  // ── Marcar todas como leídas ──
  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    fetch('/api/notifications/mark-read', { method: 'POST' }).catch(() => {})
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* ── Botón campanita ── */}
      <button
        onClick={handleOpen}
        title="Notificaciones"
        className={`relative p-1.5 rounded-lg transition-colors
          ${open
            ? 'bg-amber-500/20 text-amber-400'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
          }`}
      >
        {/* Bell icon */}
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Badge rojo */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] rounded-full
            bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5
            pointer-events-none leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-80 rounded-xl border border-[var(--border)]
          shadow-2xl overflow-hidden z-50"
          style={{ background: 'var(--bg-card)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notificaciones</h3>
            {notifications.some(n => !n.read) && (
              <button
                onClick={markAllRead}
                className="text-[10px] text-amber-400 hover:text-amber-300 transition-colors font-medium"
              >
                Marcar todo como leído
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-[var(--text-muted)] text-xs">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Cargando…
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-xs text-[var(--text-muted)]">Sin notificaciones aún</p>
              </div>
            ) : (
              notifications.map(notif => (
                <button
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={`w-full text-left flex gap-3 px-4 py-3 border-b border-[var(--border)]/50
                    hover:bg-[var(--bg-secondary)] transition-colors
                    ${!notif.read ? 'bg-amber-500/5' : ''}`}
                >
                  {/* Icono del tipo */}
                  <span className="text-base mt-0.5 flex-shrink-0 leading-none">
                    {notifIcon(notif.type)}
                  </span>

                  <div className="flex-1 min-w-0">
                    {/* Texto principal */}
                    <p className={`text-xs leading-snug ${!notif.read ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                      {notifLabel(notif.type, notif.actorName)}
                    </p>
                    {/* Snippet del post */}
                    {notif.postSnippet && (
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
                        &ldquo;{notif.postSnippet}&rdquo;
                      </p>
                    )}
                    {/* Tiempo relativo */}
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      {relativeTime(notif.creadoEn)}
                    </p>
                  </div>

                  {/* Punto azul de no leída */}
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 mt-1 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
