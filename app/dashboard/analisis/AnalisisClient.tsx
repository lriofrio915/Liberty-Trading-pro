'use client'

import { useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

// ── Types ──────────────────────────────────────────────────────────────────────

interface AssetAnalysis {
  simbolo: string
  nombre: string
  precio: number
  cambio24h: number
  sesgo: 'COMPRA' | 'VENTA' | 'NEUTRAL'
  confianza: number
  razon: string
  riesgo: 'bajo' | 'medio' | 'alto'
  sector: string
}

interface DistribucionItem {
  sector: string
  porcentaje: number
  color: string
}

interface EstrategiaResult {
  sesgo_general: 'ALCISTA' | 'BAJISTA' | 'NEUTRAL'
  resumen: string
  distribucion: DistribucionItem[]
  oportunidad_destacada: string
  alerta_riesgo: string
}

interface AnalysisResult {
  timestamp: string
  riskProfile: string
  activos: AssetAnalysis[]
  estrategia: EstrategiaResult | null
}

type RiskProfile = 'conservador' | 'moderado' | 'agresivo'

// ── Constants ──────────────────────────────────────────────────────────────────

const RISK_PROFILES: { id: RiskProfile; label: string; icon: string; desc: string }[] = [
  { id: 'conservador', label: 'Conservador', icon: '🛡️', desc: 'Estabilidad y activos refugio' },
  { id: 'moderado', label: 'Moderado', icon: '⚖️', desc: 'Balance riesgo-oportunidad' },
  { id: 'agresivo', label: 'Agresivo', icon: '🚀', desc: 'Máximo potencial de ganancia' },
]

const AGENTS = [
  { key: 'crypto', label: 'Crypto', icon: '₿', desc: 'BTC, ETH, SOL' },
  { key: 'acciones', label: 'Acciones', icon: '📈', desc: 'NQ Futures, VIX' },
  { key: 'divisas', label: 'Divisas', icon: '💱', desc: 'DXY, EUR/USD, MXN, COP' },
  { key: 'materiales', label: 'Materiales', icon: '🏗️', desc: 'Oro, Petróleo WTI' },
  { key: 'estrategia', label: 'Estrategia', icon: '🎯', desc: 'Portafolio global' },
]

const SECTOR_ORDER = ['Crypto', 'Acciones', 'Divisas', 'Materiales']

const SESGO_STYLES = {
  COMPRA: {
    bg: 'bg-green-500/15',
    text: 'text-green-400',
    border: 'border-green-500/25',
    bar: 'bg-green-400',
    label: '▲ COMPRA',
  },
  VENTA: {
    bg: 'bg-red-500/15',
    text: 'text-red-400',
    border: 'border-red-500/25',
    bar: 'bg-red-400',
    label: '▼ VENTA',
  },
  NEUTRAL: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/25',
    bar: 'bg-yellow-400',
    label: '◆ NEUTRAL',
  },
} as const

const GENERAL_STYLES = {
  ALCISTA: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    icon: '▲',
    label: 'ALCISTA',
  },
  BAJISTA: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: '▼',
    label: 'BAJISTA',
  },
  NEUTRAL: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    icon: '◆',
    label: 'NEUTRAL',
  },
} as const

const RIESGO_COLOR: Record<string, string> = {
  bajo: 'text-green-400',
  medio: 'text-yellow-400',
  alto: 'text-red-400',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  if (price === 0) return '—'
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (price >= 1) return price.toFixed(4)
  return price.toFixed(6)
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function AssetCard({ asset }: { asset: AssetAnalysis }) {
  const s = SESGO_STYLES[asset.sesgo] ?? SESGO_STYLES.NEUTRAL

  return (
    <div
      className={`rounded-xl border p-4 transition-transform hover:scale-[1.02] ${s.bg} ${s.border}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            {asset.simbolo}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {asset.nombre}
          </div>
        </div>
        <span
          className={`text-[11px] font-bold px-2 py-1 rounded-lg ${s.bg} ${s.text} border ${s.border}`}
        >
          {s.label}
        </span>
      </div>

      {/* Price */}
      {asset.precio > 0 && (
        <div className="mb-3">
          <div
            className="font-mono text-base font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            ${formatPrice(asset.precio)}
          </div>
          <div
            className={`text-xs font-mono ${asset.cambio24h >= 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            {asset.cambio24h >= 0 ? '+' : ''}
            {asset.cambio24h.toFixed(2)}% 24h
          </div>
        </div>
      )}

      {/* Confidence bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1.5">
          <span style={{ color: 'var(--text-muted)' }}>Confianza</span>
          <span className={`font-semibold ${s.text}`}>{asset.confianza}%</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
          <div
            className={`h-1.5 rounded-full transition-all duration-700 ${s.bar}`}
            style={{ width: `${asset.confianza}%` }}
          />
        </div>
      </div>

      {/* Reason */}
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {asset.razon}
      </p>

      {/* Risk badge */}
      <div className="mt-2.5 flex items-center gap-1.5">
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Riesgo:
        </span>
        <span className={`text-[10px] font-semibold ${RIESGO_COLOR[asset.riesgo] ?? 'text-gray-400'}`}>
          {asset.riesgo?.toUpperCase() ?? '—'}
        </span>
      </div>
    </div>
  )
}

function AgentRow({
  agent,
  step,
  index,
}: {
  agent: (typeof AGENTS)[0]
  step: number
  index: number
}) {
  const done = step > index
  const active = step === index

  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 transition-all ${
          done
            ? 'bg-green-500/20 text-green-400'
            : active
            ? 'bg-[var(--gold)]/20 text-[var(--gold)] animate-pulse'
            : 'text-[var(--text-muted)]'
        }`}
        style={!done && !active ? { background: 'var(--bg-hover)' } : {}}
      >
        {done ? '✓' : agent.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-semibold"
            style={{
              color: done ? '#22c55e' : active ? 'var(--gold)' : 'var(--text-muted)',
            }}
          >
            {agent.label}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {agent.desc}
          </span>
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
          {done ? 'Completado ✓' : active ? 'Investigando en tiempo real...' : 'En espera'}
        </div>
      </div>
      {active && (
        <svg
          className="animate-spin h-4 w-4 flex-shrink-0"
          style={{ color: 'var(--gold)' }}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AnalisisClient() {
  const [riskProfile, setRiskProfile] = useState<RiskProfile>('moderado')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [agentStep, setAgentStep] = useState(0)

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    setAgentStep(0)

    // Simulate agents progressing (each ~3s)
    let step = 0
    const stepInterval = setInterval(() => {
      step++
      setAgentStep(step)
      if (step >= AGENTS.length) clearInterval(stepInterval)
    }, 3000)

    try {
      const res = await fetch('/api/analisis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riskProfile }),
      })

      clearInterval(stepInterval)
      setAgentStep(AGENTS.length)

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `Error ${res.status}`)
      }

      const data: AnalysisResult = await res.json()
      setResult(data)
    } catch (err) {
      clearInterval(stepInterval)
      setError(err instanceof Error ? err.message : 'Error al ejecutar el análisis. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const activosByRanking = result?.activos
    ? [...result.activos].sort((a, b) => b.confianza - a.confianza)
    : []

  const sesgoGeneral = result?.estrategia?.sesgo_general ?? 'NEUTRAL'
  const gs = GENERAL_STYLES[sesgoGeneral] ?? GENERAL_STYLES.NEUTRAL

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-black gradient-gold mb-1">Análisis de Activos</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          5 agentes de IA trabajan en paralelo — datos en tiempo real, sesgo claro y recomendación de
          compra/venta por sector
        </p>
      </div>

      {/* ── Risk selector + CTA ── */}
      <div className="card p-6 space-y-5">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'var(--text-muted)' }}
          >
            Perfil de riesgo
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {RISK_PROFILES.map(rp => (
              <button
                key={rp.id}
                onClick={() => setRiskProfile(rp.id)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                  riskProfile === rp.id
                    ? 'border-[var(--gold)] bg-[var(--gold)]/10'
                    : 'border-[var(--border)] hover:border-[var(--gold)]/40 hover:bg-white/3'
                }`}
              >
                <div className="text-2xl mb-1.5">{rp.icon}</div>
                <div
                  className="text-sm font-semibold"
                  style={{ color: riskProfile === rp.id ? 'var(--gold)' : 'var(--text-primary)' }}
                >
                  {rp.label}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {rp.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={runAnalysis}
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all btn-gold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Analizando mercados...
            </span>
          ) : (
            '🔍 Analizar Mercados'
          )}
        </button>
      </div>

      {/* ── Agent status ── */}
      {loading && (
        <div className="card p-5">
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-4"
            style={{ color: 'var(--text-muted)' }}
          >
            Agentes trabajando en paralelo
          </p>
          <div className="space-y-3.5">
            {AGENTS.map((agent, i) => (
              <AgentRow key={agent.key} agent={agent} step={agentStep} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          ⚠️ {error}
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <div className="space-y-5">

          {/* Overall bias card */}
          {result.estrategia && (
            <div className={`rounded-xl border p-6 ${gs.bg} ${gs.border}`}>
              <div className="flex items-start gap-5">
                <div
                  className={`text-5xl font-black flex-shrink-0 leading-none mt-1 ${gs.text}`}
                >
                  {gs.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-widest"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Sesgo General del Mercado
                    </span>
                    <span className={`text-xl font-black ${gs.text}`}>{gs.label}</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {result.estrategia.resumen}
                  </p>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div
                      className="rounded-xl p-3.5"
                      style={{
                        background: 'rgba(34,197,94,0.07)',
                        border: '1px solid rgba(34,197,94,0.2)',
                      }}
                    >
                      <div className="text-xs font-semibold text-green-400 mb-1.5">
                        💡 Oportunidad destacada
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        {result.estrategia.oportunidad_destacada}
                      </p>
                    </div>
                    <div
                      className="rounded-xl p-3.5"
                      style={{
                        background: 'rgba(239,68,68,0.07)',
                        border: '1px solid rgba(239,68,68,0.2)',
                      }}
                    >
                      <div className="text-xs font-semibold text-red-400 mb-1.5">
                        ⚠️ Alerta de riesgo
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        {result.estrategia.alerta_riesgo}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Portfolio distribution + Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Pie chart */}
            {result.estrategia?.distribucion && result.estrategia.distribucion.length > 0 && (
              <div className="card p-5">
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Distribución de Portafolio
                </p>
                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                  Perfil {riskProfile}
                </p>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={result.estrategia.distribucion}
                      dataKey="porcentaje"
                      nameKey="sector"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {result.estrategia.distribucion.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value}%`, 'Asignación']}
                      contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        color: 'var(--text-primary)',
                        fontSize: 12,
                      }}
                    />
                    <Legend
                      formatter={(value) => (
                        <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Rankings */}
            <div className="card p-5">
              <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'var(--text-muted)' }}
              >
                Rankings por Confianza
              </p>
              <div className="space-y-3">
                {activosByRanking.slice(0, 10).map((asset, i) => {
                  const s = SESGO_STYLES[asset.sesgo] ?? SESGO_STYLES.NEUTRAL
                  return (
                    <div key={`${asset.simbolo}-${i}`} className="flex items-center gap-2.5">
                      <span
                        className="text-xs font-mono w-4 text-right flex-shrink-0"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0 w-14 text-center ${s.bg} ${s.text} border ${s.border}`}
                      >
                        {asset.simbolo.length > 6 ? asset.simbolo.slice(0, 6) : asset.simbolo}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className={`text-[11px] ${s.text}`}>{s.label}</span>
                          <span
                            className="text-[11px] font-mono"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {asset.confianza}%
                          </span>
                        </div>
                        <div
                          className="h-1 rounded-full"
                          style={{ background: 'var(--border)' }}
                        >
                          <div
                            className={`h-1 rounded-full transition-all duration-700 ${s.bar}`}
                            style={{ width: `${asset.confianza}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Asset cards by sector */}
          {SECTOR_ORDER.map(sector => {
            const sectorActivos = result.activos.filter(a => a.sector === sector)
            if (sectorActivos.length === 0) return null
            return (
              <div key={sector}>
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest mb-3"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {sector}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {sectorActivos.map((asset, i) => (
                    <AssetCard key={`${asset.simbolo}-${i}`} asset={asset} />
                  ))}
                </div>
              </div>
            )
          })}

          {/* Footer */}
          <div className="space-y-3">
            <p
              className="text-xs text-center"
              style={{ color: 'var(--text-muted)', opacity: 0.6 }}
            >
              Análisis generado:{' '}
              {new Date(result.timestamp).toLocaleString('es-MX', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}{' '}
              · Perfil: {result.riskProfile}
            </p>
            <div
              className="rounded-xl p-4 text-xs text-center leading-relaxed"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
                opacity: 0.7,
              }}
            >
              ⚠️ Este análisis es informativo y educativo. No constituye asesoría financiera. Siempre
              verifica la información antes de tomar decisiones de inversión o trading.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
