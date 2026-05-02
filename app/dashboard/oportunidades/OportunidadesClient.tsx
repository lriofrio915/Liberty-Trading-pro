'use client'

import { useState, useEffect, useRef } from 'react'

interface ReportJSON {
  ticker: string
  empresa: string
  bolsa: string
  precio_actual: string
  precio_objetivo: string
  informe_numero: string
  resumen: string
  negocio: string
  fuentes_ingresos: string[][]
  financieros: string
  valoracion: string
  factores_positivos: string[][]
  factores_riesgo: string[][]
  conclusion: string
  mes_año: string
}

interface Opportunity {
  id: string
  title: string
  ticker: string
  instrumento: string
  tipo: string
  direction: string
  precioEntrada: number
  precioObjetivo: number
  stopLoss: number
  timeframe: string
  riesgo: string
  description: string
  aiReport: string | null
  publishedAt: string
  status: string
  active: boolean
  minPlan: string
}

const STATUS_COLORS: Record<string, string> = {
  COMPRAR:            'bg-green-950 text-green-400',
  ACTIVA:             'bg-green-950 text-green-400',
  MANTENER:           'bg-yellow-950 text-yellow-400',
  OBJETIVO_ALCANZADO: 'bg-blue-950 text-blue-400',
  STOP_ACTIVADO:      'bg-red-950 text-red-400',
  CANCELADA:          'bg-gray-800 text-gray-400',
}
const STATUS_LABELS: Record<string, string> = {
  COMPRAR:            'Comprar',
  ACTIVA:             'Comprar',
  MANTENER:           'Mantener',
  OBJETIVO_ALCANZADO: 'Objetivo',
  STOP_ACTIVADO:      'Stop',
  CANCELADA:          'Cancelada',
}

const ACTIVE_STATUSES = new Set(['COMPRAR', 'MANTENER', 'ACTIVA'])

function parseReport(raw: string | null): ReportJSON | null {
  if (!raw) return null
  try { return JSON.parse(raw) as ReportJSON } catch { return null }
}

function fmtPrice(n: number): string {
  return `$${n.toFixed(2)}`
}

const TV_EXCHANGE: Record<string, string> = {
  NasdaqGS: 'NASDAQ', NasdaqGM: 'NASDAQ', NasdaqCM: 'NASDAQ',
  NASDAQ: 'NASDAQ', NYSE: 'NYSE', NYSEArca: 'NYSE', NYSEAmerican: 'AMEX',
  AMEX: 'AMEX', TSX: 'TSX', LSE: 'LSE', BME: 'BME', XETRA: 'XETR',
}

function TradingViewChart({ ticker, exchange, containerId }: {
  ticker: string
  exchange?: string
  containerId: string
}) {
  useEffect(() => {
    const ex = exchange ? (TV_EXCHANGE[exchange] ?? 'NASDAQ') : 'NASDAQ'
    const symbol = `${ex}:${ticker}`
    function initWidget() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (window as any).TradingView.widget({
        autosize: true, symbol, interval: 'D', timezone: 'America/New_York',
        theme: 'dark', style: '1', locale: 'es', enable_publishing: false,
        save_image: false, hide_side_toolbar: false, container_id: containerId,
      })
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).TradingView) {
      initWidget()
    } else {
      const script = document.createElement('script')
      script.src = 'https://s3.tradingview.com/tv.js'
      script.async = true
      script.onload = initWidget
      document.head.appendChild(script)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div style={{ height: '440px' }}>
      <div id={containerId} style={{ height: '100%' }} />
    </div>
  )
}

function printReport(opp: Opportunity) {
  const win = window.open('', '_blank')
  if (!win) return
  const r = parseReport(opp.aiReport)
  const tableRows = (rows: string[][], headerStyle = '') =>
    rows.map((row, i) =>
      `<tr style="${i === 0 ? headerStyle : ''}">${row.map(c => `<td style="padding:6px 10px;border:1px solid #ddd">${c}</td>`).join('')}</tr>`
    ).join('')
  const precioCompra = opp.precioEntrada > 0 ? opp.precioEntrada.toFixed(2) : (r?.precio_actual ?? 'N/D')
  const precioObj = opp.precioObjetivo > 0 ? opp.precioObjetivo.toFixed(2) : (r?.precio_objetivo ?? 'N/D')
  const body = r ? `
    <h2 style="color:#C9A84C;font-size:18px;margin:0 0 4px">Informe de Inversión — ${r.ticker}</h2>
    <p style="color:#555;font-size:13px;margin:0 0 20px">${r.empresa} · ${r.bolsa} · ${r.mes_año}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;border:1px solid #ddd;border-radius:8px;padding:16px;margin:0 0 24px">
      <div><div style="font-size:11px;color:#777;text-transform:uppercase">Precio de Compra</div><div style="font-size:20px;font-weight:bold">$${precioCompra}</div></div>
      <div><div style="font-size:11px;color:#777;text-transform:uppercase">Precio Objetivo</div><div style="font-size:20px;font-weight:bold;color:#16a34a">$${precioObj}</div></div>
    </div>
    <h3 style="font-size:13px;text-transform:uppercase;color:#C9A84C;letter-spacing:.05em;margin:24px 0 8px">Resumen Ejecutivo</h3>
    <p style="font-size:14px;line-height:1.7;margin:0 0 20px">${r.resumen}</p>
    <h3 style="font-size:13px;text-transform:uppercase;color:#C9A84C;letter-spacing:.05em;margin:24px 0 8px">El Negocio</h3>
    <p style="font-size:14px;line-height:1.7;margin:0 0 20px;white-space:pre-wrap">${r.negocio}</p>
    <h3 style="font-size:13px;text-transform:uppercase;color:#C9A84C;letter-spacing:.05em;margin:24px 0 8px">Histórico Financiero</h3>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px;font-size:13px">${tableRows(r.fuentes_ingresos, 'background:#f5f5f5;font-weight:bold')}</table>
    <h3 style="font-size:13px;text-transform:uppercase;color:#C9A84C;letter-spacing:.05em;margin:24px 0 8px">Análisis Financiero</h3>
    <p style="font-size:14px;line-height:1.7;margin:0 0 20px;white-space:pre-wrap">${r.financieros}</p>
    <h3 style="font-size:13px;text-transform:uppercase;color:#C9A84C;letter-spacing:.05em;margin:24px 0 8px">Valoración y Consenso</h3>
    <p style="font-size:14px;line-height:1.7;margin:0 0 20px;white-space:pre-wrap">${r.valoracion}</p>
    <h3 style="font-size:13px;text-transform:uppercase;color:#16a34a;letter-spacing:.05em;margin:24px 0 8px">Factores Positivos</h3>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px;font-size:13px">${tableRows(r.factores_positivos)}</table>
    <h3 style="font-size:13px;text-transform:uppercase;color:#dc2626;letter-spacing:.05em;margin:24px 0 8px">Factores de Riesgo</h3>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px;font-size:13px">${tableRows(r.factores_riesgo)}</table>
    <h3 style="font-size:13px;text-transform:uppercase;color:#C9A84C;letter-spacing:.05em;margin:24px 0 8px">Conclusión y Recomendación</h3>
    <p style="font-size:14px;line-height:1.7;margin:0 0 20px;white-space:pre-wrap">${r.conclusion}</p>
  ` : `<div style="white-space:pre-wrap;font-size:14px;line-height:1.8">${opp.aiReport ?? opp.description}</div>`
  win.document.write(`<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <title>Informe — ${opp.ticker}</title>
    <style>
      body{font-family:Georgia,serif;max-width:820px;margin:40px auto;padding:0 24px;color:#111;line-height:1.7}
      .footer{margin-top:40px;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:16px}
      @media print{body{margin:0}}
    </style>
  </head><body>
    ${body}
    <div class="footer">Liberty Trading Pro · ${new Date(opp.publishedAt).toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'})} · Análisis generado con IA · Liberty Trading Club</div>
  </body></html>`)
  win.document.close()
  win.print()
}

// ─── Inline price input cell ───────────────────────────────────────────────────
function PriceCell({ value, onSave, isAdmin }: {
  value: number
  onSave: (v: number) => void
  isAdmin: boolean
}) {
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function commit() {
    const raw = inputRef.current?.value
    if (raw === undefined) return
    const v = parseFloat(raw)
    if (isNaN(v) || v === value) return
    setSaving(true)
    await onSave(v)
    setSaving(false)
  }

  if (!isAdmin) {
    return (
      <span className="font-mono text-sm text-[var(--text-primary)]">
        {value > 0 ? fmtPrice(value) : '—'}
      </span>
    )
  }

  return (
    <input
      ref={inputRef}
      type="number"
      step="0.01"
      min="0"
      defaultValue={value > 0 ? value : ''}
      disabled={saving}
      placeholder="0.00"
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') { e.currentTarget.blur() } }}
      className="w-24 bg-transparent border border-[var(--border)] rounded px-2 py-1 text-sm font-mono text-[var(--text-primary)] focus:border-[var(--gold)] focus:outline-none disabled:opacity-40 transition-colors"
    />
  )
}

// ─── Report Modal ──────────────────────────────────────────────────────────────
function ReportModal({ opp, livePrices, onClose, onRegenerate }: {
  opp: Opportunity
  livePrices: Record<string, number>
  onClose: () => void
  onRegenerate: (updated: Opportunity) => void
}) {
  const [regenerating, setRegenerating] = useState(false)
  const [regenError, setRegenError] = useState<string | null>(null)
  const r = parseReport(opp.aiReport)

  const precioActualLive = livePrices[opp.ticker]
  const precioActualDisplay = precioActualLive
    ? fmtPrice(precioActualLive)
    : r?.precio_actual
      ? `$${r.precio_actual.replace(/[^0-9.]/g, '')}`
      : '—'
  const precioObjetivoDisplay = opp.precioObjetivo > 0 ? fmtPrice(opp.precioObjetivo) : (r?.precio_objetivo ?? 'N/D')
  const precioCompraDisplay = opp.precioEntrada > 0 ? fmtPrice(opp.precioEntrada) : '—'

  async function handleRegenerate() {
    setRegenerating(true)
    setRegenError(null)
    try {
      const res = await fetch(`/api/picks/${opp.id}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al generar informe')
      if (data.opportunity) onRegenerate(data.opportunity)
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center overflow-y-auto p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="max-w-3xl w-full my-8 card text-sm space-y-5"
        style={{ background: 'var(--bg-card)' }}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-black text-[var(--gold)]">{opp.ticker}</span>
            <span className="ml-3 text-[var(--text-secondary)] font-semibold">{opp.title}</span>
          </div>
          <div className="flex items-center gap-3">
            {opp.aiReport && (
              <button
                onClick={() => printReport(opp)}
                className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                ↓ Descargar PDF
              </button>
            )}
            <button
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-lg leading-none transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {!opp.aiReport ? (
          <div className="flex flex-col gap-2 items-start">
            <p className="text-[var(--text-muted)] text-xs">Este activo aún no tiene informe generado.</p>
            <button
              disabled={regenerating}
              onClick={handleRegenerate}
              className="text-xs font-mono text-[var(--gold)] hover:text-[var(--gold-light)] transition-colors disabled:opacity-50"
            >
              {regenerating ? '⏳ Generando informe...' : '🔄 Generar Informe'}
            </button>
            {regenError && <p className="text-[10px] text-red-400 font-mono">{regenError}</p>}
          </div>
        ) : !r ? (
          <div className="whitespace-pre-wrap text-[var(--text-secondary)] leading-relaxed max-h-96 overflow-y-auto"
            style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '16px' }}>
            {opp.aiReport}
          </div>
        ) : (
          <>
            {/* Precios: compra / actual / objetivo */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>P. Compra</div>
                <div className="text-lg font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{precioCompraDisplay}</div>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>P. Actual</div>
                <div className="text-lg font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{precioActualDisplay}</div>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>P. Objetivo</div>
                <div className="text-lg font-bold font-mono text-green-400">{precioObjetivoDisplay}</div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>Resumen Ejecutivo</p>
              <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{r.resumen}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>El Negocio</p>
              <p className="leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{r.negocio}</p>
            </div>

            {r.fuentes_ingresos?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>Histórico Financiero</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    {r.fuentes_ingresos.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i === 0 ? 'var(--bg-hover)' : 'transparent' }}>
                        {row.map((cell, j) => (
                          <td key={j} className={`px-3 py-2 ${i === 0 ? 'font-bold' : ''}`} style={{ color: i === 0 ? 'var(--text-muted)' : 'var(--text-secondary)' }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </table>
                </div>
              </div>
            )}

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>Análisis Financiero</p>
              <p className="leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{r.financieros}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>Valoración y Consenso</p>
              <p className="leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{r.valoracion}</p>
            </div>

            {r.factores_positivos?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-green-400">Factores Positivos</p>
                <div className="space-y-2">
                  {r.factores_positivos.map(([titulo, desc], i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-green-400 flex-shrink-0">▲</span>
                      <div><span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{titulo}:</span>{' '}
                        <span style={{ color: 'var(--text-secondary)' }}>{desc}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {r.factores_riesgo?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-red-400">Factores de Riesgo</p>
                <div className="space-y-2">
                  {r.factores_riesgo.map(([titulo, desc], i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-red-400 flex-shrink-0">▼</span>
                      <div><span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{titulo}:</span>{' '}
                        <span style={{ color: 'var(--text-secondary)' }}>{desc}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>Conclusión y Recomendación</p>
              <p className="leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{r.conclusion}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--gold)' }}>
                Gráfica en Tiempo Real — {opp.ticker}
              </p>
              <TradingViewChart ticker={opp.ticker} exchange={r.bolsa} containerId={`tv_modal_${opp.id}`} />
            </div>

            <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
              Liberty Trading Club · Informe generado con IA · {r.mes_año}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Opportunities table ───────────────────────────────────────────────────────
function OppTable({ opps, isAdmin, livePrices, onDelete, onStatusChange, onPriceUpdate, onOpenModal }: {
  opps: Opportunity[]
  isAdmin: boolean
  livePrices: Record<string, number>
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: string) => void
  onPriceUpdate: (id: string, changes: Partial<{ precioEntrada: number; precioObjetivo: number }>) => Promise<void>
  onOpenModal: (opp: Opportunity) => void
}) {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-[var(--border)]" style={{ background: 'var(--bg-secondary)' }}>
            {['Ticker', 'Empresa', 'Fecha', 'P.Compra', 'P.Actual', 'P.Obj.', 'Rendim.', 'Estado', 'Acc.'].map(col => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest whitespace-nowrap"
                style={{ color: 'var(--text-muted)' }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {opps.map((opp, idx) => {
            const precioActual = livePrices[opp.ticker] ?? null
            const rendimiento = (precioActual !== null && opp.precioEntrada > 0)
              ? ((precioActual - opp.precioEntrada) / opp.precioEntrada) * 100
              : null

            return (
              <tr
                key={opp.id}
                className="border-b border-[var(--border)] transition-colors"
                style={{ opacity: !opp.active && isAdmin ? 0.6 : 1 }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Ticker */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-black text-sm" style={{ color: 'var(--gold)' }}>{opp.ticker}</span>
                  <span className="ml-1 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>#{idx + 1}</span>
                </td>

                {/* Empresa */}
                <td className="px-4 py-3 max-w-[180px]">
                  <span className="text-sm font-medium truncate block" style={{ color: 'var(--text-primary)' }} title={opp.title}>
                    {opp.title}
                  </span>
                </td>

                {/* Fecha */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(opp.publishedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </td>

                {/* P.Compra */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <PriceCell
                    value={opp.precioEntrada}
                    isAdmin={isAdmin}
                    onSave={v => onPriceUpdate(opp.id, { precioEntrada: v })}
                  />
                </td>

                {/* P.Actual — precio en tiempo real de Yahoo Finance */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                    {precioActual !== null ? fmtPrice(precioActual) : '—'}
                  </span>
                </td>

                {/* P.Obj. */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <PriceCell
                    value={opp.precioObjetivo}
                    isAdmin={isAdmin}
                    onSave={v => onPriceUpdate(opp.id, { precioObjetivo: v })}
                  />
                </td>

                {/* Rendim. */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {rendimiento !== null ? (
                    <span className={`font-mono text-sm font-semibold ${rendimiento >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {rendimiento >= 0 ? '+' : ''}{rendimiento.toFixed(2)}%
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>

                {/* Estado */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {isAdmin ? (
                    <select
                      value={opp.status}
                      onChange={e => onStatusChange(opp.id, e.target.value)}
                      className="text-xs rounded-lg px-2 py-1 border border-[var(--border)] focus:outline-none focus:border-[var(--gold)] transition-colors"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                    >
                      <option value="COMPRAR">Comprar</option>
                      <option value="MANTENER">Mantener</option>
                      <option value="OBJETIVO_ALCANZADO">Objetivo alcanzado</option>
                      <option value="STOP_ACTIVADO">Stop activado</option>
                      <option value="CANCELADA">Cancelada</option>
                    </select>
                  ) : (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[opp.status] ?? STATUS_COLORS.COMPRAR}`}>
                      {STATUS_LABELS[opp.status] ?? opp.status}
                    </span>
                  )}
                </td>

                {/* Acciones */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onOpenModal(opp)}
                      title="Ver informe"
                      className="transition-colors hover:opacity-80"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>

                    {opp.aiReport && (
                      <button
                        onClick={() => printReport(opp)}
                        title="Descargar PDF"
                        className="transition-colors text-green-600 hover:text-green-400"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => onDelete(opp.id)}
                        title="Eliminar"
                        className="transition-colors text-red-800 hover:text-red-400"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/>
                          <path d="M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

interface Suggestion { symbol: string; name: string; exchange: string }

// ─── Admin form ───────────────────────────────────────────────────────────────
function AdminForm({ onCreated }: { onCreated: (opp: Opportunity) => void }) {
  const [open, setOpen]               = useState(false)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [query, setQuery]             = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [searching, setSearching]     = useState(false)
  const [selected, setSelected]       = useState<Suggestion | null>(null)
  const [precioCompra, setPrecioCompra]   = useState('')
  const [precioObjetivo, setPrecioObjetivo] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setSuggestions([])
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = query.trim()
    if (q.length < 1) { setSuggestions([]); return }
    if (selected && selected.symbol === q.toUpperCase()) return
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/picks/search?q=${encodeURIComponent(q)}`)
        const json = await res.json()
        setSuggestions(res.ok ? (json.suggestions ?? []) : [])
      } catch { setSuggestions([]) }
      finally { setSearching(false) }
    }, 400)
  }, [query, selected])

  function pickSuggestion(s: Suggestion) {
    setSelected(s)
    setQuery(s.symbol)
    setSuggestions([])
  }

  function reset() {
    setQuery(''); setSelected(null); setSuggestions([])
    setPrecioCompra(''); setPrecioObjetivo('')
    setError(null); setOpen(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const ticker = selected?.symbol ?? query.trim().toUpperCase()
    if (!ticker) return
    setSaving(true); setError(null)
    try {
      const body: Record<string, unknown> = { ticker }
      if (precioCompra && parseFloat(precioCompra) > 0) body.precioEntradaManual = precioCompra
      if (precioObjetivo && parseFloat(precioObjetivo) > 0) body.precioObjetivoManual = precioObjetivo
      const res = await fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al crear')
      onCreated(data.opportunity)
      reset()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally { setSaving(false) }
  }

  const inputCls = 'w-full bg-black/30 border border-[var(--border)] text-[var(--text-primary)] text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--gold)] transition-colors'

  return (
    <div className="mb-8">
      <button onClick={() => setOpen(!open)} className="btn-gold rounded-xl px-6 py-2 text-sm font-bold">
        {open ? '✕ Cancelar' : '+ Generar Informe de Inversión'}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="card mt-4 space-y-5 max-w-lg">
          <div>
            <h3 className="font-bold text-[var(--gold)] text-sm uppercase tracking-widest mb-0.5">
              Nuevo Informe de Inversión
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Busca por empresa o ticker — los datos financieros se obtienen de Yahoo Finance automáticamente
            </p>
          </div>

          {error && (
            <p className="text-red-400 text-xs border border-red-900 bg-red-950/50 rounded px-3 py-2">{error}</p>
          )}

          {/* Ticker search */}
          <div ref={wrapperRef} className="relative">
            <div className="relative">
              <input
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(null) }}
                required
                autoComplete="off"
                placeholder="Busca empresa o ticker: Apple, NVDA, Tesla..."
                className={inputCls + ' pr-10'}
                disabled={saving}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {searching ? (
                  <svg className="animate-spin h-4 w-4" style={{ color: 'var(--gold)' }} viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : selected ? (
                  <span className="text-green-400 text-sm">✓</span>
                ) : null}
              </div>
            </div>

            {suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-xl"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                {suggestions.map(s => (
                  <button
                    key={s.symbol}
                    type="button"
                    onClick={() => pickSuggestion(s)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                  >
                    <span className="font-mono font-bold text-sm min-w-[56px]" style={{ color: 'var(--gold)' }}>
                      {s.symbol}
                    </span>
                    <span className="text-sm flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
                      {s.name}
                    </span>
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {s.exchange}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selected && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)' }}>
              <span className="font-mono font-black text-lg" style={{ color: 'var(--gold)' }}>{selected.symbol}</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{selected.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selected.exchange}</p>
              </div>
            </div>
          )}

          {/* Precio de compra y precio objetivo */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Precios (opcional — se auto-calculan si se dejan en blanco)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Precio de Compra</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={precioCompra}
                  onChange={e => setPrecioCompra(e.target.value)}
                  placeholder="Auto"
                  disabled={saving}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Precio Objetivo</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={precioObjetivo}
                  onChange={e => setPrecioObjetivo(e.target.value)}
                  placeholder="Auto"
                  disabled={saving}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving || (!selected && !query.trim())}
              className="btn-gold rounded-xl px-8 py-2.5 text-sm font-bold disabled:opacity-50"
            >
              {saving ? '⏳ Generando informe...' : '🤖 Generar Informe'}
            </button>
            {saving && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Obteniendo datos de Yahoo Finance y generando con IA. ~30-60 seg.
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  )
}

// ─── Main export ───────────────────────────────────────────────────────────────
export default function OportunidadesClient({
  initialOpportunities,
  plan,
  isAdmin,
}: {
  initialOpportunities: Opportunity[]
  plan: string
  isAdmin: boolean
}) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities)
  const [previewMode, setPreviewMode] = useState(false)
  const [previewPlan, setPreviewPlan] = useState<'FREE' | 'CLUB' | 'PRO' | 'PORTFOLIO'>('CLUB')
  const [modalOpp, setModalOpp] = useState<Opportunity | null>(null)
  const [livePrices, setLivePrices] = useState<Record<string, number>>({})

  // Fetch live prices for all tickers on mount
  useEffect(() => {
    const tickers = [...new Set(initialOpportunities.map(o => o.ticker))]
    if (!tickers.length) return
    fetch(`/api/picks/price?tickers=${tickers.join(',')}`)
      .then(r => r.json())
      .then(d => { if (d.prices) setLivePrices(d.prices) })
      .catch(() => {})
  }, [initialOpportunities])

  const handleCreated = (opp: Opportunity) => {
    setOpportunities(prev => [opp, ...prev])
    // Fetch price for the new ticker
    fetch(`/api/picks/price?tickers=${opp.ticker}`)
      .then(r => r.json())
      .then(d => { if (d.prices) setLivePrices(prev => ({ ...prev, ...d.prices })) })
      .catch(() => {})
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta oportunidad?')) return
    await fetch(`/api/picks/${id}`, { method: 'DELETE' })
    setOpportunities(prev => prev.filter(o => o.id !== id))
  }

  const handleRegenerate = (updatedOpp: Opportunity) => {
    setOpportunities(prev => prev.map(o => o.id === updatedOpp.id ? updatedOpp : o))
    setModalOpp(updatedOpp)
  }

  const handleStatusChange = async (id: string, status: string) => {
    const active = ACTIVE_STATUSES.has(status)
    await fetch(`/api/picks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, active }),
    })
    setOpportunities(prev => prev.map(o =>
      o.id === id ? { ...o, status, active } : o
    ))
  }

  const handlePriceUpdate = async (id: string, changes: Partial<{ precioEntrada: number; precioObjetivo: number }>) => {
    await fetch(`/api/picks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    })
    setOpportunities(prev => prev.map(o => o.id === id ? { ...o, ...changes } : o))
    // Update modal if open
    setModalOpp(prev => prev && prev.id === id ? { ...prev, ...changes } : prev)
  }

  const PLAN_ORDER: Record<string, number> = { FREE: 0, CLUB: 1, PRO: 2, PORTFOLIO: 3 }
  const effectiveAdmin = isAdmin && !previewMode

  const activeOpps = (() => {
    if (previewMode) {
      const level = PLAN_ORDER[previewPlan] ?? 0
      return opportunities.filter(o => o.active && (PLAN_ORDER[o.minPlan] ?? 1) <= level)
    }
    return isAdmin ? opportunities : opportunities.filter(o => o.active)
  })()

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">
            <span className="gradient-gold">Oportunidades</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Alertas de inversión analizadas con IA — Plan{' '}
            <span className="text-[var(--gold)] font-bold">{plan}</span>
            {isAdmin && !previewMode && <span className="ml-2 text-xs bg-[var(--gold)] text-black px-2 py-0.5 rounded font-bold">ADMIN</span>}
            {previewMode && <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-bold">VISTA USUARIO</span>}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            {previewMode && (
              <select
                value={previewPlan}
                onChange={e => setPreviewPlan(e.target.value as typeof previewPlan)}
                className="text-xs font-mono rounded-lg px-2 py-1.5 border border-[var(--border)]"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <option value="FREE">Plan FREE</option>
                <option value="CLUB">Plan CLUB</option>
                <option value="PRO">Plan PRO</option>
                <option value="PORTFOLIO">Plan PORTFOLIO</option>
              </select>
            )}
            <button
              onClick={() => setPreviewMode(p => !p)}
              className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors ${
                previewMode
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {previewMode ? '✕ Salir vista usuario' : '👁 Vista usuario'}
            </button>
          </div>
        )}
      </div>

      {/* Admin form */}
      {effectiveAdmin && <AdminForm onCreated={handleCreated} />}

      {/* Opportunities table */}
      {activeOpps.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">{effectiveAdmin ? '📭' : '🔒'}</div>
          <h2 className="text-xl font-bold mb-2">
            {effectiveAdmin ? 'No hay oportunidades publicadas' : 'Contenido Premium'}
          </h2>
          <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-md mx-auto">
            {effectiveAdmin
              ? 'Crea la primera alerta de inversión con el formulario de arriba.'
              : previewMode
                ? `No hay oportunidades activas visibles para el plan ${previewPlan}.`
                : 'Las oportunidades de inversión están disponibles para miembros Club y superiores.'}
          </p>
          {!effectiveAdmin && !previewMode && (
            <a href="/dashboard/planes" className="btn-gold inline-block py-3 px-8 rounded-xl">
              Ver Planes →
            </a>
          )}
        </div>
      ) : (
        <OppTable
          opps={activeOpps}
          isAdmin={effectiveAdmin}
          livePrices={livePrices}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onPriceUpdate={handlePriceUpdate}
          onOpenModal={setModalOpp}
        />
      )}

      {/* Report modal */}
      {modalOpp && (
        <ReportModal
          opp={modalOpp}
          livePrices={livePrices}
          onClose={() => setModalOpp(null)}
          onRegenerate={handleRegenerate}
        />
      )}
    </div>
  )
}
