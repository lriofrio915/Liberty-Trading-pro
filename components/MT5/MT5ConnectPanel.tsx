'use client'

import { useState } from 'react'

interface MT5Account {
  id: string
  accountName: string | null
  broker: string | null
  login: string
  server: string | null
  isConnected: boolean
  lastSyncAt: string | null
}

interface MT5ConnectPanelProps {
  account: MT5Account | null
  onConnected: () => void
  onDisconnected: () => void
}

export default function MT5ConnectPanel({ account, onDisconnected }: MT5ConnectPanelProps) {
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
