'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

const PLAN_INFO = {
  free: { name: 'FREE', price: 'Gratis' },
  club: { name: 'CLUB', price: '$47/mes' },
  pro: { name: 'PRO', price: '$97/mes' },
}

function RegisterForm() {
  const searchParams = useSearchParams()
  const plan = (searchParams.get('plan') || 'free') as keyof typeof PLAN_INFO
  const planInfo = PLAN_INFO[plan] || PLAN_INFO.free

  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createSupabaseBrowserClient()
    const { data, error: err } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name, phone: form.phone, plan: plan.toUpperCase() } },
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    // Create user in DB
    await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, plan: plan.toUpperCase(), authId: data.user?.id }),
    })

    setSuccess(true)
  }

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  function handlePhoneChange(raw: string) {
    const digits = raw.replace(/[^\d]/g, '').slice(0, 12)
    let formatted = ''
    if (digits.length > 0)  formatted = `+${digits.slice(0, 3)}`
    if (digits.length > 3)  formatted += ` ${digits.slice(3, 5)}`
    if (digits.length > 5)  formatted += ` ${digits.slice(5, 8)}`
    if (digits.length > 8)  formatted += ` ${digits.slice(8, 12)}`
    update('phone', formatted)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black gradient-gold">Liberty Trading Pro</Link>
          <div className="mt-3 inline-block border border-[var(--gold-dark)] rounded-full px-4 py-1">
            <span className="text-sm text-[var(--gold)] font-bold">Plan {planInfo.name} — {planInfo.price}</span>
          </div>
        </div>

        {success ? (
          <div className="card-gold text-center space-y-4">
            <div className="text-4xl">✉️</div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Revisa tu correo</h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Te enviamos un enlace de confirmación a<br />
              <span className="text-[var(--gold)] font-medium">{form.email}</span>
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Haz clic en el enlace del correo para activar tu cuenta y acceder al dashboard.
              Si no lo ves, revisa tu carpeta de spam.
            </p>
          </div>
        ) : (
        <div className="card-gold">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Nombre completo</label>
              <input type="text" required value={form.name} onChange={(e) => update('name', e.target.value)}
                className="input" placeholder="Carlos Mendoza" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email</label>
              <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)}
                className="input" placeholder="tu@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">WhatsApp</label>
              <input type="tel" value={form.phone} onChange={(e) => handlePhoneChange(e.target.value)}
                className="input" placeholder="+593 99 000 0000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Contraseña</label>
              <input type="password" required minLength={8} value={form.password}
                onChange={(e) => update('password', e.target.value)}
                className="input" placeholder="Mínimo 8 caracteres" />
            </div>

            {error && (
              <div className="text-sm text-[var(--red)] bg-red-950/30 border border-red-900/50 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-gold w-full py-3">
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-[var(--gold)] hover:underline">Ingresar</Link>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
