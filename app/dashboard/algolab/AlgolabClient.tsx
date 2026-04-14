'use client'
import { useState, useEffect, useCallback } from 'react'
import DatasetPanel from './components/DatasetPanel'
import ScanPanel from './components/ScanPanel'
import PatternReport from './components/PatternReport'
import type { PatternAnalysisResult } from '@/lib/algolab-pattern-engine'

// Legacy imports (kept for backward compat — shown only when patternReport doesn't exist yet)
import StrategyList, { type Strategy } from './components/StrategyList'
import StrategyDetail from './components/StrategyDetail'
import GeneratePanel from './components/GeneratePanel'

interface DatasetSummary {
  id: string
  symbol: string
  timeframe: string
  provider: string
  dateFrom: string
  dateTo: string
  candleCount: number
  createdAt: string
  _count: { strategies: number }
}

type Panel = 'datasets' | 'generar' | 'resultados'

interface Props {
  isAdmin: boolean
}

export default function AlgolabClient({ isAdmin }: Props) {
  const [panel, setPanel] = useState<Panel>('datasets')
  const [datasets, setDatasets] = useState<DatasetSummary[]>([])
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null)

  // Pattern analysis (nuevo flujo principal)
  const [patternResult, setPatternResult] = useState<PatternAnalysisResult | null>(null)
  const [loadingPattern, setLoadingPattern] = useState(false)

  // Legacy strategies (flujo anterior — solo admin o si no hay patternReport)
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null)
  const [, setLoadingDatasets] = useState(true)
  const [showLegacy, setShowLegacy] = useState(false)

  useEffect(() => {
    fetch('/api/algolab/datasets')
      .then(r => r.json())
      .then(data => setDatasets(data.datasets ?? []))
      .catch(() => {})
      .finally(() => setLoadingDatasets(false))
  }, [])

  const loadDataset = useCallback(async (id: string) => {
    setLoadingPattern(true)
    setPatternResult(null)
    setStrategies([])
    try {
      const res = await fetch(`/api/algolab/datasets/${id}`)
      const data = await res.json()
      // Cargar patternReport si ya existe
      if (data.dataset?.patternReport) {
        const pr = data.dataset.patternReport
        setPatternResult({
          meta: pr.meta,
          stats: pr.stats,
          totalScanned: pr.totalScanned,
          generatedAt: new Date(pr.updatedAt).getTime(),
        })
      }
      // Legacy strategies
      setStrategies(data.dataset?.strategies ?? [])
    } catch {
      setStrategies([])
    } finally {
      setLoadingPattern(false)
    }
  }, [])

  function selectDataset(id: string) {
    setSelectedDatasetId(id)
    loadDataset(id)
    setPanel('generar')
  }

  function handleDatasetUploaded(ds: DatasetSummary) {
    setDatasets(prev => {
      const exists = prev.find(d => d.id === ds.id)
      if (exists) return prev.map(d => d.id === ds.id ? ds : d)
      return [ds, ...prev]
    })
    selectDataset(ds.id)
  }

  function handleAnalyzed(result: PatternAnalysisResult) {
    setPatternResult(result)
    setPanel('resultados')
  }

  // Legacy: cuando se generan estrategias IA (solo admin)
  function handleGenerated() {
    if (selectedDatasetId) {
      loadDataset(selectedDatasetId)
      setPanel('resultados')
    }
  }

  const selectedDataset = datasets.find(d => d.id === selectedDatasetId) ?? null
  const positiveCount = patternResult?.stats.filter(s => s.totalPnlPts > 0).length ?? 0

  const tabs: { id: Panel; label: string; disabled?: boolean }[] = [
    { id: 'datasets', label: 'Datasets' },
    { id: 'generar', label: 'Generar', disabled: !selectedDataset },
    {
      id: 'resultados',
      label: `Resultados${patternResult ? ` (${positiveCount}+)` : strategies.length ? ` (${strategies.length})` : ''}`,
      disabled: !selectedDataset,
    },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] px-6 py-5">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-serif)' }}>
          AlgoLab
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Laboratorio de Estrategias Cuantitativas
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-4 border-b border-[var(--border)]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setPanel(tab.id)}
            disabled={tab.disabled}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors
              ${tab.disabled ? 'opacity-40 cursor-not-allowed border-transparent text-[var(--text-muted)]' : ''}
              ${panel === tab.id && !tab.disabled
                ? 'border-amber-500 text-amber-400'
                : !tab.disabled ? 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]' : ''
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="overflow-auto">
        {panel === 'datasets' && (
          <DatasetPanel
            datasets={datasets}
            selectedId={selectedDatasetId}
            onSelect={selectDataset}
            onUploaded={handleDatasetUploaded}
          />
        )}

        {panel === 'generar' && selectedDataset && (
          <div className="space-y-0">
            {/* Panel principal: análisis de patrones */}
            <ScanPanel dataset={selectedDataset} onAnalyzed={handleAnalyzed} />

            {/* Toggle modo legado (solo admin) */}
            {isAdmin && (
              <div className="px-6 pb-6">
                <button
                  onClick={() => setShowLegacy(v => !v)}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] underline"
                >
                  {showLegacy ? '▲ Ocultar modo legado (IA)' : '▼ Mostrar modo legado (IA)'}
                </button>
                {showLegacy && (
                  <div className="mt-4 border border-dashed border-[var(--border)] rounded-xl overflow-hidden">
                    <div className="px-4 py-2 bg-[var(--bg-secondary)] text-xs text-[var(--text-muted)]">
                      Modo legado — Generación con IA (archetypes)
                    </div>
                    <GeneratePanel dataset={selectedDataset} onGenerated={handleGenerated} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {panel === 'resultados' && selectedDataset && (
          <>
            {/* Si hay patternResult, mostrar el nuevo reporte */}
            {(patternResult || loadingPattern) && (
              <PatternReport result={patternResult} loading={loadingPattern} datasetId={selectedDatasetId} />
            )}

            {/* Si no hay patternResult pero hay strategies legacy, mostrarlas */}
            {!patternResult && !loadingPattern && strategies.length > 0 && (
              <div className="p-6">
                <p className="text-xs text-[var(--text-muted)] mb-4">
                  Mostrando estrategias del análisis anterior (IA). Presiona &quot;Analizar 57 Patrones&quot; en la pestaña Generar para el nuevo análisis.
                </p>
                <StrategyList
                  strategies={strategies}
                  selectedId={selectedStrategy?.id ?? null}
                  onSelect={setSelectedStrategy}
                />
              </div>
            )}

            {/* Estado vacío */}
            {!patternResult && !loadingPattern && strategies.length === 0 && (
              <PatternReport result={null} loading={false} datasetId={selectedDatasetId} />
            )}
          </>
        )}
      </div>

      {/* Legacy strategy detail modal */}
      {selectedStrategy && (
        <StrategyDetail
          strategy={selectedStrategy}
          onClose={() => setSelectedStrategy(null)}
        />
      )}
    </div>
  )
}
