'use client'

import { useState, useEffect, useRef } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  FREE:      { label: 'Free',      color: '#888' },
  CLUB:      { label: 'Club',      color: '#C9A84C' },
  PRO:       { label: 'Pro',       color: '#e0c060' },
  PORTFOLIO: { label: 'Portfolio', color: '#fff' },
}

const CATEGORIES: { value: string; label: string; icon: string }[] = [
  { value: 'FONDEO',    label: 'Prueba de Fondeo',     icon: '🏆' },
  { value: 'RETIRO',    label: 'Retiro de Fondos',     icon: '💰' },
  { value: 'MERITO',    label: 'Mérito / Distinción',  icon: '⭐' },
  { value: 'ACADEMICO', label: 'Certificado Académico', icon: '📜' },
  { value: 'DIPLOMA',   label: 'Diploma',              icon: '🎓' },
  { value: 'OTRO',      label: 'Otro',                 icon: '📄' },
]

function catInfo(cat: string) {
  return CATEGORIES.find(c => c.value === cat) ?? { label: cat, icon: '📄' }
}

interface Certificate {
  id: string
  title: string
  category: string
  fileUrl: string
  fileType: string
  issuedBy?: string
  issuedDate?: string
  public: boolean
  createdAt: string
}

export default function ProfilePage() {
  const router = useRouter()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const certFileInputRef = useRef<HTMLInputElement>(null)

  const [data, setData]     = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Personal info
  const [name, setName]             = useState('')
  const [phone, setPhone]           = useState('')
  const [bio, setBio]               = useState('')
  const [country, setCountry]       = useState('')
  const [tradingStyle, setTradingStyle] = useState('')
  const [saving, setSaving]         = useState(false)
  const [saveMsg, setSaveMsg]       = useState('')

  // Avatar
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Password
  const [newPwd, setNewPwd]       = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdMsg, setPwdMsg]       = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)

  // Certificates
  const [certs, setCerts]             = useState<Certificate[]>([])
  const [certFile, setCertFile]       = useState<File | null>(null)
  const [certPreview, setCertPreview] = useState<string | null>(null)
  const [certTitle, setCertTitle]     = useState('')
  const [certCategory, setCertCategory] = useState('FONDEO')
  const [certIssuedBy, setCertIssuedBy] = useState('')
  const [certIssuedDate, setCertIssuedDate] = useState('')
  const [certUploading, setCertUploading]   = useState(false)
  const [certMsg, setCertMsg] = useState('')

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => {
        setData(d)
        setName(d.user?.name || '')
        setPhone(d.user?.phone || '')
        setBio(d.user?.bio || '')
        setCountry(d.user?.country || '')
        setTradingStyle(d.user?.tradingStyle || '')
        setCerts(d.certificates || [])
        setLoading(false)
      })
  }, [])

  // ── Avatar upload ────────────────────────────────────────────────────────────

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!json.url) throw new Error(json.error || 'Error al subir imagen')
      const patchRes = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: json.url }),
      })
      const patchData = await patchRes.json()
      if (patchData.user) {
        setData((prev: any) => ({ ...prev, user: patchData.user }))
      }
    } catch (err: any) {
      alert('Error al subir foto: ' + err.message)
    } finally {
      setAvatarUploading(false)
      e.target.value = ''
    }
  }

  // ── Save profile ─────────────────────────────────────────────────────────────

  const saveProfile = async () => {
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, bio, country, tradingStyle }),
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

  // ── Change password ──────────────────────────────────────────────────────────

  const changePassword = async () => {
    if (!newPwd || newPwd !== confirmPwd) {
      setPwdMsg('✗ Las contraseñas no coinciden'); return
    }
    if (newPwd.length < 6) {
      setPwdMsg('✗ Mínimo 6 caracteres'); return
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
        setNewPwd(''); setConfirmPwd('')
      }
    } finally {
      setPwdSaving(false)
      setTimeout(() => setPwdMsg(''), 4000)
    }
  }

  // ── Logout ───────────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // ── Certificate file pick ────────────────────────────────────────────────────

  const handleCertFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCertFile(file)
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setCertPreview(url)
    } else {
      setCertPreview(null)
    }
  }

  // ── Certificate upload ───────────────────────────────────────────────────────

  const uploadCertificate = async () => {
    if (!certFile || !certTitle.trim()) {
      setCertMsg('✗ Selecciona un archivo y escribe un título')
      setTimeout(() => setCertMsg(''), 3000)
      return
    }
    setCertUploading(true)
    setCertMsg('')
    try {
      // 1. Upload file
      const fd = new FormData()
      fd.append('file', certFile)
      const uploadRes = await fetch('/api/upload/document', { method: 'POST', body: fd })
      const uploadData = await uploadRes.json()
      if (!uploadData.url) throw new Error(uploadData.error || 'Error al subir archivo')

      // 2. Save certificate
      const certRes = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: certTitle,
          category: certCategory,
          fileUrl: uploadData.url,
          fileType: uploadData.fileType,
          issuedBy: certIssuedBy,
          issuedDate: certIssuedDate,
          public: true,
        }),
      })
      const certData = await certRes.json()
      if (!certData.certificate) throw new Error(certData.error || 'Error al guardar')

      setCerts(prev => [certData.certificate, ...prev])
      setCertFile(null)
      setCertPreview(null)
      setCertTitle('')
      setCertIssuedBy('')
      setCertIssuedDate('')
      setCertMsg('✓ Certificado añadido')
      if (certFileInputRef.current) certFileInputRef.current.value = ''
    } catch (err: any) {
      setCertMsg('✗ ' + err.message)
    } finally {
      setCertUploading(false)
      setTimeout(() => setCertMsg(''), 4000)
    }
  }

  // ── Delete certificate ───────────────────────────────────────────────────────

  const deleteCert = async (id: string) => {
    if (!confirm('¿Eliminar este certificado?')) return
    const res = await fetch(`/api/certificates/${id}`, { method: 'DELETE' })
    if (res.ok) setCerts(prev => prev.filter(c => c.id !== id))
  }

  // ── Toggle public ────────────────────────────────────────────────────────────

  const togglePublic = async (cert: Certificate) => {
    const res = await fetch(`/api/certificates/${cert.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public: !cert.public }),
    })
    const data = await res.json()
    if (data.certificate) {
      setCerts(prev => prev.map(c => c.id === cert.id ? data.certificate : c))
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

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

  const publicTrackUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/track-record/${user?.id}`
    : `/track-record/${user?.id}`

  return (
    <div className="animate-fadeIn max-w-2xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1"><span className="gradient-gold">Mi Perfil</span></h1>
        <p className="text-[var(--text-secondary)] text-sm">Gestiona tu cuenta y hoja de vida del operador</p>
      </div>

      {/* Avatar + plan badge */}
      <div className="card p-6 mb-6 flex items-center gap-5">
        {/* Avatar with upload */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
            className="w-20 h-20 rounded-full overflow-hidden border-2 flex items-center justify-center text-2xl font-black transition-opacity hover:opacity-80"
            style={{ borderColor: 'var(--gold)', background: 'var(--bg-secondary)', color: 'var(--gold)' }}
            title="Cambiar foto de perfil"
          >
            {avatarUploading ? (
              <span className="text-xs font-mono text-[var(--text-muted)] animate-pulse">...</span>
            ) : user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              (user?.name || 'T').charAt(0).toUpperCase()
            )}
          </button>
          <div
            className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center text-xs"
            style={{ background: 'var(--gold)', color: '#000' }}
          >
            ✏️
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
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
          <p className="text-[10px] text-[var(--text-muted)] mt-1">Clic en la foto para cambiarla</p>
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

      {/* Public track record link */}
      {stats.totalTrades > 0 && (
        <div className="card p-4 mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Tu Track Record Público</p>
            <p className="text-[11px] text-[var(--text-muted)] font-mono truncate mt-0.5">{publicTrackUrl}</p>
          </div>
          <a
            href={`/track-record/${user?.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold py-2 px-4 rounded-lg text-xs whitespace-nowrap"
          >
            Ver perfil →
          </a>
        </div>
      )}

      {/* Edit profile */}
      <div className="card p-6 mb-6">
        <h3 className="font-bold text-[var(--text-primary)] mb-4">Información personal</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-mono text-[10px] block mb-1.5">Nombre</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="input text-sm" placeholder="Tu nombre" />
          </div>
          <div>
            <label className="label-mono text-[10px] block mb-1.5">Teléfono (opcional)</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="input text-sm" placeholder="+593..." />
          </div>
          <div>
            <label className="label-mono text-[10px] block mb-1.5">País</label>
            <input type="text" value={country} onChange={e => setCountry(e.target.value)} className="input text-sm" placeholder="Ecuador" />
          </div>
          <div>
            <label className="label-mono text-[10px] block mb-1.5">Estilo de Trading</label>
            <input type="text" value={tradingStyle} onChange={e => setTradingStyle(e.target.value)} className="input text-sm" placeholder="Day Trading · Futuros Nasdaq" />
          </div>
          <div className="sm:col-span-2">
            <label className="label-mono text-[10px] block mb-1.5">Correo electrónico</label>
            <input type="email" value={user?.email || ''} disabled className="input text-sm opacity-50 cursor-not-allowed" />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">El correo no se puede cambiar desde aquí.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="label-mono text-[10px] block mb-1.5">Bio / Presentación <span className="text-[var(--text-muted)]">(aparece en tu track record público)</span></label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={300}
              rows={3}
              className="input text-sm resize-none"
              placeholder="Describe tu experiencia, enfoque y especialidad como operador..."
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-1 text-right">{bio.length}/300</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-5">
          <button onClick={saveProfile} disabled={saving} className="btn-gold py-2.5 px-6 rounded-lg text-sm disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {saveMsg && (
            <span className={`text-sm font-medium ${saveMsg.startsWith('✓') ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
              {saveMsg}
            </span>
          )}
        </div>
      </div>

      {/* ── Certificados y Logros ─────────────────────────────────────────────── */}
      <div className="card p-6 mb-6">
        <div className="mb-5">
          <h3 className="font-bold text-[var(--text-primary)]">Certificados y Logros</h3>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            Sube tus certificados de fondeo, retiros, diplomas y logros. Aparecerán en tu track record público.
          </p>
        </div>

        {/* Upload form */}
        <div className="rounded-xl border border-dashed p-5 mb-5"
          style={{ borderColor: 'rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.03)' }}>

          {/* File picker */}
          <div
            className="cursor-pointer text-center py-4 rounded-lg mb-4 transition-colors hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            onClick={() => certFileInputRef.current?.click()}
          >
            {certFile ? (
              <div>
                {certPreview ? (
                  <img src={certPreview} alt="preview" className="h-24 mx-auto rounded-lg object-cover mb-2" />
                ) : (
                  <div className="text-4xl mb-2">📄</div>
                )}
                <p className="text-sm font-medium text-[var(--text-primary)]">{certFile.name}</p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {(certFile.size / 1024 / 1024).toFixed(2)} MB · {certFile.type === 'application/pdf' ? 'PDF' : 'Imagen'}
                </p>
              </div>
            ) : (
              <div>
                <div className="text-3xl mb-2">📎</div>
                <p className="text-sm text-[var(--text-secondary)]">Clic para seleccionar archivo</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">PNG, JPG, WEBP o PDF · máx 15MB</p>
              </div>
            )}
            <input
              ref={certFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={handleCertFileChange}
            />
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="label-mono text-[10px] block mb-1.5">Título del certificado *</label>
              <input
                type="text"
                value={certTitle}
                onChange={e => setCertTitle(e.target.value)}
                className="input text-sm"
                placeholder="ej: FTMO Challenge 100K — Aprobado"
              />
            </div>
            <div>
              <label className="label-mono text-[10px] block mb-1.5">Categoría *</label>
              <select
                value={certCategory}
                onChange={e => setCertCategory(e.target.value)}
                className="input text-sm"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-mono text-[10px] block mb-1.5">Emitido por</label>
              <input
                type="text"
                value={certIssuedBy}
                onChange={e => setCertIssuedBy(e.target.value)}
                className="input text-sm"
                placeholder="FTMO, Darwinex, Universidad..."
              />
            </div>
            <div>
              <label className="label-mono text-[10px] block mb-1.5">Fecha</label>
              <input
                type="text"
                value={certIssuedDate}
                onChange={e => setCertIssuedDate(e.target.value)}
                className="input text-sm"
                placeholder="Ene 2024"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={uploadCertificate}
              disabled={certUploading || !certFile}
              className="btn-gold py-2.5 px-6 rounded-lg text-sm disabled:opacity-50"
            >
              {certUploading ? 'Subiendo...' : 'Añadir certificado'}
            </button>
            {certMsg && (
              <span className={`text-sm font-medium ${certMsg.startsWith('✓') ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                {certMsg}
              </span>
            )}
          </div>
        </div>

        {/* Certificates list */}
        {certs.length === 0 ? (
          <p className="text-[11px] text-[var(--text-muted)] text-center py-4">
            Aún no has añadido certificados. Sube tu primer logro arriba.
          </p>
        ) : (
          <div className="space-y-2">
            {certs.map(cert => {
              const cat = catInfo(cert.category)
              const isPdf = cert.fileType === 'pdf'
              return (
                <div
                  key={cert.id}
                  className="flex items-center gap-3 rounded-lg p-3"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {/* Thumbnail or icon */}
                  <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center text-xl"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    {!isPdf && cert.fileUrl ? (
                      <img src={cert.fileUrl} alt={cert.title} className="w-full h-full object-cover" />
                    ) : (
                      <span>{cat.icon}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{cert.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>
                        {cat.label}
                      </span>
                      {cert.issuedBy && <span className="text-[10px] text-[var(--text-muted)]">{cert.issuedBy}</span>}
                      {cert.issuedDate && <span className="text-[10px] text-[var(--text-muted)]">{cert.issuedDate}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Public toggle */}
                    <button
                      onClick={() => togglePublic(cert)}
                      title={cert.public ? 'Visible en perfil público' : 'Oculto del perfil público'}
                      className="text-[10px] font-mono px-2 py-1 rounded transition-colors"
                      style={{
                        background: cert.public ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
                        color: cert.public ? '#22c55e' : '#555',
                        border: `1px solid ${cert.public ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      {cert.public ? '🌐 Público' : '🔒 Privado'}
                    </button>
                    {/* View */}
                    <a
                      href={cert.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono px-2 py-1 rounded transition-colors"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#888' }}
                    >
                      Ver
                    </a>
                    {/* Delete */}
                    <button
                      onClick={() => deleteCert(cert.id)}
                      className="text-[10px] font-mono px-2 py-1 rounded transition-colors hover:text-red-400"
                      style={{ color: '#555' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Change password */}
      <div className="card p-6 mb-6">
        <h3 className="font-bold text-[var(--text-primary)] mb-4">Cambiar contraseña</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-mono text-[10px] block mb-1.5">Nueva contraseña</label>
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} className="input text-sm" placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <label className="label-mono text-[10px] block mb-1.5">Confirmar contraseña</label>
            <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} className="input text-sm" placeholder="Repite la contraseña" />
          </div>
        </div>
        <div className="flex items-center gap-4 mt-5">
          <button onClick={changePassword} disabled={pwdSaving || !newPwd || !confirmPwd} className="btn-gold py-2.5 px-6 rounded-lg text-sm disabled:opacity-50">
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
