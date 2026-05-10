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

export default function MT5ConnectPanel({ account, metaInfo, onDisconnected }: MT5ConnectPanelProps) {
  const [disconnecting, setDisconnecting] = useState(false)

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
    <div className="rounded-xl border p-5 space-y-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[var(--text-muted)]" />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
          Sin cuenta MT5 conectada
        </span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Usa el <strong className="text-[var(--text-secondary)]">EA Gratuito</strong> de arriba para conectar tu MetaTrader 5 sin necesidad de servicios de terceros. Descarga el archivo .mq5, instálalo en MT5 y activa el toggle de auto-trade.
      </p>
    </div>
  )
}
