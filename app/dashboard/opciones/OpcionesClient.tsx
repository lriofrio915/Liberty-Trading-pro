'use client'

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

type StrategyKind = 'sell-put' | 'covered-call' | 'buy-call' | 'buy-put'
type MainTab = "opciones" | "cfds" | "futuros"
type SubTab = "analisis" | "calculadora" | "estrategias"
type ToolTab = "bs" | "greeks" | "iv" | "fv"

interface Contract {
  symbol: string
  type: 'call' | 'put'
  strike: number
  expiration: string
  dte: number
  bid: number | null
  ask: number | null
  lastPrice: number | null
  mid: number | null
  spreadPct: number | null
  impliedVolatility: number | null
  delta: number | null
  gamma: number | null
  theta: number | null
  vega: number | null
  openInterest: number | null
  volume: number | null
  fairValue: number | null
  premiumStatus: 'barata' | 'justa' | 'cara' | 'sin-datos'
  probabilityITM: number | null
}

interface StrategyPick {
  strategy: StrategyKind
  action: string
  score: number
  label: string
  reasons: string[]
  warnings: string[]
  contract: Contract
  breakeven: number
  maxLossHint: string
  maxProfitHint: string
}

interface OptionsAnalyzeResult {
  dataSource: string
  dataWarning: string
  underlying: {
    ticker: string
    company: string
    underlyingPrice: number
    sector: string
    fundamentals: {
      peForward: number | null
      peTrailing: number | null
      debtToEquity: number | null
      targetMeanPrice: number | null
      analystConsensus: string
      beta: number | null
    }
    expirations: string[]
    selectedExpirations: string[]
    fetchedAt: string
  }
  technicalZones: {
    support: number | null
    resistance: number | null
    sma50: number | null
    sma200: number | null
    range52WeekLow: number | null
    range52WeekHigh: number | null
    technicalBias: 'bullish' | 'neutral' | 'bearish'
    notes: string[]
    candlesCount: number
  }
  strategies: Record<StrategyKind, StrategyPick[]>
  recommendation: StrategyPick | null
  warnings: string[]
}

const STRATEGIES: Array<{ key: StrategyKind; label: string; desc: string }> = [
  { key: 'sell-put', label: 'Vender Put', desc: 'Cobrar prima con efectivo reservado' },
  { key: 'covered-call', label: 'Covered Call', desc: 'Cobrar prima sobre acciones propias' },
  { key: 'buy-call', label: 'Comprar Call', desc: 'Apuesta direccional alcista' },
  { key: 'buy-put', label: 'Comprar Put', desc: 'Apuesta direccional bajista' },
]

interface TickerSuggestion {
  ticker: string
  name: string
  exchange: string
}

export default function OpcionesClient({ isAdmin = false }: { isAdmin?: boolean }) {
  const [ticker, setTicker] = useState('')
  const [activeStrategy, setActiveStrategy] = useState<StrategyKind>('sell-put')
  const [filterExp, setFilterExp] = useState<string>('all')
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('opciones')
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('analisis')
  const [activeToolTab, setActiveToolTab] = useState<ToolTab>('bs')
  const [data, setData] = useState<OptionsAnalyzeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [suggestions, setSuggestions] = useState<TickerSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Track record de recomendaciones de opciones
  type OptRec = {
    id: string; ticker: string; company: string; direction: string; action: string
    contractSymbol: string; contractType: string; strike: number; expiration: string
    dte: number; score: number; label: string; underlyingPrice: number
    bid: number | null; ask: number | null; mid: number | null; delta: number | null
    breakeven: number | null; maxLossHint: string | null; maxProfitHint: string | null
    publishedAt: string; status: string; precioSalida: number | null; active: boolean
    resultado: string | null; pnlPct: number | null; pnlUsd: number | null; closedAt: string | null
  }
  const [optRecs, setOptRecs] = useState<OptRec[]>([])
  const [optRecsLoading, setOptRecsLoading] = useState(false)

  useEffect(() => {
    setOptRecsLoading(true)
    fetch('/api/options-recs')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.recommendations) setOptRecs(d.recommendations) })
      .catch(() => {})
      .finally(() => setOptRecsLoading(false))
  }, [])

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) { setSuggestions([]); return }
    setSuggestionsLoading(true)
    try {
      const res = await fetch(`/api/options/search?q=${encodeURIComponent(q)}`)
      if (res.ok) setSuggestions(await res.json())
    } finally {
      setSuggestionsLoading(false)
    }
  }, [])

  const handleTickerChange = (value: string) => {
    const upper = value.toUpperCase()
    setTicker(upper)
    setShowSuggestions(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(upper), 300)
  }

  const selectSuggestion = (s: TickerSuggestion) => {
    setTicker(s.ticker)
    setSuggestions([])
    setShowSuggestions(false)
    analyze(undefined, s.ticker)
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const activePicks = useMemo(() => data?.strategies?.[activeStrategy] ?? [], [activeStrategy, data])
  const filteredPicks = useMemo(
    () => filterExp === 'all' ? activePicks : activePicks.filter(p => p.contract.expiration === filterExp),
    [activePicks, filterExp]
  )

  const analyze = async (event?: FormEvent, tickerOverride?: string) => {
    event?.preventDefault()
    const t = (tickerOverride ?? ticker).trim()
    if (!t) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/options/analyze?ticker=${encodeURIComponent(t.toUpperCase())}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo analizar el ticker')
      setData(json)
      setFilterExp('all')
      if (json.recommendation?.strategy) setActiveStrategy(json.recommendation.strategy)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al analizar opciones')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fadeIn">
      <div className="mb-7">
        <h1 className="text-3xl font-black gradient-gold mb-2">Opciones</h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-3xl">
          Analiza calls y puts con prima estimada, griegas, liquidez, soportes/resistencias y una recomendación directa para vender prima o comprar dirección.
        </p>
      </div>

      {/* Premium Horizontal Toolbar */}
      <div className="mb-6">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3">
          <div className="grid grid-cols-3 gap-3">
            
            {/* Left Zone: Market Selector */}
            <div className="flex gap-1">
              {[
                { id: "opciones" as MainTab, label: "Opciones", icon: "⚡" },
                { id: "cfds" as MainTab, label: "CFDs", icon: "🎯" },
                { id: "futuros" as MainTab, label: "Futuros", icon: "🚀" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveMainTab(tab.id)}
                  className={`px-3 py-2 text-xs font-mono tracking-widest rounded-lg border transition-all flex items-center gap-2 min-w-0 flex-1 justify-center ${
                    activeMainTab === tab.id
                      ? "bg-[var(--gold)] text-black border-[var(--gold)] shadow-sm"
                      : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--gold-dark)] hover:bg-white/5"
                  }`}
                >
                  <span className="text-[10px]">{tab.icon}</span>
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>
            
            {/* Center Zone: Analysis Mode */}
            <div className="flex gap-1">
              {[
                { id: "analisis" as SubTab, label: "Automático", icon: "🤖" },
                { id: "calculadora" as SubTab, label: "Manual", icon: "🧮" },
                { id: "estrategias" as SubTab, label: "IA", icon: "⚔️" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`px-3 py-2 text-xs font-mono tracking-widest rounded-lg border transition-all flex items-center gap-2 min-w-0 flex-1 justify-center ${
                    activeSubTab === tab.id
                      ? "bg-[var(--gold)]/20 border-[var(--gold)]/50 text-[var(--gold)] shadow-sm"
                      : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--gold-dark)] hover:bg-white/5"
                  }`}
                >
                  <span className="text-[10px]">{tab.icon}</span>
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>
            
            {/* Right Zone: Tools */}
            <div className="flex gap-1">
              {[
                { id: "bs" as ToolTab, label: "BS", icon: "📊", tooltip: "Black-Scholes" },
                { id: "greeks" as ToolTab, label: "Greeks", icon: "📈", tooltip: "Griegas" },
                { id: "iv" as ToolTab, label: "IV", icon: "📉", tooltip: "Volatilidad Implícita" },
                { id: "fv" as ToolTab, label: "FV", icon: "💰", tooltip: "Fair Value" },
              ].map(tool => (
                <button
                  key={tool.id}
                  onClick={() => setActiveToolTab(tool.id)}
                  className={`px-2 py-2 text-xs font-mono tracking-widest rounded-lg border transition-all flex items-center gap-1 min-w-0 flex-1 justify-center group relative ${
                    activeToolTab === tool.id
                      ? "bg-[var(--gold)]/20 border-[var(--gold)]/50 text-[var(--gold)] shadow-sm"
                      : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--gold-dark)] hover:bg-white/5"
                  }`}
                  title={tool.tooltip}
                >
                  <span className="text-[10px]">{tool.icon}</span>
                  <span className="truncate">{tool.label}</span>
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black/90 text-white text-[10px] px-2 py-1 rounded pointer-events-none whitespace-nowrap z-50">
                    {tool.tooltip}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <form onSubmit={analyze} className="card p-4 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-end">
          <div className="relative">
            <label className="block text-[10px] font-mono tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              TICKER O EMPRESA
            </label>
            <input
              ref={inputRef}
              value={ticker}
              onChange={(e) => handleTickerChange(e.target.value)}
              onFocus={() => { if (ticker.trim() && suggestions.length > 0) setShowSuggestions(true) }}
              onKeyDown={(e) => { if (e.key === 'Escape') setShowSuggestions(false) }}
              placeholder="Ej: BAC, Bank of America, INTC..."
              autoComplete="off"
              className="w-full bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-primary)] text-sm px-4 py-3 rounded-lg focus:outline-none focus:border-[var(--gold-dark)] font-mono"
            />
            {showSuggestions && (suggestions.length > 0 || suggestionsLoading) && (
              <div
                ref={dropdownRef}
                className="absolute z-50 w-full mt-1 rounded-xl border overflow-hidden shadow-xl"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                {suggestionsLoading && suggestions.length === 0 && (
                  <div className="px-4 py-3 text-[11px] font-mono animate-pulse" style={{ color: 'var(--text-muted)' }}>
                    Buscando...
                  </div>
                )}
                {suggestions.map((s) => (
                  <button
                    key={s.ticker}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s) }}
                    className="w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="font-mono font-bold text-sm shrink-0" style={{ color: 'var(--gold)' }}>
                        {s.ticker}
                      </span>
                      <span className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
                        {s.name}
                      </span>
                    </span>
                    {s.exchange && (
                      <span className="text-[9px] font-mono shrink-0" style={{ color: 'var(--text-muted)' }}>
                        {s.exchange}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !ticker.trim()}
            className="px-5 py-3 text-xs font-mono tracking-widest rounded-lg bg-[var(--gold)] text-black disabled:opacity-50"
          >
            {loading ? 'ANALIZANDO...' : 'ANALIZAR OPCIONES'}
          </button>
        </div>
      </form>

      {error && (
        <div className="card border border-red-500/40 p-4 mb-6">
          <p className="text-xs text-red-400 font-mono">{error}</p>
        </div>
      )}

      {!data && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {STRATEGIES.map((strategy) => (
            <div key={strategy.key} className="rounded-xl border p-5" style={{ borderColor: 'rgba(201,168,76,0.15)', background: 'var(--bg-card)' }}>
              <p className="text-sm font-bold text-white mb-1">{strategy.label}</p>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{strategy.desc}</p>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="card text-center py-14 mb-6">
          <p className="text-xs font-mono animate-pulse" style={{ color: 'var(--gold)' }}>Leyendo cadena de opciones y calculando griegas...</p>
        </div>
      )}

      {data && (
        <>
          <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-5 mb-6">
            <div className="card p-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
                <div>
                  <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: 'var(--gold)' }}>{data.underlying.ticker}</p>
                  <h2 className="text-xl font-black text-white">{data.underlying.company}</h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{data.underlying.sector}</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-3xl font-black" style={{ color: 'var(--gold)' }}>{money(data.underlying.underlyingPrice)}</p>
                  <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{new Date(data.underlying.fetchedAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Metric label="Consenso" value={data.underlying.fundamentals.analystConsensus || 'N/D'} />
                <Metric label="P/E FWD" value={num(data.underlying.fundamentals.peForward)} />
                <Metric label="Target" value={moneyOrDash(data.underlying.fundamentals.targetMeanPrice)} />
                <Metric label="Beta" value={num(data.underlying.fundamentals.beta)} />
              </div>
            </div>

            <div className="card p-5">
              <p className="text-[10px] font-mono tracking-widest mb-4" style={{ color: 'var(--gold)' }}>ZONAS TECNICAS ESTIMADAS</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Metric label="Soporte" value={moneyOrDash(data.technicalZones.support)} />
                <Metric label="Resistencia" value={moneyOrDash(data.technicalZones.resistance)} />
                <Metric label="SMA 50" value={moneyOrDash(data.technicalZones.sma50)} />
                <Metric label="SMA 200" value={moneyOrDash(data.technicalZones.sma200)} />
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Sesgo técnico: <span className="text-white font-bold">{biasLabel(data.technicalZones.technicalBias)}</span>. Zonas estimadas con histórico diario; confirmar en plataforma antes de operar.
              </p>
            </div>
          </section>

          {data.recommendation && (
            <section className="mb-6 rounded-xl border p-5" style={{ borderColor: 'rgba(201,168,76,0.35)', background: 'linear-gradient(135deg, rgba(201,168,76,0.10) 0%, var(--bg-card) 70%)' }}>
              <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: 'var(--gold)' }}>MEJOR RECOMENDACION DEL SISTEMA</p>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-white">{data.recommendation.action}</h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {data.recommendation.contract.symbol} · Strike {money(data.recommendation.contract.strike)} · {data.recommendation.contract.expiration}
                  </p>
                </div>
                <ScoreBadge score={data.recommendation.score} label={data.recommendation.label} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
                <Metric label="Prima mid" value={moneyOrDash(data.recommendation.contract.mid)} />
                <Metric label="Fair value" value={moneyOrDash(data.recommendation.contract.fairValue)} />
                <Metric label="Breakeven" value={money(data.recommendation.breakeven)} />
              </div>
            </section>
          )}

          <section className="mb-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
              {STRATEGIES.map((strategy) => (
                <button
                  key={strategy.key}
                  onClick={() => setActiveStrategy(strategy.key)}
                  className={`text-left rounded-lg border p-3 transition-colors ${
                    activeStrategy === strategy.key
                      ? 'bg-[var(--gold)] text-black border-[var(--gold)]'
                      : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--gold-dark)]'
                  }`}
                >
                  <span className="block text-xs font-bold">{strategy.label}</span>
                  <span className="block text-[10px] mt-1 opacity-80">{strategy.desc}</span>
                </button>
              ))}
            </div>

            {data.underlying.selectedExpirations.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => setFilterExp('all')}
                  className={`text-[10px] font-mono px-3 py-1 rounded-full border transition-colors ${
                    filterExp === 'all'
                      ? 'bg-[var(--gold)] text-black border-[var(--gold)]'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--gold-dark)]'
                  }`}
                >
                  Todas
                </button>
                {data.underlying.selectedExpirations.map(exp => (
                  <button key={exp}
                    onClick={() => setFilterExp(exp)}
                    className={`text-[10px] font-mono px-3 py-1 rounded-full border transition-colors ${
                      filterExp === exp
                        ? 'bg-[var(--gold)] text-black border-[var(--gold)]'
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--gold-dark)]'
                    }`}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            )}

            <div className="card p-0 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {['Score', 'Contrato', 'Strike', 'DTE', 'Bid/Ask', 'Mid', 'Fair', 'Delta', 'IV', 'OI/Vol', 'Breakeven'].map((h) => (
                      <th key={h} className="text-left p-3 font-mono text-[10px] tracking-widest" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPicks.map((pick) => (
                    <tr key={`${pick.strategy}-${pick.contract.symbol}`} className="border-b border-[var(--border)]/60 hover:bg-white/[0.03]">
                      <td className="p-3"><ScoreMini score={pick.score} label={pick.label} /></td>
                      <td className="p-3 font-mono text-[var(--text-secondary)]">{pick.contract.symbol}</td>
                      <td className="p-3 text-white">{money(pick.contract.strike)}</td>
                      <td className="p-3">{pick.contract.dte}</td>
                      <td className="p-3">{moneyOrDash(pick.contract.bid)} / {moneyOrDash(pick.contract.ask)}</td>
                      <td className="p-3">{moneyOrDash(pick.contract.mid)}</td>
                      <td className="p-3">{moneyOrDash(pick.contract.fairValue)}</td>
                      <td className="p-3">{num(pick.contract.delta)}</td>
                      <td className="p-3">{pct(pick.contract.impliedVolatility)}</td>
                      <td className="p-3">{pick.contract.openInterest ?? 'N/D'} / {pick.contract.volume ?? 'N/D'}</td>
                      <td className="p-3 text-white">{money(pick.breakeven)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredPicks.length && (
                <div className="text-center py-10 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {filterExp === 'all' ? 'No hay contratos útiles para esta estrategia.' : `Sin contratos para ${filterExp} en esta estrategia.`}
                </div>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card p-5">
              <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: 'var(--gold)' }}>RAZONES Y ALERTAS</p>
              {activePicks[0] ? (
                <div className="space-y-3">
                  {[...activePicks[0].reasons, ...activePicks[0].warnings].map((item, index) => (
                    <p key={index} className="text-xs leading-relaxed" style={{ color: index < activePicks[0].reasons.length ? 'var(--text-secondary)' : '#fca5a5' }}>
                      {item}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="card p-5">
              <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: 'var(--gold)' }}>ADVERTENCIAS</p>
              <div className="space-y-2">
                {[data.dataWarning, ...data.warnings].map((warning, index) => (
                  <p key={index} className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{warning}</p>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Track Record de Opciones */}
      <section className="mt-12 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: 'var(--gold)' }}>RECOMENDACIONES DE OPCIONES</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Track record de contratos recomendados por el Agente Vanilla</p>
          </div>
          <div className="flex items-center gap-2">
            {optRecsLoading && <span className="text-[9px] font-mono animate-pulse" style={{ color: 'var(--text-muted)' }}>cargando…</span>}
            {isAdmin && (
              <button
                onClick={async () => {
                  if (!confirm('¿Eliminar duplicados activos? Se conserva solo la recomendación más reciente por ticker+estrategia.')) return
                  const res = await fetch('/api/options-recs/cleanup', { method: 'DELETE' })
                  const json = await res.json()
                  if (res.ok) {
                    const d = await fetch('/api/options-recs').then(r => r.json())
                    if (d?.recommendations) setOptRecs(d.recommendations)
                    alert(`${json.deleted} duplicado(s) eliminado(s)`)
                  }
                }}
                className="text-[9px] font-mono px-2 py-1 rounded border border-yellow-500/40 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors"
              >
                Limpiar duplicados
              </button>
            )}
          </div>
        </div>

        {optRecs.length === 0 && !optRecsLoading ? (
          <div className="card text-center py-10">
            <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Sin recomendaciones — ejecuta el Agente Vanilla para generar la primera</p>
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)]" style={{ background: 'rgba(201,168,76,0.05)' }}>
                  {['Fecha','Ticker','Acción','Contrato','Strike','Exp.','DTE','Subyacente','Bid/Ask','Delta','Score','Estado','Resultado','P&L %','P&L $','Acc.'].map(col => (
                    <th key={col} className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {optRecs.map((rec, idx) => {
                  const expDays = Math.ceil((new Date(rec.expiration).getTime() - Date.now()) / 86_400_000)
                  const isExpired = expDays < 0
                  const statusColor = rec.status === 'ACTIVA' ? 'text-green-400'
                    : rec.status === 'CERRADA' ? 'text-blue-400' : 'text-red-400'
                  return (
                    <tr key={rec.id} className="border-b border-[var(--border)] hover:bg-white/5 transition-colors">
                      <td className="px-3 py-2 text-[9px] font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {new Date(rec.publishedAt).toLocaleDateString('es-EC', { day:'2-digit', month:'short', year:'numeric', timeZone:'America/Guayaquil' })}
                      </td>
                      <td className="px-3 py-2 font-mono font-bold whitespace-nowrap" style={{ color: 'var(--gold)' }}>{rec.ticker}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                          rec.action.includes('COMPRAR') ? 'border-green-500/40 bg-green-500/10 text-green-400'
                            : 'border-red-500/40 bg-red-500/10 text-red-400'
                        }`}>{rec.action}</span>
                      </td>
                      <td className="px-3 py-2 font-mono text-[9px]" style={{ color: 'var(--text-secondary)' }}>{rec.contractSymbol}</td>
                      <td className="px-3 py-2 font-mono whitespace-nowrap">${rec.strike.toFixed(2)}</td>
                      <td className="px-3 py-2 font-mono whitespace-nowrap text-[9px]">{rec.expiration}</td>
                      <td className="px-3 py-2 font-mono whitespace-nowrap">
                        <span className={isExpired ? 'text-red-400' : expDays <= 7 ? 'text-yellow-400' : ''}>{isExpired ? 'EXP' : `${expDays}d`}</span>
                      </td>
                      <td className="px-3 py-2 font-mono">${rec.underlyingPrice.toFixed(2)}</td>
                      <td className="px-3 py-2 font-mono text-[9px]">{rec.bid != null && rec.ask != null ? `${rec.bid.toFixed(2)}/${rec.ask.toFixed(2)}` : '—'}</td>
                      <td className="px-3 py-2 font-mono">{rec.delta != null ? rec.delta.toFixed(2) : '—'}</td>
                      <td className="px-3 py-2 font-mono">{rec.score}</td>
                      <td className="px-3 py-2">
                        {isAdmin ? (
                          <select
                            value={rec.status}
                            onChange={async e => {
                              const newStatus = e.target.value
                              await fetch(`/api/options-recs/${rec.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: newStatus, active: newStatus === 'ACTIVA' }),
                              })
                              setOptRecs(prev => prev.map(r => r.id === rec.id ? { ...r, status: newStatus, active: newStatus === 'ACTIVA' } : r))
                            }}
                            className="text-[9px] font-mono bg-transparent border border-[var(--border)] rounded px-1 py-0.5"
                            style={{ color: rec.status === 'ACTIVA' ? '#4ade80' : rec.status === 'CERRADA' ? '#60a5fa' : '#f87171' }}
                          >
                            <option value="ACTIVA">ACTIVA</option>
                            <option value="CERRADA">CERRADA</option>
                            <option value="EXPIRADA">EXPIRADA</option>
                          </select>
                        ) : (
                          <span className={`text-[9px] font-mono ${statusColor}`}>{rec.status}</span>
                        )}
                      </td>
                      {/* Resultado inline edit */}
                      <td className="px-3 py-2">
                        {isAdmin ? (
                          <select
                            value={rec.resultado ?? ''}
                            onChange={async e => {
                              const val = e.target.value || null
                              await fetch(`/api/options-recs/${rec.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ resultado: val }),
                              })
                              setOptRecs(prev => prev.map(r => r.id === rec.id ? { ...r, resultado: val } : r))
                            }}
                            className="text-[9px] font-mono bg-transparent border border-[var(--border)] rounded px-1 py-0.5"
                            style={{ color: rec.resultado === 'GANADA' ? '#4ade80' : rec.resultado === 'PERDIDA' ? '#f87171' : 'var(--text-muted)' }}
                          >
                            <option value="">—</option>
                            <option value="GANADA">GANADA</option>
                            <option value="PERDIDA">PERDIDA</option>
                            <option value="BREAKEVEN">BREAKEVEN</option>
                          </select>
                        ) : (
                          <span className={`text-[9px] font-mono ${rec.resultado === 'GANADA' ? 'text-green-400' : rec.resultado === 'PERDIDA' ? 'text-red-400' : ''}`}>
                            {rec.resultado ?? '—'}
                          </span>
                        )}
                      </td>
                      {/* P&L % inline */}
                      <td className="px-3 py-2">
                        {isAdmin ? (
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            defaultValue={rec.pnlPct ?? ''}
                            className="text-[9px] font-mono bg-transparent border border-[var(--border)] rounded px-1 py-0.5 w-16"
                            style={{ color: 'var(--text-secondary)' }}
                            onBlur={async e => {
                              const val = e.target.value ? parseFloat(e.target.value) : null
                              await fetch(`/api/options-recs/${rec.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ pnlPct: val }),
                              })
                              setOptRecs(prev => prev.map(r => r.id === rec.id ? { ...r, pnlPct: val } : r))
                            }}
                          />
                        ) : (
                          <span className={`text-[9px] font-mono ${(rec.pnlPct ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {rec.pnlPct != null ? `${rec.pnlPct.toFixed(1)}%` : '—'}
                          </span>
                        )}
                      </td>
                      {/* P&L $ inline */}
                      <td className="px-3 py-2">
                        {isAdmin ? (
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            defaultValue={rec.pnlUsd ?? ''}
                            className="text-[9px] font-mono bg-transparent border border-[var(--border)] rounded px-1 py-0.5 w-16"
                            style={{ color: 'var(--text-secondary)' }}
                            onBlur={async e => {
                              const val = e.target.value ? parseFloat(e.target.value) : null
                              await fetch(`/api/options-recs/${rec.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ pnlUsd: val }),
                              })
                              setOptRecs(prev => prev.map(r => r.id === rec.id ? { ...r, pnlUsd: val } : r))
                            }}
                          />
                        ) : (
                          <span className={`text-[9px] font-mono ${(rec.pnlUsd ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {rec.pnlUsd != null ? `$${rec.pnlUsd.toFixed(2)}` : '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {isAdmin && (
                          <button onClick={async () => {
                            if (!confirm('¿Eliminar esta recomendación?')) return
                            await fetch(`/api/options-recs/${rec.id}`, { method: 'DELETE' })
                            setOptRecs(prev => prev.filter(r => r.id !== rec.id))
                          }} className="text-red-400 hover:text-red-300 text-[9px] font-mono">✕</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Stats */}
        {optRecs.length > 0 && (
          <div className="flex gap-4 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            <span>Total: {optRecs.length}</span>
            <span className="text-green-400">Activas: {optRecs.filter(r => r.status === 'ACTIVA').length}</span>
            <span className="text-blue-400">Cerradas: {optRecs.filter(r => r.status === 'CERRADA').length}</span>
            <span className="text-red-400">Expiradas: {optRecs.filter(r => r.status === 'EXPIRADA').length}</span>
          </div>
        )}
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-3" style={{ background: 'var(--bg-secondary)' }}>
      <p className="text-[9px] font-mono tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  )
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  return (
    <div className="rounded-lg border px-5 py-3 text-center" style={{ borderColor: 'rgba(201,168,76,0.35)', background: 'rgba(201,168,76,0.08)' }}>
      <p className="text-3xl font-black" style={{ color: 'var(--gold)' }}>{score}</p>
      <p className="text-[10px] font-mono tracking-widest text-white">{label}</p>
    </div>
  )
}

function ScoreMini({ score, label }: { score: number; label: string }) {
  return (
    <div>
      <span className="font-bold text-white">{score}</span>
      <span className="ml-2 text-[10px] font-mono" style={{ color: label === 'EVITAR' ? '#f87171' : 'var(--gold)' }}>{label}</span>
    </div>
  )
}

function money(value: number): string {
  return `$${value.toFixed(2)}`
}

function moneyOrDash(value: number | null): string {
  return value == null || !Number.isFinite(value) ? 'N/D' : money(value)
}

function num(value: number | null): string {
  return value == null || !Number.isFinite(value) ? 'N/D' : value.toFixed(2)
}

function pct(value: number | null): string {
  return value == null || !Number.isFinite(value) ? 'N/D' : `${(value * 100).toFixed(1)}%`
}

function biasLabel(value: string): string {
  if (value === 'bullish') return 'Alcista'
  if (value === 'bearish') return 'Bajista'
  return 'Neutral'
}
