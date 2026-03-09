'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  FREE:      { label: 'Free',      color: '#888' },
  CLUB:      { label: 'Club',      color: '#C9A84C' },
  PRO:       { label: 'Pro',       color: '#e0c060' },
  PORTFOLIO: { label: 'Portfolio', color: '#fff' },
}

export default function ProfilePage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => {
        setData(d)
        setName(d.user?.name || '')
        setPhone(d.user?.phone || '')
        setLoading(false)
      })
  }, [])

  const saveProfile = async () => {
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      })
      const d = await res.json()
      if (d.user) {
        setData((prev: any) => ({ ...prev, user: d.user }))
        setSaveMsg('✓ Perfil actualizado')
      } else {
        setSaveMsg('✗ ' + (d.error || 'Error al guardar'))
      }
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(''), 3000)
    }
  }

  const changePassword = async () => {
    if (!newPwd || newPwd !== confirmPwd) {
      setPwdMsg('✗ Las contraseñas no coinciden')
      return
    }
    if (newPwd.length < 6) {
      setPwdMsg('✗ Mínimo 6 caracteres')
      return
    }
    setPwdSaving(true)
    setPwdMsg('')
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.updateUser({ password: newPwd })
      if (error) {
        setPwdMsg('✗ ' + error.message)
      } else {
        setPwdMsg('✓ Contraseña actualizada')
        setCurrentPwd('')
        setNewPwd('')
        setConfirmPwd('')
      }
    } finally {
      setPwdSaving(false)
      setTimeout(() => setPwdMsg(''), 4000)
    }
  }

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--text-muted)] text-sm font-mono animate-pulse">Cargando perfil...</div>
      </div>
    )
  }

  const { user, stats } = data
  const plan = PLAN_LABELS[user?.plan] ?? PLAN_LABELS.FREE
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="animate-fadeIn max-w-2xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1"><span className="gradient-gold">Mi Perfil</span></h1>
        <p className="text-[var(--text-secondary)] text-sm">Gestiona tu cuenta y preferencias</p>
      </div>

      {/* Avatar + plan badge */}
      <div className="card p-6 mb-6 flex items-center gap-5">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black border-2 flex-shrink-0"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--gold)', color: 'var(--gold)' }}
        >
          {(user?.name || 'T').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-[var(--text-primary)] truncate">{user?.name || '—'}</h2>
            <span
              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border font-mono uppercase tracking-wider"
              style={{ color: plan.color, borderColor: plan.color, background: `${plan.color}18` }}
            >
              {plan.label}
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] truncate mt-0.5">{user?.email}</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-1 font-mono">Miembro desde {memberSince}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Trades', value: stats.totalTrades, color: 'var(--gold)' },
          { label: 'Win Rate', value: `${stats.winRate}%`, color: stats.winRate >= 50 ? 'var(--green)' : 'var(--red)' },
          { label: 'P&L Total', value: `${stats.pnlTotal >= 0 ? '+' : ''}$${stats.pnlTotal.toFixed(0)}`, color: stats.pnlTotal >= 0 ? 'var(--green)' : 'var(--red)' },
        ].map(s => (
          <div key={s.label} className="card text-center py-4">
            <div className="text-2xl font-black mb-1" style={{ color: s.color, fontFamily: 'var(--font-serif)' }}>{s.value}</div>
            <div className="label-mono text-[10px]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Edit profile */}
      <div className="card p-6 mb-6">
        <h3 className="font-bold text-[var(--text-primary)] mb-4">Información personal</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-mono text-[10px] block mb-1.5">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input text-sm"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className="label-mono text-[10px] block mb-1.5">Teléfono (opcional)</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="input text-sm"
              placeholder="+593..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label-mono text-[10px] block mb-1.5">Correo electrónico</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="input text-sm opacity-50 cursor-not-allowed"
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">El correo no se puede cambiar desde aquí.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-5">
          <button
            onClick={saveProfile}
            disabled={saving}
            className="btn-gold py-2.5 px-6 rounded-lg text-sm disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {saveMsg && (
            <span className={`text-sm font-medium ${saveMsg.startsWith('✓') ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
              {saveMsg}
            </span>
          )}
        </div>
      </div>

      {/* Change password */}
      <div className="card p-6 mb-6">
        <h3 className="font-bold text-[var(--text-primary)] mb-4">Cambiar contraseña</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-mono text-[10px] block mb-1.5">Nueva contraseña</label>
            <input
              type="password"
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              className="input text-sm"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="label-mono text-[10px] block mb-1.5">Confirmar contraseña</label>
            <input
              type="password"
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              className="input text-sm"
              placeholder="Repite la contraseña"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 mt-5">
          <button
            onClick={changePassword}
            disabled={pwdSaving || !newPwd || !confirmPwd}
            className="btn-gold py-2.5 px-6 rounded-lg text-sm disabled:opacity-50"
          >
            {pwdSaving ? 'Actualizando...' : 'Cambiar contraseña'}
          </button>
          {pwdMsg && (
            <span className={`text-sm font-medium ${pwdMsg.startsWith('✓') ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
              {pwdMsg}
            </span>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="card p-6 border border-red-900/40">
        <h3 className="font-bold text-[var(--red)] mb-2">Cerrar sesión</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4">Salir de tu cuenta en este dispositivo.</p>
        <button
          onClick={handleLogout}
          className="py-2.5 px-6 rounded-lg text-sm font-bold border border-[var(--red)] text-[var(--red)] hover:bg-red-950 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>

    </div>
  )
}
