'use client'

import { useState } from 'react'

interface Props {
  programa?: 'INTEGRAL' | 'FUTUROS'
  plan?: 'MENSUAL' | 'ANUAL'
  title?: string
  subtitle?: string
}

export default function LeadCaptureForm({
  programa,
  plan,
  title = '¿Es este programa para ti?',
  subtitle = 'Déjanos tus datos y Vinces IA te contacta por WhatsApp para orientarte sin compromiso.',
}: Props) {
  const planToSend: 'MENSUAL' | 'ANUAL' =
    plan ?? (programa === 'FUTUROS' ? 'ANUAL' : 'MENSUAL')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), plan: planToSend }),
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
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="headline text-2xl text-[var(--text-primary)] mb-3">
          ¡Listo, {name}!
        </h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-xs mx-auto">
          Vinces IA te va a escribir al WhatsApp <span className="text-[var(--gold)]">{phone}</span> en
          unos segundos para orientarte. Revisa tu WhatsApp 📱
        </p>
      </div>
    )
  }

  return (
    <div className="card-panel">
      <div className="label-mono mb-2 text-[var(--gold)]">Empecemos</div>
      <h3 className="headline text-2xl text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">{subtitle}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-mono text-[10px] block mb-1.5">Tu nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Juan Pérez"
            required
            disabled={status === 'loading'}
            className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] transition-colors disabled:opacity-50"
          />
        </div>

        <div>
          <label className="label-mono text-[10px] block mb-1.5">WhatsApp (con código de país)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+593 99 123 4567"
            required
            disabled={status === 'loading'}
            className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] transition-colors disabled:opacity-50"
          />
          <p className="text-[10px] text-[var(--text-muted)] mt-1.5 font-mono">
            Ej: +593 para Ecuador · +52 México · +54 Argentina
          </p>
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
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/>
              </svg>
              Quiero que Vinces me oriente →
            </>
          )}
        </button>

        <p className="text-[10px] text-[var(--text-muted)] text-center font-mono">
          Sin spam. Solo te contacta Vinces IA de Liberty Trading Club.
        </p>
      </form>
    </div>
  )
}
