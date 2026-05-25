'use client'

export interface IntradayPick {
  id: string
  ticker: string
  direction: string
  precioEntrada: number
  precioObjetivo: number | null
  stopLoss: number | null
  description: string | null
  publishedAt: Date
}

export default function IntradayPicksTable({ picks }: { picks: IntradayPick[] }) {
  if (!picks.length) {
    return (
      <div className="rounded-xl border p-6 text-center mb-6" style={{ borderColor: 'rgba(251,146,60,0.2)', background: 'rgba(251,146,60,0.03)' }}>
        <p className="text-[10px] font-mono tracking-widest mb-1 text-orange-400">AGENTE INTRADAY</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sin picks intraday hoy — mercado sin señales o cron aún no ejecutado.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border overflow-hidden mb-6" style={{ borderColor: 'rgba(251,146,60,0.25)' }}>
      <div className="px-5 py-3 flex items-center gap-3" style={{ background: 'rgba(251,146,60,0.07)', borderBottom: '1px solid rgba(251,146,60,0.15)' }}>
        <span className="text-base">⚡</span>
        <p className="text-[10px] font-mono tracking-widest font-bold text-orange-400">AGENTE INTRADAY</p>
        <span className="ml-auto text-[9px] font-mono px-2 py-0.5 rounded-full border border-orange-500/40 text-orange-400">
          {picks.length} PICK{picks.length !== 1 ? 'S' : ''} HOY
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(251,146,60,0.1)', background: 'rgba(0,0,0,0.2)' }}>
              {['TICKER', 'DIRECCIÓN', 'ENTRADA', 'OBJETIVO', 'STOP', 'ANÁLISIS', 'HORA'].map(h => (
                <th key={h} className="px-4 py-2 text-left font-mono text-[9px] tracking-widest" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {picks.map(p => {
              const isLong = p.direction === 'COMPRA'
              const hora = new Date(p.publishedAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil' })
              const pnlPct = p.precioObjetivo && p.precioEntrada
                ? ((Math.abs(p.precioObjetivo - p.precioEntrada) / p.precioEntrada) * 100).toFixed(1)
                : null

              return (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(251,146,60,0.06)' }} className="hover:bg-orange-500/5 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-xs" style={{ color: 'var(--gold)' }}>{p.ticker}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border font-bold ${
                      isLong
                        ? 'border-green-500/40 bg-green-500/10 text-green-400'
                        : 'border-red-500/40 bg-red-500/10 text-red-400'
                    }`}>
                      {isLong ? '↑ LARGO' : '↓ CORTO'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-primary)' }}>
                    ${p.precioEntrada.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-green-400">
                    {p.precioObjetivo ? `$${p.precioObjetivo.toFixed(2)}` : '—'}
                    {pnlPct && <span className="ml-1 text-[9px] opacity-60">(+{pnlPct}%)</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-red-400">
                    {p.stopLoss ? `$${p.stopLoss.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <span className="text-[9px] truncate block" style={{ color: 'var(--text-muted)' }}>
                      {p.description?.replace(/^MAIA intraday — /, '') ?? ''}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[9px]" style={{ color: 'var(--text-muted)' }}>
                    {hora}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
