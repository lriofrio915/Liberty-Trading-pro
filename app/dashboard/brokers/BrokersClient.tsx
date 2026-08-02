'use client'

import { useState } from 'react'
import IBKRSetupForm from './components/IBKRSetupForm'
import IBKRDashboard from './components/IBKRDashboard'

interface BrokerConn {
  id: string
  brokerType: string
  ibkrHost: string | null
  ibkrPort: number | null
  ibkrClientId: number
  ibkrAccountId: string | null
  isActive: boolean
  lastConnectedAt: string | null
  lastStatus: string
  maxOrderValueUsd: number
}

export default function BrokersClient({
  initialConnections,
}: {
  initialConnections: BrokerConn[]
}) {
  const [connections, setConnections] = useState<BrokerConn[]>(initialConnections)

  const ibkr = connections.find(c => c.brokerType === 'ibkr') ?? null
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
          Conecta tu cuenta de Interactive Brokers para ejecutar órdenes directamente desde Liberty.
        </p>
      </div>

      {ibkrConnected
        ? <IBKRDashboard connection={ibkr!} onDisconnect={refresh} />
        : <IBKRSetupForm connection={ibkr} onConfigured={refresh} />
      }
    </div>
  )
}
