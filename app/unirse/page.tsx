'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const VINCES_WA = 'https://wa.me/18287149177?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20el%20Club%20Liberty%20Trading'

interface TrackRecord {
  winRate: number
  profitFactor: number
  rendimientoYTD: number
  totalTrades: number
  wins: number
}

const ALL_FEATURES = [
  { icon: '🎓', text: 'Mentoría Integral de Mercados Financieros (desde cero)' },
  { icon: '📈', text: 'Day Trading — Futuros NQ/MNQ Nasdaq con NinjaTrader 8' },
  { icon: '🤝', text: 'Mentorías 1:1 personalizadas con Luis cada mes' },
  { icon: '🤖', text: 'Vinces IA — coaching diario personalizado 24/7' },
  { icon: '💡', text: 'Reportes de oportunidades en acciones y ETFs' },
  { icon: '🌐', text: 'Monitor Mundial — geopolítica y macro en tiempo real' },
  { icon: '📊', text: 'Track record verificable — operaciones reales de Luis' },
  { icon: '📄', text: 'Reportes de rendimiento semanales y mensuales' },
  { icon: '👥', text: 'Comunidad privada activa' },
]

type Plan = 'MENSUAL' | 'ANUAL'
type FormState = 'idle' | 'loading' | 'success' | 'error'

function PhoneField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [prefix, setPrefix] = useState('+593')
  const [local, setLocal] = useState('')

  function handlePrefix(v: string) {
    setPrefix(v)
    onChange(v.replace('+', '') + local)
  }
  function handleLocal(v: string) {
    const digits = v.replace(/\D/g, '')
    setLocal(digits)
    onChange(prefix.replace('+', '') + digits)
  }

  return (
    <div className="flex gap-2">
      <select
        value={prefix}
        onChange={(e) => handlePrefix(e.target.value)}
        className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-3 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--gold)] transition-colors w-28 flex-shrink-0">
        <option value="+593">🇪🇨 +593</option>
        <option value="+57">🇨🇴 +57</option>
        <option value="+51">🇵🇪 +51</option>
        <option value="+56">🇨🇱 +56</option>
        <option value="+52">🇲🇽 +52</option>
        <option value="+54">🇦🇷 +54</option>
        <option value="+58">🇻🇪 +58</option>
        <option value="+1">🇺🇸 +1</option>
        <option value="+34">🇪🇸 +34</option>
      </select>
      <input
        type="tel"
        placeholder="99 669 1586"
        value={local}
        onChange={(e) => handleLocal(e.target.value)}
        required
        className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] transition-colors"
      />
    </div>
  )
}

export default function Unirse() {
  const [data, setData] = useState<TrackRecord | null>(null)
  const [plan, setPlan] = useState<Plan>('MENSUAL')
  const [nombre, setNombre] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetch('/api/public-track-record')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || phone.length < 8) return

    setFormState('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nombre.trim(), phone, email: email.trim(), plan }),
      })
      const json = await res.json()
      if (json.ok) {
        setFormState('success')
      } else {
        setErrorMsg(json.error || 'Hubo un error. Intenta de nuevo.')
        setFormState('error')
      }
    } catch {
      setErrorMsg('Sin conexión. Intenta de nuevo.')
      setFormState('error')
    }
  }

  const ytd = data
    ? (data.rendimientoYTD >= 0 ? `+${data.rendimientoYTD.toFixed(2)}%` : `${data.rendimientoYTD.toFixed(2)}%`)
    : '—'

  return (
    <div className="min-h-screen" style={{ background: 'var(--black)' }}>

      {/* Nav mínimo */}
      <nav className="border-b border-[var(--border)] px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="headline text-xl gradient-gold">Liberty Trading Pro</Link>
          <a href={VINCES_WA} target="_blank" rel="noopener noreferrer"
            className="btn-outline text-xs py-2 px-4 rounded-lg">
            Hablar con Vinces
          </a>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-16">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 border border-[var(--gold-dark)] rounded-full px-4 py-1.5 mb-6"
            style={{ background: 'rgba(201,168,76,0.06)' }}>
            <span className="w-2 h-2 rounded-full bg-[var(--green)] pulse-dot" />
            <span className="font-mono-custom text-[11px] text-[var(--gold)] tracking-wider">
              Club activo — plazas limitadas
            </span>
          </div>

          <h1 className="headline text-5xl sm:text-6xl text-[var(--text-primary)] mb-5">
            Únete al Club<br />
            <span className="gradient-gold">Liberty Trading</span>
          </h1>
          <p className="text-[var(--text-secondary)] max-w-lg mx-auto leading-relaxed">
            Aprende trading de cero a profesional con Luis Riofrío — operador real con track record público.
            Un solo pago mensual, acceso a todo. Cancela cuando quieras.
          </p>

          {/* Live metrics strip */}
          {data && (
            <div className="flex flex-wrap justify-center gap-6 mt-8">
              {[
                { label: 'Rendimiento YTD', value: ytd, positive: data.rendimientoYTD >= 0 },
                { label: 'Win Rate', value: `${data.winRate}%`, positive: true },
                { label: 'Profit Factor', value: `${data.profitFactor}x`, positive: true },
                { label: 'Instrumento', value: 'MNQ', positive: null },
              ].map((m) => (
                <div key={m.label} className="text-center">
                  <div className={`text-2xl font-bold ${m.positive === true ? 'text-[var(--gold)]' : m.positive === false ? 'text-[var(--red)]' : 'text-[var(--text-primary)]'}`}
                    style={{ fontFamily: 'var(--font-serif)' }}>
                    {m.value}
                  </div>
                  <div className="label-mono mt-1">{m.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* LEFT — Features + Plan selector */}
          <div>
            {/* Plan cards */}
            <div className="label-mono mb-4">Elige tu plan</div>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {/* Mensual */}
              <button type="button" onClick={() => setPlan('MENSUAL')}
                className={`rounded-xl border p-4 text-left transition-all ${
                  plan === 'MENSUAL'
                    ? 'border-[var(--gold)] bg-[rgba(201,168,76,0.06)]'
                    : 'border-[var(--border)] hover:border-[var(--gold-dark)]'
                }`}>
                <div className="label-mono mb-1 text-[10px]">Mensual</div>
                <div className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-serif)' }}>$79</div>
                <div className="label-mono text-[10px] mt-0.5">/mes · cancela cuando quieras</div>
              </button>

              {/* Anual */}
              <button type="button" onClick={() => setPlan('ANUAL')}
                className={`rounded-xl border p-4 text-left transition-all relative overflow-hidden ${
                  plan === 'ANUAL'
                    ? 'border-[var(--gold)] bg-[rgba(201,168,76,0.06)]'
                    : 'border-[var(--border)] hover:border-[var(--gold-dark)]'
                }`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="label-mono text-[10px]">Anual</div>
                  <span className="text-[9px] font-mono bg-[var(--gold)] text-black px-2 py-0.5 rounded-full font-bold">
                    -$299
                  </span>
                </div>
                <div className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-serif)' }}>$649</div>
                <div className="label-mono text-[10px] mt-0.5">/año · ~$54/mes</div>
              </button>
            </div>

            {/* Features */}
            <div className="label-mono mb-4">Todo incluido en ambos planes</div>
            <ul className="space-y-2.5">
              {ALL_FEATURES.map((f) => (
                <li key={f.text} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 mt-0.5 text-base">{f.icon}</span>
                  <span className="text-sm text-[var(--text-secondary)]">{f.text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-start gap-2 border border-[var(--border)] rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              <span className="text-[var(--green)] mt-0.5 flex-shrink-0">✓</span>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Track record de Luis verificable y público. Sin fórmulas mágicas — trading real con disciplina y método probado.{' '}
                <Link href="/track-record/cmmjkgdt800004kjq1zep8qc9" className="text-[var(--gold)] hover:underline">
                  Ver historial completo →
                </Link>
              </p>
            </div>
          </div>

          {/* RIGHT — Form */}
          <div>
            {formState === 'success' ? (
              <div className="rounded-2xl border border-[var(--gold-dark)] p-8 text-center"
                style={{ background: 'rgba(201,168,76,0.04)' }}>
                <div className="text-4xl mb-4">🎉</div>
                <h2 className="headline text-2xl text-[var(--text-primary)] mb-3">
                  ¡Listo, {nombre}!
                </h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                  Vinces te escribirá por WhatsApp en los próximos minutos para orientarte.<br />
                  Revisa también tu email — te enviamos la confirmación.
                </p>
                <div className="space-y-3">
                  <a href={plan === 'ANUAL'
                    ? 'https://pay.hotmart.com/L104900408S?checkoutMode=2'
                    : 'https://pay.hotmart.com/R104900326X?checkoutMode=2'}
                    className="hotmart-fb hotmart__button-checkout btn-gold text-sm py-3 px-6 rounded-lg w-full text-center block">
                    {plan === 'ANUAL' ? 'Suscribirme ahora — $649/año →' : 'Suscribirme ahora — $79/mes →'}
                  </a>
                  <a href={VINCES_WA} target="_blank" rel="noopener noreferrer"
                    className="btn-outline text-sm py-3 px-6 rounded-lg w-full text-center block">
                    Hablar ahora con Vinces
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--border)] p-7"
                style={{ background: '#0d0d0d' }}>
                <div className="label-mono mb-1">
                  {plan === 'ANUAL' ? 'Club Anual — $649/año' : 'Club Mensual — $79/mes'}
                </div>
                <h2 className="headline text-2xl text-[var(--text-primary)] mb-1">
                  Reserva tu lugar
                </h2>
                <p className="text-xs text-[var(--text-muted)] mb-6 leading-relaxed">
                  Vinces te escribirá por WhatsApp en minutos para orientarte y resolver tus dudas antes de que te suscribas.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label-mono text-[10px] block mb-1.5">Nombre</label>
                    <input
                      type="text"
                      placeholder="Luis Riofrío"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="label-mono text-[10px] block mb-1.5">WhatsApp</label>
                    <PhoneField value={phone} onChange={setPhone} />
                    <p className="label-mono text-[9px] mt-1">Vinces te escribirá a este número</p>
                  </div>

                  <div>
                    <label className="label-mono text-[10px] block mb-1.5">Email</label>
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] transition-colors"
                    />
                    <p className="label-mono text-[9px] mt-1">Te enviamos confirmación por correo</p>
                  </div>

                  <div>
                    <label className="label-mono text-[10px] block mb-2">Plan de interés</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['MENSUAL', 'ANUAL'] as Plan[]).map((p) => (
                        <button key={p} type="button" onClick={() => setPlan(p)}
                          className={`rounded-lg border py-2.5 px-3 text-xs font-mono transition-all ${
                            plan === p
                              ? 'border-[var(--gold)] text-[var(--gold)] bg-[rgba(201,168,76,0.08)]'
                              : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--gold-dark)]'
                          }`}>
                          {p === 'MENSUAL' ? '$79/mes' : '$649/año'}
                          {p === 'ANUAL' && (
                            <span className="ml-1 text-[9px] text-[var(--green)]">-$299</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formState === 'error' && (
                    <p className="text-xs text-[var(--red)]">{errorMsg}</p>
                  )}

                  <button type="submit" disabled={formState === 'loading'}
                    className="btn-gold text-sm py-3.5 px-6 rounded-lg w-full font-bold disabled:opacity-60 disabled:cursor-not-allowed">
                    {formState === 'loading'
                      ? 'Enviando...'
                      : `Quiero unirme — ${plan === 'ANUAL' ? '$649/año' : '$79/mes'} →`}
                  </button>

                  <p className="label-mono text-[10px] text-center">
                    Sin compromisos · Cancela cuando quieras · Vinces te orienta antes de pagar
                  </p>
                </form>
              </div>
            )}
          </div>

        </div>

        {/* Objeciones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16">
          {[
            {
              q: '¿Y si no me gusta?',
              a: 'Con un mes ($79) tienes más que suficiente para saber si el trading es para ti. Sin riesgo vs un curso de $1,000+ sin garantía.',
            },
            {
              q: '¿Sirve si soy nuevo?',
              a: 'Sí. La formación empieza desde cero. Luis te lleva desde abrir tu primera cuenta hasta operar con disciplina y método.',
            },
            {
              q: '¿Cuándo empieza?',
              a: 'Inmediatamente después de suscribirte tienes acceso a todo. Vinces te guía en los primeros pasos.',
            },
          ].map((item) => (
            <div key={item.q} className="card p-5">
              <div className="text-sm font-bold text-[var(--text-primary)] mb-2">{item.q}</div>
              <div className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.a}</div>
            </div>
          ))}
        </div>

        {/* Footer mínimo */}
        <div className="border-t border-[var(--border)] mt-16 pt-8 text-center">
          <p className="label-mono text-[10px] text-[var(--text-muted)]">
            © {new Date().getFullYear()} Liberty Trading Pro · Las inversiones implican riesgo. Resultados pasados no garantizan rendimientos futuros.
          </p>
        </div>
      </div>
    </div>
  )
}
