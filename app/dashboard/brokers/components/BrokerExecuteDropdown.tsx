'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import MT5OrderModal from './MT5OrderModal'
import IBKROrderModal from './IBKROrderModal'

export interface SignalPayload {
  ticker: string
  direction: 'BUY' | 'SELL' | 'COMPRA' | 'VENTA'
  source: string
  signalData?: unknown
}

interface BrokerConn {
  id: string
  brokerType: string
  mt5AccountNumber: string | null
  ibkrAccountId: string | null
  isActive: boolean
  lastStatus: string
}

function normalizeSide(direction: string): 'BUY' | 'SELL' {
  const d = direction.toUpperCase()
  if (d === 'COMPRA' || d === 'BUY') return 'BUY'
  return 'SELL'
}

export default function BrokerExecuteDropdown({ signal }: { signal: SignalPayload }) {
  const [open, setOpen] = useState(false)
  const [connections, setConnections] = useState<BrokerConn[]>([])
  const [loading, setLoading] = useState(false)
  const [activeBroker, setActiveBroker] = useState<'mt5' | 'ibkr' | null>(null)
  const [success, setSuccess] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = async () => {
    setOpen(o => !o)
    if (!open && connections.length === 0) {
      setLoading(true)
      try {
        const res = await fetch('/api/brokers/connections')
        if (res.ok) setConnections(await res.json())
      } finally {
        setLoading(false)
      }
    }
  }

  const mt5 = connections.find(c => c.brokerType === 'mt5' && c.isActive && c.lastStatus === 'connected')
  const ibkr = connections.find(c => c.brokerType === 'ibkr' && c.isActive && c.lastStatus === 'connected')
  const anyConnected = !!(mt5 || ibkr)

  const side = normalizeSide(signal.direction)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all"
        style={{ border: '1px solid var(--border-gold)', color: 'var(--gold)', background: 'rgba(201,168,76,0.05)' }}
      >
        <span>⚡</span>
        Ejecutar
        <span style={{ color: 'var(--text-muted)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden shadow-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', minWidth: '200px' }}
        >
          {loading ? (
            <div className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>Cargando...</div>
          ) : !anyConnected ? (
            <div className="px-4 py-3">
              <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Sin brokers conectados</div>
              <Link
                href="/dashboard/brokers"
                className="text-xs font-semibold"
                style={{ color: 'var(--gold)' }}
                onClick={() => setOpen(false)}
              >
                ⚫ Configurar broker...
              </Link>
            </div>
          ) : (
            <div className="py-1">
              <div className="px-3 py-1.5 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                {signal.ticker} — {side}
              </div>
              {mt5 && (
                <button
                  onClick={() => { setOpen(false); setActiveBroker('mt5') }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors text-left"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                  MT5 {mt5.mt5AccountNumber ? `— ${mt5.mt5AccountNumber}` : ''}
                </button>
              )}
              {ibkr && (
                <button
                  onClick={() => { setOpen(false); setActiveBroker('ibkr') }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors text-left"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                  IBKR {ibkr.ibkrAccountId ? `— ${ibkr.ibkrAccountId}` : ''}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {activeBroker === 'mt5' && (
        <MT5OrderModal
          onClose={() => setActiveBroker(null)}
          onSuccess={() => { setActiveBroker(null); setSuccess(true); setTimeout(() => setSuccess(false), 3000) }}
          prefill={{ symbol: signal.ticker, side, signalSource: signal.source, signalData: signal.signalData }}
        />
      )}

      {activeBroker === 'ibkr' && (
        <IBKROrderModal
          onClose={() => setActiveBroker(null)}
          onSuccess={() => { setActiveBroker(null); setSuccess(true); setTimeout(() => setSuccess(false), 3000) }}
          prefill={{ symbol: signal.ticker, side, signalSource: signal.source, signalData: signal.signalData }}
        />
      )}

      {success && (
        <div
          className="absolute right-0 top-full mt-1 z-50 rounded-lg px-3 py-2 text-xs font-semibold"
          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: 'rgb(34,197,94)', whiteSpace: 'nowrap' }}
        >
          ✓ Orden enviada
        </div>
      )}
    </div>
  )
}
