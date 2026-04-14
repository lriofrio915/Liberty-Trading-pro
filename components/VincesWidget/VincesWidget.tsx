'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import type { ChatMessage } from '@/types'

// ─── Config por modo ─────────────────────────────────────────────────────────

const CONFIG = {
  dashboard: {
    storageKey: 'vinces_messages',
    sessionKey: null as null,
    apiUrl: '/api/vinces',
    initialMessage: '¡Hola! Soy **Vinces**, tu asistente de trading con IA.\n\nPuedo ayudarte a:\n- Analizar tus operaciones\n- Revisar tu gestión de riesgo\n- Identificar patrones en tu trading\n- Responder preguntas sobre mercados\n\n¿En qué te puedo ayudar hoy?',
  },
  landing: {
    storageKey: 'vinces_landing_msgs',
    sessionKey: 'vinces_landing_session' as string,
    apiUrl: '/api/vinces-landing',
    initialMessage: '¡Hola! Soy **Vinces**, el asistente de Liberty Trading Pro.\n\n¿Ya tienes experiencia en trading o sería tu primera vez invirtiendo?',
  },
}

const MAX_STORED = 60
const BTN_SIZE   = 56   // px — button width/height
const POS_KEY    = 'vinces_widget_pos'

interface LandingSession {
  name?: string
  phone?: string
  email?: string
  plan?: string
  captured: boolean
}

function formatMessage(content: string) {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-black/50 px-1 rounded text-xs font-mono">$1</code>')
    .replace(/\n/g, '<br/>')
}

function loadMessages(key: string, initial: string): ChatMessage[] {
  if (typeof window === 'undefined') return [{ role: 'assistant', content: initial }]
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return [{ role: 'assistant', content: initial }]
    const parsed: ChatMessage[] = JSON.parse(raw)
    return parsed.length > 0 ? parsed : [{ role: 'assistant', content: initial }]
  } catch {
    return [{ role: 'assistant', content: initial }]
  }
}

function saveMessages(key: string, messages: ChatMessage[]) {
  try {
    const toStore = messages.map(({ links: _links, ...m }) => m)
    localStorage.setItem(key, JSON.stringify(toStore.slice(-MAX_STORED)))
  } catch {}
}

function loadSession(key: string | null): LandingSession {
  if (!key || typeof window === 'undefined') return { captured: false }
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : { captured: false }
  } catch {
    return { captured: false }
  }
}

function saveSession(key: string | null, session: LandingSession) {
  if (!key) return
  try {
    localStorage.setItem(key, JSON.stringify(session))
  } catch {}
}

const HOTMART_MENSUAL = 'https://pay.hotmart.com/R104900326X?checkoutMode=2'
const HOTMART_ANUAL   = 'https://pay.hotmart.com/L104900408S?checkoutMode=2'

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  mode?: 'dashboard' | 'landing'
}

export default function VincesWidget({ mode = 'dashboard' }: Props) {
  const cfg = CONFIG[mode]

  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: cfg.initialMessage }])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [session, setSession]   = useState<LandingSession>({ captured: false })

  // ── Drag state ──────────────────────────────────────────────────────────────
  // pos === null means "not yet initialised" — widget is hidden until first render
  const [pos, setPos]   = useState<{ x: number; y: number } | null>(null)
  const posRef          = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const dragging        = useRef(false)
  const didDrag         = useRef(false)
  const dragOrigin      = useRef({ mx: 0, my: 0, px: 0, py: 0 })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)

  // ── Init position from localStorage or default bottom-right ────────────────
  useEffect(() => {
    const margin = 20
    const defaultX = window.innerWidth  - BTN_SIZE - margin
    const defaultY = window.innerHeight - BTN_SIZE - margin - 80 // clear mobile bottom nav

    try {
      const saved = localStorage.getItem(POS_KEY)
      if (saved) {
        const p = JSON.parse(saved) as { x: number; y: number }
        const x = Math.min(Math.max(0, p.x), window.innerWidth  - BTN_SIZE)
        const y = Math.min(Math.max(0, p.y), window.innerHeight - BTN_SIZE)
        posRef.current = { x, y }
        setPos({ x, y })
        return
      }
    } catch {}

    posRef.current = { x: defaultX, y: defaultY }
    setPos({ x: defaultX, y: defaultY })
  }, [])

  // ── Drag handlers ───────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Only drag on primary button / single touch
    if (e.button !== 0 && e.pointerType === 'mouse') return
    dragging.current  = true
    didDrag.current   = false
    dragOrigin.current = {
      mx: e.clientX,
      my: e.clientY,
      px: posRef.current.x,
      py: posRef.current.y,
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    e.preventDefault()
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - dragOrigin.current.mx
    const dy = e.clientY - dragOrigin.current.my

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDrag.current = true

    const x = Math.min(Math.max(0, dragOrigin.current.px + dx), window.innerWidth  - BTN_SIZE)
    const y = Math.min(Math.max(0, dragOrigin.current.py + dy), window.innerHeight - BTN_SIZE)
    posRef.current = { x, y }
    setPos({ x, y })
  }, [])

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    // Persist final position
    try { localStorage.setItem(POS_KEY, JSON.stringify(posRef.current)) } catch {}
    // If it was a real drag (not a tap), suppress the click
    // (click fires after pointerup; we handle toggle in onClick with didDrag check)
  }, [])

  const onButtonClick = useCallback(() => {
    if (didDrag.current) { didDrag.current = false; return }
    setOpen(v => !v)
  }, [])

  // ── Panel position — computed relative to button ────────────────────────────
  function panelStyle(): React.CSSProperties {
    if (!pos) return { display: 'none' }
    const vw = window.innerWidth
    const vh = window.innerHeight

    const panelW = Math.min(380, vw - 16)
    const panelH = Math.min(580, vh - 120)
    const gap     = 10

    // Horizontal: right-align with button when on right half, else left-align
    let left: number
    if (pos.x + BTN_SIZE / 2 > vw / 2) {
      left = Math.max(8, pos.x + BTN_SIZE - panelW)
    } else {
      left = Math.min(pos.x, vw - panelW - 8)
    }

    // Vertical: prefer above button, fall back to below
    let top: number
    if (pos.y >= panelH + gap) {
      top = pos.y - panelH - gap
    } else {
      top = pos.y + BTN_SIZE + gap
    }

    return {
      position: 'fixed',
      left,
      top,
      width: panelW,
      height: panelH,
      zIndex: 50,
    }
  }

  // ── Chat logic ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const msgs = loadMessages(cfg.storageKey, cfg.initialMessage)
    const sess = loadSession(cfg.sessionKey)

    if (sess.captured && msgs.length > 0) {
      const last = msgs[msgs.length - 1]
      if (last.role === 'assistant' && !last.links) {
        msgs[msgs.length - 1] = { ...last, links: { mensual: HOTMART_MENSUAL, anual: HOTMART_ANUAL } }
      }
    }

    setMessages(msgs)
    setSession(sess)
    setHydrated(true)
  }, [cfg.storageKey, cfg.sessionKey, cfg.initialMessage])

  useEffect(() => {
    if (open) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [messages, open])

  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 150)
  }, [open])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return

    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    const nextMessages = [...messages, userMsg]

    setMessages(nextMessages)
    saveMessages(cfg.storageKey, nextMessages)
    setInput('')
    setLoading(true)

    try {
      const body: Record<string, unknown> = { messages: nextMessages }
      if (mode === 'landing') body.leadSession = session

      const res  = await fetch(cfg.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (data.content) {
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: data.content,
          ...(data.links ? { links: data.links } : {}),
        }

        if (data.ragDocsFound > 0) {
          assistantMsg.content =
            `📚 *${data.ragDocsFound} doc${data.ragDocsFound > 1 ? 's' : ''} consultado${data.ragDocsFound > 1 ? 's' : ''}*\n\n` +
            assistantMsg.content
        }

        const withReply = [...nextMessages, assistantMsg]
        setMessages(withReply)
        saveMessages(cfg.storageKey, withReply)

        if (mode === 'landing' && (data.leadCaptured || data.extractedData)) {
          const newSession: LandingSession = {
            ...session,
            ...(data.extractedData?.name  ? { name:  data.extractedData.name  } : {}),
            ...(data.extractedData?.phone ? { phone: data.extractedData.phone } : {}),
            ...(data.extractedData?.plan  ? { plan:  data.extractedData.plan  } : {}),
            captured: data.leadCaptured ? true : session.captured,
          }
          setSession(newSession)
          saveSession(cfg.sessionKey, newSession)
        }
      } else {
        throw new Error(data.error || 'Error del servidor')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      const withError = [
        ...nextMessages,
        { role: 'assistant' as const, content: `Error: ${msg}. Por favor intenta de nuevo.` },
      ]
      setMessages(withError)
      saveMessages(cfg.storageKey, withError)
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, session, mode, cfg])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    const fresh = [{ role: 'assistant' as const, content: cfg.initialMessage }]
    setMessages(fresh)
    saveMessages(cfg.storageKey, fresh)
    if (mode === 'landing') {
      const freshSession = { captured: false }
      setSession(freshSession)
      saveSession(cfg.sessionKey, freshSession)
    }
  }

  if (!hydrated || !pos) return null

  return (
    <>
      {/* ── Chat panel ─────────────────────────────────────────────────── */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          open
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        style={{
          ...panelStyle(),
          transform: open ? 'scale(1) translateY(0)' : 'scale(0.97) translateY(6px)',
        }}
      >
        <div
          className="flex flex-col h-full rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden"
          style={{ background: 'var(--bg-secondary)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] flex-shrink-0"
            style={{ background: 'var(--bg-card)' }}
          >
            <div className="flex items-center gap-2.5">
              <Image
                src="https://res.cloudinary.com/deusntwkn/image/upload/v1773069069/IMG_20251126_065050_395_wcnpca.webp"
                alt="Vinces"
                width={36}
                height={36}
                className="w-9 h-9 rounded-full object-cover border-2 border-[var(--gold)]"
              />
              <div>
                <p className="text-sm font-bold gradient-gold leading-none">Vinces AI</p>
                <p className="text-[10px] text-[var(--text-muted)] font-mono">
                  {mode === 'landing' ? 'Asistente Liberty Trading' : 'Asistente de trading'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                title="Limpiar chat"
                className="text-[var(--text-muted)] hover:text-[var(--red)] transition-colors text-xs font-mono px-2 py-1 rounded"
              >
                Limpiar
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'text-black font-medium rounded-br-sm'
                      : 'rounded-bl-sm border border-[var(--border)]'
                  }`}
                  style={{
                    background: msg.role === 'user' ? 'var(--gold-dark)' : 'var(--bg-card)',
                  }}
                >
                  {msg.role === 'assistant' ? (
                    <div
                      className="text-[var(--text-primary)]"
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                    />
                  ) : (
                    msg.content
                  )}
                </div>

                {msg.links && (
                  <div className="mt-2 max-w-[85%] w-full space-y-2">
                    <a
                      href={msg.links.mensual}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-xs font-bold py-2.5 px-4 rounded-xl border border-[var(--gold-dark)] text-[var(--gold)] hover:bg-[rgba(201,168,76,0.1)] transition-colors"
                    >
                      Plan Mensual — $79/mes →
                    </a>
                    <a
                      href={msg.links.anual}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-xs font-bold py-2.5 px-4 rounded-xl btn-gold"
                    >
                      Plan Anual — $649/año · Mejor valor →
                    </a>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl rounded-bl-sm border border-[var(--border)] px-3 py-3"
                  style={{ background: 'var(--bg-card)' }}
                >
                  <div className="flex gap-1">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            className="flex gap-2 p-3 border-t border-[var(--border)] flex-shrink-0"
            style={{ background: 'var(--bg-card)' }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === 'landing' ? 'Escribe tu mensaje...' : 'Pregunta sobre tu trading...'}
              rows={2}
              disabled={loading}
              className="flex-1 resize-none text-sm px-3 py-2 rounded-xl border border-[var(--border)] bg-black/30 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] transition-colors disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="btn-gold px-3 rounded-xl self-end text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ↑
            </button>
          </div>
        </div>
      </div>

      {/* ── Floating toggle button (draggable) ─────────────────────────── */}
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={onButtonClick}
        title="Hablar con Vinces AI — arrastra para mover"
        className="z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform duration-150 hover:scale-110 active:scale-95"
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          cursor: dragging.current ? 'grabbing' : 'grab',
          touchAction: 'none',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
          boxShadow: '0 4px 28px rgba(201,168,76,0.5), 0 0 0 2px rgba(201,168,76,0.3)',
        }}
      >
        {open ? (
          <span className="text-xl font-bold" style={{ color: 'var(--gold)' }}>×</span>
        ) : (
          <span className="relative flex items-center justify-center w-full h-full">
            <span
              className="absolute inset-0 rounded-full animate-ping opacity-30"
              style={{ background: 'var(--gold)', animationDuration: '2s' }}
            />
            <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="2" x2="18" y2="7" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="18" cy="2" r="1.5" fill="#C9A84C"/>
              <rect x="7" y="7" width="22" height="16" rx="4" fill="#C9A84C" opacity="0.15" stroke="#C9A84C" strokeWidth="1.5"/>
              <circle cx="13" cy="15" r="2.5" fill="#C9A84C"/>
              <circle cx="23" cy="15" r="2.5" fill="#C9A84C"/>
              <circle cx="14" cy="14" r="0.8" fill="#fff" opacity="0.7"/>
              <circle cx="24" cy="14" r="0.8" fill="#fff" opacity="0.7"/>
              <rect x="12" y="19" width="12" height="2" rx="1" fill="#C9A84C" opacity="0.6"/>
              <rect x="10" y="24" width="16" height="9" rx="3" fill="#C9A84C" opacity="0.12" stroke="#C9A84C" strokeWidth="1.2"/>
              <rect x="4" y="25" width="5" height="7" rx="2" fill="#C9A84C" opacity="0.15" stroke="#C9A84C" strokeWidth="1.2"/>
              <rect x="27" y="25" width="5" height="7" rx="2" fill="#C9A84C" opacity="0.15" stroke="#C9A84C" strokeWidth="1.2"/>
              <circle cx="18" cy="28" r="1.5" fill="#C9A84C" opacity="0.8"/>
            </svg>
          </span>
        )}
      </button>
    </>
  )
}
