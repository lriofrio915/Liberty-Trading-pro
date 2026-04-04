'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createSupabaseBrowserClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setSent(true)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black gradient-gold">Liberty Trading Pro</Link>
          <p className="text-[var(--text-secondary)] mt-2 text-sm">Restablecer contraseña</p>
        </div>

        {sent ? (
          <div className="card-gold text-center space-y-4">
            <div className="text-4xl">✉️</div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Revisa tu correo</h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Te enviamos un correo con instrucciones para restablecer tu contraseña a{' '}
              <span className="text-[var(--gold)] font-medium">{email}</span>
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Si no lo ves en tu bandeja, revisa la carpeta de spam.
            </p>
            <Link href="/login" className="text-[var(--gold)] text-sm hover:underline block">
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <div className="card-gold">
            <p className="text-sm text-[var(--text-secondary)] mb-5 leading-relaxed">
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="tu@email.com"
                />
              </div>

              {error && (
                <div className="text-sm text-[var(--red)] bg-red-950/30 border border-red-900/50 rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-gold w-full py-3">
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
              <Link href="/login" className="text-[var(--gold)] hover:underline">
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  )
}
