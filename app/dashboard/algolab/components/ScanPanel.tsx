'use client'
import { useState } from 'react'
import type { PatternAnalysisResult } from '@/lib/algolab-pattern-engine'

interface DatasetSummary {
  id: string
  symbol: string
  timeframe: string
  candleCount: number
  dateFrom: string
  dateTo: string
  provider: string
}

interface Props {
  dataset: DatasetSummary
  onAnalyzed: (result: PatternAnalysisResult) => void
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ScanPanel({ dataset, onAnalyzed }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/algolab/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId: dataset.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al analizar patrones')
        return
      }
      onAnalyzed(data.result as PatternAnalysisResult)
    } catch {
      setError('Error de red. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      {/* Dataset info */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">Dataset seleccionado</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-[var(--text-muted)]">Activo</span>
            <p className="font-bold text-[var(--text-primary)] text-lg">{dataset.symbol}</p>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Timeframe</span>
            <p className="font-bold text-[var(--text-primary)] text-lg">{dataset.timeframe}</p>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Total de barras</span>
            <p className="font-semibold text-[var(--text-primary)]">{dataset.candleCount.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Proveedor</span>
            <p className="font-semibold text-[var(--text-primary)]">{dataset.provider}</p>
          </div>
          <div className="col-span-2">
            <span className="text-[var(--text-muted)]">Rango</span>
            <p className="font-semibold text-[var(--text-primary)]">
              {fmtDate(dataset.dateFrom)} — {fmtDate(dataset.dateTo)}
            </p>
          </div>
        </div>
      </div>

      {/* Descripción del análisis */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5 space-y-2">
        <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">¿Qué se analiza?</h2>
        <ul className="text-sm text-[var(--text-secondary)] space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">▸</span>
            <span><strong>57 patrones</strong> de velas japonesas (1, 2, 3 y 4 velas)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">▸</span>
            <span>Solo en la <strong>ventana horaria de mayor volumen</strong> (auto-detectada)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">▸</span>
            <span><strong>TP = 3 × ATR(14)</strong> · <strong>SL = 1 × ATR(14)</strong> — si ambos tocan en la misma barra, gana el SL</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">▸</span>
            <span>Solo se reportan patrones con <strong>≥ 30 señales</strong> válidas</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">▸</span>
            <span>Sin IA — cálculo determinístico local (~2 segundos)</span>
          </li>
        </ul>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Botón principal */}
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full rounded-xl py-4 px-6 font-semibold text-base transition-all
          bg-amber-500 hover:bg-amber-400 text-black
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Analizando 57 patrones en ventana de alto volumen…
          </span>
        ) : (
          'Analizar 57 Patrones'
        )}
      </button>
    </div>
  )
}
