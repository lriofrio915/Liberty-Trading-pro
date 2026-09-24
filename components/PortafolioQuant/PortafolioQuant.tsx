'use client'

import { useMemo, useState } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import data from '@/lib/portafolio/portafolio.json'

/**
 * Portafolio comunitario — backtest conjunto de las 6 estrategias MNQ.
 *
 * Datos estáticos generados desde el proyecto Emporium Quant Desk
 * (public/estrategias/data/*.json). Para actualizarlos, regenerar
 * lib/portafolio/portafolio.json con el mismo script — este componente no
 * calcula métricas, solo las presenta.
 */

type Punto = { fecha: string; valor: number }
type Regimen = { operaciones: number; neto: number; profitFactor: number; tStat: number; porOperacion: number }
type Estrategia = {
  slug: string; nombre: string; neto: number; drawdown: number; netoSobreDrawdown: number
  calmar: number; operaciones: number; porcentajeDelNeto: number; profitFactor: number
  aciertos: number; tStat: number; anios: number; netoPorAnio: number
  regimen: { corte: string; anterior: Regimen; posterior: Regimen }
}

const R = data.resumen
const ESTRATEGIAS = data.estrategias as Estrategia[]
const CURVAS = data.curvasIndividuales as { slug: string; nombre: string; equity: Punto[] }[]

const usd = (v: number, dec = 0) =>
  `${v < 0 ? '−' : ''}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })}`
const usdK = (v: number) => `${v < 0 ? '−' : ''}$${(Math.abs(v) / 1000).toFixed(Math.abs(v) >= 10_000 ? 0 : 1)}k`
const fechaCorta = (f: string) => {
  const [y, m] = f.split('-')
  return `${['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][Number(m) - 1]} ${y}`
}

const AXIS = { fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }
const TOOLTIP_STYLE = {
  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
  fontSize: 12, color: 'var(--text-primary)',
}

// ── Piezas ────────────────────────────────────────────────────────────────────

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'up' | 'down' }) {
  const color = tone === 'up' ? 'var(--green)' : tone === 'down' ? 'var(--red)' : 'var(--text-primary)'
  return (
    <div className="card py-4">
      <div className="label-mono text-[10px] mb-1.5">{label}</div>
      <div className="text-2xl font-bold tabular-nums tracking-tight" style={{ color }}>{value}</div>
      {hint && <div className="text-[11px] text-[var(--text-muted)] mt-1 leading-snug">{hint}</div>}
    </div>
  )
}

function Panel({ title, subtitle, children, className = '' }: {
  title: string; subtitle?: string; children: React.ReactNode; className?: string
}) {
  return (
    <section className={`card p-5 ${className}`}>
      <h3 className="text-sm font-bold text-[var(--text-primary)]">{title}</h3>
      {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5 mb-4 leading-relaxed">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </section>
  )
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function PortafolioQuant() {
  const [vista, setVista] = useState<'neto' | 'pf'>('neto')

  // Curva y drawdown comparten eje X (sincronizados por syncId), cada una en su gráfica.
  const equity = data.equity as Punto[]
  const drawdown = data.drawdown as Punto[]
  const anual = data.anual.map(a => ({ anio: a.anio, pnl: a.pnl }))
  const maxIndividual = Math.max(...CURVAS.flatMap(c => c.equity.map(p => p.valor)))
  const minIndividual = Math.min(0, ...CURVAS.flatMap(c => c.equity.map(p => p.valor)))

  const regimen = useMemo(() => ESTRATEGIAS.map(e => ({
    nombre: e.nombre,
    antes: vista === 'neto' ? e.regimen.anterior.neto : e.regimen.anterior.profitFactor,
    despues: vista === 'neto' ? e.regimen.posterior.neto : e.regimen.posterior.profitFactor,
  })), [vista])

  const fmtRegimen = (v: number) => (vista === 'neto' ? usdK(v) : v.toFixed(2))

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="label-mono text-[10px] text-[var(--gold)] mb-1">Portafolio comunitario · trading cuantitativo</div>
          <h2 className="text-2xl font-black text-[var(--text-primary)]">
            6 estrategias, <span className="gradient-gold">un solo portafolio</span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-2xl leading-relaxed">
            Backtest conjunto en MNQ, 1 contrato por estrategia, con comisiones y 2 ticks de deslizamiento ·{' '}
            {fechaCorta(R.desde)} – {fechaCorta(R.hasta)} ({R.mesesTotales} meses).
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Kpi label="Beneficio neto" value={usd(R.neto)} hint={`${usd(R.porAnio)} por año`} tone="up" />
        <Kpi label="Drawdown máximo" value={usd(R.drawdown)} hint={`El ${R.fechaDrawdown.split('-').reverse().join('/')}`} tone="down" />
        <Kpi label="Neto / Drawdown" value={R.netoSobreDrawdown.toFixed(1)} hint="Cuánto gana por cada $ de caída" />
        <Kpi label="Calmar" value={R.calmar.toFixed(2)} hint="Retorno anual ÷ peor caída" />
        <Kpi label="Meses en positivo" value={`${R.mesesPositivos}%`} hint={`${R.mesesEnPositivo} de ${R.mesesTotales} meses`} />
        <Kpi label="Operaciones" value={R.operaciones.toLocaleString('en-US')} hint={`t-stat ${R.tStat} · ${R.estrategias} estrategias`} />
      </div>

      {/* Curva de capital + drawdown */}
      <Panel title="Curva de capital del portafolio" subtitle="Beneficio acumulado de las 6 estrategias operando juntas. Debajo, la distancia al máximo anterior (drawdown).">
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equity} syncId="portafolio" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pqEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-accent)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--chart-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="fecha" tick={AXIS} tickLine={false} axisLine={{ stroke: 'var(--chart-grid)' }}
                minTickGap={48} tickFormatter={f => f.slice(0, 4)} />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} width={48} tickFormatter={usdK} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={l => fechaCorta(String(l))}
                formatter={(v) => [usd(Number(v)), 'Acumulado']}
                cursor={{ stroke: 'var(--text-muted)', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="valor" stroke="var(--chart-accent)" strokeWidth={2}
                fill="url(#pqEquity)" dot={false} activeDot={{ r: 4, stroke: 'var(--bg-card)', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ height: 110 }} className="mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={drawdown} syncId="portafolio" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="fecha" tick={AXIS} tickLine={false} axisLine={{ stroke: 'var(--chart-grid)' }}
                minTickGap={48} tickFormatter={f => f.slice(0, 4)} />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} width={48} tickFormatter={usdK}
                domain={['dataMin', 0]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={l => fechaCorta(String(l))}
                formatter={(v) => [usd(Number(v)), 'Drawdown']}
                cursor={{ stroke: 'var(--text-muted)', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="valor" stroke="var(--red)" strokeWidth={1.5}
                fill="var(--red)" fillOpacity={0.12} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
        {/* P&L anual */}
        <Panel title="Resultado por año" subtitle={`${anual.filter(a => a.pnl > 0).length} de ${anual.length} años cerraron en positivo.`}>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={anual} margin={{ top: 16, right: 4, left: 0, bottom: 0 }} barCategoryGap={4}>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="anio" tick={AXIS} tickLine={false} axisLine={{ stroke: 'var(--chart-grid)' }}
                  tickFormatter={a => `'${String(a).slice(2)}`} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} width={44} tickFormatter={usdK} />
                <ReferenceLine y={0} stroke="var(--text-muted)" />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--bg-hover)' }}
                  formatter={(v) => [usd(Number(v)), 'Resultado']} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {anual.map(a => <Cell key={a.anio} fill={a.pnl >= 0 ? 'var(--green)' : 'var(--red)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Diversificación */}
        <Panel title="El poder de diversificar" subtitle="Si cada estrategia sufriera su peor caída por separado, perderías la suma. Juntas, sus caídas no coinciden.">
          <div className="space-y-4">
            {[
              { label: 'Suma de los drawdowns individuales', value: R.sumaDrawdownsIndividuales, color: 'var(--chart-context)' },
              { label: 'Drawdown real del portafolio', value: R.drawdown, color: 'var(--chart-accent)' },
            ].map(row => (
              <div key={row.label}>
                <div className="flex items-baseline justify-between text-xs mb-1.5">
                  <span className="text-[var(--text-secondary)]">{row.label}</span>
                  <span className="font-bold tabular-nums text-[var(--text-primary)]">{usd(row.value)}</span>
                </div>
                <div className="h-3 rounded-full bg-[var(--bg-hover)] overflow-hidden">
                  <div className="h-full rounded-full"
                    style={{ width: `${(row.value / R.sumaDrawdownsIndividuales) * 100}%`, background: row.color }} />
                </div>
              </div>
            ))}
            <div className="rounded-xl border border-[var(--gold-dark)] p-4 text-center" style={{ background: 'rgba(201,168,76,0.05)' }}>
              <div className="text-3xl font-bold tabular-nums text-[var(--text-primary)]">−{R.reduccionDrawdown}%</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">de caída máxima gracias a combinar las 6 estrategias</div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Estrategias por separado vs en conjunto */}
      <Panel title="Cada estrategia por separado"
        subtitle={`Por su cuenta ninguna supera un Neto/DD de ${Math.max(...ESTRATEGIAS.map(e => e.netoSobreDrawdown)).toFixed(1)}. Juntas, el portafolio llega a ${R.netoSobreDrawdown.toFixed(1)}: la columna «Mejora en conjunto» muestra cuántas veces mejor rinde cada $ de riesgo dentro del portafolio.`}>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                {['Estrategia', 'Aporte al neto', 'Neto', 'Drawdown', 'Neto/DD', 'Mejora en conjunto', 'Profit factor', 'Aciertos', 'Ops.'].map((h, i) => (
                  <th key={h} className={`label-mono text-[10px] font-normal py-2.5 ${i > 1 ? 'text-right' : ''} ${i === 1 ? 'w-40' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ESTRATEGIAS.map(e => (
                <tr key={e.slug} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-3 font-medium text-[var(--text-primary)]">{e.nombre}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-hover)] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(e.porcentajeDelNeto / 30) * 100}%`, background: 'var(--chart-accent)' }} />
                      </div>
                      <span className="text-xs tabular-nums text-[var(--text-secondary)] w-10 text-right">{e.porcentajeDelNeto}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-right tabular-nums text-[var(--text-primary)]">{usd(e.neto)}</td>
                  <td className="py-3 text-right tabular-nums text-[var(--text-secondary)]">{usd(e.drawdown)}</td>
                  <td className="py-3 text-right tabular-nums text-[var(--text-secondary)]">{e.netoSobreDrawdown.toFixed(2)}</td>
                  <td className="py-3 text-right tabular-nums font-bold text-[var(--green)]">
                    ×{(R.netoSobreDrawdown / e.netoSobreDrawdown).toFixed(1)}
                  </td>
                  <td className="py-3 text-right tabular-nums text-[var(--text-secondary)]">{e.profitFactor?.toFixed(2) ?? '—'}</td>
                  <td className="py-3 text-right tabular-nums text-[var(--text-secondary)]">{e.aciertos != null ? `${e.aciertos}%` : '—'}</td>
                  <td className="py-3 text-right tabular-nums text-[var(--text-secondary)]">{e.operaciones.toLocaleString('en-US')}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-[var(--gold-dark)]">
                <td className="py-3 font-bold text-[var(--gold)]">Portafolio conjunto</td>
                <td className="py-3 pr-4 text-xs text-[var(--text-muted)]">100%</td>
                <td className="py-3 text-right tabular-nums font-bold text-[var(--text-primary)]">{usd(R.neto)}</td>
                <td className="py-3 text-right tabular-nums font-bold text-[var(--text-primary)]">{usd(R.drawdown)}</td>
                <td className="py-3 text-right tabular-nums font-bold text-[var(--gold)]">{R.netoSobreDrawdown.toFixed(2)}</td>
                <td className="py-3 text-right text-xs text-[var(--text-muted)]">—</td>
                <td className="py-3 text-right text-xs text-[var(--text-muted)]">—</td>
                <td className="py-3 text-right text-xs text-[var(--text-muted)]">—</td>
                <td className="py-3 text-right tabular-nums font-bold text-[var(--text-primary)]">{R.operaciones.toLocaleString('en-US')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Small multiples: curva individual de cada estrategia, misma escala */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-5">
          {CURVAS.map(c => {
            const est = ESTRATEGIAS.find(e => e.slug === c.slug)
            return (
              <div key={c.slug} className="rounded-xl border border-[var(--border)] p-3">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-xs font-medium text-[var(--text-primary)] truncate">{c.nombre}</span>
                  <span className="text-xs tabular-nums text-[var(--text-secondary)]">{est ? usd(est.neto) : ''}</span>
                </div>
                <div style={{ height: 70 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={c.equity} margin={{ top: 4, right: 2, left: 2, bottom: 2 }}>
                      <YAxis hide domain={[minIndividual, maxIndividual]} />
                      <XAxis dataKey="fecha" hide />
                      <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={l => fechaCorta(String(l))}
                        formatter={(v) => [usd(Number(v)), 'Acumulado']}
                        cursor={{ stroke: 'var(--text-muted)', strokeWidth: 1 }} />
                      <Line type="monotone" dataKey="valor" stroke="var(--chart-accent)" strokeWidth={2} dot={false}
                        activeDot={{ r: 4, stroke: 'var(--bg-card)', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-[11px] text-[var(--text-muted)] mt-2">Curvas individuales en la misma escala, para comparar su peso real.</p>
      </Panel>

      {/* Régimen: antes vs después de julio 2020 */}
      <Panel title="Cómo mejoró cada estrategia"
        subtitle={`Desempeño antes y después de julio de 2020. El portafolio pasó de un Neto/DD de ${data.regimen.anterior.netoSobreDrawdown} a ${data.regimen.posterior.netoSobreDrawdown} en el régimen actual.`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: 'var(--chart-context)' }} /> Antes de jul 2020
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: 'var(--chart-accent)' }} /> Desde jul 2020
            </span>
          </div>
          <div className="flex gap-1 p-1 rounded-lg border border-[var(--border)]">
            {([['neto', 'Neto'], ['pf', 'Profit factor']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setVista(v)}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
                  vista === v ? 'bg-[var(--gold-dark)] text-black font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regimen} layout="vertical" margin={{ top: 0, right: 56, left: 0, bottom: 0 }}
              barCategoryGap={10} barGap={2}>
              <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
              <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false}
                tickFormatter={v => fmtRegimen(Number(v))} />
              <YAxis type="category" dataKey="nombre" tick={{ ...AXIS, fontSize: 11, fill: 'var(--text-secondary)' }}
                tickLine={false} axisLine={false} width={140} />
              {vista === 'pf' && <ReferenceLine x={1} stroke="var(--text-muted)" label={{ value: 'PF 1', fill: 'var(--text-muted)', fontSize: 10, position: 'top' }} />}
              {vista === 'neto' && <ReferenceLine x={0} stroke="var(--text-muted)" />}
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--bg-hover)' }}
                formatter={(v, n) => [fmtRegimen(Number(v)), n === 'antes' ? 'Antes de jul 2020' : 'Desde jul 2020']} />
              <Bar dataKey="antes" fill="var(--chart-context)" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="antes" position="right" formatter={(v: unknown) => fmtRegimen(Number(v))}
                  style={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
              </Bar>
              <Bar dataKey="despues" fill="var(--chart-accent)" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="despues" position="right" formatter={(v: unknown) => fmtRegimen(Number(v))}
                  style={{ fontSize: 10, fill: 'var(--text-primary)', fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
        Resultados de backtest (simulados) sobre datos históricos de NQ escalados a MNQ. No incluyen todos los costes
        reales ni garantizan resultados futuros. Operar futuros implica riesgo de pérdida de capital.
      </p>
    </div>
  )
}
