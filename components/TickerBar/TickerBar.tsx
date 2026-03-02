'use client'

const TICKERS = [
  { symbol: 'NQ1!', name: 'Nasdaq Fut', value: '21,847.50', change: '+0.42%', up: true },
  { symbol: 'ES1!', name: 'S&P 500 Fut', value: '5,923.25', change: '+0.31%', up: true },
  { symbol: 'BTC/USD', name: 'Bitcoin', value: '94,821.00', change: '+1.87%', up: true },
  { symbol: 'GC1!', name: 'Gold Fut', value: '3,124.40', change: '+0.15%', up: true },
  { symbol: 'CL1!', name: 'WTI Crude', value: '78.34', change: '-0.22%', up: false },
  { symbol: 'EUR/USD', name: 'Euro Dollar', value: '1.0847', change: '-0.09%', up: false },
  { symbol: 'NQ1!', name: 'Nasdaq Fut', value: '21,847.50', change: '+0.42%', up: true },
  { symbol: 'ES1!', name: 'S&P 500 Fut', value: '5,923.25', change: '+0.31%', up: true },
  { symbol: 'BTC/USD', name: 'Bitcoin', value: '94,821.00', change: '+1.87%', up: true },
  { symbol: 'GC1!', name: 'Gold Fut', value: '3,124.40', change: '+0.15%', up: true },
  { symbol: 'CL1!', name: 'WTI Crude', value: '78.34', change: '-0.22%', up: false },
  { symbol: 'EUR/USD', name: 'Euro Dollar', value: '1.0847', change: '-0.09%', up: false },
]

export default function TickerBar() {
  return (
    <div className="ticker-wrap py-2 z-40 relative">
      <div className="ticker-track">
        {TICKERS.map((t, i) => (
          <div key={i} className="inline-flex items-center gap-3 px-6 border-r border-[var(--border)]">
            <span className="font-mono-custom text-[10px] text-[var(--text-muted)] tracking-widest uppercase">
              {t.symbol}
            </span>
            <span className="font-mono-custom text-sm font-medium text-[var(--text-primary)]">
              {t.value}
            </span>
            <span className={`font-mono-custom text-[11px] font-medium ${t.up ? 'positive' : 'negative'}`}>
              {t.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
