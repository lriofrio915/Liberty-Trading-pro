'use client'

import { useState } from 'react'
import MT5Wizard from './components/MT5Wizard'
import MT5Dashboard from './components/MT5Dashboard'
import IBKRSetupForm from './components/IBKRSetupForm'
import IBKRDashboard from './components/IBKRDashboard'

interface BrokerConn {
  id: string
  brokerType: string
  mt5TunnelUrl: string | null
  mt5AccountNumber: string | null
  ibkrHost: string | null
  ibkrPort: number | null
  ibkrClientId: number
  ibkrAccountId: string | null
  isActive: boolean
  lastConnectedAt: string | null
  lastStatus: string
  maxOrderValueUsd: number
}

type Tab = 'mt5' | 'ibkr'

export default function BrokersClient({
  initialConnections,
}: {
  initialConnections: BrokerConn[]
}) {
  const [tab, setTab] = useState<Tab>('mt5')
  const [connections, setConnections] = useState<BrokerConn[]>(initialConnections)

  const mt5 = connections.find(c => c.brokerType === 'mt5') ?? null
  const ibkr = connections.find(c => c.brokerType === 'ibkr') ?? null

  const mt5Connected = mt5?.isActive && mt5?.lastStatus === 'connected'
  const ibkrConnected = ibkr?.isActive && ibkr?.lastStatus === 'connected'

  const refresh = async () => {
    const res = await fetch('/api/brokers/connections')
    if (res.ok) setConnections(await res.json())
  }

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">
          <span className="gradient-gold">Brokers Conectados</span>
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Conecta tu broker para ejecutar señales directamente desde Liberty.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-8 w-fit" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {(['mt5', 'ibkr'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={
              tab === t
                ? { background: 'var(--gold-dark)', color: '#000' }
                : { color: 'var(--text-secondary)' }
            }
          >
            {t === 'mt5' ? (
              <span className="flex items-center gap-2">
                {mt5Connected && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                MT5
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {ibkrConnected && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                IBKR
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'mt5' && (
        mt5Connected
          ? <MT5Dashboard connection={mt5!} onDisconnect={refresh} />
          : <MT5Wizard connection={mt5} onConfigured={refresh} />
      )}

      {tab === 'ibkr' && (
        ibkrConnected
          ? <IBKRDashboard connection={ibkr!} onDisconnect={refresh} />
          : <IBKRSetupForm connection={ibkr} onConfigured={refresh} />
      )}
    </div>
  )
}
