'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer, ReferenceLine,
} from 'recharts'

interface MonthData {
  month: string
  pnl: number
  trades: number
  wins: number
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as MonthData
  const wr = d.trades > 0 ? Math.round((d.wins / d.trades) * 100) : 0
  const pos = d.pnl >= 0
  return (
    <div style={{
      background: '#111', border: '1px solid #222', borderRadius: 10,
      padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ color: '#888', marginBottom: 6, fontFamily: 'monospace', letterSpacing: 1 }}>{label}</div>
      <div style={{ color: pos ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: 16, fontFamily: 'Georgia, serif' }}>
        {pos ? '+' : ''}{d.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </div>
      <div style={{ color: '#555', marginTop: 4 }}>{d.trades} trades · {wr}% win rate</div>
    </div>
  )
}

export default function PublicChart({ data }: { data: MonthData[] }) {
  if (!data || data.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
        <XAxis
          dataKey="month"
          tick={{ fill: '#444', fontSize: 10, fontFamily: 'monospace' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#444', fontSize: 10, fontFamily: 'monospace' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v =>
            Math.abs(v) >= 1000
              ? `${v >= 0 ? '+' : '-'}$${Math.round(Math.abs(v) / 1000)}k`
              : `${v >= 0 ? '+' : ''}$${Math.round(v)}`
          }
          width={52}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
