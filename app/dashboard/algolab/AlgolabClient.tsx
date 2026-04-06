'use client'
import { useState, useEffect, useCallback } from 'react'
import DatasetPanel from './components/DatasetPanel'
import GeneratePanel from './components/GeneratePanel'
import StrategyList, { type Strategy } from './components/StrategyList'
import StrategyDetail from './components/StrategyDetail'

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

export default function AlgolabClient({ isAdmin: _isAdmin }: Props) {
  const [panel, setPanel] = useState<Panel>('datasets')
  const [datasets, setDatasets] = useState<DatasetSummary[]>([])
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null)
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null)
  const [loadingDatasets, setLoadingDatasets] = useState(true)
  const [loadingStrategies, setLoadingStrategies] = useState(false)

  useEffect(() => {
    fetch('/api/algolab/datasets')
      .then(r => r.json())
      .then(data => setDatasets(data.datasets ?? []))
      .catch(() => {})
      .finally(() => setLoadingDatasets(false))
  }, [])

  const loadStrategies = useCallback(async (id: string) => {
    setLoadingStrategies(true)
    setStrategies([])
    try {
      const res = await fetch(`/api/algolab/datasets/${id}`)
      const data = await res.json()
      setStrategies(data.dataset?.strategies ?? [])
    } catch {
      setStrategies([])
    } finally {
      setLoadingStrategies(false)
    }
  }, [])

  function selectDataset(id: string) {
    setSelectedDatasetId(id)
    loadStrategies(id)
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

  function handleGenerated() {
    if (selectedDatasetId) {
      loadStrategies(selectedDatasetId)
      setPanel('resultados')
    }
  }

  const selectedDataset = datasets.find(d => d.id === selectedDatasetId) ?? null

  const tabs: { id: Panel; label: string; disabled?: boolean }[] = [
    { id: 'datasets',   label: 'Datasets' },
    { id: 'generar',    label: 'Generar',    disabled: !selectedDataset },
    { id: 'resultados', label: `Resultados${strategies.length ? ` (${strategies.length})` : ''}`, disabled: !selectedDataset },
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
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
              panel === tab.id
                ? 'border-[var(--gold)] text-[var(--gold)]'
                : tab.disabled
                ? 'border-transparent text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {panel === 'datasets' && (
          loadingDatasets ? (
            <p className="text-center text-[var(--text-muted)] text-sm py-12">Cargando datasets…</p>
          ) : (
            <DatasetPanel
              datasets={datasets}
              selectedId={selectedDatasetId}
              onSelect={selectDataset}
              onUploaded={handleDatasetUploaded}
            />
          )
        )}

        {panel === 'generar' && selectedDataset && (
          <GeneratePanel
            dataset={selectedDataset}
            onGenerated={handleGenerated}
          />
        )}

        {panel === 'resultados' && selectedDataset && (
          loadingStrategies ? (
            <p className="text-center text-[var(--text-muted)] text-sm py-12">Cargando estrategias…</p>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[var(--text-muted)]">
                  Dataset: <span className="text-[var(--text-primary)] font-semibold">{selectedDataset.symbol} · {selectedDataset.timeframe}</span>
                </p>
                <button
                  onClick={() => setPanel('generar')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[var(--gold)] text-black font-semibold hover:brightness-110 transition"
                >
                  + Generar más
                </button>
              </div>
              <StrategyList
                strategies={strategies}
                selectedId={selectedStrategy?.id ?? null}
                onSelect={setSelectedStrategy}
              />
            </div>
          )
        )}
      </div>

      {/* Strategy detail modal */}
      {selectedStrategy && (
        <StrategyDetail
          strategy={selectedStrategy}
          onClose={() => setSelectedStrategy(null)}
        />
      )}
    </div>
  )
}
