'use client'

import { useState } from 'react'

interface MT5TradeModalProps {
  symbol: string
  direction: 'BUY' | 'SELL'
  onClose: () => void
  onSuccess: (trade: unknown) => void
}

export default function MT5TradeModal({ symbol, direction, onClose, onSuccess }: MT5TradeModalProps) {
  const [volume, setVolume] = useState('0.01')
  const [sl, setSl] = useState('')
  const [tp, setTp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isBuy = direction === 'BUY'

  const handleSubmit = async () => {
    const vol = parseFloat(volume)
    if (isNaN(vol) || vol <= 0) {
      setError('Volumen inválido')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/mt5/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          type: direction,
          volume: vol,
          sl: sl ? parseFloat(sl) : undefined,
          tp: tp ? parseFloat(tp) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al ejecutar operación')
      onSuccess(data.trade)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ejecutar operación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-black px-2 py-0.5 rounded-lg ${isBuy ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                {isBuy ? '▲ LONG' : '▼ SHORT'}
              </span>
              <span className="font-mono font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{symbol}</span>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Ejecutar en MT5 via MetaAPI</p>
          </div>
          <button
            onClick={onClose}
            className="text-lg leading-none"
            style={{ color: 'var(--text-muted)' }}
          >
            ×
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
              Volumen (lotes)
            </label>
            <input
              type="number"
              value={volume}
              onChange={e => setVolume(e.target.value)}
              step="0.01"
              min="0.01"
              max="100"
              className="w-full px-3 py-2 rounded-lg text-sm font-mono"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                Stop Loss
              </label>
              <input
                type="number"
                value={sl}
                onChange={e => setSl(e.target.value)}
                placeholder="Opcional"
                className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                Take Profit
              </label>
              <input
                type="number"
                value={tp}
                onChange={e => setTp(e.target.value)}
                placeholder="Opcional"
                className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isBuy
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
            }`}
          >
            {loading ? 'Ejecutando...' : `Ejecutar ${isBuy ? 'LONG' : 'SHORT'}`}
          </button>
        </div>
      </div>
    </div>
  )
}
