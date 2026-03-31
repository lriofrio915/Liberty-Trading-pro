'use client'

import { useEffect, useState, useCallback } from 'react'

interface PriceItem {
  symbol: string
  name: string
  price: number
  change: number
  changePct: number
  up: boolean
}

const TICKER_SYMBOLS = ['NQ=F', 'BTC/USD', 'ETH/USD', 'GC=F', 'CL=F', 'EURUSD=X']

function formatPrice(symbol: string, price: number): string {
  if (!price || isNaN(price)) return '—'
  if (symbol.includes('USD') && price > 100) return price.toLocaleString('en-US', { maximumFractionDigits: 2 })
  if (symbol === 'EURUSD=X' || symbol.includes('EUR/USD')) return price.toFixed(4)
  return price.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export default function TickerBar() {
  const [prices, setPrices] = useState<PriceItem[]>([])
  const [lastPrices, setLastPrices] = useState<PriceItem[]>([])

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/prices')
      if (!res.ok) return
      const data = await res.json()
      if (data.prices?.length) {
        setLastPrices(data.prices)
        setPrices(data.prices)
      }
    } catch {
      // Show last known prices on error
      if (lastPrices.length) setPrices(lastPrices)
    }
  }, [lastPrices])

  useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 60_000)
    return () => clearInterval(interval)
  }, [fetchPrices])

  // Show placeholder while loading
  const display = prices.length > 0 ? [...prices, ...prices] : []

  if (display.length === 0) {
    return (
      <div className="ticker-wrap py-2 z-40 relative">
        <div className="flex items-center justify-center gap-8 px-6 py-1">
          {TICKER_SYMBOLS.map((s) => (
            <div key={s} className="flex items-center gap-2 opacity-30 animate-pulse">
              <span className="font-mono-custom text-[10px] text-[var(--text-muted)] tracking-widest uppercase">{s}</span>
              <span className="font-mono-custom text-sm text-[var(--text-primary)]">—</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="ticker-wrap py-2 z-40 relative overflow-hidden">
      <div className="ticker-track">
        {display.map((t, i) => (
          <div key={i} className="inline-flex items-center gap-3 px-6 border-r border-[var(--border)] shrink-0">
            <span className="font-mono-custom text-[10px] text-[var(--text-muted)] tracking-widest uppercase whitespace-nowrap">
              {t.name}
            </span>
            <span className="font-mono-custom text-sm font-medium text-[var(--text-primary)] whitespace-nowrap">
              {formatPrice(t.symbol, t.price)}
            </span>
            <span className={`font-mono-custom text-[11px] font-medium whitespace-nowrap ${t.up ? 'positive' : 'negative'}`}>
              {t.changePct >= 0 ? '+' : ''}{t.changePct.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
