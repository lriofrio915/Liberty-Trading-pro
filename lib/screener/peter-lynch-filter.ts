// lib/screener/peter-lynch-filter.ts
// Applies Peter Lynch's 6 investment criteria to Yahoo Finance data

import type { TickerFinancials } from '@/lib/yahoo-financials'

export interface LynchResult extends TickerFinancials {
  criteriaMet: boolean[]
  score: number
  criteriaDetails: {
    peTrailingOk: boolean
    peForwardOk: boolean
    debtToEquityOk: boolean
    epsGrowthOk: boolean
    pegOk: boolean
    marketCapOk: boolean
  }
  epsGrowthRate: number | null
}

function calcEpsGrowth(historico: Array<[string, string, string, string]>): number | null {
  if (historico.length < 2) return null
  const latest = historico[0]
  const prev = historico[1]
  const latestNi = parseFloat(latest[3].replace(/[^0-9.-]/g, ''))
  const prevNi = parseFloat(prev[3].replace(/[^0-9.-]/g, ''))
  if (!prevNi || prevNi === 0 || isNaN(latestNi) || isNaN(prevNi)) return null
  return ((latestNi - prevNi) / Math.abs(prevNi)) * 100
}

export function applyPeterLynchFilter(d: TickerFinancials): LynchResult | null {
  const marketCapB = d.marketCap / 1e9 // convert to billions

  // 6. Market cap > $5B (must pass to be included)
  if (marketCapB < 5) return null

  const epsGrowth = calcEpsGrowth(d.historico)

  const peTrailingOk = d.peTrailing != null && d.peTrailing > 0 && d.peTrailing < 25
  const peForwardOk = d.peForward != null && d.peForward > 0 && d.peForward < 15
  const debtToEquityOk = d.debtToEquity != null && d.debtToEquity >= 0 && d.debtToEquity < 35
  const epsGrowthOk = epsGrowth != null && epsGrowth > 15
  const pegOk = d.pegRatio != null && d.pegRatio > 0 && d.pegRatio < 2
  const marketCapOk = true // already filtered above

  const criteria = [peTrailingOk, peForwardOk, debtToEquityOk, epsGrowthOk, pegOk, marketCapOk]
  const score = criteria.filter(Boolean).length

  return {
    ...d,
    criteriaMet: criteria,
    score,
    criteriaDetails: {
      peTrailingOk,
      peForwardOk,
      debtToEquityOk,
      epsGrowthOk,
      pegOk,
      marketCapOk,
    },
    epsGrowthRate: epsGrowth,
  }
}

export const CRITERIA_LABELS = [
  { key: 'peTrailingOk', label: 'P/E histórico < 25', description: 'No pagar de más por ganancias actuales' },
  { key: 'peForwardOk', label: 'P/E proyectado < 15', description: 'Valuación futura más barata' },
  { key: 'debtToEquityOk', label: 'Deuda/Capital < 35%', description: 'Menos deuda = menos riesgo' },
  { key: 'epsGrowthOk', label: 'Crecimiento EPS > 15%', description: 'Motor de crecimiento sólido' },
  { key: 'pegOk', label: 'PEG < 2', description: 'Crecimiento a precio razonable' },
  { key: 'marketCapOk', label: 'Market Cap > $5B', description: 'Empresa probada con margen para crecer' },
] as const