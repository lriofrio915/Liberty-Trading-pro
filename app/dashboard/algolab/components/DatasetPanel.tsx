'use client'
import { useState, useRef } from 'react'

const CHUNK_LINES = 15_000 // ~750KB por chunk para M1

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

interface Props {
  datasets: DatasetSummary[]
  selectedId: string | null
  onSelect: (id: string) => void
  onUploaded: (dataset: DatasetSummary) => void
}

async function uploadChunk(
  chunk: string,
  symbol: string,
  provider: string,
  filename: string
): Promise<DatasetSummary> {
  const blob = new Blob([chunk], { type: 'text/plain' })
  const file = new File([blob], filename)
  const form = new FormData()
  form.append('file', file)
  form.append('symbol', symbol)
  form.append('provider', provider)

  const res = await fetch('/api/algolab/datasets', { method: 'POST', body: form })
  const text = await res.text()
  let data: { error?: string; dataset?: DatasetSummary } = {}
  try { data = JSON.parse(text) } catch { /* no-JSON */ }
  if (!res.ok) {
    if (res.status === 413) throw new Error('Chunk demasiado grande (reducir CHUNK_LINES)')
    throw new Error(data.error ?? `Error ${res.status}`)
  }
  if (!data.dataset) throw new Error('Respuesta inesperada del servidor')
  return data.dataset
}

export default function DatasetPanel({ datasets, selectedId, onSelect, onUploaded }: Props) {
  const [symbol, setSymbol] = useState('')
  const [provider, setProvider] = useState('MetaTrader 5')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file || !symbol.trim()) {
      setError('Selecciona un archivo y escribe el símbolo')
      return
    }
    setUploading(true)
    setError(null)
    setProgress(null)

    try {
      const sym = symbol.trim().toUpperCase()
      const content = await file.text()

      // Filtrar solo líneas con datos MT5 (formato YYYY.MM.DD al inicio)
      const dataLines = content.split('\n').filter(l => /^\d{4}\.\d{2}\.\d{2}/.test(l.trim()))

      if (dataLines.length < 10) {
        throw new Error('El archivo no contiene datos MT5 válidos. Verifica el formato del CSV.')
      }

      // Dividir en chunks de CHUNK_LINES filas de datos
      const chunks: string[] = []
      for (let i = 0; i < dataLines.length; i += CHUNK_LINES) {
        chunks.push(dataLines.slice(i, i + CHUNK_LINES).join('\n'))
      }

      setProgress({ current: 0, total: chunks.length })

      let lastDataset: DatasetSummary | null = null
      for (let i = 0; i < chunks.length; i++) {
        setProgress({ current: i + 1, total: chunks.length })
        lastDataset = await uploadChunk(chunks[i], sym, provider, file.name)
      }

      if (lastDataset) onUploaded(lastDataset)
      setSymbol('')
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir dataset')
    } finally {
      setUploading(false)
      setProgress(null)
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Upload form */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
        <h3 className="text-[var(--text-primary)] font-semibold mb-4 text-sm uppercase tracking-wider">
          Subir Dataset MT5
        </h3>
        <form onSubmit={handleUpload} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Símbolo</label>
              <input
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                placeholder="EURUSD"
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Proveedor</label>
              <input
                value={provider}
                onChange={e => setProvider(e.target.value)}
                placeholder="MetaTrader 5"
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold)]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Archivo CSV (export MT5)</label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[var(--gold)] file:text-black file:text-xs file:cursor-pointer"
            />
          </div>

          {/* Progress bar */}
          {progress && (
            <div>
              <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                <span>Subiendo bloque {progress.current} de {progress.total}…</span>
                <span>{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-[var(--bg-secondary)] rounded-full h-1.5">
                <div
                  className="bg-[var(--gold)] h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {error && <p className="text-xs text-[var(--red)]">{error}</p>}
          <button
            type="submit"
            disabled={uploading}
            className="w-full py-2 rounded-lg bg-[var(--gold)] text-black text-sm font-semibold disabled:opacity-50 hover:brightness-110 transition"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Procesando…
              </span>
            ) : 'Subir Dataset'}
          </button>
        </form>
      </div>

      {/* Dataset list */}
      {datasets.length === 0 ? (
        <p className="text-center text-[var(--text-muted)] text-sm py-8">
          No hay datasets. Sube un CSV exportado desde MetaTrader 5.
        </p>
      ) : (
        <div className="space-y-2">
          <h3 className="text-[var(--text-primary)] font-semibold text-sm uppercase tracking-wider">
            Mis Datasets ({datasets.length})
          </h3>
          {datasets.map(ds => (
            <button
              key={ds.id}
              onClick={() => onSelect(ds.id)}
              className={`w-full text-left p-4 rounded-xl border transition ${
                selectedId === ds.id
                  ? 'border-[var(--gold)] bg-[var(--gold)]/10'
                  : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--gold)]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--text-primary)]">{ds.symbol}</span>
                <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded">
                  {ds.timeframe}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-[var(--text-muted)]">
                  {ds.candleCount.toLocaleString()} velas · {formatDate(ds.dateFrom)} – {formatDate(ds.dateTo)}
                </span>
                <span className="text-xs text-[var(--gold)]">
                  {ds._count.strategies} estrategia{ds._count.strategies !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">{ds.provider}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
