"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface TickerSuggestion {
  ticker: string
  name: string
  exchange: string
}

interface AnalysisResult {
  ticker: string
  company: string
  price: number
  sector: string
}

type MainTab = "opciones" | "cfds" | "futuros"
type SubTab = "analisis" | "calculadora" | "estrategias"
type ToolTab = "bs" | "greeks" | "iv" | "fv"

export default function CoberturasClient() {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>("opciones")
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("analisis")
  const [activeToolTab, setActiveToolTab] = useState<ToolTab>("bs")
  
  const [ticker, setTicker] = useState("")
  const [suggestions, setSuggestions] = useState<TickerSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) { setSuggestions([]); return }
    setSuggestionsLoading(true)
    try {
      const res = await fetch(`/api/tickers/search?q=${encodeURIComponent(q)}`)
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
    analyzeTicker(s.ticker)
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) setShowSuggestions(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const analyzeTicker = async (tickerOverride?: string) => {
    const t = (tickerOverride ?? ticker).trim()
    if (!t) return
    setLoading(true)
    try {
      const res = await fetch(`/api/coberturas/analyze?ticker=${encodeURIComponent(t)}`)
      if (res.ok) setAnalysisResult(await res.json())
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-black gradient-gold mb-2">Coberturas</h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-3xl">
          Análisis integral de opciones, CFDs y futuros con herramientas profesionales
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
      <div className="mb-6">
        <div className="card p-4">
          <div className="relative">
            <label className="block text-[10px] font-mono tracking-widest mb-2 text-[var(--text-muted)]">
              BUSCAR TICKER
            </label>
            <input
              ref={inputRef}
              value={ticker}
              onChange={(e) => handleTickerChange(e.target.value)}
              onFocus={() => { if (ticker.trim() && suggestions.length > 0) setShowSuggestions(true) }}
              onKeyDown={(e) => { if (e.key === "Escape") setShowSuggestions(false) }}
              placeholder="Ej: AAPL, TSLA, SPY..."
              autoComplete="off"
              className="w-full bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-primary)] text-sm px-4 py-3 rounded-lg focus:outline-none focus:border-[var(--gold-dark)] font-mono"
            />
            
            {showSuggestions && (suggestions.length > 0 || suggestionsLoading) && (
              <div
                ref={dropdownRef}
                className="absolute z-50 w-full mt-1 rounded-xl border overflow-hidden shadow-xl"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
              >
                {suggestionsLoading && suggestions.length === 0 && (
                  <div className="px-4 py-3 text-[11px] font-mono animate-pulse text-[var(--text-muted)]">
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
                      <span className="font-mono font-bold text-sm shrink-0 text-[var(--gold)]">
                        {s.ticker}
                      </span>
                      <span className="text-[11px] truncate text-[var(--text-secondary)]">
                        {s.name}
                      </span>
                    </span>
                    {s.exchange && (
                      <span className="text-[9px] font-mono shrink-0 text-[var(--text-muted)]">
                        {s.exchange}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
        
        <div className="space-y-6">

          <div className="card p-5 min-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-2 border-[var(--gold)] border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-xs font-mono text-[var(--text-muted)]">Analizando {ticker}...</p>
                </div>
              </div>
            ) : analysisResult ? (
              <div>
                <h3 className="text-lg font-black mb-4">Análisis de {analysisResult.ticker}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <MetricCard label="Precio" value={`$${analysisResult.price.toFixed(2)}`} />
                  <MetricCard label="Sector" value={analysisResult.sector} />
                  <MetricCard label="Empresa" value={analysisResult.company} />
                  <MetricCard label="Ticker" value={analysisResult.ticker} />
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-[var(--text-muted)] mb-2">
                  Ingresa un ticker para comenzar el análisis
                </p>
                <p className="text-xs text-[var(--text-muted)] opacity-70">
                  El sistema analizará opciones, CFDs y futuros disponibles
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">🤖</span>
              <h3 className="text-xs font-mono tracking-widest text-[var(--text-muted)]">ANÁLISIS AUTOMÁTICO</h3>
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] mb-3">
              Análisis en tiempo real basado en datos de mercado y algoritmos avanzados
            </p>
            
            <div className="space-y-2">
              <AnalysisMetric label="Sesgo del Mercado" value="Alcista" trend="positive" />
              <AnalysisMetric label="Volatilidad" value="Alta" trend="neutral" />
              <AnalysisMetric label="Liquidez" value="Excelente" trend="positive" />
              <AnalysisMetric label="Riesgo" value="Moderado" trend="neutral" />
            </div>
            
            <button className="w-full mt-3 px-3 py-2 text-[10px] font-mono tracking-widest rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/30 text-[var(--gold)] hover:bg-[var(--gold)]/20 transition-colors">
              ACTUALIZAR ANÁLISIS
            </button>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">🧮</span>
              <h3 className="text-xs font-mono tracking-widest text-[var(--text-muted)]">CALCULADORA BS</h3>
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] mb-3">
              Calculadora Black-Scholes para valoración de opciones
            </p>
            
            <div className="space-y-2">
              <CalculatorInput label="Precio Subyacente" value="150.00" />
              <CalculatorInput label="Precio Ejercicio" value="155.00" />
              <CalculatorInput label="Días a Vencimiento" value="30" />
              <CalculatorInput label="Volatilidad" value="0.20" />
              <CalculatorInput label="Tasa Libre Riesgo" value="0.05" />
            </div>
            
            <div className="mt-3 p-2 rounded-lg bg-[var(--bg-secondary)]">
              <div className="text-[9px] font-mono tracking-widest text-[var(--text-muted)] mb-1">
                VALOR TEÓRICO
              </div>
              <div className="text-sm font-black text-[var(--gold)]">
                $4.25
              </div>
            </div>
            
            <button className="w-full mt-2 px-3 py-2 text-[10px] font-mono tracking-widest rounded-lg bg-[var(--gold)] text-black hover:bg-[var(--gold-dark)] transition-colors">
              CALCULAR
            </button>
          </div>

          <div className="card p-3">
            <h4 className="text-[10px] font-mono tracking-widest text-[var(--text-muted)] mb-2">ALERTAS RÁPIDAS</h4>
            <div className="space-y-1">
              <QuickAlert label="SPY" value="+1.2%" trend="positive" />
              <QuickAlert label="QQQ" value="-0.8%" trend="negative" />
              <QuickAlert label="DIA" value="+0.5%" trend="positive" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-3 bg-[var(--bg-secondary)]">
      <p className="text-[9px] font-mono tracking-widest text-[var(--text-muted)] mb-1">{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  )
}

function AnalysisMetric({ label, value, trend }: { label: string; value: string; trend: "positive" | "negative" | "neutral" }) {
  const trendColors = {
    positive: "text-green-400",
    negative: "text-red-400", 
    neutral: "text-yellow-400"
  }
  
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      <span className={`text-xs font-bold ${trendColors[trend]}`}>{value}</span>
    </div>
  )
}

function CalculatorInput({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-[9px] font-mono tracking-widest text-[var(--text-muted)] mb-1">
        {label}
      </label>
      <input 
        type="text"
        value={value}
        className="w-full bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-primary)] text-[10px] px-2 py-1.5 rounded focus:outline-none focus:border-[var(--gold-dark)]"
      />
    </div>
  )
}

function QuickAlert({ label, value, trend }: { label: string; value: string; trend: "positive" | "negative" }) {
  const trendIcon = trend === "positive" ? "▲" : "▼"
  const trendColor = trend === "positive" ? "text-green-400" : "text-red-400"
  
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="font-mono font-bold">{label}</span>
      <span className={`font-mono ${trendColor}`}>
        {trendIcon} {value}
      </span>
    </div>
  )
}
