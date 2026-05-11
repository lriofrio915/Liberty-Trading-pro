'use client'

import { useState, useEffect, useCallback } from 'react'
import IBKROrderModal from './IBKROrderModal'

interface BrokerConn {
  id: string
  ibkrHost: string | null
  ibkrPort: number | null
  ibkrAccountId: string | null
  maxOrderValueUsd: number
}

interface Position {
  symbol: string
  secType?: string
  quantity: number
  avgCost?: number
  account?: string
}

interface AccountData {
  NetLiquidation?: string
  AvailableFunds?: string
  BuyingPower?: string
  TotalCashValue?: string
  [key: string]: string | undefined
}

export default function IBKRDashboard({
  connection,
  onDisconnect,
}: {
  connection: BrokerConn
  onDisconnect: () => void
}) {
  const [account, setAccount] = useState<AccountData | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [accRes, posRes] = await Promise.all([
        fetch('/api/brokers/ibkr/account'),
        fetch('/api/brokers/ibkr/positions'),
      ])
      if (accRes.ok) setAccount(await accRes.json())
      if (posRes.ok) setPositions(await posRes.json())
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDisconnect = async () => {
    setDisconnecting(true)
    await fetch('/api/brokers/connections/ibkr', { method: 'DELETE' })
    onDisconnect()
  }

  const fmt = (n?: string | number, decimals = 2) => {
    const num = typeof n === 'string' ? parseFloat(n) : n
    if (num == null || isNaN(num)) return '—'
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              IBKR Conectado — {connection.ibkrHost}:{connection.ibkrPort}
            </div>
            {connection.ibkrAccountId && (
              <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{connection.ibkrAccountId}</div>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Net Liquidation', key: 'NetLiquidation' },
          { label: 'Available Funds', key: 'AvailableFunds' },
          { label: 'Buying Power', key: 'BuyingPower' },
        ].map(({ label, key }) => (
          <div key={key} className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
            <div className="text-lg font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
              {loading ? '...' : `$${fmt(account?.[key])}`}
            </div>
          </div>
        ))}
      </div>

      {/* Positions table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Posiciones ({positions.length})
          </span>
        </div>
        {positions.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)', background: 'var(--bg-card)' }}>
            Sin posiciones
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ background: 'var(--bg-card)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Símbolo', 'Cantidad', 'Costo promedio'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-2.5 font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{p.symbol}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: p.quantity >= 0 ? 'rgb(34,197,94)' : 'rgb(239,68,68)' }}>
                      {p.quantity}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                      ${fmt(p.avgCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showOrderModal && (
        <IBKROrderModal
          onClose={() => setShowOrderModal(false)}
          onSuccess={() => { setShowOrderModal(false); fetchData() }}
        />
      )}
    </div>
  )
}
