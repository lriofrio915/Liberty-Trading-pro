'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import MT5ConnectPanel from '@/components/MT5/MT5ConnectPanel'
import MT5TradeModal from '@/components/MT5/MT5TradeModal'

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

interface FarosAssetItem {
  symbol: string
  zScore: number
  thermodynamicState: string
  reynoldsPercentile: number
  entropy: number
  alphaFlow: number
  psiScore: number
  marketRegime: string
  governanceSignal: string
  killSwitch: boolean
  trendStrength5d: number
}

interface FarosAgentResult {
  sesgo_faros: 'ALCISTA' | 'BAJISTA' | 'NEUTRAL' | 'KILL_SWITCH'
  regimen_dominante: string
  activos_faros: FarosAssetItem[]
  resumen_faros: string
  kill_switch_activos: string[]
  oportunidades_faros: string
  advertencias_faros: string
}

interface AnalysisResult {
  timestamp: string
  riskProfile: string
  activos: AssetAnalysis[]
  estrategia: EstrategiaResult | null
  faros?: FarosAgentResult
}

interface MT5AccountData {
  id: string
  metaApiAccountId: string
  accountName: string | null
  broker: string | null
  login: string
  server: string | null
  isConnected: boolean
  lastSyncAt: string | null
}

interface MT5Position {
  id: string
  symbol: string
  type: string
  volume: number
  openPrice: number
  currentPrice: number
  profit: number
  swap: number
  time: string
  comment?: string
}

interface TradeModalState {
  symbol: string
  direction: 'BUY' | 'SELL'
}

type RiskProfile = 'conservador' | 'moderado' | 'agresivo'
type ActiveTab = 'analisis' | 'mt5' | 'senales'

// ── CFD Signal types ────────────────────────────────────────────────────────────

interface CfdSignalCalc {
  simbolo: string
  nombre: string
  sector: string
  sesgo: string
  confianza: number
  razon: string
  precioEntrada: number
  stopLoss: number
  takeProfit: number
  lotaje: number
  riesgoUsd: number
  rrRatio: number
  riskProfile: string
  farosSesgo?: string
  farosRegimen?: string
  psiScore?: number
  killSwitch: boolean
}

interface CfdSignalRecord extends CfdSignalCalc {
  id: string
  createdAt: string
  resultado: string
  pnlUsd?: number | null
  closedPrice?: number | null
}

// ── Constants ──────────────────────────────────────────────────────────────────

const AGENTS = [
  { key: 'crypto',     label: 'Crypto',     icon: '₿',  desc: 'BTC, ETH, BNB, XRP' },
  { key: 'acciones',   label: 'Acciones',   icon: '📈', desc: '7 Magnificas' },
  { key: 'indices',    label: 'Índices',    icon: '📊', desc: 'Nasdaq, SP500, Russell, Dow, VIX' },
  { key: 'divisas',    label: 'Divisas',    icon: '💱', desc: 'DXY, EUR/USD, JPY, CAD, GBP' },
  { key: 'materiales', label: 'Materias',   icon: '🏗️', desc: 'Oro, Petróleo, Plata' },
  { key: 'estrategia', label: 'Estrategia', icon: '🎯', desc: 'Portafolio global' },
  { key: 'faros',      label: 'FAROS v7',   icon: '🔭', desc: 'TAI-ACF — Física de fluidos' },
]

const SECTOR_ORDER = ['Crypto', 'Acciones', 'Índices', 'Divisas', 'Materiales']

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

function formatPriceNum(price: number): string {
  if (price === 0) return '—'
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (price >= 1) return price.toFixed(4)
  return price.toFixed(6)
}

// ── FAROS helpers ─────────────────────────────────────────────────────────────

const REGIME_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  INSTITUTIONAL_ACCUMULATION: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/25', label: 'Acumulación Institucional' },
  HIGH_MOMENTUM:               { bg: 'bg-blue-500/10',  text: 'text-blue-400',  border: 'border-blue-500/25',  label: 'Alto Momentum' },
  CONSOLIDATION:               { bg: 'bg-yellow-500/10',text: 'text-yellow-400',border: 'border-yellow-500/25',label: 'Consolidación' },
  STRUCTURAL_BREAK:            { bg: 'bg-red-500/10',   text: 'text-red-400',   border: 'border-red-500/25',   label: 'Ruptura Estructural ⚠️' },
  DISTRIBUTION_BEAR:           { bg: 'bg-red-500/15',   text: 'text-red-300',   border: 'border-red-500/30',   label: 'Distribución / Bajista' },
}

const SIGNAL_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  BUY:         { bg: 'bg-green-500/15',  text: 'text-green-400',  label: '▲ BUY' },
  BUY_CAUTION: { bg: 'bg-blue-500/10',   text: 'text-blue-400',   label: '▲ BUY~' },
  HOLD:        { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: '◆ HOLD' },
  SELL:        { bg: 'bg-red-500/15',    text: 'text-red-400',    label: '▼ SELL' },
  CASH:        { bg: 'bg-orange-500/10', text: 'text-orange-400', label: '✕ CASH' },
}

const FAROS_SESGO_STYLES: Record<string, { bg: string; border: string; text: string; icon: string; label: string }> = {
  ALCISTA:     { bg: 'bg-green-500/10', border: 'border-green-500/30',  text: 'text-green-400',  icon: '▲', label: 'ALCISTA' },
  BAJISTA:     { bg: 'bg-red-500/10',   border: 'border-red-500/30',    text: 'text-red-400',    icon: '▼', label: 'BAJISTA' },
  NEUTRAL:     { bg: 'bg-yellow-500/10',border: 'border-yellow-500/30', text: 'text-yellow-400', icon: '◆', label: 'NEUTRAL' },
  KILL_SWITCH: { bg: 'bg-red-500/20',   border: 'border-red-500/50',    text: 'text-red-300',    icon: '✕', label: 'KILL SWITCH' },
}

function FarosMetricMini({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div className="text-sm font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

function FarosAssetCard({ asset }: { asset: FarosAssetItem }) {
  const regime = REGIME_STYLES[asset.marketRegime] ?? REGIME_STYLES.CONSOLIDATION
  const signal = SIGNAL_STYLES[asset.governanceSignal] ?? SIGNAL_STYLES.HOLD

  return (
    <div className={`rounded-xl border p-3.5 ${regime.bg} ${regime.border} ${asset.killSwitch ? 'ring-1 ring-red-500/40' : ''}`}>
      <div className="flex items-start justify-between mb-2.5">
        <div>
          <div className="font-mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            {asset.symbol}
          </div>
          <div className={`text-[10px] font-medium mt-0.5 ${regime.text}`}>{regime.label}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${signal.bg} ${signal.text}`}>
            {signal.label}
          </span>
          {asset.killSwitch && (
            <span className="text-[10px] font-bold text-red-400 animate-pulse">KILL SWITCH</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2.5">
        <FarosMetricMini label="Z-Score" value={asset.zScore.toFixed(2)} sub={asset.thermodynamicState} />
        <FarosMetricMini label="Reynolds%" value={`${asset.reynoldsPercentile.toFixed(0)}%`} />
        <FarosMetricMini label="αflow" value={asset.alphaFlow.toFixed(2)} />
      </div>

      <div>
        <div className="flex justify-between text-[10px] mb-1">
          <span style={{ color: 'var(--text-muted)' }}>Ψ Gobernanza</span>
          <span className={`font-mono font-semibold ${regime.text}`}>{(asset.psiScore * 100).toFixed(0)}%</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
          <div
            className={`h-1.5 rounded-full transition-all duration-700 ${
              asset.psiScore > 0.5 ? 'bg-green-400' : asset.psiScore > 0.25 ? 'bg-yellow-400' : 'bg-red-400'
            }`}
            style={{ width: `${asset.psiScore * 100}%` }}
          />
        </div>
      </div>

      <div className={`mt-2 text-[10px] font-mono ${asset.trendStrength5d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        Trend 5d: {asset.trendStrength5d >= 0 ? '+' : ''}{asset.trendStrength5d}%
      </div>
    </div>
  )
}

function FarosPanel({ faros }: { faros: FarosAgentResult }) {
  const ss = FAROS_SESGO_STYLES[faros.sesgo_faros] ?? FAROS_SESGO_STYLES.NEUTRAL
  const sorted = [...faros.activos_faros].sort((a, b) => b.psiScore - a.psiScore)

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border p-5 ${ss.bg} ${ss.border}`}>
        <div className="flex items-start gap-4">
          <div className={`text-4xl font-black flex-shrink-0 leading-none mt-1 ${ss.text}`}>
            {ss.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                FAROS v7.0 — Sesgo TAI-ACF
              </span>
              <span className={`text-lg font-black ${ss.text}`}>{ss.label}</span>
            </div>
            <p className="text-sm leading-relaxed mb-1" style={{ color: 'var(--text-secondary)' }}>
              {faros.resumen_faros}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Régimen dominante:{' '}
              <span className="font-semibold">
                {REGIME_STYLES[faros.regimen_dominante]?.label ?? faros.regimen_dominante}
              </span>
            </p>

            {faros.kill_switch_activos.length > 0 && (
              <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2">
                <div className="text-xs font-bold text-red-400 mb-1">⚠️ Kill Switch Activo</div>
                <div className="text-xs text-red-300">
                  Turbulencia extrema detectada en: {faros.kill_switch_activos.join(', ')} — Ψ forzado a 0. Evitar exposición.
                </div>
              </div>
            )}

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl p-3" style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div className="text-xs font-semibold text-green-400 mb-1">🔭 Oportunidades FAROS</div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {faros.oportunidades_faros}
                </p>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="text-xs font-semibold text-red-400 mb-1">⚠️ Advertencias FAROS</div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {faros.advertencias_faros}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {sorted.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Activos por Ψ Score — Física de Fluidos
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {sorted.map(asset => (
              <FarosAssetCard key={asset.symbol} asset={asset} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── AssetCard helpers ──────────────────────────────────────────────────────────

const FAROS_SYMBOL_ALIASES: Record<string, string> = {
  'EUR/USD': 'EURUSD', 'GBP/USD': 'GBPUSD', 'USD/JPY': 'USDJPY', 'USD/CAD': 'USDCAD',
  'DXY': 'DXY', 'SP500': 'SP500', 'RUSSELL': 'RUSSELL',
}

function findFarosAsset(simbolo: string, activos: FarosAssetItem[]): FarosAssetItem | undefined {
  const s = simbolo.toUpperCase()
  const direct = activos.find(f => f.symbol === s)
  if (direct) return direct
  const mapped = FAROS_SYMBOL_ALIASES[s]
  if (mapped) return activos.find(f => f.symbol === mapped)
  return activos.find(f => f.symbol.includes(s) || s.includes(f.symbol))
}

function FarosAnnotation({ fa }: { fa: FarosAssetItem }) {
  const govColor: Record<string, string> = {
    BUY: 'text-green-400', BUY_CAUTION: 'text-blue-400',
    HOLD: 'text-yellow-400', SELL: 'text-red-400', CASH: 'text-orange-400',
  }
  const obs = fa.killSwitch
    ? 'FAROS veta esta señal — turbulencia extrema, evitar posición'
    : fa.psiScore > 0.65 && fa.alphaFlow > 0.55
      ? 'FAROS confirma — flujo orgánico con régimen estable'
      : fa.psiScore > 0.40
        ? 'FAROS neutral — señal operable, confirmar en gráfico'
        : 'FAROS débil — presión vendedora o liquidez sintética'
  const obsColor = fa.killSwitch ? 'bg-red-500/10 text-red-400 border-red-500/25'
    : fa.psiScore > 0.65 ? 'bg-green-500/10 text-green-400 border-green-500/20'
    : fa.psiScore > 0.40 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    : 'bg-orange-500/10 text-orange-400 border-orange-500/20'

  return (
    <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
      <div className="text-[9px] font-bold uppercase tracking-widest mb-2 opacity-60" style={{ color: 'var(--gold)' }}>
        FAROS v7.0
      </div>
      {fa.killSwitch && (
        <div className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/25 rounded-lg px-2 py-1 mb-2 flex items-center gap-1.5">
          ✕ KILL SWITCH ACTIVO
        </div>
      )}
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] mb-2">
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Ψ Score: </span>
          <span className={`font-mono font-bold ${fa.psiScore > 0.6 ? 'text-green-400' : fa.psiScore > 0.35 ? 'text-yellow-400' : 'text-red-400'}`}>
            {(fa.psiScore * 100).toFixed(0)}%
          </span>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Señal: </span>
          <span className={`font-mono font-bold ${govColor[fa.governanceSignal] ?? 'text-gray-400'}`}>
            {fa.governanceSignal}
          </span>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>αflow: </span>
          <span className="font-mono font-bold" style={{ color: fa.alphaFlow > 0.6 ? '#4ade80' : fa.alphaFlow < 0.35 ? '#f87171' : '#facc15' }}>
            {fa.alphaFlow.toFixed(2)}
          </span>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Estado: </span>
          <span className="font-mono text-[9px]" style={{ color: 'var(--text-secondary)' }}>{fa.thermodynamicState}</span>
        </div>
      </div>
      <div className={`text-[10px] font-medium px-2 py-1 rounded-lg border leading-snug ${obsColor}`}>
        {obs}
      </div>
    </div>
  )
}

// ── AssetCard (with optional MT5 trade button + FAROS annotation) ──────────────

function AssetCard({ asset, mt5Connected, onTrade, farosActivos }: {
  asset: AssetAnalysis
  mt5Connected: boolean
  onTrade?: (symbol: string, direction: 'BUY' | 'SELL') => void
  farosActivos?: FarosAssetItem[]
}) {
  const s = SESGO_STYLES[asset.sesgo] ?? SESGO_STYLES.NEUTRAL
  const tradeDirection: 'BUY' | 'SELL' | null =
    asset.sesgo === 'COMPRA' ? 'BUY' : asset.sesgo === 'VENTA' ? 'SELL' : null
  const fa = farosActivos ? findFarosAsset(asset.simbolo, farosActivos) : undefined

  return (
    <div className={`rounded-xl border p-4 transition-transform hover:scale-[1.02] ${s.bg} ${s.border}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            {asset.simbolo}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {asset.nombre}
          </div>
        </div>
        <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${s.bg} ${s.text} border ${s.border}`}>
          {s.label}
        </span>
      </div>

      {asset.precio > 0 && (
        <div className="mb-3">
          <div className="font-mono text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            ${formatPriceNum(asset.precio)}
          </div>
          <div className={`text-xs font-mono ${asset.cambio24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {asset.cambio24h >= 0 ? '+' : ''}{asset.cambio24h.toFixed(2)}% 24h
          </div>
        </div>
      )}

      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1.5">
          <span style={{ color: 'var(--text-muted)' }}>Confianza</span>
          <span className={`font-semibold ${s.text}`}>{asset.confianza}%</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
          <div className={`h-1.5 rounded-full transition-all duration-700 ${s.bar}`} style={{ width: `${asset.confianza}%` }} />
        </div>
      </div>

      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {asset.razon}
      </p>

      <div className="mt-2.5 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Riesgo:</span>
          <span className={`text-[10px] font-semibold ${RIESGO_COLOR[asset.riesgo] ?? 'text-gray-400'}`}>
            {asset.riesgo?.toUpperCase() ?? '—'}
          </span>
        </div>

        {mt5Connected && tradeDirection && onTrade && (
          <button
            onClick={() => onTrade(asset.simbolo, tradeDirection)}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all hover:scale-105 ${
              tradeDirection === 'BUY'
                ? 'bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/25'
                : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
            }`}
          >
            {tradeDirection === 'BUY' ? '▲ Abrir LONG' : '▼ Abrir SHORT'}
          </button>
        )}
      </div>

      {fa && <FarosAnnotation fa={fa} />}
    </div>
  )
}

// ── AgentRow ───────────────────────────────────────────────────────────────────

function AgentRow({ agent, step, index }: { agent: (typeof AGENTS)[0]; step: number; index: number }) {
  const done = step > index
  const active = step === index

  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 transition-all ${
          done ? 'bg-green-500/20 text-green-400' : active ? 'bg-[var(--gold)]/20 text-[var(--gold)] animate-pulse' : 'text-[var(--text-muted)]'
        }`}
        style={!done && !active ? { background: 'var(--bg-hover)' } : {}}
      >
        {done ? '✓' : agent.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: done ? '#22c55e' : active ? 'var(--gold)' : 'var(--text-muted)' }}>
            {agent.label}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{agent.desc}</span>
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
          {done ? 'Completado ✓' : active ? 'Investigando en tiempo real...' : 'En espera'}
        </div>
      </div>
      {active && (
        <svg className="animate-spin h-4 w-4 flex-shrink-0" style={{ color: 'var(--gold)' }} viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
    </div>
  )
}

// ── MT5 Positions ─────────────────────────────────────────────────────────────

function MT5PositionsList({ positions, loading }: { positions: MT5Position[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Cargando posiciones...
      </div>
    )
  }

  if (positions.length === 0) {
    return (
      <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
        No hay posiciones abiertas en este momento.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {positions.map(pos => {
        const isLong = pos.type === 'POSITION_TYPE_BUY'
        const pnlColor = pos.profit >= 0 ? 'text-green-400' : 'text-red-400'
        return (
          <div key={pos.id} className="card p-3.5 flex items-center gap-3">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ${isLong ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
              {isLong ? '▲ LONG' : '▼ SHORT'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{pos.symbol}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{pos.volume} lotes</span>
              </div>
              <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                Entrada: ${pos.openPrice?.toFixed(5)} → Actual: ${pos.currentPrice?.toFixed(5)}
              </div>
            </div>
            <div className={`text-sm font-mono font-bold flex-shrink-0 ${pnlColor}`}>
              {pos.profit >= 0 ? '+' : ''}{pos.profit?.toFixed(2)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Portfolio Tooltip ──────────────────────────────────────────────────────────

function PortfolioTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1c1917',
      border: '1px solid #292524',
      borderRadius: 10,
      padding: '8px 12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
    }}>
      <p style={{ color: '#C9A84C', fontWeight: 700, fontSize: 12, marginBottom: 2 }}>
        {payload[0]?.name}
      </p>
      <p style={{ color: '#f0ece4', fontSize: 14, fontWeight: 800 }}>
        {payload[0]?.value}%
      </p>
    </div>
  )
}

// ── CFD Signal calculation ─────────────────────────────────────────────────────

const RISK_USD = 10
const RR_RATIO = 2.0

const SL_PCT: Record<string, number> = {
  Crypto:     0.020,
  Acciones:   0.020,
  'Índices':  0.005,
  Divisas:    0.003,
  Materiales: 0.010,
}

const LOT_MULTIPLIER: Record<string, number> = {
  'EUR/USD': 100000, 'GBP/USD': 100000, 'USD/CAD': 100000, 'USD/JPY': 100000,
  'DXY': 10000,
  'ORO': 100, 'PLATA': 5000, 'WTI': 1000,
  'NQ': 2, 'SP500': 0.5, 'RUSSELL': 1, 'DOW': 1,
  'BTC': 1, 'ETH': 10, 'BNB': 10, 'XRP': 10000,
}

function calcSignal(
  asset: AssetAnalysis,
  riskProfile: string,
  faros?: FarosAgentResult,
): CfdSignalCalc {
  const entry = asset.precio
  const slPct = SL_PCT[asset.sector] ?? 0.010
  const slDist = entry * slPct
  const tpDist = slDist * RR_RATIO
  const isCompra = asset.sesgo === 'COMPRA'
  const stopLoss = parseFloat((isCompra ? entry - slDist : entry + slDist).toFixed(5))
  const takeProfit = parseFloat((isCompra ? entry + tpDist : entry - tpDist).toFixed(5))
  const mult = LOT_MULTIPLIER[asset.simbolo] ?? 1
  const rawLot = RISK_USD / (slDist * mult)
  const lotaje = parseFloat(Math.max(0.01, rawLot).toFixed(2))

  const farosAsset = faros?.activos_faros?.find(f => f.symbol === asset.simbolo)

  return {
    simbolo:       asset.simbolo,
    nombre:        asset.nombre,
    sector:        asset.sector,
    sesgo:         asset.sesgo,
    confianza:     asset.confianza,
    razon:         asset.razon,
    precioEntrada: entry,
    stopLoss,
    takeProfit,
    lotaje,
    riesgoUsd:     RISK_USD,
    rrRatio:       RR_RATIO,
    riskProfile,
    farosSesgo:    faros?.sesgo_faros,
    farosRegimen:  faros?.regimen_dominante,
    psiScore:      farosAsset?.psiScore,
    killSwitch:    farosAsset?.killSwitch ?? false,
  }
}

function formatSignalText(s: CfdSignalCalc): string {
  const dir = s.sesgo === 'COMPRA' ? '▲ COMPRA' : '▼ VENTA'
  const slDist = Math.abs(s.precioEntrada - s.stopLoss)
  const tpDist = Math.abs(s.takeProfit - s.precioEntrada)
  const formatP = (n: number) =>
    n >= 1000 ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n.toFixed(5)
  const psiLine = s.psiScore != null ? `  FAROS Ψ: ${(s.psiScore * 100).toFixed(0)}%` : ''
  return [
    `${dir} ${s.simbolo}`,
    `Entrada:     ${formatP(s.precioEntrada)}`,
    `Stop Loss:   ${formatP(s.stopLoss)}  (-${formatP(slDist)})`,
    `Take Profit: ${formatP(s.takeProfit)}  (+${formatP(tpDist)})`,
    `Lotaje:      ${s.lotaje} lotes`,
    `RR: 1:${s.rrRatio}  |  Riesgo: $${s.riesgoUsd.toFixed(2)}`,
    `Confianza: ${s.confianza}%${psiLine}`,
  ].join('\n')
}

// ── SignalCard ─────────────────────────────────────────────────────────────────

function SignalCard({ signal, onCopy }: { signal: CfdSignalCalc; onCopy: (text: string) => void }) {
  const isCompra = signal.sesgo === 'COMPRA'
  const accent = isCompra ? 'text-green-400' : 'text-red-400'
  const bg = isCompra ? 'bg-green-500/10 border-green-500/25' : 'bg-red-500/10 border-red-500/25'
  const formatP = (n: number) =>
    n >= 1000 ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n.toFixed(5)
  const slDist = Math.abs(signal.precioEntrada - signal.stopLoss)
  const tpDist = Math.abs(signal.takeProfit - signal.precioEntrada)

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${bg}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-black ${accent}`}>{isCompra ? '▲' : '▼'} {signal.simbolo}</span>
            {signal.killSwitch && (
              <span className="text-[10px] font-bold text-red-400 bg-red-500/15 border border-red-500/30 px-2 py-0.5 rounded-full animate-pulse">
                VETADO FAROS
              </span>
            )}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{signal.nombre} · {signal.sector}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-xs font-bold ${accent}`}>{signal.confianza}% confianza</div>
          {signal.psiScore != null && (
            <div className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
              FAROS Ψ {(signal.psiScore * 100).toFixed(0)}%
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 font-mono text-xs">
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entrada</div>
          <div className="font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{formatP(signal.precioEntrada)}</div>
        </div>
        <div>
          <div className="text-red-400" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stop Loss</div>
          <div className="font-bold text-red-400 mt-0.5">{formatP(signal.stopLoss)}</div>
          <div className="text-[10px] text-red-400 opacity-70">-{formatP(slDist)}</div>
        </div>
        <div>
          <div className="text-green-400" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Take Profit</div>
          <div className="font-bold text-green-400 mt-0.5">{formatP(signal.takeProfit)}</div>
          <div className="text-[10px] text-green-400 opacity-70">+{formatP(tpDist)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span>
            <span style={{ color: 'var(--text-muted)' }}>Lotaje: </span>
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{signal.lotaje}</span>
          </span>
          <span>
            <span style={{ color: 'var(--text-muted)' }}>RR: </span>
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>1:{signal.rrRatio}</span>
          </span>
          <span>
            <span style={{ color: 'var(--text-muted)' }}>Riesgo: </span>
            <span className="font-bold text-yellow-400">${signal.riesgoUsd}</span>
          </span>
        </div>
        <button
          onClick={() => onCopy(formatSignalText(signal))}
          className="text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all hover:scale-105"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          Copiar
        </button>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AnalisisClient({ isAdmin }: { isAdmin: boolean }) {
  const riskProfile: RiskProfile = 'agresivo'
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [agentStep, setAgentStep] = useState(0)
  const [activeTab, setActiveTab] = useState<ActiveTab>('analisis')

  // MT5 state
  const [mt5Account, setMt5Account] = useState<MT5AccountData | null>(null)
  const [mt5MetaInfo, setMt5MetaInfo] = useState<Record<string, unknown> | null>(null)
  const [mt5Positions, setMt5Positions] = useState<MT5Position[]>([])
  const [mt5PositionsLoading, setMt5PositionsLoading] = useState(false)
  const [tradeModal, setTradeModal] = useState<TradeModalState | null>(null)
  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null)

  // Signals state
  const [copiedSignal, setCopiedSignal] = useState<string | null>(null)
  const [savingSignals, setSavingSignals] = useState(false)
  const [savedCount, setSavedCount] = useState<number | null>(null)
  const [signalHistory, setSignalHistory] = useState<CfdSignalRecord[]>([])
  const [updatingResultado, setUpdatingResultado] = useState<string | null>(null)
  const [skippedSignals, setSkippedSignals] = useState<{ skipped: string[]; updated: string[] } | null>(null)

  const [video, setVideo] = useState<{ youtubeUrl: string; title: string | null }>({ youtubeUrl: '', title: null })
  const [editMode, setEditMode] = useState(false)
  const [editUrl, setEditUrl] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/section-video?section=cfds')
        if (res.ok) { const d = await res.json(); if (d.youtubeUrl) setVideo(d) }
      } catch {}
    })()
  }, [])

  // Auto-run analysis on first mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { runAnalysis() }, [])

  const fetchMt5Account = useCallback(async () => {
    try {
      const res = await fetch('/api/mt5')
      if (res.ok) {
        const data = await res.json()
        setMt5Account(data.connected ? data.account : null)
        setMt5MetaInfo(data.metaInfo ?? null)
      }
    } catch {
      // silently fail — MT5 is optional
    }
  }, [])

  const fetchPositions = useCallback(async () => {
    setMt5PositionsLoading(true)
    try {
      const res = await fetch('/api/mt5/positions')
      if (res.ok) {
        const data = await res.json()
        setMt5Positions(data.positions ?? [])
      }
    } catch {
      setMt5Positions([])
    } finally {
      setMt5PositionsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMt5Account()
  }, [fetchMt5Account])

  useEffect(() => {
    if (activeTab === 'mt5' && mt5Account) {
      fetchPositions()
    }
  }, [activeTab, mt5Account, fetchPositions])

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    setAgentStep(0)

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
        signal: AbortSignal.timeout(70000),
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
      const msg =
        err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')
          ? 'El análisis tardó demasiado. Los mercados están lentos, intenta nuevamente en unos momentos.'
          : err instanceof Error
            ? err.message
            : 'Error al ejecutar el análisis. Intenta nuevamente.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleTrade = (symbol: string, direction: 'BUY' | 'SELL') => {
    setTradeModal({ symbol, direction })
  }

  const handleTradeSuccess = (trade: unknown) => {
    setTradeModal(null)
    const t = trade as { symbol?: string; type?: string } | null
    setTradeSuccess(`Operación ${t?.type === 'BUY' ? 'LONG' : 'SHORT'} en ${t?.symbol ?? ''} ejecutada en MT5`)
    setTimeout(() => setTradeSuccess(null), 5000)
  }

  const loadSignalHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/cfds/signals')
      if (res.ok) setSignalHistory(await res.json())
    } catch {}
  }, [])

  useEffect(() => { loadSignalHistory() }, [loadSignalHistory])

  useEffect(() => {
    if (activeTab === 'senales') loadSignalHistory()
  }, [activeTab, loadSignalHistory])

  const handleCopySignal = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedSignal(text.split('\n')[0])
    setTimeout(() => setCopiedSignal(null), 2500)
  }

  const handleSaveSignals = async (signals: CfdSignalCalc[]) => {
    setSavingSignals(true)
    setSavedCount(null)
    setSkippedSignals(null)

    // Build map of existing PENDIENTE signals by symbol
    const pendingMap = new Map(
      signalHistory
        .filter(s => s.resultado === 'PENDIENTE')
        .map(s => [s.simbolo, s]),
    )

    const toSave: CfdSignalCalc[] = []
    const skipped: string[] = []
    const updated: string[] = []

    for (const sig of signals) {
      const existing = pendingMap.get(sig.simbolo)
      if (!existing) {
        toSave.push(sig)
      } else {
        const dirChanged = existing.sesgo !== sig.sesgo
        const confDiff = Math.abs(sig.confianza - existing.confianza)
        if (dirChanged || confDiff >= 10) {
          // Significant change — save new signal and report
          updated.push(
            dirChanged
              ? `${sig.simbolo} (dirección: ${existing.sesgo}→${sig.sesgo})`
              : `${sig.simbolo} (confianza: ${existing.confianza}%→${sig.confianza}%)`,
          )
          toSave.push(sig)
        } else {
          skipped.push(sig.simbolo)
        }
      }
    }

    if (skipped.length > 0 || updated.length > 0) {
      setSkippedSignals({ skipped, updated })
    }

    if (toSave.length === 0) {
      setSavingSignals(false)
      return
    }

    try {
      const res = await fetch('/api/cfds/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signals: toSave }),
      })
      if (res.ok) {
        const d = await res.json()
        setSavedCount(d.saved ?? toSave.length)
        await loadSignalHistory()
      }
    } catch {} finally {
      setSavingSignals(false)
    }
  }

  const handleUpdateResultado = async (id: string, resultado: string) => {
    setUpdatingResultado(id)
    try {
      await fetch(`/api/cfds/signals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultado }),
      })
      await loadSignalHistory()
    } catch {} finally {
      setUpdatingResultado(null)
    }
  }

  const activosByRanking = result?.activos ? [...result.activos].sort((a, b) => b.confianza - a.confianza) : []

  // All candidates: confianza >=70, sesgo direccional
  const allCandidates: CfdSignalCalc[] = result
    ? result.activos
        .filter(a => a.confianza >= 70 && a.sesgo !== 'NEUTRAL')
        .map(a => calcSignal(a, riskProfile, result.faros))
    : []

  // FAROS filter: aprobadas = no killSwitch (or no faros data for that asset)
  const signalActivos = allCandidates.filter(s => !s.killSwitch)
  const signalesVetadas = allCandidates.filter(s => s.killSwitch)

  const sesgoGeneral = result?.estrategia?.sesgo_general ?? 'NEUTRAL'
  const gs = GENERAL_STYLES[sesgoGeneral] ?? GENERAL_STYLES.NEUTRAL

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-black gradient-gold mb-1">CFDs</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          7 agentes de IA determinan el sesgo intradía del mercado — conecta MT5 para ejecutar operaciones directamente
        </p>
      </div>

      {/* Video admin */}
      <div className="rounded-xl border p-5 mb-4" style={{ borderColor: 'rgba(201,168,76,0.18)', background: 'linear-gradient(135deg, rgba(201,168,76,0.04) 0%, transparent 70%)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-mono tracking-widest" style={{ color: 'var(--gold)' }}>VIDEO DEL PROFESIONAL</p>
          {isAdmin && (
            <button
              onClick={() => { setEditMode(!editMode); if (!editMode) { setEditUrl(video.youtubeUrl); setEditTitle(video.title || '') } }}
              className="text-[10px] font-mono tracking-widest px-3 py-1 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--gold)]"
            >
              {editMode ? 'CANCELAR' : 'EDITAR'}
            </button>
          )}
        </div>
        {editMode && (
          <div className="space-y-3 mb-4">
            <input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="URL de YouTube" className="w-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] text-xs px-4 py-2 rounded-lg focus:outline-none focus:border-[var(--gold-dark)] font-mono" />
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Título (opcional)" className="w-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] text-xs px-4 py-2 rounded-lg focus:outline-none focus:border-[var(--gold-dark)] font-mono" />
            <button onClick={async () => { setSaving(true); try { const r = await fetch('/api/section-video', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section: 'cfds', youtubeUrl: editUrl, title: editTitle }) }); if (r.ok) { setVideo({ youtubeUrl: editUrl, title: editTitle }); setEditMode(false) } } catch {} finally { setSaving(false) } }} disabled={!editUrl || saving} className="px-4 py-2 text-xs font-mono tracking-widest rounded-lg bg-[var(--gold)] text-black disabled:opacity-50">{saving ? 'GUARDANDO…' : 'GUARDAR'}</button>
          </div>
        )}
        {video.youtubeUrl ? (
          <div className="aspect-video rounded-lg overflow-hidden">
            <iframe src={`https://www.youtube.com/embed/${(video.youtubeUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/)||[])[1] || ''}`} title={video.title || 'Video'} className="w-full h-full" allowFullScreen />
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed rounded-lg" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs text-[var(--text-muted)]">El administrador aún no ha publicado un video para esta sección.</p>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {[
          { id: 'analisis' as ActiveTab, label: '🔍 Análisis de Mercado' },
          { id: 'senales' as ActiveTab, label: `📋 Señales CFD${signalActivos.length > 0 ? ` (${signalActivos.length}✓${signalesVetadas.length > 0 ? ` ${signalesVetadas.length}✕` : ''})` : ''}` },
          { id: 'mt5' as ActiveTab, label: `🤖 Trading MT5${mt5Account ? ' ✓' : ''}` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/30'
                : 'hover:bg-white/5'
            }`}
            style={activeTab !== tab.id ? { color: 'var(--text-muted)' } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Copy toast ── */}
      {copiedSignal && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm text-green-400 flex items-center gap-2">
          ✓ Señal copiada: {copiedSignal}
        </div>
      )}

      {/* ── Señales CFD Tab ── */}
      {activeTab === 'senales' && (
        <div className="space-y-6">
          {/* Explainer FAROS */}
          <div className="rounded-xl border p-5 space-y-3" style={{ background: 'rgba(201,168,76,0.04)', borderColor: 'rgba(201,168,76,0.18)' }}>
            <p className="text-[10px] font-mono tracking-widest" style={{ color: 'var(--gold)' }}>FAROS v7.0 — QUÉ HACE Y POR QUÉ IMPORTA</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Los 5 agentes estándar analizan solo el precio del día (cambio 24h). <strong className="text-[var(--text-secondary)]">FAROS añade la dimensión de régimen de mercado</strong> usando 30 días de OHLCV y física de fluidos (Navier-Stokes):
              Z-Score termodinámico · Reynolds% (turbulencia) · αflow (demanda orgánica) · Ψ Governance.
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <strong className="text-yellow-400">Sin FAROS</strong>: una señal COMPRA BTC al 82% confianza en régimen PLASMA (euforia extrema, Reynolds{'>'}90%) parece igual de válida que en régimen LÍQUIDO saludable.{' '}
              <strong className="text-[var(--text-secondary)]">Con FAROS</strong>: la señal se marca como <span className="text-red-400 font-bold">VETADA</span> cuando killSwitch=true — independiente del sesgo del agente.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {[
                { k: 'Z-Score', v: 'Estado termodinámico. LÍQUIDO=OK, PLASMA=veto' },
                { k: 'Reynolds%', v: '<50% laminar · >75% turbulento · >95% colapso' },
                { k: 'αflow', v: 'Cerca 1=orgánico · cerca 0=manipulado' },
                { k: 'Ψ Score', v: '>0.6 señal fuerte · =0 Kill Switch activo' },
              ].map(item => (
                <div key={item.k} className="rounded-lg p-2.5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div className="text-[10px] font-bold font-mono mb-1" style={{ color: 'var(--gold)' }}>{item.k}</div>
                  <div className="text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* No analysis yet */}
          {!result && (
            <div className="rounded-xl border p-8 text-center" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
              <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                Primero corre el análisis de mercado para generar señales con confianza ≥70%.
              </p>
              <button
                onClick={() => setActiveTab('analisis')}
                className="text-xs px-4 py-2 rounded-lg border transition-all hover:bg-white/5"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                Ir a Análisis de Mercado
              </button>
            </div>
          )}

          {/* Signals from current analysis */}
          {result && signalActivos.length === 0 && (
            <div className="rounded-xl border p-6 text-center" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Ningún activo alcanzó ≥70% de confianza con sesgo direccional en este análisis.
              </p>
            </div>
          )}

          {result && signalActivos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    Señales activas — Cuenta $1,000 · Riesgo 1% ($10)
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                    {signalActivos.length} activo{signalActivos.length !== 1 ? 's' : ''} con confianza ≥70% · RR 1:2
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleSaveSignals(signalActivos)}
                    disabled={savingSignals}
                    className="text-xs font-bold px-4 py-2 rounded-lg border transition-all hover:scale-105 disabled:opacity-50"
                    style={{ background: 'rgba(201,168,76,0.1)', borderColor: 'rgba(201,168,76,0.3)', color: 'var(--gold)' }}
                  >
                    {savingSignals ? 'Guardando...' : 'Guardar en DB'}
                  </button>
                )}
              </div>

              {isAdmin && savedCount != null && (
                <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm text-green-400">
                  ✓ {savedCount} señal{savedCount !== 1 ? 'es' : ''} guardada{savedCount !== 1 ? 's' : ''} en Supabase
                </div>
              )}

              {isAdmin && skippedSignals && (skippedSignals.skipped.length > 0 || skippedSignals.updated.length > 0) && (
                <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/8 px-4 py-3 space-y-1">
                  {skippedSignals.skipped.length > 0 && (
                    <p className="text-xs text-yellow-400">
                      <span className="font-bold">Sin cambios — no guardadas:</span>{' '}
                      {skippedSignals.skipped.join(', ')} ya tienen señal PENDIENTE activa con score similar.
                    </p>
                  )}
                  {skippedSignals.updated.length > 0 && (
                    <p className="text-xs text-orange-400">
                      <span className="font-bold">Score cambió — guardadas de nuevo:</span>{' '}
                      {skippedSignals.updated.join(' · ')}
                    </p>
                  )}
                </div>
              )}

              {signalActivos.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {signalActivos.map((sig, i) => (
                    <SignalCard key={`${sig.simbolo}-${i}`} signal={sig} onCopy={handleCopySignal} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border p-5 text-center" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Ninguna señal aprobada por FAROS. Todos los candidatos con ≥70% confianza tienen Kill Switch activo.
                  </p>
                </div>
              )}

              {/* Vetadas por FAROS */}
              {signalesVetadas.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px" style={{ background: 'rgba(239,68,68,0.2)' }} />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 flex-shrink-0">
                      ✕ FAROS vetó {signalesVetadas.length} señal{signalesVetadas.length !== 1 ? 'es' : ''} — Kill Switch activo
                    </p>
                    <div className="flex-1 h-px" style={{ background: 'rgba(239,68,68,0.2)' }} />
                  </div>
                  <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    Los agentes recomendaron estas entradas pero FAROS detectó turbulencia extrema (Reynolds% &gt;90% o régimen STRUCTURAL_BREAK). Ψ forzado a 0. No operar.
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 opacity-50 pointer-events-none select-none">
                    {signalesVetadas.map((sig, i) => (
                      <SignalCard key={`veto-${sig.simbolo}-${i}`} signal={sig} onCopy={() => {}} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Signal history */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Historial de señales guardadas
              </p>
              <button
                onClick={loadSignalHistory}
                className="text-[10px] px-2.5 py-1 rounded-lg border transition-all"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                Actualizar
              </button>
            </div>

            {signalHistory.length === 0 ? (
              <div className="rounded-xl border p-4 text-center text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                No hay señales guardadas aún. Corre un análisis y haz clic en &quot;Guardar en DB&quot;.
              </div>
            ) : (
              <div className="space-y-2">
                {/* Stats */}
                {(() => {
                  const ganadas = signalHistory.filter(s => s.resultado === 'GANADA').length
                  const perdidas = signalHistory.filter(s => s.resultado === 'PERDIDA').length
                  const total = ganadas + perdidas
                  const wr = total > 0 ? ((ganadas / total) * 100).toFixed(0) : '—'
                  const pnl = signalHistory.reduce((acc, s) => acc + (s.pnlUsd ?? 0), 0)
                  return (
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { label: 'Win Rate', value: `${wr}%`, color: 'text-green-400' },
                        { label: 'Operaciones', value: `${total}/${signalHistory.length}`, color: 'var(--text-primary)' },
                        { label: 'PnL Total', value: `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`, color: pnl >= 0 ? 'text-green-400' : 'text-red-400' },
                      ].map(stat => (
                        <div key={stat.label} className="rounded-xl border p-3 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                          <div className={`text-lg font-black font-mono ${stat.color}`} style={typeof stat.color === 'string' && stat.color.startsWith('var') ? { color: stat.color } : {}}>{stat.value}</div>
                          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  )
                })()}

                {/* History rows */}
                {signalHistory.map(sig => {
                  const isCompra = sig.sesgo === 'COMPRA'
                  const resultColor: Record<string, string> = {
                    GANADA: 'text-green-400', PERDIDA: 'text-red-400',
                    BREAKEVEN: 'text-yellow-400', PENDIENTE: 'text-gray-400',
                  }
                  const formatP = (n: number) =>
                    n >= 1000 ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n.toFixed(5)
                  return (
                    <div key={sig.id} className="rounded-xl border p-3.5 flex items-center gap-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ${isCompra ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                        {isCompra ? '▲' : '▼'} {sig.simbolo}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                            {formatP(sig.precioEntrada)}
                          </span>
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            SL {formatP(sig.stopLoss)} · TP {formatP(sig.takeProfit)} · {sig.lotaje} lotes
                          </span>
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {new Date(sig.createdAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                          {sig.killSwitch && <span className="ml-1 text-red-400">· VETADO FAROS</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[11px] font-bold ${resultColor[sig.resultado] ?? 'text-gray-400'}`}>
                          {sig.resultado}
                        </span>
                        {isAdmin && (
                          <select
                            value={sig.resultado}
                            disabled={updatingResultado === sig.id}
                            onChange={e => handleUpdateResultado(sig.id, e.target.value)}
                            className="text-[10px] rounded-lg px-2 py-1 border"
                            style={{ background: 'var(--bg-hover)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                          >
                            {['PENDIENTE', 'GANADA', 'PERDIDA', 'BREAKEVEN'].map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Trade success toast ── */}
      {tradeSuccess && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400 flex items-center gap-2">
          ✓ {tradeSuccess}
        </div>
      )}

      {/* ── MT5 Tab ── */}
      {activeTab === 'mt5' && (
        <div className="space-y-5">
          <MT5ConnectPanel
            account={mt5Account}
            metaInfo={mt5MetaInfo as Record<string, number & string> | null}
            onConnected={() => { fetchMt5Account(); fetchPositions() }}
            onDisconnected={() => { setMt5Account(null); setMt5MetaInfo(null); setMt5Positions([]) }}
          />

          {mt5Account && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  Posiciones abiertas
                </p>
                <button
                  onClick={fetchPositions}
                  className="text-xs px-2 py-1 rounded-lg border transition-colors"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                >
                  Actualizar
                </button>
              </div>
              <MT5PositionsList positions={mt5Positions} loading={mt5PositionsLoading} />
            </div>
          )}

          {!mt5Account && (
            <div className="rounded-xl border p-4 text-xs" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>¿Cómo funciona el trading automático?</p>
              <ol className="list-decimal pl-4 space-y-1 leading-relaxed">
                <li>Crea una cuenta gratuita en <strong className="text-yellow-400">metaapi.cloud</strong></li>
                <li>Agrega tu cuenta MT5 (login, password, servidor) en MetaAPI</li>
                <li>Pega el Account ID aquí y conecta</li>
                <li>Corre el análisis de mercado — aparecerán botones para abrir operaciones directamente en tu MT5</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {/* ── Analysis Tab ── */}
      {activeTab === 'analisis' && (
        <div className="space-y-6">
          {/* CTA */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30">
                🚀 Perfil Agresivo
              </span>
              <span style={{ color: 'var(--text-muted)' }}>Máximo potencial — análisis se ejecuta automáticamente al entrar</span>
            </div>

            {mt5Account && (
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                MT5 conectado — {mt5Account.accountName ?? `MT5 #${mt5Account.login}`}. Los activos con sesgo tendrán botón de ejecución.
              </div>
            )}

            <button
              onClick={runAnalysis}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all btn-gold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analizando mercados...
                </span>
              ) : (
                '🔍 Analizar Mercados'
              )}
            </button>
          </div>

          {/* Agent status */}
          {loading && (
            <div className="card p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
                Agentes trabajando en paralelo
              </p>
              <div className="space-y-3.5">
                {AGENTS.map((agent, i) => (
                  <AgentRow key={agent.key} agent={agent} step={agentStep} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
              ⚠️ {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-5">
              {result.estrategia && (
                <div className={`rounded-xl border p-6 ${gs.bg} ${gs.border}`}>
                  <div className="flex items-start gap-5">
                    <div className={`text-5xl font-black flex-shrink-0 leading-none mt-1 ${gs.text}`}>{gs.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                          Sesgo General del Mercado
                        </span>
                        <span className={`text-xl font-black ${gs.text}`}>{gs.label}</span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {result.estrategia.resumen}
                      </p>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-xl p-3.5" style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}>
                          <div className="text-xs font-semibold text-green-400 mb-1.5">💡 Oportunidad destacada</div>
                          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                            {result.estrategia.oportunidad_destacada}
                          </p>
                        </div>
                        <div className="rounded-xl p-3.5" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                          <div className="text-xs font-semibold text-red-400 mb-1.5">⚠️ Alerta de riesgo</div>
                          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                            {result.estrategia.alerta_riesgo}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {result.faros && <FarosPanel faros={result.faros} />}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {result.estrategia?.distribucion && result.estrategia.distribucion.length > 0 && (
                  <div className="card p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
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
                        <Tooltip content={<PortfolioTooltip />} />
                        <Legend formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="card p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
                    Rankings por Confianza
                  </p>
                  <div className="space-y-3">
                    {activosByRanking.slice(0, 10).map((asset, i) => {
                      const s = SESGO_STYLES[asset.sesgo] ?? SESGO_STYLES.NEUTRAL
                      return (
                        <div key={`${asset.simbolo}-${i}`} className="flex items-center gap-2.5">
                          <span className="text-xs font-mono w-4 text-right flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0 w-14 text-center ${s.bg} ${s.text} border ${s.border}`}>
                            {asset.simbolo.length > 6 ? asset.simbolo.slice(0, 6) : asset.simbolo}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-xs mb-1">
                              <span className={`text-[11px] ${s.text}`}>{s.label}</span>
                              <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{asset.confianza}%</span>
                            </div>
                            <div className="h-1 rounded-full" style={{ background: 'var(--border)' }}>
                              <div className={`h-1 rounded-full transition-all duration-700 ${s.bar}`} style={{ width: `${asset.confianza}%` }} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {SECTOR_ORDER.map(sector => {
                const sectorActivos = result.activos.filter(a => a.sector === sector)
                if (sectorActivos.length === 0) return null
                return (
                  <div key={sector}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                      {sector}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {sectorActivos.map((asset, i) => (
                        <AssetCard
                          key={`${asset.simbolo}-${i}`}
                          asset={asset}
                          mt5Connected={!!mt5Account}
                          onTrade={handleTrade}
                          farosActivos={result.faros?.activos_faros}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}

              <div className="space-y-3">
                <p className="text-xs text-center" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                  Análisis generado:{' '}
                  {new Date(result.timestamp).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}{' '}
                  · Perfil: {result.riskProfile}
                </p>
                <div className="rounded-xl p-4 text-xs text-center leading-relaxed" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)', opacity: 0.7 }}>
                  ⚠️ Este análisis es informativo y educativo. No constituye asesoría financiera. Siempre
                  verifica la información antes de tomar decisiones de inversión o trading.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Trade Modal ── */}
      {tradeModal && (
        <MT5TradeModal
          symbol={tradeModal.symbol}
          direction={tradeModal.direction}
          onClose={() => setTradeModal(null)}
          onSuccess={handleTradeSuccess}
        />
      )}
    </div>
  )
}
