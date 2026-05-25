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
import BrokerExecuteDropdown from '@/app/dashboard/brokers/components/BrokerExecuteDropdown'

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

// FAROS types kept for dead-code component functions — not used in new pipeline
interface FarosAssetItem {
  symbol: string; zScore: number; thermodynamicState: string; reynoldsPercentile: number
  entropy: number; alphaFlow: number; psiScore: number; marketRegime: string
  governanceSignal: string; killSwitch: boolean; trendStrength5d: number
}
interface FarosAgentResult {
  sesgo_faros: 'ALCISTA' | 'BAJISTA' | 'NEUTRAL' | 'KILL_SWITCH'; regimen_dominante: string
  activos_faros: FarosAssetItem[]; resumen_faros: string; kill_switch_activos: string[]
  oportunidades_faros: string; advertencias_faros: string
}

interface AnalysisResult {
  timestamp: string
  riskProfile: string
  activos: AssetAnalysis[]
  estrategia: EstrategiaResult | null
}

interface MT5AccountData {
  id: string
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
type ActiveTab = 'analisis' | 'senales'

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
  { key: 'acciones',   label: 'Acciones',   icon: '📈', desc: 'S&P 500 top picks' },
  { key: 'indices',    label: 'Índices',    icon: '📊', desc: 'Nasdaq, SP500, Russell, Dow, VIX' },
  { key: 'divisas',    label: 'Divisas',    icon: '💱', desc: 'DXY, EUR/USD, JPY, CAD, GBP' },
  { key: 'materiales', label: 'Materias',   icon: '🏗️', desc: 'Oro, Petróleo, Plata' },
  { key: 'estrategia', label: 'Estrategia', icon: '🎯', desc: 'Portafolio global' },
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

// ── FAROS helpers REMOVED ─────────────────────────────────────────────────────
// (TAI-ACF Framework removed — using 6 MAIA agents only)

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

// ── AssetCard (with BrokerExecuteDropdown + FAROS annotation) ──────────────

function AssetCard({ asset, farosActivos }: {
  asset: AssetAnalysis
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

        {tradeDirection && (
          <BrokerExecuteDropdown signal={{
            ticker: asset.simbolo,
            direction: tradeDirection,
            source: 'cfd_signal',
            signalData: { simbolo: asset.simbolo, sesgo: asset.sesgo, confianza: asset.confianza, precio: asset.precio },
          }} />
        )}
      </div>

      {fa && <FarosAnnotation fa={fa} />}
    </div>
  )
}

// ── SectorTable ────────────────────────────────────────────────────────────────

const SECTOR_TITLES: Record<string, string> = {
  Crypto:     'RECOMENDACIONES CRYPTO',
  Acciones:   'RECOMENDACIONES ACCIONES',
  'Índices':  'RECOMENDACIONES ÍNDICES',
  Divisas:    'RECOMENDACIONES DIVISAS',
  Materiales: 'RECOMENDACIONES MATERIALES',
}

function SectorTable({ sector, activos }: { sector: string; activos: AssetAnalysis[] }) {
  const title = SECTOR_TITLES[sector] ?? `RECOMENDACIONES ${sector.toUpperCase()}`
  const signals = activos.filter(a => a.sesgo !== 'NEUTRAL' && a.confianza >= 70)
  const sorted = [...activos].sort((a, b) => b.confianza - a.confianza)
  const fmtP = (n: number) =>
    n >= 10000 ? n.toLocaleString('en-US', { minimumFractionDigits: 0 })
    : n >= 100  ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : n.toFixed(5)

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border)' }}>
        <span className="text-[10px] font-mono tracking-widest font-bold" style={{ color: 'var(--gold)' }}>{title}</span>
        {signals.length > 0 && (
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-[var(--gold)]/30 text-[var(--gold)]">
            {signals.length} señal{signals.length !== 1 ? 'es' : ''}
          </span>
        )}
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
              {['Símbolo', 'Nombre', 'Dir', 'Conf', 'Entrada', 'Stop Loss', 'Take Profit', 'Razón'].map(h => (
                <th key={h} className="px-3 py-1.5 text-left whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(asset => {
              const isSignal = asset.sesgo !== 'NEUTRAL' && asset.confianza >= 70
              const isCompra = asset.sesgo === 'COMPRA'
              const isVenta  = asset.sesgo === 'VENTA'
              // Compute estimated SL/TP
              const SL_PCT: Record<string, number> = { Crypto: 0.02, Acciones: 0.02, 'Índices': 0.005, Divisas: 0.003, Materiales: 0.01 }
              const slPct = SL_PCT[asset.sector] ?? 0.01
              const slDist = asset.precio * slPct
              const tpDist = slDist * 2
              const sl = isCompra ? asset.precio - slDist : asset.precio + slDist
              const tp = isCompra ? asset.precio + tpDist : asset.precio - tpDist

              return (
                <tr
                  key={asset.simbolo}
                  className="border-b border-[var(--border)] transition-colors hover:bg-white/5"
                  style={{
                    opacity: !isSignal ? 0.45 : 1,
                    borderLeft: isSignal ? `3px solid ${isCompra ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}` : undefined,
                  }}
                >
                  <td className="px-3 py-2 font-bold whitespace-nowrap" style={{ color: isSignal ? 'var(--gold)' : 'var(--text-muted)' }}>
                    {asset.simbolo}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-[10px]" style={{ color: 'var(--text-secondary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {asset.nombre}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {asset.sesgo !== 'NEUTRAL' ? (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isCompra ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
                        {asset.sesgo}
                      </span>
                    ) : (
                      <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap" style={{ color: asset.confianza >= 80 ? 'var(--gold)' : asset.confianza >= 70 ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                    {asset.confianza}%
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {isSignal ? fmtP(asset.precio) : '—'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-red-400">
                    {isSignal ? fmtP(sl) : '—'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-green-400">
                    {isSignal ? fmtP(tp) : '—'}
                  </td>
                  <td className="px-3 py-2" style={{ color: 'var(--text-muted)', maxWidth: '200px' }}>
                    <span title={asset.razon}>
                      {asset.razon.length > 65 ? asset.razon.slice(0, 65) + '…' : asset.razon}
                    </span>
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

function calcSignal(asset: AssetAnalysis, riskProfile: string): CfdSignalCalc {
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
  }
}

function formatSignalText(s: CfdSignalCalc): string {
  const dir = s.sesgo === 'COMPRA' ? '▲ COMPRA' : '▼ VENTA'
  const slDist = Math.abs(s.precioEntrada - s.stopLoss)
  const tpDist = Math.abs(s.takeProfit - s.precioEntrada)
  const formatP = (n: number) =>
    n >= 1000 ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n.toFixed(5)
  return [
    `${dir} ${s.simbolo}`,
    `Entrada:     ${formatP(s.precioEntrada)}`,
    `Stop Loss:   ${formatP(s.stopLoss)}  (-${formatP(slDist)})`,
    `Take Profit: ${formatP(s.takeProfit)}  (+${formatP(tpDist)})`,
    `Lotaje:      ${s.lotaje} lotes`,
    `RR: 1:${s.rrRatio}  |  Riesgo: $${s.riesgoUsd.toFixed(2)}`,
    `Confianza: ${s.confianza}%`,
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
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{signal.nombre} · {signal.sector}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-xs font-bold ${accent}`}>{signal.confianza}% confianza</div>
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
        <div className="flex items-center gap-2">
          <BrokerExecuteDropdown signal={{
            ticker: signal.simbolo,
            direction: signal.sesgo as 'COMPRA' | 'VENTA',
            source: 'cfd_signal',
            signalData: { simbolo: signal.simbolo, sesgo: signal.sesgo, precioEntrada: signal.precioEntrada, stopLoss: signal.stopLoss, takeProfit: signal.takeProfit, lotaje: signal.lotaje },
          }} />
          <button
            onClick={() => onCopy(formatSignalText(signal))}
            className="text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all hover:scale-105"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            Copiar
          </button>
        </div>
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

  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null)

  // Signals state
  const [copiedSignal, setCopiedSignal] = useState<string | null>(null)
  const [savingSignals, setSavingSignals] = useState(false)
  const [savedCount, setSavedCount] = useState<number | null>(null)
  const [signalHistory, setSignalHistory] = useState<CfdSignalRecord[]>([])
  const [updatingResultado, setUpdatingResultado] = useState<string | null>(null)
  const [clearingSignals, setClearingSignals] = useState(false)
  const [rowEdits, setRowEdits] = useState<Record<string, { resultado: string; pnlUsd: string; closedPrice: string }>>({})
  const [skippedSignals, setSkippedSignals] = useState<{ skipped: string[]; updated: string[] } | null>(null)


  // History table state
  const [refreshing, setRefreshing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'user'>('admin')
  const [confirmModal, setConfirmModal] = useState<{
    type: 'all' | 'selected' | 'single'
    ids?: string[]
    count: number
    onConfirm: () => void
  } | null>(null)

  const [showAnalisisGuide, setShowAnalisisGuide] = useState(false)
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

      // Auto-save recommendations (admin): auto-close expired signals + save new ones
      if (isAdmin) {
        const candidates: CfdSignalCalc[] = data.activos
          .filter(a => a.confianza >= 70 && a.sesgo !== 'NEUTRAL')
          .map(a => calcSignal(a, riskProfile))
        if (candidates.length > 0) {
          handleSaveSignals(candidates, data.activos)
        }
      }
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

  const loadSignalHistory = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/cfds/signals')
      if (res.ok) setSignalHistory(await res.json())
      else setTradeSuccess('Error al cargar historial de señales')
    } catch {
      setTradeSuccess('Error de red al cargar historial')
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadSignalHistory() }, [loadSignalHistory])

  // Auto-refresh every 30s when signals tab is active
  useEffect(() => {
    if (activeTab !== 'senales') return
    const id = setInterval(loadSignalHistory, 30_000)
    return () => clearInterval(id)
  }, [activeTab, loadSignalHistory])

  useEffect(() => {
    if (activeTab === 'senales') loadSignalHistory()
  }, [activeTab, loadSignalHistory])

  const handleCopySignal = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedSignal(text.split('\n')[0])
    setTimeout(() => setCopiedSignal(null), 2500)
  }

  const handleSaveSignals = async (signals: CfdSignalCalc[], analysisActivos?: AssetAnalysis[]) => {
    setSavingSignals(true)
    setSavedCount(null)
    setSkippedSignals(null)

    // ── Step 1: Auto-close PENDIENTE signals that hit TP or SL ──
    const activos = analysisActivos ?? result?.activos ?? []
    const priceMap: Record<string, number> = {}
    for (const a of activos) priceMap[a.simbolo] = a.precio

    const pendingSignals = signalHistory.filter(s => s.resultado === 'PENDIENTE')
    for (const sig of pendingSignals) {
      const currentPrice = priceMap[sig.simbolo]
      if (currentPrice == null || currentPrice <= 0) continue
      const isCompra = sig.sesgo === 'COMPRA'
      const hitTP = isCompra ? currentPrice >= sig.takeProfit : currentPrice <= sig.takeProfit
      const hitSL = isCompra ? currentPrice <= sig.stopLoss  : currentPrice >= sig.stopLoss
      if (!hitTP && !hitSL) continue
      const resultado = hitTP ? 'GANADA' : 'PERDIDA'
      const slDist = Math.abs(sig.precioEntrada - sig.stopLoss)
      const pnlUsd = isCompra
        ? ((currentPrice - sig.precioEntrada) / slDist) * 10
        : ((sig.precioEntrada - currentPrice) / slDist) * 10
      try {
        await fetch(`/api/cfds/signals/${sig.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resultado, closedPrice: currentPrice, pnlUsd: parseFloat(pnlUsd.toFixed(2)) }),
        })
      } catch {}
    }
    if (pendingSignals.length > 0) await loadSignalHistory()

    // ── Step 2: Build map of still-PENDIENTE signals (after auto-close) ──
    // Fetch fresh list to know which are still blocked
    let freshHistory = signalHistory
    try {
      const fr = await fetch('/api/cfds/signals')
      if (fr.ok) {
        const json = await fr.json()
        freshHistory = json.recommendations ?? json ?? signalHistory
        setSignalHistory(freshHistory)
      }
    } catch {}

    const pendingMap = new Map(
      freshHistory
        .filter((s: CfdSignalRecord) => s.resultado === 'PENDIENTE')
        .map((s: CfdSignalRecord) => [s.simbolo, s]),
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

  const handleSaveRow = async (id: string) => {
    const edit = rowEdits[id]
    if (!edit) return
    setUpdatingResultado(id)
    try {
      await fetch(`/api/cfds/signals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultado: edit.resultado,
          pnlUsd: edit.pnlUsd !== '' ? Number(edit.pnlUsd) : undefined,
          closedPrice: edit.closedPrice !== '' ? Number(edit.closedPrice) : undefined,
        }),
      })
      setRowEdits(prev => { const n = { ...prev }; delete n[id]; return n })
      await loadSignalHistory()
    } catch {} finally {
      setUpdatingResultado(null)
    }
  }

  const handleClearSignals = () => {
    setConfirmModal({
      type: 'all',
      count: signalHistory.length,
      onConfirm: async () => {
        setClearingSignals(true)
        try {
          await fetch('/api/cfds/signals', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
          setSelectedIds(new Set())
          await loadSignalHistory()
        } catch {} finally {
          setClearingSignals(false)
        }
      },
    })
  }

  const handleDeleteSelected = () => {
    const ids = [...selectedIds]
    setConfirmModal({
      type: 'selected',
      ids,
      count: ids.length,
      onConfirm: async () => {
        setClearingSignals(true)
        try {
          await fetch('/api/cfds/signals', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
          })
          setSelectedIds(new Set())
          await loadSignalHistory()
        } catch {} finally {
          setClearingSignals(false)
        }
      },
    })
  }

  const activosByRanking = result?.activos ? [...result.activos].sort((a, b) => b.confianza - a.confianza) : []

  // Candidates from manual analysis (for signals tab history reference)
  const allCandidates: CfdSignalCalc[] = result
    ? result.activos
        .filter(a => a.confianza >= 70 && a.sesgo !== 'NEUTRAL')
        .map(a => calcSignal(a, riskProfile))
    : []

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
          { id: 'senales' as ActiveTab, label: `📊 Track Record${signalHistory.filter(s => s.confianza >= 80).length > 0 ? ` (${signalHistory.filter(s => s.confianza >= 80).length})` : ''}` },
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

      {/* ── Track Record Tab ── */}
      {activeTab === 'senales' && (
        <div className="space-y-4">
          {/* Header with stats */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-mono tracking-widest font-bold" style={{ color: 'var(--gold)' }}>TRACK RECORD CFD</p>
              {signalHistory.filter(s => s.confianza >= 80).length > 0 && (() => {
                const filtered = signalHistory.filter(s => s.confianza >= 80)
                const ganadas = filtered.filter(s => s.resultado === 'GANADA').length
                const cerradas = filtered.filter(s => s.resultado !== 'PENDIENTE').length
                const totalPnl = filtered.reduce((sum, s) => sum + (s.pnlUsd ?? 0), 0)
                const wr = cerradas > 0 ? Math.round((ganadas / cerradas) * 100) : null
                return (
                  <div className="flex items-center gap-3 text-[9px] font-mono flex-wrap">
                    <span style={{ color: 'var(--text-muted)' }}>{filtered.length} ops ≥80%</span>
                    {wr !== null && <span className={wr >= 50 ? 'text-green-400' : 'text-red-400'}>{wr}% WR</span>}
                    <span className={totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}>{totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(0)} USD</span>
                  </div>
                )
              })()}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isAdmin && (
                <>
                  <button
                    onClick={() => setAdminViewMode(m => m === 'admin' ? 'user' : 'admin')}
                    className="label-mono text-[9px] px-2 py-1 rounded-lg border"
                    style={{ borderColor: adminViewMode !== 'admin' ? 'rgba(201,168,76,0.5)' : 'var(--border)', color: adminViewMode !== 'admin' ? 'var(--gold)' : 'var(--text-muted)' }}
                  >
                    {adminViewMode === 'admin' ? '👁 Usuario' : '⚙ Admin'}
                  </button>
                  {selectedIds.size > 0 && (
                    <button onClick={handleDeleteSelected} disabled={clearingSignals} className="label-mono text-[9px] px-2 py-1 rounded-lg border" style={{ borderColor: 'rgba(239,68,68,0.4)', color: 'rgb(239,68,68)' }}>
                      Borrar sel. ({selectedIds.size})
                    </button>
                  )}
                  {signalHistory.length > 0 && (
                    <button onClick={handleClearSignals} disabled={clearingSignals} className="label-mono text-[9px] px-2 py-1 rounded-lg border" style={{ borderColor: 'rgba(239,68,68,0.3)', color: 'rgba(239,68,68,0.7)' }}>
                      {clearingSignals ? 'Borrando...' : 'Borrar todo'}
                    </button>
                  )}
                </>
              )}
              <button onClick={loadSignalHistory} disabled={refreshing} className="label-mono text-[9px] px-2 py-1 rounded-lg border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                {refreshing ? '...' : '↺'}
              </button>
            </div>
          </div>

          {/* Auto-save info */}
          <p className="text-[10px] font-mono mb-3" style={{ color: 'var(--text-muted)' }}>
            Las señales con confianza ≥ 80% se guardan automáticamente cada día a las 10am ET desde el análisis de mercado.
          </p>

          {/* Table filtered ≥80% */}
          {signalHistory.filter(s => s.confianza >= 80).length === 0 ? (
            <div className="rounded-xl border p-8 text-center" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
              <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Sin señales con confianza ≥ 80%.</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>Las señales se guardan automáticamente al ejecutar el análisis.</p>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] font-mono">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)' }}>
                      {['Fecha', 'Par', 'Dir', 'Entrada', 'SL', 'TP', 'Lotes', 'Conf', 'Resultado', 'P&L USD', ...(isAdmin && adminViewMode === 'admin' ? ['Acc.'] : [])].map(h => (
                        <th key={h} className="px-2.5 py-2 text-left whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {signalHistory.filter(s => s.confianza >= 80).map(sig => {
                      const isDirty = rowEdits[sig.id] !== undefined
                      const edit = rowEdits[sig.id]
                      const isClosed = sig.resultado !== 'PENDIENTE'
                      return (
                        <tr
                          key={sig.id}
                          className="border-b border-[var(--border)]"
                          style={{
                            opacity: isClosed ? 0.6 : 1,
                            filter: isClosed ? 'saturate(0.5)' : undefined,
                          }}
                        >
                          <td className="px-2.5 py-2 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                            {new Date(sig.createdAt).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', timeZone: 'America/Guayaquil' })}
                          </td>
                          <td className="px-2.5 py-2 font-bold whitespace-nowrap" style={{ color: 'var(--gold)' }}>
                            {sig.simbolo}
                            {sig.razon?.startsWith('[Auto 10am ET]') && (
                              <span className="ml-1.5 text-[8px] font-mono px-1 py-0.5 rounded align-middle"
                                style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.3)' }}>
                                AUTO 10AM
                              </span>
                            )}
                          </td>
                          <td className="px-2.5 py-2 whitespace-nowrap">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${sig.sesgo === 'COMPRA' ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
                              {sig.sesgo}
                            </span>
                          </td>
                          <td className="px-2.5 py-2 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{sig.precioEntrada.toFixed(sig.precioEntrada > 100 ? 2 : 5)}</td>
                          <td className="px-2.5 py-2 whitespace-nowrap text-red-400">{sig.stopLoss.toFixed(sig.stopLoss > 100 ? 2 : 5)}</td>
                          <td className="px-2.5 py-2 whitespace-nowrap text-green-400">{sig.takeProfit.toFixed(sig.takeProfit > 100 ? 2 : 5)}</td>
                          <td className="px-2.5 py-2 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{sig.lotaje}</td>
                          <td className="px-2.5 py-2 whitespace-nowrap" style={{ color: 'var(--gold)' }}>{sig.confianza}%</td>
                          <td className="px-2.5 py-2 whitespace-nowrap">
                            {isAdmin && adminViewMode === 'admin' ? (
                              <select
                                value={edit?.resultado ?? sig.resultado}
                                onChange={e => setRowEdits(prev => ({ ...prev, [sig.id]: { resultado: e.target.value, pnlUsd: String(edit?.pnlUsd ?? sig.pnlUsd ?? ''), closedPrice: String(edit?.closedPrice ?? sig.closedPrice ?? '') } }))}
                                className="text-[9px] font-mono bg-transparent border border-[var(--border)] rounded px-1 py-0.5"
                                style={{ color: sig.resultado === 'GANADA' ? '#4ade80' : sig.resultado === 'PERDIDA' ? '#f87171' : sig.resultado === 'BREAKEVEN' ? '#facc15' : 'var(--text-muted)' }}
                              >
                                {['PENDIENTE','GANADA','PERDIDA','BREAKEVEN'].map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            ) : (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${sig.resultado === 'GANADA' ? 'text-green-400' : sig.resultado === 'PERDIDA' ? 'text-red-400' : sig.resultado === 'BREAKEVEN' ? 'text-yellow-400' : ''}`} style={sig.resultado === 'PENDIENTE' ? { color: 'var(--text-muted)' } : {}}>
                                {sig.resultado}
                              </span>
                            )}
                          </td>
                          <td className="px-2.5 py-2 whitespace-nowrap">
                            {isAdmin && adminViewMode === 'admin' ? (
                              <input
                                type="number"
                                step="0.01"
                                className="text-[9px] font-mono bg-transparent border border-[var(--border)] rounded px-1 py-0.5 w-14"
                                value={edit?.pnlUsd ?? (sig.pnlUsd != null ? String(sig.pnlUsd) : '')}
                                placeholder="0.00"
                                onChange={e => setRowEdits(prev => ({ ...prev, [sig.id]: { resultado: edit?.resultado ?? sig.resultado, pnlUsd: e.target.value, closedPrice: String(edit?.closedPrice ?? sig.closedPrice ?? '') } }))}
                                style={{ color: 'var(--text-secondary)' }}
                              />
                            ) : (
                              <span className={sig.pnlUsd != null ? (sig.pnlUsd >= 0 ? 'text-green-400' : 'text-red-400') : ''} style={sig.pnlUsd == null ? { color: 'var(--text-muted)' } : {}}>
                                {sig.pnlUsd != null ? `${sig.pnlUsd >= 0 ? '+' : ''}$${sig.pnlUsd.toFixed(2)}` : '—'}
                              </span>
                            )}
                          </td>
                          {isAdmin && adminViewMode === 'admin' && (
                            <td className="px-2.5 py-2 whitespace-nowrap">
                              {isDirty && (
                                <button
                                  onClick={() => handleSaveRow(sig.id)}
                                  disabled={updatingResultado === sig.id}
                                  className="text-[9px] px-1.5 py-0.5 rounded border font-semibold"
                                  style={{ borderColor: 'rgba(234,179,8,0.5)', color: 'rgb(234,179,8)' }}
                                >
                                  {updatingResultado === sig.id ? '...' : 'Guardar'}
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Confirm Delete Modal ── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full max-w-sm rounded-2xl border p-6 space-y-5" style={{ background: '#0d0d0d', borderColor: 'rgba(239,68,68,0.35)' }}>
            <div className="flex items-center gap-3">
              <span className="text-red-400 text-lg">⚠</span>
              <span className="text-sm font-bold text-red-400">Confirmar eliminación</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {confirmModal.type === 'all'
                ? `¿Borrar TODAS las señales (${confirmModal.count} registros)? Esta acción no se puede deshacer.`
                : `¿Borrar ${confirmModal.count} señal${confirmModal.count !== 1 ? 'es' : ''} seleccionada${confirmModal.count !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmModal(null)}
                className="label-mono text-xs px-4 py-2 rounded-lg border transition-colors hover:bg-white/5"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => { confirmModal.onConfirm(); setConfirmModal(null) }}
                className="label-mono text-xs px-4 py-2 rounded-lg border font-bold transition-colors"
                style={{ background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.4)', color: 'rgb(239,68,68)' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Trade success toast ── */}
      {tradeSuccess && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400 flex items-center gap-2">
          ✓ {tradeSuccess}
        </div>
      )}


      {/* ── Analysis Tab ── */}
      {activeTab === 'analisis' && (
        <div className="space-y-6">
          {/* Instrucciones de uso */}
          <div className="rounded-xl">
            <button
              onClick={() => setShowAnalisisGuide(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-left rounded-xl transition-all"
              style={{
                background: showAnalisisGuide ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.07)',
                border: '1px solid rgba(201,168,76,0.35)',
              }}
            >
              <span className="text-[11px] font-mono tracking-widest font-bold" style={{ color: 'var(--gold)' }}>
                GUÍA DE USO — CÓMO USAR EL ANÁLISIS DE MERCADO
              </span>
              <span className="text-xs font-mono font-bold" style={{ color: 'var(--gold)' }}>{showAnalisisGuide ? '▲' : '▼'}</span>
            </button>
            {showAnalisisGuide && (
              <div className="px-5 py-5 space-y-4 text-xs text-[var(--text-secondary)] leading-relaxed rounded-b-xl"
                style={{ border: '1px solid rgba(201,168,76,0.2)', borderTop: 'none', background: 'rgba(201,168,76,0.03)' }}>
                <div>
                  <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: 'var(--gold)' }}>CUÁNDO USAR ESTA HERRAMIENTA</p>
                  <p>Genera el análisis a la hora que decidas sentarte a operar. Los precios son en tiempo real, por lo que el análisis es válido para tu operativa del día en cualquier momento de la sesión.</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: 'var(--gold)' }}>FLUJO DE TRABAJO SUGERIDO</p>
                  <ol className="space-y-1 ml-3 list-decimal">
                    <li>Genera el análisis — 7 agentes de IA analizan más de 40 activos en paralelo.</li>
                    <li>Revisa el <span className="text-white font-semibold">Sesgo General</span> del mercado (COMPRA / VENTA / NEUTRAL).</li>
                    <li>Identifica los activos con mayor confianza en la dirección del sesgo general.</li>
                    <li>Conecta MT5 para ejecutar directamente desde la señal.</li>
                  </ol>
                </div>
                <div>
                  <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: 'var(--gold)' }}>AUTO-GUARDADO DE SEÑALES</p>
                  <p>Cada día a las 10am ET el análisis se ejecuta automáticamente. Las señales con confianza ≥ 80% se guardan en el <span className="text-white font-semibold">Track Record</span> sin que tengas que hacer nada — aparecen marcadas con <span className="text-[var(--gold)] font-semibold">AUTO 10AM</span>.</p>
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30">
                🚀 Perfil Agresivo
              </span>
              <span style={{ color: 'var(--text-muted)' }}>Máximo potencial — análisis se ejecuta automáticamente al entrar</span>
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

              {(result as any).faros && <FarosPanel faros={(result as any).faros} />}

              {/* ── Sector recommendation tables (replaces asset cards) ── */}
              {SECTOR_ORDER.map(sector => {
                const sl = sector.toLowerCase()
                const sectorActivos = result.activos.filter(a => a.sector?.toLowerCase() === sl)
                if (sectorActivos.length === 0) return null
                return <SectorTable key={sector} sector={sector} activos={sectorActivos} />
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

    </div>
  )
}
