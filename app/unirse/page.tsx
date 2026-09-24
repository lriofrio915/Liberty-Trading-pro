'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { wa } from '@/lib/brand'

// ─── Config ──────────────────────────────────────────────────────────────────

const LUIS_WA = wa('Hola Luis, quiero información sobre el curso gratuito')
const TRACK_RECORD_URL = '/track-record/luis-riofrio'

// ─── Types ────────────────────────────────────────────────────────────────────

type FormState = 'idle' | 'loading' | 'success' | 'error'

interface TrackRecord {
  winRate: number
  profitFactor: number
  rendimientoYTD: number
  totalTrades: number
}

// ─── Módulos del curso gratuito ────────────────────────────────────────────────

const MODULOS = [
  { icon: '🎬', title: 'Mi historia', desc: 'De profesor de química con plaza fija a operador financiero en una fintech — por qué hago esto' },
  { icon: '📊', title: 'Fundamentos de los mercados', desc: 'Qué es la bolsa, y dónde encajan acciones, opciones y futuros' },
  { icon: '🏦', title: 'Tu cuenta en IBKR', desc: 'Apertura paso a paso en Interactive Brokers desde Latinoamérica' },
  { icon: '🤖', title: 'Analiza acciones con Claude', desc: 'Mi flujo real de prompts para analizar una empresa antes de invertir' },
  { icon: '📈', title: 'Opciones desde cero', desc: 'Qué es un contrato de opciones y las griegas explicadas con intuición' },
  { icon: '🔍', title: 'Lee la cadena de opciones', desc: 'Cómo encontrar oportunidades reales en una cadena de opciones' },
]

const FAQS = [
  {
    q: '¿De verdad es gratis?',
    a: 'Sí, completamente. Es mi forma de mostrarte cómo trabajo antes de que consideres Liberty Quant, mi especialización pagada en trading cuantitativo de futuros.',
  },
  {
    q: '¿Necesito experiencia previa?',
    a: 'No. Empezamos desde cero: qué es la bolsa, cómo abrir tu cuenta en EEUU y cómo analizar tu primera acción.',
  },
  {
    q: '¿Tengo que pagar algo después?',
    a: 'No hay ninguna obligación. Al terminar el curso te cuento sobre Liberty Quant por si quieres dar el siguiente paso, pero el curso gratuito se queda contigo de todas formas.',
  },
  {
    q: '¿Cuándo tengo acceso?',
    a: 'Inmediatamente después de registrarte. El curso completo vive en tu panel, disponible cuando quieras verlo.',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPhoneDigits(digits: string): string {
  if (digits.length === 0) return ''
  if (digits.length <= 3)  return `+${digits}`
  if (digits.length <= 5)  return `+${digits.slice(0, 3)} ${digits.slice(3)}`
  if (digits.length <= 8)  return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`
  return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
}

function cleanPhone(v: string): string {
  return v.replace(/\D/g, '')
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-3 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <span className="text-2xl font-black" style={{ color: color || '#C9A84C', fontFamily: 'Georgia, serif' }}>
        {value}
      </span>
      <span className="text-[10px] font-mono tracking-widest uppercase mt-0.5" style={{ color: '#555' }}>
        {label}
      </span>
    </div>
  )
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 transition-colors hover:text-white"
        style={{ color: open ? '#fff' : '#aaa' }}
      >
        <span className="text-sm font-medium">{q}</span>
        <span className="flex-shrink-0 text-lg leading-none transition-transform duration-200"
          style={{ transform: open ? 'rotate(45deg)' : 'none', color: '#C9A84C' }}>
          +
        </span>
      </button>
      {open && (
        <p className="pb-4 text-sm leading-relaxed" style={{ color: '#888' }}>{a}</p>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function UnirsePage() {
  const [stats, setStats] = useState<TrackRecord | null>(null)
  const [nombre, setNombre] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [formState, setFormState] = useState<FormState>('idle')
  const [phoneError, setPhoneError] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const formRef = useRef<HTMLDivElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/public-track-record')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
  }, [])

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target
    const cursorPos = input.selectionStart ?? 0
    const raw = input.value

    // Count digits before cursor position in the raw string
    const digitsBeforeCursor = raw.slice(0, cursorPos).replace(/\D/g, '').length

    const digits = raw.replace(/\D/g, '').slice(0, 12)
    const formatted = formatPhoneDigits(digits)
    setPhone(formatted)
    setPhoneError('')

    // Restore cursor to the correct position after React re-renders
    requestAnimationFrame(() => {
      const el = phoneRef.current
      if (!el) return
      let digitsSeen = 0
      let newPos = formatted.length
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) digitsSeen++
        if (digitsSeen === digitsBeforeCursor) { newPos = i + 1; break }
      }
      el.setSelectionRange(newPos, newPos)
    })
  }

  async function doSubmit() {
    const digits = cleanPhone(phone)
    if (!nombre.trim()) return
    if (digits.length < 8) {
      setPhoneError('Número incompleto — recuerda incluir el código de país (ej: +593 99 123 4567)')
      return
    }

    setFormState('loading')
    setErrorMsg('')
    setPhoneError('')

    try {
      const res = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nombre.trim(),
          phone: digits,
          email: email.trim(),
          plan: 'GRATIS',
          source: 'landing',
        }),
      })
      const json = await res.json()
      if (json.ok) {
        setFormState('success')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setErrorMsg(json.error || 'Hubo un error. Intenta de nuevo.')
        setFormState('error')
      }
    } catch {
      setErrorMsg('Sin conexión. Intenta de nuevo.')
      setFormState('error')
    }
  }

  const ytd = stats
    ? (stats.rendimientoYTD >= 0 ? `+${stats.rendimientoYTD.toFixed(1)}%` : `${stats.rendimientoYTD.toFixed(1)}%`)
    : null

  // ── Success screen ──────────────────────────────────────────────────────────
  if (formState === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 text-center"
        style={{ background: '#080808' }}>
        <div className="fixed top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,#C9A84C,#e8c96a,#C9A84C)' }} />

        <div className="w-full max-w-md">
          <div className="text-6xl mb-6">🎉</div>
          <div className="text-[10px] font-mono tracking-widest uppercase mb-3" style={{ color: '#C9A84C' }}>
            ¡Todo listo, {nombre.split(' ')[0]}!
          </div>
          <h1 className="text-3xl font-black text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Tu curso gratuito ya está disponible
          </h1>
          <p className="text-sm leading-relaxed mb-8" style={{ color: '#888' }}>
            Ya puedes entrar a tu panel y ver el curso. Luis revisa cada registro personalmente —
            si prefieres hablar ya mismo, escríbele directo por WhatsApp.
          </p>

          {/* Steps */}
          <div className="text-left space-y-3 mb-8">
            {[
              { n: '1', text: 'Creamos tu acceso gratuito', done: true },
              { n: '2', text: 'Miras el curso a tu ritmo, cuando quieras', done: false },
              { n: '3', text: 'Si tienes dudas, le escribes a Luis directo', done: false },
            ].map(step => (
              <div key={step.n} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: step.done ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${step.done ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: step.done ? '#C9A84C' : 'rgba(255,255,255,0.1)', color: step.done ? '#080808' : '#666' }}>
                  {step.done ? '✓' : step.n}
                </div>
                <span className="text-sm" style={{ color: step.done ? '#fff' : '#888' }}>{step.text}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Link href="/dashboard/academia"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
              style={{ background: '#C9A84C', color: '#080808' }}>
              Ver el curso gratuito →
            </Link>
            <a href={LUIS_WA} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm border transition-colors hover:border-white/20"
              style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#888' }}>
              Hablar ahora con Luis por WhatsApp
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ── Main page ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: '#080808', color: '#fff' }}>
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50" style={{ background: 'linear-gradient(90deg,#C9A84C,#e8c96a,#C9A84C)' }} />

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 border-b px-4 py-3"
        style={{ background: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(12px)', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-black" style={{ color: '#C9A84C', fontFamily: 'Georgia, serif' }}>
            Liberty Trading Pro
          </Link>
          <div className="flex items-center gap-3">
            <a href={LUIS_WA} target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 text-xs font-mono px-4 py-2 rounded-lg border transition-colors hover:border-white/20"
              style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#888' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#25D366' }}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413A11.824 11.824 0 0012.05 0zm0 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884z" />
              </svg>
              Hablar con Luis
            </a>
            <button
              onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              className="text-xs font-bold px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
              style={{ background: '#C9A84C', color: '#080808' }}>
              Empezar gratis →
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-4 pt-14 pb-12 text-center">

        {/* Live badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
          style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          <span className="text-[11px] font-mono tracking-widest uppercase" style={{ color: '#C9A84C' }}>
            Curso 100% gratuito · Sin tarjeta, sin compromiso
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-5">
          Hace 8 años era profesor de química.<br />
          <span style={{ color: '#C9A84C', fontFamily: 'Georgia, serif' }}>Hoy vivo de los mercados financieros.</span>
        </h1>

        <p className="text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-10" style={{ color: '#999' }}>
          Con Luis Riofrío — trader cuantitativo con <strong className="text-white">track record público verificable</strong>.
          Aprende a abrir tu cuenta en EEUU, analizar acciones con Claude y entender opciones — gratis, desde cero.
        </p>

        {/* Live stats */}
        {stats ? (
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <StatCard label="Win Rate" value={`${stats.winRate}%`} color={stats.winRate >= 50 ? '#22c55e' : '#ef4444'} />
            <StatCard label="Profit Factor" value={`${stats.profitFactor}x`} />
            {ytd && <StatCard label="P&L YTD" value={ytd} color={stats.rendimientoYTD >= 0 ? '#22c55e' : '#ef4444'} />}
            <StatCard label="Operaciones" value={String(stats.totalTrades)} />
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-28 h-16 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        )}

        <Link href={TRACK_RECORD_URL} target="_blank"
          className="inline-flex items-center gap-2 text-xs font-mono transition-colors hover:text-[#C9A84C]"
          style={{ color: '#555' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          Ver track record completo de Luis →
        </Link>
      </section>

      {/* ── Main content ── */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">

          {/* LEFT — Modules + FAQ (on mobile: after form) */}
          <div className="lg:col-span-3 order-2 lg:order-1">

            {/* Modules */}
            <div className="mb-8">
              <p className="text-[10px] font-mono tracking-widest uppercase mb-4" style={{ color: '#555' }}>
                Lo que aprenderás — gratis
              </p>
              <div className="space-y-2.5">
                {MODULOS.map(f => (
                  <div key={f.title} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
                      style={{ background: 'rgba(255,255,255,0.04)' }}>
                      {f.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{f.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#666' }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upsell badge */}
            <div className="rounded-xl p-4 mb-8 flex items-start gap-3"
              style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}>
              <span className="text-lg flex-shrink-0">🚀</span>
              <div>
                <p className="text-sm font-bold text-white mb-0.5">¿Quieres ir más allá?</p>
                <p className="text-xs leading-relaxed" style={{ color: '#888' }}>
                  Al terminar el curso gratuito te cuento sobre <Link href="/liberty-quant" className="underline" style={{ color: '#C9A84C' }}>Liberty Quant</Link>,
                  mi club de trading algorítmico cuantitativo — incluye 6 bots listos para instalar y una cuenta fondeada de $200k.
                </p>
              </div>
            </div>

            {/* FAQ */}
            <div>
              <p className="text-[10px] font-mono tracking-widest uppercase mb-4" style={{ color: '#555' }}>
                Preguntas frecuentes
              </p>
              {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
            </div>
          </div>

          {/* RIGHT — Form card */}
          <div className="lg:col-span-2 order-1 lg:order-2 lg:sticky lg:top-24" ref={formRef}>
            <div className="rounded-2xl overflow-hidden"
              style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.09)' }}>

              {/* Card header */}
              <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="text-[10px] font-mono tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>
                  Curso gratuito · Acceso inmediato
                </div>
                <h2 className="text-xl font-black text-white" style={{ fontFamily: 'Georgia, serif' }}>
                  Regístrate gratis
                </h2>
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#666' }}>
                  Acceso inmediato a tu panel. Sin pago, nunca.
                </p>
              </div>

              {/* Form */}
              <div className="px-6 py-5 space-y-4">

                {/* Nombre */}
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest block mb-2" style={{ color: '#555' }}>
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && doSubmit()}
                    placeholder="Carlos Mendoza"
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-[#444] outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.09)',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')}
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest block mb-1.5" style={{ color: '#555' }}>
                    Número de WhatsApp *
                  </label>
                  <p className="text-[10px] mb-2" style={{ color: '#444' }}>
                    Empieza con el código de tu país — Ej: <span style={{ color: '#777' }}>+593</span> Ecuador · <span style={{ color: '#777' }}>+57</span> Colombia · <span style={{ color: '#777' }}>+34</span> España
                  </p>
                  <input
                    ref={phoneRef}
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={handlePhoneChange}
                    onKeyDown={e => e.key === 'Enter' && doSubmit()}
                    placeholder="Ej: +593 99 123 4567"
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-[#333] outline-none transition-all font-mono tracking-wide"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${phoneError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.09)'}`,
                    }}
                    onFocus={e => !phoneError && (e.target.style.borderColor = '#C9A84C')}
                    onBlur={e => !phoneError && (e.target.style.borderColor = 'rgba(255,255,255,0.09)')}
                  />
                  {phoneError && (
                    <p className="text-[11px] mt-1.5" style={{ color: '#ef4444' }}>{phoneError}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest block mb-2" style={{ color: '#555' }}>
                    Email <span style={{ color: '#333' }}>(opcional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && doSubmit()}
                    placeholder="tu@email.com"
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-[#444] outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.09)',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')}
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {errorMsg}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="button"
                  onClick={doSubmit}
                  disabled={formState === 'loading'}
                  className="w-full py-4 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                  style={{ background: '#C9A84C', color: '#080808' }}
                >
                  {formState === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                      Enviando...
                    </span>
                  ) : (
                    'Empezar gratis ahora →'
                  )}
                </button>

                {/* Trust signals */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { icon: '🔒', text: '100% gratis' },
                    { icon: '⚡', text: 'Respuesta en 5 min' },
                    { icon: '🎓', text: 'Acceso inmediato' },
                  ].map(t => (
                    <div key={t.text} className="flex flex-col items-center gap-1 text-center">
                      <span className="text-base">{t.icon}</span>
                      <span className="text-[10px] font-mono leading-tight" style={{ color: '#444' }}>{t.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t px-4 py-8 text-center" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <Link href="/" className="text-sm font-black mb-3 block" style={{ color: '#C9A84C', fontFamily: 'Georgia, serif' }}>
          Liberty Trading Pro
        </Link>
        <p className="text-[11px] font-mono max-w-md mx-auto" style={{ color: '#333' }}>
          © {new Date().getFullYear()} Liberty Trading Pro · Las inversiones implican riesgo.
          Resultados pasados no garantizan rendimientos futuros.
        </p>
      </footer>
    </div>
  )
}
