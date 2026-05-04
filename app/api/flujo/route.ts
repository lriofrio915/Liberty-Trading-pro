import { NextResponse } from 'next/server'
import { fetchAllOHLCV, fetchAllPrices, type PriceItem } from '@/lib/analisis-engine'
import { computeFarosMetrics, type OHLCVData, type FarosMetrics } from '@/lib/faros-metrics'

export const runtime = 'nodejs'
export const revalidate = 900 // cache 15 min — OHLCV is daily data

// ── Asset metadata ────────────────────────────────────────────────────────────

const ASSET_META: Record<string, { nombre: string; sector: string; priceSymbol: string }> = {
  BTC:    { nombre: 'Bitcoin',          sector: 'Crypto',      priceSymbol: 'BTC' },
  ETH:    { nombre: 'Ethereum',         sector: 'Crypto',      priceSymbol: 'ETH' },
  NVDA:   { nombre: 'Nvidia',           sector: 'Acciones',    priceSymbol: 'NVDA' },
  AAPL:   { nombre: 'Apple',            sector: 'Acciones',    priceSymbol: 'AAPL' },
  MSFT:   { nombre: 'Microsoft',        sector: 'Acciones',    priceSymbol: 'MSFT' },
  TSLA:   { nombre: 'Tesla',            sector: 'Acciones',    priceSymbol: 'TSLA' },
  SP500:  { nombre: 'S&P 500',          sector: 'Índices',     priceSymbol: '^GSPC' },
  NQ:     { nombre: 'Nasdaq 100',       sector: 'Índices',     priceSymbol: 'NQ=F' },
  VIX:    { nombre: 'Volatilidad VIX',  sector: 'Índices',     priceSymbol: '%5EVIX' },
  DXY:    { nombre: 'Índice Dólar',     sector: 'Divisas',     priceSymbol: 'DX=F' },
  EURUSD: { nombre: 'EUR/USD',          sector: 'Divisas',     priceSymbol: 'EURUSD=X' },
  ORO:    { nombre: 'Oro (XAU)',        sector: 'Materiales',  priceSymbol: 'GC=F' },
  WTI:    { nombre: 'Petróleo WTI',     sector: 'Materiales',  priceSymbol: 'CL=F' },
  PLATA:  { nombre: 'Plata (XAG)',      sector: 'Materiales',  priceSymbol: 'SI=F' },
}

// ── Money flow calculation (5-day net buy/sell volume) ────────────────────────

function calcNetMoneyFlow(ohlcv: OHLCVData, days = 5): number {
  const n = Math.min(days, ohlcv.closes.length)
  const start = ohlcv.closes.length - n
  let buyVol = 0
  let sellVol = 0
  for (let i = start; i < ohlcv.closes.length; i++) {
    const close = ohlcv.closes[i]
    const open = ohlcv.opens[i]
    const vol = Math.abs(ohlcv.volumes[i]) // some assets return normalized volume
    if (close >= open) buyVol += vol
    else sellVol += vol
  }
  const total = buyVol + sellVol
  return total > 0 ? ((buyVol - sellVol) / total) * 100 : 0
}

// Money Flow Index (MFI) style — more precise than raw buy/sell volume
function calcMFI(ohlcv: OHLCVData, days = 14): number {
  const n = Math.min(days, ohlcv.closes.length - 1)
  const start = ohlcv.closes.length - n
  let posFlow = 0
  let negFlow = 0
  for (let i = start; i < ohlcv.closes.length; i++) {
    const typicalPrice = (ohlcv.highs[i] + ohlcv.lows[i] + ohlcv.closes[i]) / 3
    const prevTypical = i > 0
      ? (ohlcv.highs[i - 1] + ohlcv.lows[i - 1] + ohlcv.closes[i - 1]) / 3
      : typicalPrice
    const rawFlow = typicalPrice * Math.abs(ohlcv.volumes[i])
    if (typicalPrice >= prevTypical) posFlow += rawFlow
    else negFlow += rawFlow
  }
  if (negFlow === 0) return 100
  const mfr = posFlow / negFlow
  return 100 - 100 / (1 + mfr)
}

// ── Conclusion logic ──────────────────────────────────────────────────────────

export type FlujoConclusion =
  | 'ACUMULACION_FUERTE'
  | 'ACUMULACION_MODERADA'
  | 'CONSOLIDACION'
  | 'DISTRIBUCION_MODERADA'
  | 'DISTRIBUCION_FUERTE'
  | 'KILL_SWITCH'

function getConclusion(m: FarosMetrics, mfi: number): FlujoConclusion {
  if (m.killSwitch) return 'KILL_SWITCH'
  const { psiScore, alphaFlow, marketRegime, reynoldsPercentile } = m
  if (reynoldsPercentile > 80) return psiScore > 0.5 ? 'ACUMULACION_MODERADA' : 'KILL_SWITCH'
  if (marketRegime === 'INSTITUTIONAL_ACCUMULATION' && alphaFlow > 0.6 && mfi > 60) return 'ACUMULACION_FUERTE'
  if (marketRegime === 'HIGH_MOMENTUM' && psiScore > 0.5) return 'ACUMULACION_MODERADA'
  if (marketRegime === 'DISTRIBUTION_BEAR' && alphaFlow < 0.35) return 'DISTRIBUCION_FUERTE'
  if (marketRegime === 'STRUCTURAL_BREAK') return 'DISTRIBUCION_MODERADA'
  if (psiScore < 0.3 && mfi < 40) return 'DISTRIBUCION_MODERADA'
  return 'CONSOLIDACION'
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FlujoDineroAsset extends FarosMetrics {
  nombre: string
  sector: string
  currentPrice: number
  netMoneyFlowPct: number  // -100 to +100 (5-day net buy pressure)
  mfi: number              // Money Flow Index 0-100
  conclusion: FlujoConclusion
}

export interface FlujoDineroResponse {
  timestamp: string
  assets: FlujoDineroAsset[]
  globalRegime: string
  killSwitchCount: number
  avgPsiScore: number
  avgAlphaFlow: number
  sesgoGlobal: 'ALCISTA' | 'BAJISTA' | 'NEUTRAL' | 'KILL_SWITCH'
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    // Fetch OHLCV and spot prices in parallel — reuse existing connections
    const FAROS_SYMBOLS: { yahoo: string; label: string }[] = [
      { yahoo: 'BTC-USD',   label: 'BTC' },
      { yahoo: 'ETH-USD',   label: 'ETH' },
      { yahoo: 'NVDA',      label: 'NVDA' },
      { yahoo: 'AAPL',      label: 'AAPL' },
      { yahoo: 'MSFT',      label: 'MSFT' },
      { yahoo: 'TSLA',      label: 'TSLA' },
      { yahoo: '^GSPC',     label: 'SP500' },
      { yahoo: 'NQ=F',      label: 'NQ' },
      { yahoo: '%5EVIX',    label: 'VIX' },
      { yahoo: 'DX=F',      label: 'DXY' },
      { yahoo: 'EURUSD=X',  label: 'EURUSD' },
      { yahoo: 'GC=F',      label: 'ORO' },
      { yahoo: 'CL=F',      label: 'WTI' },
      { yahoo: 'SI=F',      label: 'PLATA' },
    ]

    const { fetchYahooOHLCV } = await import('@/lib/analisis-engine')

    const [ohlcvResults, prices] = await Promise.all([
      Promise.allSettled(FAROS_SYMBOLS.map(s => fetchYahooOHLCV(s.yahoo, s.label))),
      fetchAllPrices(),
    ])

    const priceMap: Record<string, number> = {}
    for (const p of prices) {
      priceMap[p.symbol] = p.price
    }

    const assets: FlujoDineroAsset[] = []

    ohlcvResults.forEach((r, i) => {
      if (r.status !== 'fulfilled' || !r.value || r.value.closes.length < 10) return
      const ohlcv = r.value
      const label = FAROS_SYMBOLS[i].label
      const meta = ASSET_META[label]
      if (!meta) return

      try {
        const faros = computeFarosMetrics(ohlcv)
        const netMoneyFlowPct = calcNetMoneyFlow(ohlcv, 5)
        const mfi = calcMFI(ohlcv, 14)
        const conclusion = getConclusion(faros, mfi)

        const priceSymbol = meta.priceSymbol
        const currentPrice =
          priceMap[priceSymbol] ??
          priceMap[label] ??
          ohlcv.closes[ohlcv.closes.length - 1] ??
          0

        assets.push({
          ...faros,
          nombre: meta.nombre,
          sector: meta.sector,
          currentPrice,
          netMoneyFlowPct,
          mfi,
          conclusion,
        })
      } catch {
        // skip on computation error
      }
    })

    if (assets.length === 0) {
      return NextResponse.json({ error: 'No se pudo obtener datos de mercado' }, { status: 503 })
    }

    const killSwitchCount = assets.filter(a => a.killSwitch).length
    const avgPsiScore = assets.reduce((s, a) => s + a.psiScore, 0) / assets.length
    const avgAlphaFlow = assets.reduce((s, a) => s + a.alphaFlow, 0) / assets.length

    const regimeCounts: Record<string, number> = {}
    for (const a of assets) {
      regimeCounts[a.marketRegime] = (regimeCounts[a.marketRegime] ?? 0) + 1
    }
    const globalRegime = Object.entries(regimeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'CONSOLIDATION'

    let sesgoGlobal: FlujoDineroResponse['sesgoGlobal'] = 'NEUTRAL'
    if (killSwitchCount >= assets.length * 0.4) sesgoGlobal = 'KILL_SWITCH'
    else if (avgPsiScore > 0.55 && avgAlphaFlow > 0.55) sesgoGlobal = 'ALCISTA'
    else if (avgPsiScore < 0.35 || avgAlphaFlow < 0.30) sesgoGlobal = 'BAJISTA'

    const response: FlujoDineroResponse = {
      timestamp: new Date().toISOString(),
      assets,
      globalRegime,
      killSwitchCount,
      avgPsiScore,
      avgAlphaFlow,
      sesgoGlobal,
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[/api/flujo]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error obteniendo datos de flujo' },
      { status: 500 },
    )
  }
}
