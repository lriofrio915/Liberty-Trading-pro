'use client'

import { useEffect, useState, useCallback } from 'react'

interface LynchResultItem {
  ticker: string
  empresa: string
  bolsa: string
  sector: string
  industria: string
  precioActual: number
  marketCap: number
  peTrailing: number | null
  peForward: number | null
  debtToEquity: number | null
  epsGrowthRate: number | null
  pegRatio: number | null
  score: number
  criteriaMet: boolean[]
  criteriaDetails: {
    peTrailingOk: boolean
    peForwardOk: boolean
    debtToEquityOk: boolean
    epsGrowthOk: boolean
    pegOk: boolean
    marketCapOk: boolean
  }
}

const CRITERIA = [
  { label: 'P/E histórico < 25', description: 'No pagar de más por ganancias actuales' },
  { label: 'P/E forward < 15', description: 'Valuación futura más barata' },
  { label: 'Deuda/Capital < 35%', description: 'Menos deuda = menos riesgo' },
  { label: 'Crecimiento EPS > 15%', description: 'Motor de crecimiento sólido' },
  { label: 'PEG < 2', description: 'Crecimiento a precio razonable' },
  { label: 'Market Cap > $5B', description: 'Empresa probada con margen para crecer' },
]

export default function ResearchTab() {
  const [results, setResults] = useState<LynchResultItem[]>([])
  
  // Sample data for demo when API fails
  const SAMPLE_DATA: LynchResultItem[] = [
    { ticker: 'AAPL', empresa: 'Apple Inc.', bolsa: 'NASDAQ', sector: 'Technology', industria: 'Consumer Electronics', precioActual: 189.84, marketCap: 2890000000000, peTrailing: 29.5, peForward: 25.2, debtToEquity: 1.80, epsGrowthRate: 18.5, pegRatio: 1.6, score: 5, criteriaMet: [true, true, false, true, true, true], criteriaDetails: { peTrailingOk: true, peForwardOk: true, debtToEquityOk: false, epsGrowthOk: true, pegOk: true, marketCapOk: true } },
    { ticker: 'MSFT', empresa: 'Microsoft Corporation', bolsa: 'NASDAQ', sector: 'Technology', industria: 'Software', precioActual: 415.50, marketCap: 3090000000000, peTrailing: 36.8, peForward: 28.4, debtToEquity: 0.45, epsGrowthRate: 22.1, pegRatio: 1.3, score: 5, criteriaMet: [true, true, true, true, true, true], criteriaDetails: { peTrailingOk: true, peForwardOk: true, debtToEquityOk: true, epsGrowthOk: true, pegOk: true, marketCapOk: true } },
    { ticker: 'GOOGL', empresa: 'Alphabet Inc.', bolsa: 'NASDAQ', sector: 'Technology', industria: 'Internet', precioActual: 174.90, marketCap: 2180000000000, peTrailing: 24.5, peForward: 19.8, debtToEquity: 0.28, epsGrowthRate: 25.3, pegRatio: 0.8, score: 6, criteriaMet: [true, true, true, true, true, true], criteriaDetails: { peTrailingOk: true, peForwardOk: true, debtToEquityOk: true, epsGrowthOk: true, pegOk: true, marketCapOk: true } },
    { ticker: 'AMZN', empresa: 'Amazon.com Inc.', bolsa: 'NASDAQ', sector: 'Consumer Cyclical', industria: 'E-Commerce', precioActual: 227.63, marketCap: 2370000000000, peTrailing: 42.3, peForward: 32.1, debtToEquity: 1.15, epsGrowthRate: 28.7, pegRatio: 1.1, score: 4, criteriaMet: [false, true, true, true, true, true], criteriaDetails: { peTrailingOk: false, peForwardOk: true, debtToEquityOk: true, epsGrowthOk: true, pegOk: true, marketCapOk: true } },
    { ticker: 'NVDA', empresa: 'NVIDIA Corporation', bolsa: 'NASDAQ', sector: 'Technology', industria: 'Semiconductors', precioActual: 875.28, marketCap: 2160000000000, peTrailing: 65.4, peForward: 45.2, debtToEquity: 0.35, epsGrowthRate: 95.2, pegRatio: 0.5, score: 5, criteriaMet: [false, true, true, true, true, true], criteriaDetails: { peTrailingOk: false, peForwardOk: true, debtToEquityOk: true, epsGrowthOk: true, pegOk: true, marketCapOk: true } },
    { ticker: 'JPM', empresa: 'JPMorgan Chase & Co.', bolsa: 'NYSE', sector: 'Financial', industria: 'Banks', precioActual: 198.47, marketCap: 571000000000, peTrailing: 11.2, peForward: 10.5, debtToEquity: 2.20, epsGrowthRate: 8.5, pegRatio: 1.3, score: 5, criteriaMet: [true, true, false, false, true, true], criteriaDetails: { peTrailingOk: true, peForwardOk: true, debtToEquityOk: false, epsGrowthOk: false, pegOk: true, marketCapOk: true } },
    { ticker: 'JNJ', empresa: 'Johnson & Johnson', bolsa: 'NYSE', sector: 'Healthcare', industria: 'Pharmaceuticals', precioActual: 156.74, marketCap: 377000000000, peTrailing: 15.8, peForward: 14.2, debtToEquity: 0.55, epsGrowthRate: 6.2, pegRatio: 2.3, score: 4, criteriaMet: [true, true, true, false, false, true], criteriaDetails: { peTrailingOk: true, peForwardOk: true, debtToEquityOk: true, epsGrowthOk: false, pegOk: false, marketCapOk: true } },
    { ticker: 'V', empresa: 'Visa Inc.', bolsa: 'NYSE', sector: 'Financial', industria: 'Credit Services', precioActual: 279.85, marketCap: 573000000000, peTrailing: 30.5, peForward: 26.8, debtToEquity: 0.65, epsGrowthRate: 14.8, pegRatio: 1.8, score: 5, criteriaMet: [true, true, true, true, true, true], criteriaDetails: { peTrailingOk: true, peForwardOk: true, debtToEquityOk: true, epsGrowthOk: true, pegOk: true, marketCapOk: true } },
  ]
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cachedAt, setCachedAt] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<string>('score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [minScore, setMinScore] = useState(0)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 30

  const fetchResults = useCallback(async (forceRefresh = false) => {
    setLoading(true)
    setError(null)
    try {
      const url = forceRefresh ? '/api/screener/lynch?refresh=true' : '/api/screener/lynch'
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.results && data.results.length > 0) {
        setResults(data.results)
      } else {
        // Use sample data when API returns empty
        setResults(SAMPLE_DATA)
        setError('Datos de ejemplo (Yahoo Finance no disponible)')
      }
      if (data.cachedAt) setCachedAt(data.cachedAt)
    } catch (err) {
      // Use sample data on error
      setResults(SAMPLE_DATA)
      setError('Datos de ejemplo (error de conexión)')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchResults(false) }, [fetchResults])

  const sectors = Array.from(new Set(results.map((r) => r.sector).filter(Boolean))).sort()

  const filtered = results
    .filter((r) => {
      if (search && !r.ticker.toLowerCase().includes(search.toLowerCase()) && !r.empresa.toLowerCase().includes(search.toLowerCase())) return false
      if (sectorFilter && r.sector !== sectorFilter) return false
      if (r.score < minScore) return false
      return true
    })
    .sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortKey]
      const bVal = (b as unknown as Record<string, unknown>)[sortKey]
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (typeof aVal === 'number' && typeof bVal === 'number') return sortDir === 'desc' ? bVal - aVal : aVal - bVal
      return sortDir === 'desc' ? String(bVal).localeCompare(String(aVal)) : String(aVal).localeCompare(String(bVal))
    })

  const totalFiltered = filtered.length
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE)

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [search, sectorFilter, minScore, sortKey])

  const fmtMktCap = (v: number) => {
    if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
    if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
    return `$${(v / 1e6).toFixed(0)}M`
  }

  const handleSort = (key: string) => {
    if (sortKey === key) { setSortDir(sortDir === 'desc' ? 'asc' : 'desc') }
    else { setSortKey(key); setSortDir('desc') }
  }

  const sortArrow = (key: string) => {
    if (sortKey !== key) return ''
    return sortDir === 'desc' ? ' ▾' : ' ▴'
  }

  const handleRefresh = () => { fetchResults(true) }

  return (
    <div>
      {/* Refresh Button */}
      <div className="flex justify-end mb-3">
        <button 
          onClick={handleRefresh} 
          disabled={loading}
          className="px-3 py-1.5 text-[10px] font-mono tracking-widest rounded border border-[var(--gold)]/30 text-[var(--gold)] hover:bg-[var(--gold)]/10 disabled:opacity-50"
        >
          {loading ? 'ACTUALIZANDO...' : '🔄 ACTUALIZAR DATOS'}
        </button>
      </div>

      {/* Explanation */}
      <div className="rounded-xl border p-4 mb-5" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.05) 0%, transparent 80%)', borderColor: 'rgba(201,168,76,0.15)' }}>
        <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: 'var(--gold)' }}>CRITERIOS DE PETER LYNCH</p>
        <p className="text-[11px] leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>
          Este screener analiza las empresas del S&P 500 y NASDAQ 100 aplicando los 6 criterios de inversión
          de Peter Lynch, legendario gestor del Fidelity Magellan Fund (29.2% anualizado por 13 años).
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CRITERIA.map((c, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px]">
              <span className="mt-0.5 text-[10px]" style={{ color: 'var(--gold)' }}>{i + 1}.</span>
              <span style={{ color: 'var(--text-secondary)' }}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar ticker o empresa…"
          className="bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--gold-dark)] font-mono w-48"
        />
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--gold-dark)] font-mono"
        >
          <option value="">Todos los sectores</option>
          {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={minScore}
          onChange={(e) => setMinScore(Number(e.target.value))}
          className="bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--gold-dark)] font-mono"
        >
          <option value={0}>Score: Todos</option>
          <option value={6}>Score: 6/6 (Perfecto)</option>
          <option value={5}>Score: 5-6</option>
          <option value={4}>Score: 4-6</option>
          <option value={3}>Score: 3-6</option>
        </select>
        <span className="text-[10px] font-mono self-center" style={{ color: 'var(--text-muted)' }}>
          {filtered.length} de {results.length} resultados
          {cachedAt ? ` · cache: ${new Date(cachedAt).toLocaleDateString()}` : ''}
        </span>
      </div>

      {/* Loading / Error / Empty */}
      {loading && (
        <div className="card text-center py-12">
          <div className="animate-pulse text-[var(--gold)] text-xs font-mono">Analizando ~600 empresas del S&P 500 + NASDAQ 100…</div>
          <p className="text-[10px] mt-2 text-[var(--text-muted)]">Esto puede tardar varios minutos la primera vez. Los resultados se cachean por 24 horas.</p>
        </div>
      )}

      {error && (
        <div className="card border border-red-500/40 p-4 mb-4">
          <p className="text-xs text-red-400 font-mono">{error}</p>
          <button onClick={() => fetchResults(false)} className="mt-2 px-3 py-1 text-[10px] font-mono tracking-widest rounded border border-red-400/50 text-red-400 hover:bg-red-400/10">REINTENTAR</button>
        </div>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-xs text-[var(--text-muted)]">No hay datos disponibles. Intenta recargar más tarde.</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && paginated.length > 0 && (
        <div className="flex justify-between items-center mb-3 px-2">
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            Mostrando {paginated.length} de {totalFiltered} empresas analizadas
          </span>
          {totalPages > 1 && (
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 text-[10px] font-mono border rounded disabled:opacity-30">←</button>
              <span className="px-2 py-1 text-[10px] font-mono">{page}/{totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 text-[10px] font-mono border rounded disabled:opacity-30">→</button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      {!loading && !error && paginated.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-center p-3 font-mono text-[10px] tracking-widest text-[var(--text-muted)]">Nº</th>
                <th className="text-left p-3 font-mono text-[10px] tracking-widest text-[var(--text-muted)] cursor-pointer" onClick={() => handleSort('ticker')}>TICKER{sortArrow('ticker')}</th>
                <th className="text-left p-3 font-mono text-[10px] tracking-widest text-[var(--text-muted)] cursor-pointer" onClick={() => handleSort('empresa')}>EMPRESA{sortArrow('empresa')}</th>
                <th className="text-left p-3 font-mono text-[10px] tracking-widest text-[var(--text-muted)]">SECTOR</th>
                <th className="text-center p-3 font-mono text-[10px] tracking-widest cursor-pointer" style={{ color: 'var(--gold)' }} onClick={() => handleSort('score')}>SCORE{sortArrow('score')}</th>
                <th className="text-center p-3 font-mono text-[10px] tracking-widest text-[var(--text-muted)] cursor-pointer" onClick={() => handleSort('precioActual')}>PRECIO{sortArrow('precioActual')}</th>
                <th className="text-center p-3 font-mono text-[10px] tracking-widest text-[var(--text-muted)] cursor-pointer" onClick={() => handleSort('marketCap')}>MARKET CAP{sortArrow('marketCap')}</th>
                <th className="text-center p-3 font-mono text-[10px] tracking-widest text-[var(--text-muted)] cursor-pointer" onClick={() => handleSort('peTrailing')}>P/E{sortArrow('peTrailing')}</th>
                <th className="text-center p-3 font-mono text-[10px] tracking-widest text-[var(--text-muted)] cursor-pointer" onClick={() => handleSort('peForward')}>P/E FWD{sortArrow('peForward')}</th>
                <th className="text-center p-3 font-mono text-[10px] tracking-widest text-[var(--text-muted)] cursor-pointer" onClick={() => handleSort('debtToEquity')}>D/E{sortArrow('debtToEquity')}</th>
                <th className="text-center p-3 font-mono text-[10px] tracking-widest text-[var(--text-muted)] cursor-pointer" onClick={() => handleSort('epsGrowthRate')}>EPS GR.{sortArrow('epsGrowthRate')}</th>
                <th className="text-center p-3 font-mono text-[10px] tracking-widest text-[var(--text-muted)] cursor-pointer" onClick={() => handleSort('pegRatio')}>PEG{sortArrow('pegRatio')}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((r, idx) => {
                const details = [
                  r.criteriaDetails.peTrailingOk,
                  r.criteriaDetails.peForwardOk,
                  r.criteriaDetails.debtToEquityOk,
                  r.criteriaDetails.epsGrowthOk,
                  r.criteriaDetails.pegOk,
                  r.criteriaDetails.marketCapOk,
                ]
                return (
                  <tr key={r.ticker} className="border-t border-[var(--border)] hover:bg-white/[0.02]">
                    <td className="p-3 text-center font-mono text-[var(--text-muted)]">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-white">{r.ticker}</td>
                    <td className="p-3 text-[var(--text-secondary)] max-w-[180px] truncate" title={r.empresa}>{r.empresa}</td>
                    <td className="p-3 text-[var(--text-muted)] font-mono text-[10px]">{r.sector}</td>
                    <td className="p-3 text-center">
                      <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                        r.score >= 6 ? 'bg-green-950 text-green-400' :
                        r.score >= 5 ? 'bg-yellow-950 text-yellow-400' :
                        'bg-gray-800 text-gray-400'
                      }`}>{r.score}/6</span>
                    </td>
                    <td className="p-3 text-center font-mono text-[var(--text-secondary)]">${r.precioActual?.toFixed(2) || '—'}</td>
                    <td className="p-3 text-center font-mono text-[var(--text-secondary)] text-[11px]">{fmtMktCap(r.marketCap)}</td>
                    <td className="p-3 text-center font-mono">
                      <span className={details[0] ? 'text-green-400' : 'text-red-400/60'}>{r.peTrailing?.toFixed(1) || '—'}</span>
                    </td>
                    <td className="p-3 text-center font-mono">
                      <span className={details[1] ? 'text-green-400' : 'text-red-400/60'}>{r.peForward?.toFixed(1) || '—'}</span>
                    </td>
                    <td className="p-3 text-center font-mono">
                      <span className={details[2] ? 'text-green-400' : 'text-red-400/60'}>{r.debtToEquity != null && r.debtToEquity > 0 ? `${r.debtToEquity.toFixed(1)}x` : '—'}</span>
                    </td>
                    <td className="p-3 text-center font-mono">
                      <span className={details[3] ? 'text-green-400' : 'text-red-400/60'}>{r.epsGrowthRate != null ? `${r.epsGrowthRate.toFixed(1)}%` : '—'}</span>
                    </td>
                    <td className="p-3 text-center font-mono">
                      <span className={details[4] ? 'text-green-400' : 'text-red-400/60'}>{r.pegRatio?.toFixed(2) || '—'}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}