'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { ChatMessage } from '@/types'

const STORAGE_KEY = 'vinces_messages'
const MAX_STORED = 60

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    '¡Hola! Soy **Vinces**, tu asistente de trading con IA. 🤖\n\nPuedo ayudarte a:\n- Analizar tus operaciones\n- Revisar tu gestión de riesgo\n- Identificar patrones en tu trading\n- Responder preguntas sobre mercados\n\n¿En qué te puedo ayudar hoy?',
}

function formatMessage(content: string) {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-black/50 px-1 rounded text-xs font-mono">$1</code>')
    .replace(/\n/g, '<br/>')
}

function loadMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return [INITIAL_MESSAGE]
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [INITIAL_MESSAGE]
    const parsed: ChatMessage[] = JSON.parse(raw)
    return parsed.length > 0 ? parsed : [INITIAL_MESSAGE]
  } catch {
    return [INITIAL_MESSAGE]
  }
}

function saveMessages(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED)))
  } catch {
    // ignore storage errors
  }
}

export default function VincesWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load from localStorage after hydration
  useEffect(() => {
    setMessages(loadMessages())
    setHydrated(true)
  }, [])

  // Scroll to bottom when messages change or panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }, [messages, open])

  // Focus textarea when panel opens
  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 150)
  }, [open])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return

    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    const nextMessages = [...messages, userMsg]

    setMessages(nextMessages)
    saveMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/vinces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      })

      const data = await res.json()

      if (data.content) {
        const withReply = [...nextMessages, { role: 'assistant' as const, content: data.content }]
        setMessages(withReply)
        saveMessages(withReply)
      } else {
        throw new Error(data.error || 'Error del servidor')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      const withError = [
        ...nextMessages,
        { role: 'assistant' as const, content: `❌ ${msg}. Por favor intenta de nuevo.` },
      ]
      setMessages(withError)
      saveMessages(withError)
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    const fresh = [INITIAL_MESSAGE]
    setMessages(fresh)
    saveMessages(fresh)
  }

  if (!hydrated) return null

  return (
    <>
      {/* ── Chat panel ──────────────────────────────────────────────────── */}
      <div
        className={`fixed bottom-36 right-5 z-50 flex flex-col transition-all duration-300 ease-in-out ${
          open
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{
          width: 'min(380px, calc(100vw - 24px))',
          height: 'min(560px, calc(100vh - 120px))',
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
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <div>
                <p className="text-sm font-bold gradient-gold leading-none">Vinces AI</p>
                <p className="text-[10px] text-[var(--text-muted)] font-mono">Asistente de trading</p>
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
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
              placeholder="Pregunta sobre tu trading..."
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

      {/* ── Floating toggle button ─────────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Vinces AI"
        className="fixed bottom-20 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--gold-dark) 0%, var(--gold) 100%)',
          boxShadow: '0 4px 24px rgba(201,168,76,0.45)',
        }}
      >
        {open ? (
          <span className="text-2xl text-black font-bold">×</span>
        ) : (
          <img
            src="https://res.cloudinary.com/deusntwkn/image/upload/v1773069069/IMG_20251126_065050_395_wcnpca.webp"
            alt="Vinces AI"
            className="w-full h-full object-cover"
          />
        )}
      </button>
    </>
  )
}
