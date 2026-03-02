'use client'

import { useState, useRef, useEffect } from 'react'
import type { ChatMessage } from '@/types'

const SYSTEM_CONTEXT = `Eres Vinces, el asistente de trading de Liberty Trading Pro, creado por Luis Riofrio.
Ayudas a traders a mejorar su desempeño con análisis detallado, gestión de riesgo y psicología del trading.
Eres experto en: mercados de futuros, forex, Price Action, estructura de mercado, gestión de riesgo y psicología del trading.
Responde siempre en español de forma clara, concisa y profesional. Usa emojis cuando sea apropiado.`

export default function VincesPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy **Vinces**, tu asistente de trading con IA. 🤖\n\nPuedo ayudarte a:\n- Analizar tus operaciones\n- Revisar tu gestión de riesgo\n- Identificar patrones en tu trading\n- Responder preguntas sobre mercados\n\n¿En qué te puedo ayudar hoy?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: ChatMessage = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/vinces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          systemContext: SYSTEM_CONTEXT,
        }),
      })

      const data = await res.json()

      if (data.content) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.content }])
      } else {
        throw new Error(data.error || 'Error del servidor')
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `❌ Error: ${err.message}. Por favor intenta de nuevo.` },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-black/50 px-1 rounded text-sm font-mono">$1</code>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="animate-fadeIn flex flex-col h-[calc(100vh-12rem)]">
      <div className="mb-6">
        <h1 className="text-3xl font-black mb-1">
          <span className="gradient-gold">Vinces AI</span> 🤖
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Tu asistente personal de trading con inteligencia artificial
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[var(--gold-dark)] text-black font-medium rounded-br-sm'
                  : 'card rounded-bl-sm'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="card rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--gold)] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[var(--gold)] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-[var(--gold)] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pregunta sobre trading, análisis, gestión de riesgo..."
          rows={2}
          className="input flex-1 resize-none"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="btn-gold px-6 rounded-xl self-end disabled:opacity-50"
        >
          ↑
        </button>
      </div>
      <p className="text-xs text-[var(--text-muted)] mt-2 text-center">
        Enter para enviar · Shift+Enter para nueva línea
      </p>
    </div>
  )
}
