'use client'

import { useState } from 'react'

interface MT5OrderModalProps {
  onClose: () => void
  onSuccess: () => void
  prefill?: { symbol?: string; side?: 'BUY' | 'SELL'; signalSource?: string; signalData?: unknown }
}

const QUICK_SYMBOLS = ['EURUSD', 'GBPUSD', 'XAUUSD', 'US30', 'US500', 'BTCUSD', 'NASDAQ']
const QUICK_VOLUMES = ['0.01', '0.05', '0.10']

export default function MT5OrderModal({ onClose, onSuccess, prefill }: MT5OrderModalProps) {
  const [symbol, setSymbol] = useState(prefill?.symbol ?? '')
  const [side, setSide] = useState<'BUY' | 'SELL'>(prefill?.side ?? 'BUY')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [volume, setVolume] = useState('0.01')
  const [price, setPrice] = useState('')
  const [sl, setSl] = useState('')
  const [tp, setTp] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/brokers/mt5/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          side,
          volume: parseFloat(volume),
          order_type: orderType,
          price: price ? parseFloat(price) : undefined,
          stop_loss: sl ? parseFloat(sl) : undefined,
          take_profit: tp ? parseFloat(tp) : undefined,
          signal_source: prefill?.signalSource ?? 'manual',
          signal_data: prefill?.signalData ?? null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? data.detail ?? 'Error al ejecutar orden')
      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
      setConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            {confirm ? 'Confirmar orden' : 'Nueva orden MT5'}
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }} className="text-lg">✕</button>
        </div>

        {!confirm ? (
          <div className="space-y-4">
            {/* Symbol */}
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-muted)' }}>Símbolo</label>
              <input
                type="text"
                placeholder="EURUSD"
                value={symbol}
                onChange={e => setSymbol(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none mb-2"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SYMBOLS.map(s => (
                  <button key={s} onClick={() => setSymbol(s)}
                    className="px-2 py-1 rounded text-xs transition-colors"
                    style={symbol === s
                      ? { background: 'var(--gold-dark)', color: '#000' }
                      : { background: 'var(--border)', color: 'var(--text-secondary)' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Order type + Direction */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-muted)' }}>Tipo</label>
                <div className="flex gap-1">
                  {(['market', 'limit'] as const).map(t => (
                    <button key={t} onClick={() => setOrderType(t)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize"
                      style={orderType === t
                        ? { background: 'var(--gold-dark)', color: '#000' }
                        : { background: 'var(--border)', color: 'var(--text-secondary)' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-muted)' }}>Dirección</label>
                <div className="flex gap-1">
                  {(['BUY', 'SELL'] as const).map(d => (
                    <button key={d} onClick={() => setSide(d)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      style={side === d
                        ? { background: d === 'BUY' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', color: d === 'BUY' ? 'rgb(34,197,94)' : 'rgb(239,68,68)', border: `1px solid ${d === 'BUY' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}` }
                        : { background: 'var(--border)', color: 'var(--text-secondary)' }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Volume */}
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-muted)' }}>Volumen (lotes)</label>
              <div className="flex gap-1.5 mb-2">
                {QUICK_VOLUMES.map(v => (
                  <button key={v} onClick={() => setVolume(v)}
                    className="px-3 py-1 rounded text-xs font-mono transition-colors"
                    style={volume === v
                      ? { background: 'var(--gold-dark)', color: '#000' }
                      : { background: 'var(--border)', color: 'var(--text-secondary)' }}>
                    {v}
                  </button>
                ))}
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={volume}
                onChange={e => setVolume(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Limit price */}
            {orderType === 'limit' && (
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-muted)' }}>Precio límite</label>
                <input
                  type="number"
                  step="0.00001"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            )}

            {/* SL / TP */}
            <div className="grid grid-cols-2 gap-3">
              {[['Stop Loss', sl, setSl], ['Take Profit', tp, setTp]].map(([label, val, setter]) => (
                <div key={String(label)}>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    {String(label)} <span className="font-normal">(opcional)</span>
                  </label>
                  <input
                    type="number"
                    step="0.00001"
                    value={String(val)}
                    onChange={e => (setter as (v: string) => void)(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono"
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => { if (!symbol) { setError('Símbolo requerido'); return } setError(null); setConfirm(true) }}
              className="w-full py-2.5 rounded-lg text-sm font-bold transition-colors"
              style={{ background: 'var(--gold-dark)', color: '#000' }}
            >
              Revisar orden
            </button>
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
              {[
                ['Símbolo', symbol],
                ['Dirección', side],
                ['Tipo', orderType],
                ['Volumen', `${volume} lotes`],
                price && ['Precio límite', price],
                sl && ['Stop Loss', sl],
                tp && ['Take Profit', tp],
              ].filter(Boolean).map(([k, v]) => (
                <div key={String(k)} className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>{String(k)}</span>
                  <span className="font-semibold font-mono" style={{ color: side === 'BUY' ? 'rgb(34,197,94)' : 'rgb(239,68,68)' }}>
                    {String(v)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Al confirmar, la orden será enviada a tu MT5 de inmediato a través del EA Bridge.
            </p>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setConfirm(false)} className="flex-1 py-2 rounded-lg text-sm border transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                Cancelar
              </button>
              <button onClick={handleConfirm} disabled={loading}
                className="flex-1 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                style={{ background: side === 'BUY' ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)', color: '#fff' }}>
                {loading ? 'Enviando...' : `Confirmar ${side}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
