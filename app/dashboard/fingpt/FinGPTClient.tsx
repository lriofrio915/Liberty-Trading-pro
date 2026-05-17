'use client'

import { useState } from 'react'

const ASSETS_LIST = [
  { simbolo: 'BTC',   nombre: 'Bitcoin' },
  { simbolo: 'ETH',   nombre: 'Ethereum' },
  { simbolo: 'SPY',   nombre: 'S&P 500 ETF' },
  { simbolo: 'QQQ',   nombre: 'Nasdaq ETF' },
  { simbolo: 'NQ=F',  nombre: 'Nasdaq Futures' },
  { simbolo: 'ES=F',  nombre: 'S&P Futures' },
  { simbolo: 'GC=F',  nombre: 'Oro Futures' },
  { simbolo: 'CL=F',  nombre: 'Petróleo WTI' },
  { simbolo: 'EUR/USD', nombre: 'Euro/Dólar' },
  { simbolo: 'AAPL',  nombre: 'Apple' },
  { simbolo: 'TSLA',  nombre: 'Tesla' },
  { simbolo: 'NVDA',  nombre: 'NVIDIA' },
]

type Tab = 'sentiment' | 'qa' | 'signals'

interface SentimentResult {
  label: 'positive' | 'negative' | 'neutral'
  score: number
  reasoning: string
  keywords: string[]
}

interface Signal {
  simbolo: string
  sesgo: 'COMPRA' | 'VENTA' | 'NEUTRAL'
  confianza: number
  razon: string
}

interface QAMessage {
  role: 'user' | 'assistant'
  content: string
}

const LABEL_MAP: Record<SentimentResult['label'], { text: string; color: string; bg: string }> = {
  positive: { text: 'POSITIVO',  color: 'text-green-400',  bg: 'bg-green-400/10 border-green-400/30' },
  negative: { text: 'NEGATIVO',  color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/30' },
  neutral:  { text: 'NEUTRAL',   color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
}

const SESGO_MAP: Record<Signal['sesgo'], { color: string; bg: string }> = {
  COMPRA:  { color: 'text-green-400',  bg: 'bg-green-400/10' },
  VENTA:   { color: 'text-red-400',    bg: 'bg-red-400/10' },
  NEUTRAL: { color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? '#4ade80' : score >= 40 ? '#facc15' : '#f87171'
  return (
    <div className="flex items-center gap-3 mt-2">
      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-bold" style={{ color }}>{score}/100</span>
    </div>
  )
}

export default function FinGPTClient({ isAdmin }: { isAdmin: boolean }) {
  const [tab, setTab] = useState<Tab>('sentiment')

  // Sentiment state
  const [sentimentInput, setSentimentInput] = useState('')
  const [sentimentResult, setSentimentResult] = useState<SentimentResult | null>(null)
  const [loadingSentiment, setLoadingSentiment] = useState(false)
  const [sentimentError, setSentimentError] = useState('')

  // QA state
  const [qaInput, setQaInput] = useState('')
  const [qaHistory, setQaHistory] = useState<QAMessage[]>([])
  const [loadingQA, setLoadingQA] = useState(false)
  const [qaError, setQaError] = useState('')

  // Signals state
  const [selectedAssets, setSelectedAssets] = useState<string[]>(['BTC', 'ETH', 'SPY', 'NQ=F'])
  const [signals, setSignals] = useState<Signal[]>([])
  const [loadingSignals, setLoadingSignals] = useState(false)
  const [signalsError, setSignalsError] = useState('')

  async function analyzeSentiment() {
    if (!sentimentInput.trim()) return
    setLoadingSentiment(true)
    setSentimentError('')
    setSentimentResult(null)
    try {
      const res = await fetch('/api/fingpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'sentiment', input: sentimentInput }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al analizar')
      setSentimentResult(data as SentimentResult)
    } catch (err) {
      setSentimentError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoadingSentiment(false)
    }
  }

  async function askQuestion() {
    if (!qaInput.trim()) return
    const question = qaInput.trim()
    setQaInput('')
    setLoadingQA(true)
    setQaError('')
    setQaHistory(h => [...h, { role: 'user', content: question }])
    try {
      const res = await fetch('/api/fingpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'qa', input: question }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al responder')
      setQaHistory(h => [...h, { role: 'assistant', content: data.answer }])
    } catch (err) {
      setQaError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoadingQA(false)
    }
  }

  async function generateSignals() {
    if (selectedAssets.length === 0) return
    setLoadingSignals(true)
    setSignalsError('')
    setSignals([])
    try {
      const res = await fetch('/api/fingpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'signals', assets: selectedAssets }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al generar señales')
      setSignals((data.activos ?? []) as Signal[])
    } catch (err) {
      setSignalsError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoadingSignals(false)
    }
  }

  function toggleAsset(simbolo: string) {
    setSelectedAssets(prev =>
      prev.includes(simbolo) ? prev.filter(s => s !== simbolo) : [...prev, simbolo]
    )
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'sentiment', label: 'Sentimiento',    icon: '🔍' },
    { id: 'qa',        label: 'Q&A Financiero', icon: '💬' },
    { id: 'signals',   label: 'Señales',        icon: '📡' },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="text-4xl">🧬</div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">FinGPT</h1>
              <a
                href="https://github.com/AI4Finance-Foundation/FinGPT"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/50 hover:text-white/80 transition-colors"
              >
                AI4Finance-Foundation ↗
              </a>
            </div>
            <p className="text-sm text-white/50 mt-0.5">
              Análisis financiero con IA: sentimiento de noticias, preguntas de mercado y señales por sentimiento.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-yellow-400 text-black'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab: Sentimiento */}
        {tab === 'sentiment' && (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-5 space-y-3">
              <p className="text-sm text-white/60">
                Pega un titular, tweet, artículo financiero o texto de mercado para analizar su sentimiento.
              </p>
              <textarea
                value={sentimentInput}
                onChange={e => setSentimentInput(e.target.value)}
                placeholder={'Ejemplo: "Bitcoin surges to new all-time high as institutional demand accelerates amid ETF inflows."'}
                rows={5}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-yellow-400/50 transition-colors"
              />
              <button
                onClick={analyzeSentiment}
                disabled={loadingSentiment || !sentimentInput.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-yellow-400 text-black rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-yellow-300 transition-colors"
              >
                {loadingSentiment ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>🔍 Analizar Sentimiento</>
                )}
              </button>
            </div>

            {sentimentError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
                {sentimentError}
              </div>
            )}

            {sentimentResult && (() => {
              const style = LABEL_MAP[sentimentResult.label] ?? LABEL_MAP.neutral
              return (
                <div className={`border rounded-xl p-5 space-y-4 ${style.bg}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-lg font-black ${style.color}`}>{style.text}</span>
                    <span className="text-xs text-white/40">Confianza del modelo</span>
                  </div>
                  <ScoreBar score={sentimentResult.score} />
                  <p className="text-sm text-white/70 leading-relaxed">{sentimentResult.reasoning}</p>
                  {sentimentResult.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {sentimentResult.keywords.map(kw => (
                        <span key={kw} className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/60">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* Tab: Q&A */}
        {tab === 'qa' && (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-5 space-y-4 min-h-[300px] flex flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px]">
                {qaHistory.length === 0 && (
                  <div className="text-sm text-white/30 text-center py-8">
                    Haz una pregunta sobre mercados, activos, estrategias o conceptos financieros.
                  </div>
                )}
                {qaHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-yellow-400 text-black font-medium'
                          : 'bg-white/10 text-white/80'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loadingQA && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-white/40">
                      <span className="w-3 h-3 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                      FinGPT está pensando...
                    </div>
                  </div>
                )}
              </div>

              {qaError && (
                <div className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{qaError}</div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={qaInput}
                  onChange={e => setQaInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); askQuestion() } }}
                  placeholder="¿Qué es el ratio P/E? ¿Cómo funciona el carry trade?..."
                  disabled={loadingQA}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400/50 transition-colors disabled:opacity-50"
                />
                <button
                  onClick={askQuestion}
                  disabled={loadingQA || !qaInput.trim()}
                  className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-bold disabled:opacity-40 hover:bg-yellow-300 transition-colors"
                >
                  ↑
                </button>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-white/30">Enter para enviar — FinGPT responde en español</p>
                {qaHistory.length > 0 && (
                  <button onClick={() => setQaHistory([])} className="text-xs text-white/30 hover:text-white/60 transition-colors">
                    Limpiar chat
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Señales */}
        {tab === 'signals' && (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-5 space-y-4">
              <p className="text-sm text-white/60">
                Selecciona activos para analizar su sentimiento de mercado con FinGPT Forecaster.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ASSETS_LIST.map(a => (
                  <button
                    key={a.simbolo}
                    onClick={() => toggleAsset(a.simbolo)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm border transition-all ${
                      selectedAssets.includes(a.simbolo)
                        ? 'bg-yellow-400/10 border-yellow-400/50 text-yellow-300'
                        : 'bg-black/30 border-white/10 text-white/50 hover:border-white/20'
                    }`}
                  >
                    <span className="font-mono font-bold text-xs">{a.simbolo}</span>
                    <span className="text-xs text-white/30">{a.nombre}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">{selectedAssets.length} activo(s) seleccionado(s)</span>
                <button
                  onClick={generateSignals}
                  disabled={loadingSignals || selectedAssets.length === 0}
                  className="flex items-center gap-2 px-5 py-2 bg-yellow-400 text-black rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-yellow-300 transition-colors"
                >
                  {loadingSignals ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>📡 Generar Señales</>
                  )}
                </button>
              </div>
            </div>

            {signalsError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
                {signalsError}
              </div>
            )}

            {signals.length > 0 && (
              <div className="bg-white/5 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 text-left text-white/40 font-medium">Activo</th>
                      <th className="px-4 py-3 text-left text-white/40 font-medium">Señal</th>
                      <th className="px-4 py-3 text-left text-white/40 font-medium">Confianza</th>
                      <th className="px-4 py-3 text-left text-white/40 font-medium hidden sm:table-cell">Razonamiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signals.map((s, i) => {
                      const style = SESGO_MAP[s.sesgo] ?? SESGO_MAP.NEUTRAL
                      return (
                        <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-white">{s.simbolo}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${style.color} ${style.bg}`}>
                              {s.sesgo}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${s.confianza}%`,
                                    backgroundColor: s.sesgo === 'COMPRA' ? '#4ade80' : s.sesgo === 'VENTA' ? '#f87171' : '#facc15',
                                  }}
                                />
                              </div>
                              <span className="text-xs text-white/50">{s.confianza}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-white/50 text-xs leading-relaxed hidden sm:table-cell max-w-xs">
                            {s.razon}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-white/20 text-center">
          FinGPT — AI4Finance-Foundation · Impulsado por modelos LLM vía OpenRouter · No es consejo financiero
        </p>
      </div>
    </div>
  )
}
