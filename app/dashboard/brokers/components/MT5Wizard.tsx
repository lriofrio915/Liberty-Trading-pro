'use client'

import { useState } from 'react'

interface BrokerConn {
  id: string
  mt5TunnelUrl: string | null
  mt5AccountNumber: string | null
  lastStatus: string
}

export default function MT5Wizard({
  connection,
  onConfigured,
}: {
  connection: BrokerConn | null
  onConfigured: () => void
}) {
  const [step, setStep] = useState(connection?.mt5TunnelUrl ? 2 : 0)
  const [tunnelUrl, setTunnelUrl] = useState(connection?.mt5TunnelUrl ?? '')
  const [authToken, setAuthToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; info?: Record<string, unknown> } | null>(null)

  const steps = ['Descarga el EA Bridge', 'Configura el túnel', 'Verificar conexión']

  const handleVerify = async () => {
    setLoading(true)
    setError(null)
    setVerifyResult(null)
    try {
      // First configure (save encrypted credentials)
      const cfgRes = await fetch('/api/brokers/mt5/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tunnel_url: tunnelUrl, auth_token: authToken }),
      })
      if (!cfgRes.ok) {
        const e = await cfgRes.json()
        throw new Error(e.error ?? 'Error al configurar')
      }

      // Then verify status
      const statusRes = await fetch('/api/brokers/mt5/status')
      if (!statusRes.ok) {
        const e = await statusRes.json()
        throw new Error(e.error ?? 'No se pudo conectar a MT5. Verifica el tunnel URL y el AuthToken.')
      }
      const info = await statusRes.json()
      setVerifyResult({ success: true, info })
      onConfigured()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
      setVerifyResult({ success: false })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
              style={
                i === step
                  ? { background: 'var(--gold-dark)', color: '#000' }
                  : i < step
                  ? { background: 'rgba(34,197,94,0.2)', color: 'rgb(34,197,94)' }
                  : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }
              }
            >
              {i < step ? '✓' : i + 1}
            </div>
            <span className="text-xs hidden sm:block" style={{ color: i === step ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {s}
            </span>
            {i < steps.length - 1 && (
              <div className="w-8 h-px mx-1" style={{ background: 'var(--border)' }} />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl p-6 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

        {/* Step 0: Download EA */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Paso 1 — Descarga e instala el EA Bridge
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              El EA Bridge es un Expert Advisor MQL5 que expone una REST API local desde MetaTrader 5.
              Liberty lo usa para enviar órdenes directamente a tu cuenta.
            </p>
            <div className="rounded-lg p-4 space-y-3" style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)' }}>
              <div className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>Instrucciones de instalación</div>
              <ol className="text-sm space-y-2 list-decimal list-inside" style={{ color: 'var(--text-secondary)' }}>
                <li>Descarga el EA desde el botón de abajo (o clona el repo de GitHub)</li>
                <li>Abre MetaTrader 5 → <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'var(--border)' }}>File &gt; Open Data Folder</code></li>
                <li>Navega a <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'var(--border)' }}>MQL5/Experts/</code> y copia el archivo <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'var(--border)' }}>.ex5</code></li>
                <li>Reinicia MetaTrader 5</li>
                <li>Arrastra el EA a cualquier gráfico</li>
                <li>En la configuración del EA, activa <strong>Allow Algo Trading</strong></li>
                <li>El EA mostrará el <strong>AuthToken</strong> en el panel del gráfico — cópialo</li>
              </ol>
            </div>
            <div className="flex gap-3">
              <a
                href="/downloads/LibertyBridge.ex5"
                download
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{ background: 'var(--gold-dark)', color: '#000' }}
              >
                Descargar LibertyBridge.ex5
              </a>
              <a
                href="https://github.com/DevRico003/mt5-rest-api"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg text-sm font-semibold border transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                Ver en GitHub
              </a>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-sm font-semibold transition-colors"
              style={{ color: 'var(--gold)' }}
            >
              Ya lo instalé → Continuar
            </button>
          </div>
        )}

        {/* Step 1: Configure tunnel */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Paso 2 — Configura el túnel seguro
            </h2>
            <div className="rounded-lg p-4 space-y-3" style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)' }}>
              <div className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>Instala y ejecuta cloudflared</div>
              <ol className="text-sm space-y-2 list-decimal list-inside" style={{ color: 'var(--text-secondary)' }}>
                <li>Descarga cloudflared desde <strong>developers.cloudflare.com/cloudflared</strong></li>
                <li>Ejecuta en terminal: <code className="px-1 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--border)' }}>cloudflared tunnel --url http://localhost:6542</code></li>
                <li>Copia la URL generada (formato <code>https://xxxx.trycloudflare.com</code>)</li>
              </ol>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  URL del túnel (debe empezar con https://)
                </label>
                <input
                  type="url"
                  placeholder="https://xxxx.trycloudflare.com"
                  value={tunnelUrl}
                  onChange={e => setTunnelUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  AuthToken del EA (visible en el panel del gráfico)
                </label>
                <input
                  type="password"
                  placeholder="Pega el AuthToken aquí"
                  value={authToken}
                  onChange={e => setAuthToken(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="px-4 py-2 rounded-lg text-sm border transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                Atrás
              </button>
              <button
                onClick={() => {
                  if (!tunnelUrl.startsWith('https://')) {
                    setError('La URL debe empezar con https://')
                    return
                  }
                  if (!authToken) {
                    setError('El AuthToken es requerido')
                    return
                  }
                  setError(null)
                  setStep(2)
                }}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{ background: 'var(--gold-dark)', color: '#000' }}
              >
                Continuar
              </button>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        )}

        {/* Step 2: Verify */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Paso 3 — Verificar conexión
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Liberty intentará conectarse a tu MT5 a través del túnel configurado.
            </p>
            {!connection?.mt5TunnelUrl && (
              <div className="text-xs rounded-lg p-3" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>
                Túnel: <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{tunnelUrl}</span>
              </div>
            )}
            {verifyResult?.success && (
              <div className="rounded-lg p-4 flex items-start gap-3" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
                <span className="text-green-400 text-xl mt-0.5">✓</span>
                <div>
                  <div className="text-sm font-semibold text-green-400">Conexión exitosa</div>
                  {verifyResult.info && (
                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      Cuenta: {String((verifyResult.info as Record<string, unknown>).login ?? '')}
                    </div>
                  )}
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-lg p-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <div className="text-sm text-red-400 font-semibold">Error de conexión</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{error}</div>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setStep(1); setError(null); setVerifyResult(null) }}
                className="px-4 py-2 rounded-lg text-sm border transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                Atrás
              </button>
              <button
                onClick={handleVerify}
                disabled={loading}
                className="px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ background: 'var(--gold-dark)', color: '#000' }}
              >
                {loading ? 'Verificando...' : 'Verificar conexión'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
