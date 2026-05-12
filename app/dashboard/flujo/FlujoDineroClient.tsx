'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import type { FlujoDineroResponse, FlujoDineroAsset, FlujoConclusion } from '@/app/api/flujo/route'

interface TickerSuggestion {
  symbol: string
  name: string
  type: string
  exchange: string
  sector: string
}

// ── Constants ──────────────────────────────────────────────────────────────────

const SECTOR_ORDER = ['Crypto', 'Acciones', 'Índices', 'Divisas', 'Materiales']

const CONCLUSION_CONFIG: Record<FlujoConclusion, {
  label: string; color: string; bg: string; border: string; icon: string; accion: string
}> = {
  ACUMULACION_FUERTE:    { label: 'Acumulación Fuerte',   color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', icon: '▲▲', accion: 'Dinero institucional entrando con alta autenticidad. Considera posición LONG con gestión de riesgo estándar.' },
  ACUMULACION_MODERADA:  { label: 'Acumulación Moderada', color: 'text-green-400',   bg: 'bg-green-500/12',   border: 'border-green-500/25',   icon: '▲',  accion: 'Momentum alcista con flujo orgánico. Válido para entrada, confirma con tu timeframe.' },
  CONSOLIDACION:         { label: 'Consolidación',        color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/25',  icon: '◆',  accion: 'Sin dirección clara de flujo. Espera confirmación de ruptura antes de entrar.' },
  DISTRIBUCION_MODERADA: { label: 'Distribución Moderada',color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/25',  icon: '▼',  accion: 'Presión vendedora moderada. Reduce exposición o espera antes de nuevas entradas.' },
  DISTRIBUCION_FUERTE:   { label: 'Distribución Fuerte',  color: 'text-red-400',     bg: 'bg-red-500/15',     border: 'border-red-500/30',     icon: '▼▼', accion: 'Smart money saliendo activamente. Evita longs. Considerar cobertura o SHORT con gestión.' },
  KILL_SWITCH:           { label: 'Kill Switch Activo',   color: 'text-red-300',     bg: 'bg-red-500/20',     border: 'border-red-500/50',     icon: '✕',  accion: 'Turbulencia extrema detectada por FAROS. Mantenerse en CASH. Ψ forzado a 0.' },
}

const REGIME_LABELS: Record<string, string> = {
  INSTITUTIONAL_ACCUMULATION: 'Acumulación Institucional',
  HIGH_MOMENTUM:              'Alto Momentum',
  CONSOLIDATION:              'Consolidación',
  STRUCTURAL_BREAK:           'Ruptura Estructural',
  DISTRIBUTION_BEAR:          'Distribución Bajista',
}

const THERMO_LABELS: Record<string, string> = {
  'SÓLIDO': 'SÓLIDO — precio congelado/lateral',
  'LÍQUIDO': 'LÍQUIDO — zona de trading óptima',
  'GAS': 'GAS — expansión acelerada',
  'PLASMA': 'PLASMA — euforia/pánico extremo',
}

// ── Helper formatters ──────────────────────────────────────────────────────────

function fmtPrice(n: number): string {
  if (n === 0) return '—'
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (n >= 1) return n.toFixed(4)
  return n.toFixed(6)
}

function mfColor(pct: number): string {
  if (pct > 35)  return 'bg-emerald-500/15 border-emerald-500/30'
  if (pct > 10)  return 'bg-green-500/10 border-green-500/20'
  if (pct > -10) return 'bg-yellow-500/10 border-yellow-500/20'
  if (pct > -35) return 'bg-red-500/12 border-red-500/25'
  return 'bg-red-500/20 border-red-500/35'
}

function mfTextColor(pct: number): string {
  if (pct > 35)  return 'text-emerald-300'
  if (pct > 10)  return 'text-green-400'
  if (pct > -10) return 'text-yellow-400'
  if (pct > -35) return 'text-orange-400'
  return 'text-red-300'
}

function psiBar(score: number): string {
  if (score > 0.7) return 'bg-emerald-400'
  if (score > 0.5) return 'bg-green-400'
  if (score > 0.3) return 'bg-yellow-400'
  return 'bg-red-400'
}

// ── Heat Map Cell ──────────────────────────────────────────────────────────────

function HeatCell({ asset }: { asset: FlujoDineroAsset }) {
  const [hovered, setHovered] = useState(false)
  const c = CONCLUSION_CONFIG[asset.conclusion]
  const mfPct = asset.netMoneyFlowPct
  const isIn = mfPct > 0
  const absPct = Math.abs(mfPct).toFixed(1)

  return (
    <div
      className={`relative rounded-xl border p-3 cursor-pointer transition-all duration-200 ${mfColor(mfPct)} ${hovered ? 'scale-[1.04] z-10 shadow-lg' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Kill switch pulse */}
      {asset.killSwitch && (
        <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-400 animate-pulse" />
      )}

      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-mono font-black text-sm" style={{ color: 'var(--text-primary)' }}>
            {asset.symbol}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {fmtPrice(asset.currentPrice)}
          </div>
        </div>
        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg ${c.bg} ${c.color} border ${c.border}`}>
          {c.icon}
        </div>
      </div>

      {/* Money flow bar */}
      <div className="mb-2">
        <div className="flex justify-between text-[10px] mb-1">
          <span style={{ color: 'var(--text-muted)' }}>{isIn ? 'Entrada' : 'Salida'}</span>
          <span className={`font-mono font-bold ${mfTextColor(mfPct)}`}>
            {isIn ? '+' : ''}{absPct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className={`h-1.5 rounded-full transition-all duration-700 ${isIn ? 'bg-green-400' : 'bg-red-400'}`}
            style={{ width: `${Math.min(Math.abs(mfPct) * 1.5, 100)}%`, marginLeft: isIn ? 0 : 'auto' }}
          />
        </div>
      </div>

      {/* Ψ score */}
      <div className="flex items-center gap-1.5 text-[10px]">
        <span style={{ color: 'var(--text-muted)' }}>Ψ</span>
        <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className={`h-1 rounded-full ${psiBar(asset.psiScore)}`} style={{ width: `${asset.psiScore * 100}%` }} />
        </div>
        <span className="font-mono font-bold" style={{ color: 'var(--text-muted)' }}>
          {(asset.psiScore * 100).toFixed(0)}%
        </span>
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <div
          className="absolute left-0 top-full mt-2 z-20 rounded-xl border p-3 space-y-1.5 w-56 shadow-xl"
          style={{ background: '#1c1917', borderColor: '#292524' }}
        >
          <div className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>
            {asset.nombre}
          </div>
          <div className="text-[10px] space-y-1" style={{ color: 'var(--text-muted)' }}>
            <div>Z-Score: <span className="font-mono font-bold">{asset.zScore.toFixed(2)}</span> — {asset.thermodynamicState}</div>
            <div>Reynolds%: <span className="font-mono font-bold">{asset.reynoldsPercentile.toFixed(0)}%</span></div>
            <div>αflow: <span className="font-mono font-bold">{asset.alphaFlow.toFixed(2)}</span></div>
            <div>MFI (14d): <span className="font-mono font-bold">{asset.mfi.toFixed(0)}</span></div>
            <div>Trend 5d: <span className={`font-mono font-bold ${asset.trendStrength5d >= 0 ? 'text-green-400' : 'text-red-400'}`}>{asset.trendStrength5d >= 0 ? '+' : ''}{asset.trendStrength5d}%</span></div>
            <div>Régimen: <span className="font-bold">{REGIME_LABELS[asset.marketRegime] ?? asset.marketRegime}</span></div>
          </div>
          <div className={`text-[10px] pt-1 border-t leading-relaxed ${c.color}`} style={{ borderColor: '#292524' }}>
            {c.accion}
          </div>
        </div>
      )}
    </div>
  )
}

// ── FAROS Theory Panel ─────────────────────────────────────────────────────────

function FarosTheoryPanel() {
  const concepts = [
    {
      key: 'Z-Score Termodinámico',
      icon: '🌡️',
      desc: 'Mide cuántas desviaciones estándar está el precio actual respecto a su media histórica (30d). Se mapea a estados termodinámicos: SÓLIDO (lateral, precio congelado), LÍQUIDO (zona de trading óptima, Z entre 0.5-2), GAS (expansión acelerada) y PLASMA (euforia/pánico extremo, Z>3 → veto operativo).',
      util: 'Evita entrar en activos en estado PLASMA (bubble) o SÓLIDO (sin movimiento). Busca LÍQUIDO para trades de calidad.',
    },
    {
      key: 'Reynolds Financial Number',
      icon: '🌀',
      desc: 'Adaptación del número de Reynolds de la física de fluidos para mercados financieros. Mide la "viscosidad" vs "inercia" del flujo de precios — qué tan turbulento es el movimiento. Reynolds alto = flujo caótico = entradas de baja calidad.',
      util: '<50% = laminar (flujo suave, alta probabilidad). 50-75% = transición. >75% = turbulento (reducir tamaño). >95% = colapso entrópico (CASH).',
    },
    {
      key: 'αflow (Alpha Flow)',
      icon: '🔬',
      desc: 'Mide la autenticidad de la demanda. αflow cercano a 1 indica flujo de compra orgánico — inversores reales comprando con convicción. αflow cercano a 0 indica liquidez sintética, wash trading o manipulación de mercado.',
      util: 'Solo operar cuando αflow > 0.5. αflow < 0.3 con precio subiendo = trampa alcista. Es el detector de "dinero real" del sistema.',
    },
    {
      key: 'Ψ Governance Score',
      icon: '⚖️',
      desc: 'Score compuesto (0-1) que agrega Z-Score, Reynolds%, αflow y régimen de mercado en una sola métrica de gobernanza. Ψ = 0 activa automáticamente el Kill Switch. Ψ > 0.6 indica condiciones óptimas para operar. Es el semáforo final del sistema FAROS.',
      util: 'Ψ > 0.7 = señal fuerte. Ψ 0.5-0.7 = operable con precaución. Ψ < 0.3 = evitar. Ψ = 0 = Kill Switch, mantenerse fuera.',
    },
    {
      key: 'Kill Switch',
      icon: '🚨',
      desc: 'Mecanismo automático de protección. Se activa cuando Reynolds% supera el umbral de colapso entrópico O cuando el régimen es STRUCTURAL_BREAK. Fuerza Ψ a 0 independientemente de los otros factores. Diseñado para proteger capital en flash crashes, contagio sistémico y black swans.',
      util: 'Si killSwitch=true en un activo, ignorarlo aunque el sesgo del agente IA sea positivo. La turbulencia extrema destruye el edge estadístico.',
    },
    {
      key: 'Regímenes de Mercado',
      icon: '🗺️',
      desc: 'FAROS clasifica cada activo en 5 regímenes basados en combinaciones de Z-Score, αflow y Reynolds%: Acumulación Institucional, Alto Momentum, Consolidación, Ruptura Estructural y Distribución Bajista. Cada régimen mapea directamente a una señal de gobernanza (BUY, BUY_CAUTION, HOLD, CASH, SELL).',
      util: 'INSTITUTIONAL_ACCUMULATION = mejor régimen para entrar. DISTRIBUTION_BEAR = señal de salida. STRUCTURAL_BREAK = evitar nuevas entradas.',
    },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {concepts.map(c => (
          <div key={c.key} className="rounded-xl border p-4 space-y-2" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{c.icon}</span>
              <span className="text-xs font-bold font-mono" style={{ color: 'var(--gold)' }}>{c.key}</span>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{c.desc}</p>
            <div className="rounded-lg px-3 py-2 text-[10px] leading-relaxed" style={{ background: 'rgba(201,168,76,0.07)', color: 'var(--text-secondary)' }}>
              <span className="font-bold" style={{ color: 'var(--gold)' }}>Aplicación: </span>{c.util}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Conclusiones Panel ─────────────────────────────────────────────────────────

function ConclusionesPanel({ assets }: { assets: FlujoDineroAsset[] }) {
  const byConclusion = assets.reduce<Record<FlujoConclusion, FlujoDineroAsset[]>>(
    (acc, a) => { acc[a.conclusion] = [...(acc[a.conclusion] ?? []), a]; return acc },
    {} as Record<FlujoConclusion, FlujoDineroAsset[]>,
  )

  const order: FlujoConclusion[] = [
    'ACUMULACION_FUERTE', 'ACUMULACION_MODERADA', 'CONSOLIDACION',
    'DISTRIBUCION_MODERADA', 'DISTRIBUCION_FUERTE', 'KILL_SWITCH',
  ]

  return (
    <div className="space-y-3">
      {order.map(key => {
        const list = byConclusion[key]
        if (!list?.length) return null
        const cfg = CONCLUSION_CONFIG[key]
        return (
          <div key={key} className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
            <div className="flex items-start gap-3">
              <div className={`text-2xl font-black flex-shrink-0 leading-none mt-0.5 ${cfg.color}`}>
                {cfg.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {list.map(a => (
                      <span key={a.symbol} className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                        {a.symbol}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {cfg.accion}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Detail Table ───────────────────────────────────────────────────────────────

function DetailTable({ assets }: { assets: FlujoDineroAsset[] }) {
  const sorted = [...assets].sort((a, b) => b.psiScore - a.psiScore)
  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
            {['Activo', 'Precio', 'Flujo Neto', 'MFI', 'αflow', 'Z-Score', 'Reynolds%', 'Ψ Score', 'Régimen', 'Conclusión'].map(h => (
              <th key={h} className="text-left px-3 py-3 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((a, i) => {
            const cfg = CONCLUSION_CONFIG[a.conclusion]
            return (
              <tr key={a.symbol} style={{ borderBottom: i < sorted.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <td className="px-3 py-2.5">
                  <div className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{a.symbol}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{a.sector}</div>
                </td>
                <td className="px-3 py-2.5 font-mono" style={{ color: 'var(--text-secondary)' }}>
                  {fmtPrice(a.currentPrice)}
                </td>
                <td className="px-3 py-2.5">
                  <span className={`font-mono font-bold ${mfTextColor(a.netMoneyFlowPct)}`}>
                    {a.netMoneyFlowPct >= 0 ? '+' : ''}{a.netMoneyFlowPct.toFixed(1)}%
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-14 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div
                        className={`h-1.5 rounded-full ${a.mfi > 60 ? 'bg-green-400' : a.mfi < 40 ? 'bg-red-400' : 'bg-yellow-400'}`}
                        style={{ width: `${a.mfi}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{a.mfi.toFixed(0)}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 font-mono font-bold" style={{ color: a.alphaFlow > 0.6 ? '#4ade80' : a.alphaFlow < 0.35 ? '#f87171' : '#facc15' }}>
                  {a.alphaFlow.toFixed(2)}
                </td>
                <td className="px-3 py-2.5">
                  <span className="font-mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>{a.zScore.toFixed(2)}</span>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{a.thermodynamicState}</div>
                </td>
                <td className="px-3 py-2.5 font-mono font-bold" style={{ color: a.reynoldsPercentile > 75 ? '#f87171' : a.reynoldsPercentile > 50 ? '#facc15' : '#4ade80' }}>
                  {a.reynoldsPercentile.toFixed(0)}%
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className={`h-1.5 rounded-full ${psiBar(a.psiScore)}`} style={{ width: `${a.psiScore * 100}%` }} />
                    </div>
                    <span className="font-mono font-bold text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                      {(a.psiScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {REGIME_LABELS[a.marketRegime] ?? a.marketRegime}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${cfg.bg} ${cfg.color} ${cfg.border} whitespace-nowrap`}>
                    {cfg.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

type ViewTab = 'mapa' | 'teoria' | 'tabla'

export default function FlujoDineroClient({ hasAccess }: { hasAccess: boolean }) {
  const [data, setData] = useState<FlujoDineroResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<ViewTab>('mapa')

  // Ticker search
  const [tickerQuery, setTickerQuery] = useState('')
  const [suggestions, setSuggestions] = useState<TickerSuggestion[]>([])
  const [searchAsset, setSearchAsset] = useState<FlujoDineroAsset | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/flujo', { cache: 'no-store', signal: AbortSignal.timeout(30000) })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        throw new Error(b?.error ?? `Error ${res.status}`)
      }
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error obteniendo datos de flujo')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function handleSearchInput(val: string) {
    setTickerQuery(val)
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    if (!val.trim()) { setSuggestions([]); return }
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/flujo/search?q=${encodeURIComponent(val)}`)
        if (res.ok) setSuggestions(((await res.json()) as { suggestions: TickerSuggestion[] }).suggestions ?? [])
      } catch { /* silencioso */ }
    }, 300)
  }

  async function loadTicker(s: TickerSuggestion) {
    setSuggestions([])
    setTickerQuery(`${s.symbol} — ${s.name}`)
    setSearchLoading(true)
    setSearchError(null)
    setSearchAsset(null)
    try {
      const res = await fetch(
        `/api/flujo/ticker?symbol=${encodeURIComponent(s.symbol)}&name=${encodeURIComponent(s.name)}&sector=${encodeURIComponent(s.sector)}`,
        { signal: AbortSignal.timeout(20000) },
      )
      const d = await res.json()
      if (!res.ok) { setSearchError(d.error ?? `Error ${res.status}`); return }
      setSearchAsset(d as FlujoDineroAsset)
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Error cargando datos')
    } finally {
      setSearchLoading(false)
    }
  }

  function clearSearch() {
    setTickerQuery('')
    setSuggestions([])
    setSearchAsset(null)
    setSearchError(null)
  }

  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="text-4xl">🌊</div>
        <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Flujo del Dinero</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Esta sección está disponible en los planes Club, Pro y Portfolio.
        </p>
        <a href="/dashboard/upgrade" className="inline-block mt-2 px-6 py-2.5 rounded-xl font-bold text-sm btn-gold">
          Ver planes
        </a>
      </div>
    )
  }

  // Group assets by sector for heat map
  const sectorGroups = SECTOR_ORDER.reduce<Record<string, FlujoDineroAsset[]>>((acc, s) => {
    acc[s] = data?.assets.filter(a => a.sector === s) ?? []
    return acc
  }, {})

  const globalStyles: Record<string, { color: string; bg: string; border: string; icon: string }> = {
    ALCISTA:     { color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30',  icon: '▲' },
    BAJISTA:     { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    icon: '▼' },
    NEUTRAL:     { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/25', icon: '◆' },
    KILL_SWITCH: { color: 'text-red-300',    bg: 'bg-red-500/20',    border: 'border-red-500/50',    icon: '✕' },
  }
  const gs = data ? (globalStyles[data.sesgoGlobal] ?? globalStyles.NEUTRAL) : globalStyles.NEUTRAL

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black gradient-gold mb-1">Flujo del Dinero</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            FAROS v7.0 — TAI-ACF · Rastreo de capital con física de fluidos financieros
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="text-xs font-bold px-4 py-2 rounded-xl border transition-all btn-gold disabled:opacity-50 flex-shrink-0"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Cargando...
            </span>
          ) : 'Actualizar'}
        </button>
      </div>

      {/* FAROS content */}
      {<>
      {/* Buscador de tickers */}
      <div className="relative">
        <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5 focus-within:border-[var(--gold-dark)]" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={tickerQuery}
            onChange={e => handleSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && setSuggestions([])}
            placeholder="Buscar ticker o empresa (ej: AMZN, Amazon, BTC...)"
            className="flex-1 bg-transparent text-sm focus:outline-none font-mono"
            style={{ color: 'var(--text-secondary)' }}
          />
          {tickerQuery && (
            <button onClick={clearSearch} className="text-[var(--text-muted)] hover:text-white text-lg leading-none flex-shrink-0">×</button>
          )}
        </div>
        {/* Autocomplete dropdown */}
        {suggestions.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 mt-1 rounded-xl border z-30 overflow-hidden shadow-xl"
            style={{ background: '#1c1917', borderColor: 'var(--border)' }}
          >
            {suggestions.map(s => (
              <button
                key={s.symbol}
                onClick={() => loadTicker(s)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-left transition-colors border-b last:border-b-0"
                style={{ borderColor: 'rgba(255,255,255,0.05)' }}
              >
                <span className="font-mono font-bold text-sm w-16 flex-shrink-0" style={{ color: 'var(--gold)' }}>{s.symbol}</span>
                <span className="text-sm flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-lg border font-mono flex-shrink-0" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                  {s.sector}
                </span>
                {s.exchange && (
                  <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{s.exchange}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search result */}
      {(searchLoading || searchError || searchAsset) && (
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'rgba(201,168,76,0.25)' }}>
          {searchLoading && (
            <div className="flex items-center gap-3 py-4">
              <svg className="animate-spin h-5 w-5" style={{ color: 'var(--gold)' }} viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Calculando métricas FAROS…</span>
            </div>
          )}
          {searchError && (
            <p className="text-sm text-red-400">⚠️ {searchError}</p>
          )}
          {searchAsset && !searchLoading && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-mono tracking-widest" style={{ color: 'var(--gold)' }}>
                  ANÁLISIS FAROS — {searchAsset.nombre}
                </p>
                <button onClick={clearSearch} className="text-[10px] font-mono text-[var(--text-muted)] hover:text-white">CERRAR ×</button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="max-w-xs">
                  <HeatCell asset={searchAsset} />
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    { label: 'Z-Score Termodinámico', value: `${searchAsset.zScore.toFixed(2)} — ${searchAsset.thermodynamicState}` },
                    { label: 'Reynolds%', value: `${searchAsset.reynoldsPercentile.toFixed(0)}%`, color: searchAsset.reynoldsPercentile > 75 ? '#f87171' : searchAsset.reynoldsPercentile > 50 ? '#facc15' : '#4ade80' },
                    { label: 'αflow (Autenticidad)', value: searchAsset.alphaFlow.toFixed(2), color: searchAsset.alphaFlow > 0.6 ? '#4ade80' : searchAsset.alphaFlow < 0.35 ? '#f87171' : '#facc15' },
                    { label: 'Ψ Score (Gobernanza)', value: `${(searchAsset.psiScore * 100).toFixed(0)}%`, color: searchAsset.psiScore > 0.6 ? '#4ade80' : searchAsset.psiScore > 0.4 ? '#facc15' : '#f87171' },
                    { label: 'MFI (14d)', value: searchAsset.mfi.toFixed(0) },
                    { label: 'Flujo Neto 5d', value: `${searchAsset.netMoneyFlowPct >= 0 ? '+' : ''}${searchAsset.netMoneyFlowPct.toFixed(1)}%` },
                    { label: 'Régimen', value: REGIME_LABELS[searchAsset.marketRegime] ?? searchAsset.marketRegime },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                      <span className="font-mono font-bold" style={{ color: (row.color as string | undefined) ?? 'var(--text-secondary)' }}>{row.value}</span>
                    </div>
                  ))}
                  <div className={`mt-3 rounded-lg px-3 py-2 text-[10px] leading-relaxed ${CONCLUSION_CONFIG[searchAsset.conclusion].bg} ${CONCLUSION_CONFIG[searchAsset.conclusion].color} border ${CONCLUSION_CONFIG[searchAsset.conclusion].border}`}>
                    <span className="font-bold">{CONCLUSION_CONFIG[searchAsset.conclusion].label}: </span>
                    {CONCLUSION_CONFIG[searchAsset.conclusion].accion}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Hero stats */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Sesgo Global',
              value: data.sesgoGlobal,
              sub: REGIME_LABELS[data.globalRegime] ?? data.globalRegime,
              color: gs.color,
              icon: gs.icon,
            },
            {
              label: 'Ψ Promedio',
              value: `${(data.avgPsiScore * 100).toFixed(0)}%`,
              sub: data.avgPsiScore > 0.6 ? 'Gobernanza Alta' : data.avgPsiScore > 0.4 ? 'Gobernanza Media' : 'Gobernanza Baja',
              color: data.avgPsiScore > 0.6 ? 'text-green-400' : data.avgPsiScore > 0.4 ? 'text-yellow-400' : 'text-red-400',
              icon: '⚖️',
            },
            {
              label: 'αflow Promedio',
              value: data.avgAlphaFlow.toFixed(2),
              sub: data.avgAlphaFlow > 0.6 ? 'Demanda Orgánica' : data.avgAlphaFlow > 0.4 ? 'Flujo Mixto' : 'Liquidez Sintética',
              color: data.avgAlphaFlow > 0.6 ? 'text-green-400' : data.avgAlphaFlow > 0.4 ? 'text-yellow-400' : 'text-red-400',
              icon: '🔬',
            },
            {
              label: 'Kill Switches',
              value: `${data.killSwitchCount}/${data.assets.length}`,
              sub: data.killSwitchCount === 0 ? 'Sin turbulencia extrema' : `${data.killSwitchCount} activo${data.killSwitchCount !== 1 ? 's' : ''} vetado${data.killSwitchCount !== 1 ? 's' : ''}`,
              color: data.killSwitchCount === 0 ? 'text-green-400' : 'text-red-400',
              icon: '🚨',
            },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
              <div className={`text-xl font-black font-mono ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          ⚠️ {error}
        </div>
      )}

      {/* Loading state */}
      {loading && !data && (
        <div className="rounded-xl border p-12 text-center space-y-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <svg className="animate-spin h-8 w-8 mx-auto" style={{ color: 'var(--gold)' }} viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Obteniendo datos de mercado y calculando métricas FAROS...
          </p>
        </div>
      )}

      {/* Tabs */}
      {data && (
        <>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {[
              { id: 'mapa' as ViewTab, label: '🗺️ Mapa de Calor' },
              { id: 'tabla' as ViewTab, label: '📊 Tabla Detallada' },
              { id: 'teoria' as ViewTab, label: '📖 Teoría FAROS' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                  tab === t.id
                    ? 'bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/30'
                    : 'hover:bg-white/5'
                }`}
                style={tab !== t.id ? { color: 'var(--text-muted)' } : {}}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Mapa de Calor */}
          {tab === 'mapa' && (
            <div className="space-y-6">
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <span className="font-semibold uppercase tracking-wider">Flujo neto 5 días:</span>
                {[
                  { label: 'Entrada fuerte (>35%)', color: 'bg-emerald-500/40' },
                  { label: 'Entrada (>10%)', color: 'bg-green-500/25' },
                  { label: 'Neutral', color: 'bg-yellow-500/15' },
                  { label: 'Salida (>10%)', color: 'bg-red-500/20' },
                  { label: 'Salida fuerte (>35%)', color: 'bg-red-500/35' },
                ].map(l => (
                  <span key={l.label} className="flex items-center gap-1.5">
                    <span className={`w-3 h-3 rounded-md ${l.color}`} />
                    {l.label}
                  </span>
                ))}
                <span className="flex items-center gap-1.5 ml-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  Kill Switch activo
                </span>
              </div>

              {/* Sector heat maps */}
              {SECTOR_ORDER.map(sector => {
                const assets = sectorGroups[sector]
                if (!assets?.length) return null
                return (
                  <div key={sector}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                      {sector}
                    </p>
                    <div className={`grid gap-3 ${
                      assets.length <= 2 ? 'grid-cols-2' :
                      assets.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' :
                      'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                    }`}>
                      {assets.map(a => <HeatCell key={a.symbol} asset={a} />)}
                    </div>
                  </div>
                )
              })}

              {/* Conclusiones */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                  Conclusiones FAROS — ¿Qué dice el flujo del dinero?
                </p>
                <ConclusionesPanel assets={data.assets} />
              </div>
            </div>
          )}

          {/* Tabla detallada */}
          {tab === 'tabla' && <DetailTable assets={data.assets} />}

          {/* Teoría FAROS */}
          {tab === 'teoria' && (
            <div className="space-y-5">
              <div className="rounded-xl border p-5" style={{ background: 'rgba(201,168,76,0.04)', borderColor: 'rgba(201,168,76,0.18)' }}>
                <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: 'var(--gold)' }}>
                  FAROS v7.0 — TAI-ACF FRAMEWORK
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <strong className="text-[var(--gold)]">FAROS</strong> (Future-Oriented Actor-Critic System) es un framework cuantitativo que modela los mercados financieros como <strong>sistemas de fluidos termodinámicos</strong>. Inspirado en las ecuaciones de Navier-Stokes y la mecánica estadística, trata el capital como un fluido con propiedades de viscosidad, turbulencia, entropía y temperatura.
                </p>
                <p className="text-sm leading-relaxed mt-2" style={{ color: 'var(--text-secondary)' }}>
                  La premisa central: <strong>el dinero fluye como un fluido</strong>. Cuando el flujo es laminar (suave, organizado, baja turbulencia), las señales de dirección son confiables. Cuando el flujo se vuelve turbulento (caótico, alta varianza, Reynolds alto), las señales técnicas clásicas pierden validez — el mercado entra en un estado caótico donde la estadística de series de tiempo se rompe.
                </p>
              </div>
              <FarosTheoryPanel />
              <div className="rounded-xl border p-5 space-y-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  Matriz de decisión FAROS
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Estado', 'Reynolds%', 'αflow', 'Ψ Score', 'Decisión'].map(h => (
                          <th key={h} className="text-left pb-2 pr-4 text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="space-y-1">
                      {[
                        { estado: 'Acumulación Fuerte', reynolds: '<50%', alpha: '>0.65', psi: '>0.70', decision: '✅ LONG — señal óptima', color: 'text-emerald-400' },
                        { estado: 'Acumulación Moderada', reynolds: '<60%', alpha: '>0.50', psi: '>0.55', decision: '✅ LONG con cautela', color: 'text-green-400' },
                        { estado: 'Consolidación', reynolds: '50-70%', alpha: '0.35-0.55', psi: '0.35-0.55', decision: '⏳ ESPERAR ruptura', color: 'text-yellow-400' },
                        { estado: 'Distribución Moderada', reynolds: '>60%', alpha: '<0.45', psi: '<0.40', decision: '⚠️ REDUCIR exposición', color: 'text-orange-400' },
                        { estado: 'Distribución Fuerte', reynolds: '>65%', alpha: '<0.30', psi: '<0.30', decision: '🔴 SHORT / CASH', color: 'text-red-400' },
                        { estado: 'Kill Switch', reynolds: '>90%', alpha: 'cualquiera', psi: '= 0', decision: '🚨 CASH — no operar', color: 'text-red-300' },
                      ].map(row => (
                        <tr key={row.estado} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td className="py-2 pr-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>{row.estado}</td>
                          <td className="py-2 pr-4 font-mono" style={{ color: 'var(--text-muted)' }}>{row.reynolds}</td>
                          <td className="py-2 pr-4 font-mono" style={{ color: 'var(--text-muted)' }}>{row.alpha}</td>
                          <td className="py-2 pr-4 font-mono" style={{ color: 'var(--text-muted)' }}>{row.psi}</td>
                          <td className={`py-2 font-bold ${row.color}`}>{row.decision}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Timestamp */}
          <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
            Datos calculados:{' '}
            {new Date(data.timestamp).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
            {' '}· Fuente: Yahoo Finance (OHLCV 30d) · FAROS v7.0 TAI-ACF
          </p>
        </>
      )}
      {/* end FAROS content */}
      </>}
    </div>
  )
}
