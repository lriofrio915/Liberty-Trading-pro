'use client'

import { useRef, useState } from 'react'

type Phase = 'idle' | 'running' | 'done' | 'error'
type Decision = 'pending' | 'mantener' | 'precaución' | 'cerrar'

type OpenOpp = {
  id: string
  ticker: string
  precioEntrada: number
  precioObjetivo: number
  stopLoss: number
  category: string
}

type MonitorResult = {
  opp: OpenOpp
  currentPrice: number | null
  lynchFail: boolean | null
  forecastFail: boolean | null
  dsFail: boolean | null
  tauricFail: boolean | null
  totalFails: number
  decision: Decision
  closeStatus?: string
  closed: boolean
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const CATEGORY_LABELS: Record<string, string> = {
  OPERATOR:    'Operador',
  PETER_LYNCH: 'Peter Lynch',
  SMALL_CAPS:  'Small Caps',
}

function DecisionBadge({ d, closed, closeStatus }: { d: Decision; closed: boolean; closeStatus?: string }) {
  if (closed) return (
    <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-red-500/50 bg-red-500/10 text-red-400 font-bold">
      🔴 CERRADO — {closeStatus}
    </span>
  )
  if (d === 'mantener')   return <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-green-500/40 bg-green-500/10 text-green-400">🟢 MANTENER</span>
  if (d === 'precaución') return <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-yellow-500/40 bg-yellow-500/10 text-yellow-400">🟡 PRECAUCIÓN</span>
  if (d === 'cerrar')     return <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-red-500/40 bg-red-500/10 text-red-400">🔴 CERRANDO…</span>
  return <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-[var(--border)] text-[var(--text-muted)] animate-pulse">⟳ evaluando</span>
}

function FilterBadge({ value, label }: { value: boolean | null; label: string }) {
  const color = value === null ? 'border-[var(--border)] text-[var(--text-muted)]'
    : value ? 'border-red-500/40 bg-red-500/10 text-red-400'
    : 'border-green-500/40 bg-green-500/10 text-green-400'
  return (
    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${color}`}>
      {value === null ? `${label} ⟳` : value ? `${label} ✗` : `${label} ✓`}
    </span>
  )
}

export default function AgenteMonitor({ isAdmin }: { isAdmin: boolean }) {
  const [phase, setPhase]       = useState<Phase>('idle')
  const [results, setResults]   = useState<MonitorResult[]>([])
  const [activeTicker, setActiveTicker] = useState<string | null>(null)
  const [log, setLog]           = useState<string[]>([])
  const [summary, setSummary]   = useState<{ closed: number; precaución: number; mantener: number } | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  function addLog(msg: string) {
    setLog(prev => [...prev, msg])
  }

  function upsertResult(id: string, patch: Partial<MonitorResult>) {
    setResults(prev => {
      const idx = prev.findIndex(r => r.opp.id === id)
      if (idx === -1) return prev
      const updated = [...prev]
      updated[idx] = { ...updated[idx], ...patch }
      return updated
    })
  }

  function resetMonitor() {
    setPhase('idle'); setResults([]); setLog([]); setActiveTicker(null); setSummary(null)
  }

  function stopMonitor() {
    abortRef.current?.abort()
    setPhase('idle'); setActiveTicker(null)
    addLog('⛔ Monitor detenido por el usuario')
  }

  // Helper: run Daily Scanner for one ticker, return true if COMPRAR
  async function runDailyScanner(ticker: string, signal: AbortSignal): Promise<boolean> {
    const mRes = await fetch('/api/daily-signals/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stocks: [ticker] }),
      signal,
    })
    const mData = await mRes.json()
    let taskId: string | null = null
    if (mRes.status === 409 && mData.existing_task_id) {
      taskId = mData.existing_task_id as string
    } else if (!mRes.ok) {
      throw new Error(mData.error ?? `HTTP ${mRes.status}`)
    } else {
      type AT = { task_id: string }
      const ids: string[] = mData?.accepted
        ? (mData.accepted as AT[]).map((x: AT) => x.task_id).filter(Boolean)
        : mData?.task_id ? [mData.task_id as string] : []
      taskId = ids[0] ?? null
    }
    if (!taskId) throw new Error('Sin task_id')

    for (let i = 0; i < 40; i++) {
      if (signal.aborted) throw new Error('Aborted')
      await sleep(15_000)
      const pRes = await fetch(`/api/daily-signals/tasks?task_id=${taskId}`, { signal })
      const pData = await pRes.json()
      if (pData.status === 'completed' || pData.status === 'failed') {
        const rRes = await fetch('/api/daily-signals/results', { signal })
        const rData = await rRes.json()
        const list = Array.isArray(rData) ? rData
          : Array.isArray(rData?.items) ? rData.items
          : Array.isArray(rData?.results) ? rData.results
          : Array.isArray(rData?.data) ? rData.data : []
        const found = list.find((s: { stock_code?: string; symbol?: string }) =>
          (s.stock_code ?? s.symbol ?? '').toUpperCase() === ticker
        )
        if (!found) return false
        const sig = found.operation_advice ?? found.recommendation ?? found.signal ?? ''
        return /\b(BUY|COMPRAR|ALCISTA|BULLISH|STRONG_BUY|OVERWEIGHT|买入|增持)\b/i.test(sig)
      }
    }
    throw new Error('Timeout Daily Scanner')
  }

  // Helper: run Tauric for one ticker, return true if COMPRAR
  async function runTauric(ticker: string, signal: AbortSignal): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0]
    const aRes = await fetch('/api/tauric/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker, date: today, depth: 'moderate' }),
      signal,
    })
    if (!aRes.ok) throw new Error(`Tauric HTTP ${aRes.status}`)
    const aData = await aRes.json()
    const runId: string = aData.run_id ?? aData.id ?? ''
    if (!runId) throw new Error('Sin run_id Tauric')

    for (let i = 0; i < 60; i++) {
      if (signal.aborted) throw new Error('Aborted')
      await sleep(10_000)
      const pRes = await fetch(`/api/tauric/runs/${runId}`, { signal })
      const pData = await pRes.json()
      if (pData.status === 'completed') {
        const result = pData.result ?? pData.signal ?? ''
        return /\b(BUY|COMPRAR|ALCISTA|BULLISH|OVERWEIGHT)\b/i.test(result)
      }
      if (pData.status === 'failed') throw new Error('Tauric run failed')
    }
    throw new Error('Timeout Tauric')
  }

  async function runMonitor() {
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal
    setPhase('running'); setLog([]); setResults([]); setSummary(null)

    try {
      // 1. Posiciones abiertas
      addLog('📋 Cargando posiciones abiertas...')
      const picksRes = await fetch('/api/picks', { signal })
      if (!picksRes.ok) throw new Error(`Picks HTTP ${picksRes.status}`)
      const data = await picksRes.json()
      type RawOpp = { id: string; ticker: string; precioVenta: number | null; active: boolean
        precioEntrada: number; precioObjetivo: number; stopLoss: number; category: string }
      const openPositions = (data.opportunities as RawOpp[])
        .filter(o => o.active && (o.precioVenta == null || o.precioVenta === 0))

      if (!openPositions.length) {
        addLog('✓ Sin posiciones abiertas — nada que monitorear')
        setPhase('done'); setSummary({ closed: 0, precaución: 0, mantener: 0 }); return
      }
      addLog(`✓ ${openPositions.length} posición(es) activa(s) a evaluar`)

      // Inicializar resultados
      const initialResults: MonitorResult[] = openPositions.map(o => ({
        opp: { id: o.id, ticker: o.ticker, precioEntrada: o.precioEntrada,
          precioObjetivo: o.precioObjetivo, stopLoss: o.stopLoss, category: o.category },
        currentPrice: null,
        lynchFail: null, forecastFail: null, dsFail: null, tauricFail: null,
        totalFails: 0, decision: 'pending', closed: false,
      }))
      setResults(initialResults)

      // 2. Precios actuales (batch)
      const tickerList = openPositions.map(o => o.ticker).join(',')
      const priceRes = await fetch(`/api/picks/price?tickers=${tickerList}`, { signal })
      const priceData = await priceRes.json()
      const prices: Record<string, number> = priceData.prices ?? {}
      addLog(`✓ Precios obtenidos para ${Object.keys(prices).length} ticker(s)`)

      // 3. Lynch screener (cacheado)
      addLog('🔍 Cargando screener Lynch (caché 24h)...')
      const lynchRes = await fetch('/api/screener/lynch', { signal })
      const lynchData = await lynchRes.json()
      const lynchMap: Record<string, number> = {}
      for (const r of (lynchData.results ?? [])) lynchMap[(r as { ticker: string; score: number }).ticker] = (r as { ticker: string; score: number }).score
      addLog(`✓ Screener cargado — ${Object.keys(lynchMap).length} tickers en base`)

      // 4. Evaluar posición por posición
      let countClosed = 0, countPrecaucion = 0, countMantener = 0

      for (const opp of openPositions) {
        if (signal.aborted) break
        setActiveTicker(opp.ticker)
        addLog(`\n🔍 ${opp.ticker} [${CATEGORY_LABELS[opp.category] ?? opp.category}]`)

        let fails = 0
        const patch: Partial<MonitorResult> = {
          currentPrice: prices[opp.ticker] ?? null,
          lynchFail: null, forecastFail: null, dsFail: null, tauricFail: null,
        }

        // Filter 1: Lynch
        const lynchScore = lynchMap[opp.ticker] ?? 0
        patch.lynchFail = lynchScore < 6
        if (patch.lynchFail) fails++
        addLog(`  Lynch: ${patch.lynchFail ? `✗ score ${lynchScore}/6` : '✓ 6/6'}`)
        upsertResult(opp.id, patch)

        // Filter 2: Forecast
        try {
          const fRes = await fetch(`/api/forecast?symbol=${opp.ticker}&horizon=30`, { signal })
          const fData = await fRes.json()
          const lastPrice: number = fData.last_price ?? 0
          const forecastArr: number[] = fData.forecast ?? []
          const forecastPrice = forecastArr[forecastArr.length - 1] ?? lastPrice
          const isAlcista = forecastPrice > lastPrice * 1.001
          patch.forecastFail = !isAlcista
          if (patch.forecastFail) fails++
          addLog(`  Forecast: ${patch.forecastFail ? '✗ no alcista' : `✓ ALCISTA ($${lastPrice.toFixed(2)} → $${forecastPrice.toFixed(2)})`}`)
        } catch {
          patch.forecastFail = true; fails++
          addLog('  Forecast: ✗ error')
        }
        upsertResult(opp.id, patch)

        // Corte rápido: 0-1 fails → MANTENER sin más análisis
        if (fails < 2) {
          const finalPatch: Partial<MonitorResult> = { ...patch, totalFails: fails, decision: 'mantener' }
          upsertResult(opp.id, finalPatch)
          addLog(`  ✅ MANTENER (${fails} fail)`)
          countMantener++; continue
        }

        // Filter 3: Daily Scanner
        addLog('  Daily Scanner: analizando...')
        try {
          const dsBuy = await runDailyScanner(opp.ticker, signal)
          patch.dsFail = !dsBuy
          if (patch.dsFail) fails++
          addLog(`  Daily Scanner: ${patch.dsFail ? '✗ no COMPRAR' : '✓ COMPRAR'}`)
        } catch (e) {
          if (signal.aborted) break
          patch.dsFail = true; fails++
          addLog(`  Daily Scanner: ✗ error — ${(e as Error).message}`)
        }
        upsertResult(opp.id, patch)

        // Con 3 fails → cierre inmediato sin Tauric
        if (fails >= 3) {
          const finalPatch: Partial<MonitorResult> = { ...patch, totalFails: fails, decision: 'cerrar' }
          upsertResult(opp.id, finalPatch)
        } else {
          // Filter 4: Tauric — SOLO para decidir entre PRECAUCIÓN y CERRAR (fails===2)
          addLog('  Tauric: analizando (moderado ~3-7 min)...')
          try {
            const tauricBuy = await runTauric(opp.ticker, signal)
            patch.tauricFail = !tauricBuy
            if (patch.tauricFail) fails++
            addLog(`  Tauric: ${patch.tauricFail ? '✗ no COMPRAR' : '✓ COMPRAR'}`)
          } catch (e) {
            if (signal.aborted) break
            patch.tauricFail = true; fails++
            addLog(`  Tauric: ✗ error — ${(e as Error).message}`)
          }
          const decision: Decision = fails >= 3 ? 'cerrar' : 'precaución'
          upsertResult(opp.id, { ...patch, totalFails: fails, decision })
        }

        // Leer decisión actual
        const currentDecision = fails >= 3 ? 'cerrar' : fails === 2 ? 'precaución' : 'mantener'

        if (currentDecision === 'cerrar') {
          const currentPrice = prices[opp.ticker]
          if (currentPrice) {
            const closeStatus = currentPrice >= opp.precioObjetivo ? 'OBJETIVO_ALCANZADO' : 'STOP_ACTIVADO'
            try {
              await fetch(`/api/picks/${opp.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ precioVenta: currentPrice, status: closeStatus, active: false }),
                signal,
              })
              upsertResult(opp.id, { closed: true, closeStatus, currentPrice })
              addLog(`  🔴 CERRADO a $${currentPrice.toFixed(2)} — ${closeStatus}`)
              countClosed++
            } catch (e) {
              addLog(`  ⚠ Error cerrando: ${(e as Error).message}`)
            }
          } else {
            addLog(`  ⚠ Sin precio actual — no se pudo cerrar`)
            countPrecaucion++
          }
        } else if (currentDecision === 'precaución') {
          addLog(`  🟡 PRECAUCIÓN (${fails} fails)`)
          countPrecaucion++
        }
      }

      if (signal.aborted) { setPhase('idle'); return }
      setPhase('done'); setActiveTicker(null)
      setSummary({ closed: countClosed, precaución: countPrecaucion, mantener: countMantener })
      addLog(`\n🎉 Monitor completado: ${countClosed} cerradas, ${countPrecaucion} precaución, ${countMantener} mantener`)

    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      addLog(`❌ Error fatal: ${(e as Error).message}`)
      setPhase('error'); setActiveTicker(null)
    }
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(201,168,76,0.25)' }}>
      {/* Header */}
      <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.06) 0%, transparent 70%)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">📡</span>
              <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Agente Monitor</h2>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-[var(--gold)]/40 text-[var(--gold)]">CIERRE AUTOMÁTICO</span>
            </div>
            <p className="text-xs max-w-lg" style={{ color: 'var(--text-muted)' }}>
              Evalúa todas las posiciones abiertas con 4 filtros. Si 3+ fallan simultáneamente,
              registra el precio de venta actual y cierra la recomendación automáticamente.
            </p>
            <div className="flex gap-3 mt-2 text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
              <span>🟢 0-1 fails → MANTENER</span>
              <span>🟡 2 fails → PRECAUCIÓN</span>
              <span>🔴 3+ fails → CERRAR</span>
            </div>
          </div>
          <div className="flex gap-2">
            {phase === 'idle' || phase === 'done' || phase === 'error' ? (
              <button
                onClick={phase === 'idle' ? runMonitor : resetMonitor}
                disabled={!isAdmin}
                className="px-5 py-2.5 text-sm font-mono tracking-widest rounded-xl bg-[var(--gold)] text-black font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {phase === 'idle' ? '▶ INICIAR MONITOR' : '↺ REINICIAR'}
              </button>
            ) : (
              <button onClick={stopMonitor}
                className="px-5 py-2.5 text-sm font-mono tracking-widest rounded-xl border border-red-500/50 text-red-400 font-bold hover:bg-red-500/10 transition-colors">
                ⛔ DETENER
              </button>
            )}
          </div>
        </div>
        {!isAdmin && <p className="text-[10px] font-mono mt-2 text-amber-400">Solo el administrador puede ejecutar el monitor.</p>}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="px-6 py-4 space-y-2" style={{ borderTop: '1px solid rgba(201,168,76,0.12)' }}>
          <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: 'var(--gold)' }}>POSICIONES EVALUADAS</p>
          {results.map(r => (
            <div key={r.opp.id} className="rounded-xl border p-4" style={{
              borderColor: r.closed ? 'rgba(239,68,68,0.4)'
                : r.decision === 'precaución' ? 'rgba(251,191,36,0.3)'
                : r.decision === 'mantener' ? 'rgba(74,222,128,0.2)'
                : 'var(--border)',
              background: r.closed ? 'rgba(239,68,68,0.04)'
                : r.decision === 'precaución' ? 'rgba(251,191,36,0.03)'
                : 'transparent',
            }}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-sm" style={{ color: 'var(--gold)' }}>{r.opp.ticker}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-muted)]">
                    {CATEGORY_LABELS[r.opp.category] ?? r.opp.category}
                  </span>
                  {r.currentPrice && (
                    <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                      ${r.currentPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                <DecisionBadge d={r.decision} closed={r.closed} closeStatus={r.closeStatus} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <FilterBadge value={r.lynchFail} label="Lynch" />
                <FilterBadge value={r.forecastFail} label="Forecast" />
                <FilterBadge value={r.dsFail} label="DailyScanner" />
                {r.tauricFail !== null && <FilterBadge value={r.tauricFail} label="Tauric" />}
                {r.tauricFail === null && r.dsFail !== null && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-muted)] opacity-50">Tauric —</span>
                )}
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: 'var(--text-muted)' }}>
                  {r.totalFails}/4 fails
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="mx-6 mb-5 p-4 rounded-xl border" style={{ borderColor: 'rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.05)' }}>
          <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: 'var(--gold)' }}>RESUMEN</p>
          <div className="flex gap-6 text-sm">
            <span className="text-red-400 font-bold">{summary.closed} cerradas</span>
            <span className="text-yellow-400 font-bold">{summary.precaución} precaución</span>
            <span className="text-green-400 font-bold">{summary.mantener} mantener</span>
          </div>
          {summary.closed > 0 && (
            <a href="/dashboard/acciones" className="text-[10px] font-mono underline mt-1 block" style={{ color: 'var(--gold)' }}>
              Ver cambios en RECOMENDACIONES →
            </a>
          )}
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div className="mx-6 mb-6 rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="px-4 py-2 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <p className="text-[9px] font-mono tracking-widest" style={{ color: 'var(--text-muted)' }}>LOG EN TIEMPO REAL</p>
            {activeTicker && <span className="text-[9px] font-mono animate-pulse" style={{ color: 'var(--gold)' }}>⟳ {activeTicker}</span>}
          </div>
          <div className="p-4 space-y-1 max-h-64 overflow-y-auto font-mono text-[10px]" style={{ background: '#0a0a0a', color: '#4ade80' }}>
            {log.map((line, i) => <p key={i} className="leading-relaxed">{line}</p>)}
          </div>
        </div>
      )}
    </div>
  )
}
