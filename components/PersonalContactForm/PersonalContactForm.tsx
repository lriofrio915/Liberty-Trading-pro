'use client'

import { useState } from 'react'

interface Props {
  plan?: 'MENSUAL' | 'ANUAL'
  title?: string
  subtitle?: string
}

export default function PersonalContactForm({
  plan,
  title = '¿Prefieres hablar directamente con Luis?',
  subtitle = 'Deja tus datos y Luis Riofrio se pondrá en contacto contigo personalmente. Sin automatizaciones.',
}: Props) {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [phone, setPhone]     = useState('')
  const [mensaje, setMensaje] = useState('')
  const [status, setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/leads/personal-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim(), mensaje: mensaje.trim(), plan }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Error al enviar. Intenta de nuevo.')
        setStatus('error')
        return
      }
      setStatus('success')
    } catch {
      setErrorMsg('Error de conexión. Intenta de nuevo.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="card text-center py-10 px-6">
        <div className="text-5xl mb-4">✉️</div>
        <h3 className="headline text-2xl text-[var(--text-primary)] mb-3">
          ¡Listo, {name}!
        </h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-xs mx-auto">
          Luis Riofrio revisará tu mensaje y te contactará personalmente
          por WhatsApp o email a la brevedad.
        </p>
      </div>
    )
  }

  return (
    <div className="card-panel">
      <div className="label-mono mb-2 text-[var(--gold)]">Contacto directo</div>
      <h3 className="headline text-2xl text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">{subtitle}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-mono text-[10px] block mb-1.5">Tu nombre *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Juan Pérez"
            required
            disabled={status === 'loading'}
            className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] transition-colors disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-mono text-[10px] block mb-1.5">WhatsApp (con código de país) *</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+593 99 123 4567"
              required
              disabled={status === 'loading'}
              className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] transition-colors disabled:opacity-50"
            />
          </div>
          <div>
            <label className="label-mono text-[10px] block mb-1.5">Email (opcional)</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="juan@correo.com"
              disabled={status === 'loading'}
              className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="label-mono text-[10px] block mb-1.5">¿Tienes alguna pregunta o contexto para Luis? (opcional)</label>
          <textarea
            value={mensaje}
            onChange={e => setMensaje(e.target.value)}
            placeholder="Ej: Llevo 1 año invirtiendo de forma autodidacta y quiero dar el siguiente paso..."
            rows={3}
            disabled={status === 'loading'}
            className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] transition-colors resize-none disabled:opacity-50"
          />
        </div>

        {status === 'error' && (
          <p className="text-xs text-[var(--red)] bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={status === 'loading' || !name.trim() || !phone.trim()}
          className="btn-gold w-full py-3.5 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Enviando...
            </>
          ) : (
            'Quiero hablar con Luis →'
          )}
        </button>

        <p className="text-[10px] text-[var(--text-muted)] text-center font-mono">
          Luis te contactará personalmente. Sin bots, sin automatizaciones.
        </p>
      </form>
    </div>
  )
}
