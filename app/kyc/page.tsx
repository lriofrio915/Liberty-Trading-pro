'use client'

import { useState } from 'react'

// ── Tipos ──────────────────────────────────────────────────────────────────

type Status = 'idle' | 'loading' | 'success' | 'error'

interface FormData {
  // Paso 1
  fullName: string
  email: string
  phone: string
  dateOfBirth: string
  nationality: string
  country: string
  city: string
  // Paso 2
  tier: string
  capitalDisponible: string
  horizonte: string
  toleranciaRiesgo: string
  experiencia: string
  fuenteCapital: string
  // Paso 3
  objetivo: string
  tieneIbkr: boolean
  ibkrAccount: string
  esPep: boolean
  documentType: string
  documentNumber: string
  // Paso 4
  declaracion: boolean
}

const INITIAL: FormData = {
  fullName: '', email: '', phone: '', dateOfBirth: '', nationality: '',
  country: '', city: '',
  tier: '', capitalDisponible: '', horizonte: '', toleranciaRiesgo: '',
  experiencia: '', fuenteCapital: '',
  objetivo: '', tieneIbkr: false, ibkrAccount: '', esPep: false,
  documentType: '', documentNumber: '',
  declaracion: false,
}

// ── Helpers UI ─────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-300">
        {label}{required && <span className="text-yellow-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400/60 transition-colors'
const selectCls = inputCls + ' cursor-pointer'

// ── Componente principal ───────────────────────────────────────────────────

export default function KycPage() {
  const [step, setStep]     = useState(1)
  const [form, setForm]     = useState<FormData>(INITIAL)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError]   = useState('')

  const set = (key: keyof FormData, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }))

  // Validaciones por paso
  function validateStep(s: number): string | null {
    if (s === 1) {
      if (!form.fullName.trim()) return 'El nombre completo es requerido'
      if (!form.country.trim())  return 'El país es requerido'
    }
    if (s === 2) {
      if (!form.tier)             return 'Selecciona el tier de interés'
      if (!form.horizonte)        return 'Selecciona tu horizonte de inversión'
      if (!form.toleranciaRiesgo) return 'Selecciona tu tolerancia al riesgo'
      if (!form.fuenteCapital)    return 'Selecciona la fuente de capital'
    }
    if (s === 3) {
      if (!form.objetivo)        return 'Selecciona tu objetivo principal'
      if (!form.documentType)    return 'Selecciona el tipo de documento'
      if (!form.documentNumber.trim()) return 'El número de documento es requerido'
    }
    if (s === 4) {
      if (!form.declaracion) return 'Debes confirmar la veracidad de los datos'
    }
    return null
  }

  function nextStep() {
    const err = validateStep(step)
    if (err) { setError(err); return }
    setError('')
    setStep(s => s + 1)
  }

  async function submit() {
    const err = validateStep(4)
    if (err) { setError(err); return }
    setError('')
    setStatus('loading')
    try {
      const res = await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          capitalDisponible: form.capitalDisponible ? parseFloat(form.capitalDisponible) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al enviar'); setStatus('error'); return }
      setStatus('success')
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
      setStatus('error')
    }
  }

  // ── Pantalla de éxito ──────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-5xl">✅</div>
          <h1 className="text-2xl font-bold text-white">¡Formulario recibido!</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Tu información ha sido enviada correctamente. Luis revisará tu perfil
            y te contactará en breve para los próximos pasos.
          </p>
          <p className="text-yellow-400 text-xs">Liberty Trading Pro — Asesoría de Inversión</p>
        </div>
      </main>
    )
  }

  // ── Barra de progreso ──────────────────────────────────────────────────
  const steps = ['Datos personales', 'Perfil inversor', 'Cumplimiento', 'Confirmación']

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-10">
      <div className="max-w-lg mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <p className="text-yellow-400 text-xs font-semibold uppercase tracking-widest">Liberty Trading Pro</p>
          <h1 className="text-2xl font-bold text-white">Formulario KYC</h1>
          <p className="text-gray-500 text-sm">Asesoría de inversión — Conoce a tu cliente</p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] text-gray-500">
            {steps.map((s, i) => (
              <span key={i} className={i + 1 <= step ? 'text-yellow-400 font-medium' : ''}>
                {i + 1}. {s}
              </span>
            ))}
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 transition-all duration-500"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Card del formulario */}
        <div className="bg-[#111] border border-white/8 rounded-2xl p-6 space-y-5">

          {/* ── PASO 1 — Datos personales ── */}
          {step === 1 && (
            <>
              <h2 className="text-base font-semibold text-white">Datos personales</h2>
              <Field label="Nombre completo" required>
                <input className={inputCls} placeholder="Ej. Juan Pérez García"
                  value={form.fullName} onChange={e => set('fullName', e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Email">
                  <input className={inputCls} type="email" placeholder="juan@email.com"
                    value={form.email} onChange={e => set('email', e.target.value)} />
                </Field>
                <Field label="Teléfono (WhatsApp)">
                  <input className={inputCls} placeholder="+593 99 999 9999"
                    value={form.phone} onChange={e => set('phone', e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Fecha de nacimiento">
                  <input className={inputCls} type="date"
                    value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
                </Field>
                <Field label="Nacionalidad">
                  <input className={inputCls} placeholder="Ecuatoriana"
                    value={form.nationality} onChange={e => set('nationality', e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="País de residencia" required>
                  <input className={inputCls} placeholder="Ecuador"
                    value={form.country} onChange={e => set('country', e.target.value)} />
                </Field>
                <Field label="Ciudad">
                  <input className={inputCls} placeholder="Quito"
                    value={form.city} onChange={e => set('city', e.target.value)} />
                </Field>
              </div>
            </>
          )}

          {/* ── PASO 2 — Perfil inversor ── */}
          {step === 2 && (
            <>
              <h2 className="text-base font-semibold text-white">Perfil de inversión</h2>
              <Field label="Tier de interés" required>
                <select className={selectCls} value={form.tier} onChange={e => set('tier', e.target.value)}>
                  <option value="">Selecciona...</option>
                  <option value="A">Tier A — Gestión de portafolio (ideal USD 10,000)</option>
                  <option value="B">Tier B — Ideas de inversión activas</option>
                </select>
              </Field>
              <Field label="Capital disponible para invertir (USD)">
                <input className={inputCls} type="number" min="0" placeholder="10000"
                  value={form.capitalDisponible} onChange={e => set('capitalDisponible', e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Horizonte de inversión" required>
                  <select className={selectCls} value={form.horizonte} onChange={e => set('horizonte', e.target.value)}>
                    <option value="">Selecciona...</option>
                    <option value="CORTO">Corto plazo (&lt;1 año)</option>
                    <option value="MEDIO">Medio plazo (1–3 años)</option>
                    <option value="LARGO">Largo plazo (&gt;3 años)</option>
                  </select>
                </Field>
                <Field label="Tolerancia al riesgo" required>
                  <select className={selectCls} value={form.toleranciaRiesgo} onChange={e => set('toleranciaRiesgo', e.target.value)}>
                    <option value="">Selecciona...</option>
                    <option value="BAJO">Bajo — prefiero preservar capital</option>
                    <option value="MEDIO">Medio — acepto volatilidad moderada</option>
                    <option value="ALTO">Alto — busco crecimiento agresivo</option>
                  </select>
                </Field>
              </div>
              <Field label="Fuente principal del capital" required>
                <select className={selectCls} value={form.fuenteCapital} onChange={e => set('fuenteCapital', e.target.value)}>
                  <option value="">Selecciona...</option>
                  <option value="AHORROS">Ahorros personales</option>
                  <option value="NEGOCIO">Ingresos de negocio</option>
                  <option value="SALARIO">Salario / empleo</option>
                  <option value="HERENCIA">Herencia / donación</option>
                  <option value="OTRO">Otro</option>
                </select>
              </Field>
              <Field label="Experiencia previa en inversiones">
                <textarea className={inputCls + ' resize-none'} rows={3}
                  placeholder="Describe brevemente tu experiencia: acciones, fondos, criptomonedas, etc."
                  value={form.experiencia} onChange={e => set('experiencia', e.target.value)} />
              </Field>
            </>
          )}

          {/* ── PASO 3 — Cumplimiento ── */}
          {step === 3 && (
            <>
              <h2 className="text-base font-semibold text-white">Objetivos y cumplimiento</h2>
              <Field label="Objetivo principal de inversión" required>
                <select className={selectCls} value={form.objetivo} onChange={e => set('objetivo', e.target.value)}>
                  <option value="">Selecciona...</option>
                  <option value="PRESERVAR">Preservar capital</option>
                  <option value="CRECER">Hacer crecer el capital</option>
                  <option value="INGRESO_PASIVO">Generar ingreso pasivo</option>
                </select>
              </Field>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-yellow-400"
                    checked={form.tieneIbkr} onChange={e => set('tieneIbkr', e.target.checked)} />
                  <span className="text-sm text-gray-300">Ya tengo cuenta en Interactive Brokers (IBKR)</span>
                </label>
                {form.tieneIbkr && (
                  <Field label="Número de cuenta IBKR">
                    <input className={inputCls} placeholder="U1234567"
                      value={form.ibkrAccount} onChange={e => set('ibkrAccount', e.target.value)} />
                  </Field>
                )}
              </div>

              <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-lg p-4 space-y-2">
                <p className="text-xs text-yellow-400 font-semibold">Declaración de persona políticamente expuesta (PEP)</p>
                <p className="text-xs text-gray-400">¿Eres o has sido en los últimos 2 años: funcionario público, directivo de partido político, familiar directo de alguno de los anteriores?</p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-yellow-400"
                    checked={form.esPep} onChange={e => set('esPep', e.target.checked)} />
                  <span className="text-sm text-gray-300">Sí, soy una PEP</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Tipo de documento" required>
                  <select className={selectCls} value={form.documentType} onChange={e => set('documentType', e.target.value)}>
                    <option value="">Selecciona...</option>
                    <option value="CEDULA">Cédula de identidad</option>
                    <option value="PASAPORTE">Pasaporte</option>
                    <option value="LICENCIA">Licencia de conducir</option>
                  </select>
                </Field>
                <Field label="Número de documento" required>
                  <input className={inputCls} placeholder="1234567890"
                    value={form.documentNumber} onChange={e => set('documentNumber', e.target.value)} />
                </Field>
              </div>
            </>
          )}

          {/* ── PASO 4 — Confirmación ── */}
          {step === 4 && (
            <>
              <h2 className="text-base font-semibold text-white">Confirmación</h2>

              {/* Resumen */}
              <div className="bg-white/3 rounded-xl p-4 space-y-2 text-sm">
                <Row label="Nombre"     value={form.fullName} />
                <Row label="País"       value={form.country} />
                <Row label="Tier"       value={form.tier ? `Tier ${form.tier}` : '—'} />
                <Row label="Capital"    value={form.capitalDisponible ? `USD ${Number(form.capitalDisponible).toLocaleString()}` : '—'} />
                <Row label="Horizonte"  value={form.horizonte || '—'} />
                <Row label="Riesgo"     value={form.toleranciaRiesgo || '—'} />
                <Row label="Objetivo"   value={form.objetivo || '—'} />
                <Row label="Documento"  value={form.documentType ? `${form.documentType} ${form.documentNumber}` : '—'} />
                <Row label="IBKR"       value={form.tieneIbkr ? `Sí${form.ibkrAccount ? ` (${form.ibkrAccount})` : ''}` : 'No'} />
                <Row label="PEP"        value={form.esPep ? 'Sí' : 'No'} />
              </div>

              {/* Disclaimer */}
              <div className="bg-white/3 rounded-xl p-4 text-xs text-gray-400 leading-relaxed">
                <strong className="text-gray-300 block mb-1">Aviso importante</strong>
                La información recopilada en este formulario es confidencial y se utiliza
                exclusivamente para evaluar tu perfil de inversión. Este formulario no constituye
                un contrato de servicios ni una recomendación de inversión. Los fondos siempre
                permanecen bajo tu custodia directa en tu cuenta personal de IBKR.
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 mt-0.5 accent-yellow-400 flex-shrink-0"
                  checked={form.declaracion} onChange={e => set('declaracion', e.target.checked)} />
                <span className="text-sm text-gray-300">
                  Declaro que toda la información proporcionada es verdadera y completa.
                  Entiendo que estoy solicitando información sobre un servicio de asesoría
                  y no garantías de rendimiento.
                </span>
              </label>
            </>
          )}

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Botones de navegación */}
          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <button
                onClick={() => { setError(''); setStep(s => s - 1) }}
                className="flex-1 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors"
              >
                Anterior
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={nextStep}
                className="flex-1 py-2.5 rounded-lg bg-yellow-400 text-black font-semibold text-sm hover:bg-yellow-300 transition-colors"
              >
                Siguiente →
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={status === 'loading'}
                className="flex-1 py-2.5 rounded-lg bg-yellow-400 text-black font-semibold text-sm hover:bg-yellow-300 transition-colors disabled:opacity-50"
              >
                {status === 'loading' ? 'Enviando...' : 'Enviar formulario'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-600">
          Tus datos son confidenciales y nunca serán compartidos con terceros.
        </p>
      </div>
    </main>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-300 text-right">{value}</span>
    </div>
  )
}
