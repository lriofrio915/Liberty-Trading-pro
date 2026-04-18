'use client'

import { useState } from 'react'

interface MT5Account {
  id: string
  metaApiAccountId: string
  accountName: string | null
  broker: string | null
  login: string
  server: string | null
  isConnected: boolean
  lastSyncAt: string | null
}

interface MetaInfo {
  balance?: number
  equity?: number
  margin?: number
  freeMargin?: number
  currency?: string
  server?: string
  platform?: string
}

interface MT5ConnectPanelProps {
  account: MT5Account | null
  metaInfo: MetaInfo | null
  onConnected: () => void
  onDisconnected: () => void
}

export default function MT5ConnectPanel({ account, metaInfo, onConnected, onDisconnected }: MT5ConnectPanelProps) {
  const [form, setForm] = useState({
    metaApiAccountId: '',
    login: '',
    broker: '',
    server: '',
    accountName: '',
  })
  const [loading, setLoading] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    if (!form.metaApiAccountId || !form.login) {
      setError('MetaAPI Account ID y Login son requeridos')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/mt5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al conectar')
      onConnected()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar cuenta MT5')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      await fetch('/api/mt5', { method: 'DELETE' })
      onDisconnected()
    } finally {
      setDisconnecting(false)
    }
  }

  if (account) {
    return (
      <div className="space-y-4">
        {/* Account status card */}
        <div className="rounded-xl border p-5" style={{ background: 'rgba(34,197,94,0.05)', borderColor: 'rgba(34,197,94,0.25)' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                <span className="text-sm font-semibold text-green-400">Cuenta MT5 Conectada</span>
              </div>
              <div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                {account.accountName ?? `MT5 #${account.login}`}
              </div>
              <div className="text-xs mt-1 space-y-0.5" style={{ color: 'var(--text-muted)' }}>
                {account.broker && <div>Broker: <span className="font-medium">{account.broker}</span></div>}
                {account.server && <div>Servidor: <span className="font-mono">{account.server}</span></div>}
                <div>Login: <span className="font-mono">{account.login}</span></div>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="text-xs px-3 py-1.5 rounded-lg border transition-colors flex-shrink-0"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              {disconnecting ? 'Desconectando...' : 'Desconectar'}
            </button>
          </div>
        </div>

        {/* Account metrics from MetaAPI */}
        {metaInfo && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Balance', value: metaInfo.balance != null ? `${metaInfo.currency ?? '$'} ${metaInfo.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—' },
              { label: 'Equity', value: metaInfo.equity != null ? `${metaInfo.currency ?? '$'} ${metaInfo.equity?.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—' },
              { label: 'Margen libre', value: metaInfo.freeMargin != null ? `${metaInfo.currency ?? '$'} ${metaInfo.freeMargin?.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—' },
              { label: 'Plataforma', value: metaInfo.platform ?? 'MT5' },
            ].map(m => (
              <div key={m.label} className="card p-3 text-center">
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{m.label}</div>
                <div className="text-sm font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{m.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Conectar cuenta MetaTrader 5
        </h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Necesitas una cuenta en{' '}
          <a href="https://metaapi.cloud" target="_blank" rel="noreferrer" className="text-yellow-400 hover:underline">
            MetaAPI.cloud
          </a>
          {' '}y agregar tu cuenta MT5 allá. Luego pega el Account ID aquí.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
              MetaAPI Account ID *
            </label>
            <input
              type="text"
              value={form.metaApiAccountId}
              onChange={e => setForm(f => ({ ...f, metaApiAccountId: e.target.value }))}
              placeholder="ej: abc123def456..."
              className="w-full px-3 py-2 rounded-lg text-sm font-mono"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                Login MT5 *
              </label>
              <input
                type="text"
                value={form.login}
                onChange={e => setForm(f => ({ ...f, login: e.target.value }))}
                placeholder="ej: 123456"
                className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                Broker
              </label>
              <input
                type="text"
                value={form.broker}
                onChange={e => setForm(f => ({ ...f, broker: e.target.value }))}
                placeholder="ej: ICMarkets"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                Servidor
              </label>
              <input
                type="text"
                value={form.server}
                onChange={e => setForm(f => ({ ...f, server: e.target.value }))}
                placeholder="ej: ICMarketsSC-Demo"
                className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                Nombre descriptivo
              </label>
              <input
                type="text"
                value={form.accountName}
                onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))}
                placeholder="ej: Mi cuenta demo"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm btn-gold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Conectando...' : '🔗 Conectar cuenta MT5'}
          </button>
        </div>
      </div>
    </div>
  )
}
