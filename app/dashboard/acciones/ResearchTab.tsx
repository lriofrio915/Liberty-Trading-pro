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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cachedAt, setCachedAt] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<string>('score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [minScore, setMinScore] = useState(0)

  const fetchResults = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/screener/lynch')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setResults(data.results || [])
      if (data.cachedAt) setCachedAt(data.cachedAt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el screener')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchResults() }, [fetchResults])

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

  return (
    <div>
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
          <button onClick={fetchResults} className="mt-2 px-3 py-1 text-[10px] font-mono tracking-widest rounded border border-red-400/50 text-red-400 hover:bg-red-400/10">REINTENTAR</button>
        </div>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-xs text-[var(--text-muted)]">No hay datos disponibles. Intenta recargar más tarde.</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && results.length > 0 && (
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
              {filtered.map((r, idx) => {
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
                    <td className="p-3 text-center font-mono text-[var(--text-muted)]">{idx + 1}</td>
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
                      <span className={details[2] ? 'text-green-400' : 'text-red-400/60'}>{r.debtToEquity?.toFixed(1) || '—'}</span>
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