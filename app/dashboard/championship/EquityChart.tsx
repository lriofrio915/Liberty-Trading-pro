'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface EquityPoint {
  fecha: string
  equity: number
  pnl: number
}

export default function EquityChart({ data }: { data: EquityPoint[] }) {
  if (data.length < 2) return null
  return (
    <div>
      <div className="label-mono text-[9px] mb-2">Equity Curve</div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <XAxis dataKey="fecha" hide />
          <YAxis hide />
          <Tooltip
            formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Equity']}
            contentStyle={{
              background: '#111',
              border: '1px solid #C9A84C',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#999', fontSize: '11px' }}
            itemStyle={{ color: '#C9A84C' }}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="equity"
            stroke="#C9A84C"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#C9A84C', stroke: '#111' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
