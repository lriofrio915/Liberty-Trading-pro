'use client'

import { useState } from 'react'

interface BrokerConn {
  id: string
  ibkrHost: string | null
  ibkrPort: number | null
  ibkrClientId: number
  ibkrAccountId: string | null
  lastStatus: string
}

export default function IBKRSetupForm({
  connection,
  onConfigured,
}: {
  connection: BrokerConn | null
  onConfigured: () => void
}) {
  const [host, setHost] = useState(connection?.ibkrHost ?? '')
  const [port, setPort] = useState(String(connection?.ibkrPort ?? 7497))
  const [clientId, setClientId] = useState(String(connection?.ibkrClientId ?? 1))
  const [accountId, setAccountId] = useState(connection?.ibkrAccountId ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    if (!host || !port) { setError('Host y puerto son requeridos'); return }
    setLoading(true)
    setError(null)
    try {
      const cfgRes = await fetch('/api/brokers/ibkr/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port: parseInt(port), client_id: parseInt(clientId), account_id: accountId || undefined }),
      })
      if (!cfgRes.ok) {
        const e = await cfgRes.json()
        throw new Error(e.error ?? 'Error al configurar')
      }

      const statusRes = await fetch('/api/brokers/ibkr/status')
      const status = await statusRes.json()
      if (!status.connected) {
        throw new Error(`No se pudo conectar a IBKR en ${host}:${port}. Asegúrate de que TWS o IB Gateway esté abierto y aceptando conexiones API.`)
      }

      onConfigured()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl p-6 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div>
          <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Conectar Interactive Brokers
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Requiere TWS o IB Gateway abierto con API habilitada en la misma máquina o red.
          </p>
        </div>

        <div className="rounded-lg p-4 space-y-2" style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)' }}>
          <div className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>Puertos por defecto</div>
          <div className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
            <div><code className="px-1 rounded" style={{ background: 'var(--border)' }}>7497</code> — TWS Live</div>
            <div><code className="px-1 rounded" style={{ background: 'var(--border)' }}>7496</code> — TWS Paper Trading</div>
            <div><code className="px-1 rounded" style={{ background: 'var(--border)' }}>4001</code> — IB Gateway Live</div>
            <div><code className="px-1 rounded" style={{ background: 'var(--border)' }}>4002</code> — IB Gateway Paper</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-muted)' }}>Host</label>
            <input
              type="text"
              placeholder="127.0.0.1 o tu IP pública"
              value={host}
              onChange={e => setHost(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-muted)' }}>Puerto</label>
            <input
              type="number"
              value={port}
              onChange={e => setPort(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-muted)' }}>Client ID</label>
            <input
              type="number"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Account ID <span className="font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="U1234567"
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
          style={{ background: 'var(--gold-dark)', color: '#000' }}
        >
          {loading ? 'Conectando...' : 'Conectar a IBKR'}
        </button>
      </div>
    </div>
  )
}
