'use client'

import { useState, useEffect, useCallback } from 'react'
import MT5OrderModal from './MT5OrderModal'

interface BrokerConn {
  id: string
  mt5TunnelUrl: string | null
  mt5AccountNumber: string | null
  lastStatus: string
  maxOrderValueUsd: number
}

interface Position {
  ticket: string | number
  symbol: string
  type: string
  volume: number
  open_price?: number
  current_price?: number
  profit?: number
}

interface AccountData {
  balance?: number
  equity?: number
  margin_free?: number
  profit?: number
  login?: string
  server?: string
}

export default function MT5Dashboard({
  connection,
  onDisconnect,
}: {
  connection: BrokerConn
  onDisconnect: () => void
}) {
  const [account, setAccount] = useState<AccountData | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [closingTicket, setClosingTicket] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [accRes, posRes] = await Promise.all([
        fetch('/api/brokers/mt5/account'),
        fetch('/api/brokers/mt5/positions'),
      ])
      if (accRes.ok) setAccount(await accRes.json())
      if (posRes.ok) setPositions(await posRes.json())
      setLastUpdated(new Date())
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleClose = async (ticket: string | number) => {
    if (!confirm(`¿Cerrar posición #${ticket}?`)) return
    setClosingTicket(String(ticket))
    try {
      const res = await fetch(`/api/brokers/mt5/close/${ticket}`, { method: 'POST' })
      if (res.ok) fetchData()
    } finally {
      setClosingTicket(null)
    }
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    await fetch('/api/brokers/connections/mt5', { method: 'DELETE' })
    onDisconnect()
  }

  const fmt = (n?: number, decimals = 2) =>
    n == null ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

  const pnlColor = (n?: number) => n == null ? 'var(--text-muted)' : n >= 0 ? 'rgb(34,197,94)' : 'rgb(239,68,68)'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              MT5 Conectado {account?.server ? `— ${account.server}` : ''}
            </div>
            {lastUpdated && (
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Actualizado {lastUpdated.toLocaleTimeString('es')} · Auto-refresh 30s
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowOrderModal(true)}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: 'var(--gold-dark)', color: '#000' }}
          >
            Nueva orden
          </button>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="px-3 py-1.5 rounded-lg text-xs border transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            {disconnecting ? 'Desconectando...' : 'Desconectar'}
          </button>
        </div>
      </div>

      {/* Account cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Balance', value: account?.balance, prefix: '$' },
          { label: 'Equity', value: account?.equity, prefix: '$' },
          { label: 'Margen libre', value: account?.margin_free, prefix: '$' },
          { label: 'P&L del día', value: account?.profit, prefix: '$' },
        ].map(({ label, value, prefix }) => (
          <div key={label} className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
            <div
              className="text-lg font-bold font-mono"
              style={{ color: label === 'P&L del día' ? pnlColor(value) : 'var(--text-primary)' }}
            >
              {loading ? '...' : `${prefix}${fmt(value)}`}
            </div>
          </div>
        ))}
      </div>

      {/* Positions table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Posiciones abiertas ({positions.length})
          </span>
        </div>
        {positions.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)', background: 'var(--bg-card)' }}>
            Sin posiciones abiertas
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ background: 'var(--bg-card)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Símbolo', 'Lotes', 'Tipo', 'Entrada', 'Actual', 'P&L', ''].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.map(p => (
                  <tr key={p.ticket} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-2.5 font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{p.symbol}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: 'var(--text-secondary)' }}>{p.volume}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-xs font-bold"
                        style={{ background: p.type === 'BUY' || p.type === '0' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: p.type === 'BUY' || p.type === '0' ? 'rgb(34,197,94)' : 'rgb(239,68,68)' }}>
                        {p.type === '0' ? 'BUY' : p.type === '1' ? 'SELL' : p.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{fmt(p.open_price, 5)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{fmt(p.current_price, 5)}</td>
                    <td className="px-4 py-2.5 font-mono font-semibold" style={{ color: pnlColor(p.profit) }}>
                      {fmt(p.profit)}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => handleClose(p.ticket)}
                        disabled={closingTicket === String(p.ticket)}
                        className="px-2 py-1 rounded text-xs border transition-colors disabled:opacity-40"
                        style={{ border: '1px solid rgba(239,68,68,0.4)', color: 'rgb(239,68,68)' }}
                      >
                        {closingTicket === String(p.ticket) ? '...' : 'Cerrar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showOrderModal && (
        <MT5OrderModal
          onClose={() => setShowOrderModal(false)}
          onSuccess={() => { setShowOrderModal(false); fetchData() }}
        />
      )}
    </div>
  )
}
