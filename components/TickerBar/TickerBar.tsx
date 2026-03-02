'use client'

import { useEffect, useRef } from 'react'

export default function TickerBar() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    // Avoid double-init on hot reload
    if (containerRef.current.querySelector('iframe')) return

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: 'CME_MINI:NQ1!', title: 'Nasdaq Fut' },
        { proName: 'CME_MINI:MNQ1!', title: 'Micro NQ' },
        { proName: 'COMEX:GC1!', title: 'Gold' },
        { proName: 'NYMEX:CL1!', title: 'WTI Crude' },
        { proName: 'BITSTAMP:BTCUSD', title: 'Bitcoin' },
        { proName: 'FX:EURUSD', title: 'EUR/USD' },
        { proName: 'FX:USDCLP', title: 'USD/CLP' },
      ],
      showSymbolLogo: false,
      isTransparent: true,
      displayMode: 'adaptive',
      colorTheme: 'dark',
      locale: 'es',
    })
    containerRef.current.appendChild(script)
  }, [])

  return (
    <div className="ticker-wrap py-1 z-40 relative overflow-hidden">
      <div className="tradingview-widget-container" ref={containerRef}>
        <div className="tradingview-widget-container__widget" />
      </div>
    </div>
  )
}
