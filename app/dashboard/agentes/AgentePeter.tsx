'use client'

import { useRef, useState } from 'react'

type Phase = 'idle' | 'running' | 'done' | 'error'

type TickerStage = {
  ticker: string
  lastPrice?: number
  forecastPrice?: number
  forecastDirection?: string
  tauricRecommendation?: string
  step1: 'pass'
  step2: 'pending' | 'pass' | 'fail'
  step3: 'pending' | 'pass' | 'fail' | 'running'
  momentum: 'pending' | 'pass' | 'fail' | 'running'
  step5: 'pending' | 'done' | 'fail'
  error?: string
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function updateTicker(arr: TickerStage[], ticker: string, patch: Partial<TickerStage>) {
  const idx = arr.findIndex(t => t.ticker === ticker)
  if (idx !== -1) Object.assign(arr[idx], patch)
}

function StepBadge({ phase }: { phase: Phase }) {
  if (phase === 'idle')    return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-muted)]">EN ESPERA</span>
  if (phase === 'running') return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-yellow-500/40 bg-yellow-500/10 text-yellow-400 animate-pulse">● EJECUTANDO</span>
  if (phase === 'done')    return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-green-500/40 bg-green-500/10 text-green-400">✓ COMPLETADO</span>
  return                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-red-500/40 bg-red-500/10 text-red-400">✗ ERROR</span>
}

function TickerBadge({ t }: { t: TickerStage }) {
  const step2Color = t.step2 === 'pass' ? 'border-green-500/40 bg-green-500/10 text-green-400'
    : t.step2 === 'fail' ? 'border-red-500/40 bg-red-500/10 text-red-400'
    : 'border-[var(--border)] text-[var(--text-muted)]'
  const step3Color = t.step3 === 'pass' ? 'border-green-500/40 bg-green-500/10 text-green-400'
    : t.step3 === 'fail' ? 'border-red-500/40 bg-red-500/10 text-red-400'
    : t.step3 === 'running' ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400 animate-pulse'
    : 'border-[var(--border)] text-[var(--text-muted)]'
  const momentumColor = t.momentum === 'pass' ? 'border-green-500/40 bg-green-500/10 text-green-400'
    : t.momentum === 'fail' ? 'border-red-500/40 bg-red-500/10 text-red-400'
    : t.momentum === 'running' ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400 animate-pulse'
    : 'border-[var(--border)] text-[var(--text-muted)]'

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
      <span className="font-mono font-bold text-xs" style={{ color: 'var(--gold)' }}>{t.ticker}</span>
      {t.step2 !== 'pending' && (
        <span className={`text-[9px] font-mono px-1 py-0.5 rounded border ${step2Color}`}>
          {t.step2 === 'pass' ? `↑${t.forecastDirection}` : '✗'}
        </span>
      )}
      {t.step3 !== 'pending' && (
        <span className={`text-[9px] font-mono px-1 py-0.5 rounded border ${step3Color}`}>
          {t.step3 === 'pass' ? 'IA✓' : t.step3 === 'fail' ? 'IA✗' : '⟳'}
        </span>
      )}
      {t.momentum !== 'pending' && (
        <span className={`text-[9px] font-mono px-1 py-0.5 rounded border ${momentumColor}`}>
          {t.momentum === 'pass' ? '📡✓' : t.momentum === 'fail' ? '📡✗' : '📡⟳'}
        </span>
      )}
      {t.step5 === 'done' && (
        <span className="text-[9px] font-mono px-1 py-0.5 rounded border border-blue-500/40 bg-blue-500/10 text-blue-400">📝</span>
      )}
    </div>
  )
}

export default function AgentePeter({ isAdmin }: { isAdmin: boolean }) {
  const [phase, setPhase]           = useState<Phase>('idle')
  const [step1Phase, setStep1Phase] = useState<Phase>('idle')
  const [step2Phase, setStep2Phase] = useState<Phase>('idle')
  const [step3Phase, setStep3Phase] = useState<Phase>('idle')
  const [step4Phase, setStep4Phase] = useState<Phase>('idle') // momentum
  const [step5Phase, setStep5Phase] = useState<Phase>('idle') // informes
  const [tickers, setTickers]       = useState<TickerStage[]>([])
  const [activeTicker, setActiveTicker] = useState<string | null>(null)
  const [log, setLog]               = useState<string[]>([])
  const [summary, setSummary]       = useState<{ created: number; total: number } | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  function addLog(msg: string) {
    setLog(prev => [...prev, msg])
  }

  function resetAgent() {
    setPhase('idle')
    setStep1Phase('idle'); setStep2Phase('idle'); setStep3Phase('idle')
    setStep4Phase('idle'); setStep5Phase('idle')
    setTickers([]); setLog([]); setActiveTicker(null); setSummary(null)
  }

  function stopAgent() {
    abortRef.current?.abort()
    setPhase('idle')
    setStep1Phase('idle'); setStep2Phase('idle'); setStep3Phase('idle')
    setStep4Phase('idle'); setStep5Phase('idle')
    setActiveTicker(null)
    addLog('⛔ Agente detenido por el usuario')
  }

  async function runAgentePeter() {
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal
    setPhase('running'); setLog([]); setTickers([]); setSummary(null)

    try {
      // ── PASO 1: Lynch 6/6 ─────────────────────────────────────
      setStep1Phase('running')
      addLog('🔍 Cargando screener INVESTIGACIÓN...')
      const lynchRes = await fetch('/api/screener/lynch', { signal })
      if (!lynchRes.ok) throw new Error(`Screener HTTP ${lynchRes.status}`)
      const lynchData = await lynchRes.json()
      const sixSixRaw: Array<{ ticker: string; score: number }> = (lynchData.results ?? []).filter((r: { score: number }) => r.score === 6)
      const sixSix = sixSixRaw.map(r => r.ticker)

      if (sixSix.length === 0) {
        addLog('⚠ Sin acciones con score 6/6. Actualiza el screener primero.')
        setStep1Phase('done'); setPhase('done'); return
      }

      addLog(`✓ ${sixSix.length} acciones con score 6/6: ${sixSix.join(', ')}`)
      const initial: TickerStage[] = sixSix.map(t => ({
        ticker: t, step1: 'pass', step2: 'pending', step3: 'pending', momentum: 'pending', step5: 'pending',
      }))
      setTickers(initial)
      setStep1Phase('done')

      // ── PASO 2: Proyección alcista a 30 días ──────────────────
      setStep2Phase('running')
      addLog('📈 Verificando proyección 30 días...')
      const paso2Results: TickerStage[] = [...initial]
      for (const ticker of sixSix) {
        if (signal.aborted) break
        setActiveTicker(ticker)
        try {
          const fRes = await fetch(`/api/forecast?symbol=${ticker}&horizon=30`, { signal })
          if (!fRes.ok) throw new Error(`HTTP ${fRes.status}`)
          const fData = await fRes.json()
          const lastPrice: number = fData.last_price ?? 0
          const forecastArr: number[] = fData.forecast ?? []
          const forecastPrice: number = forecastArr[forecastArr.length - 1] ?? lastPrice
          const direction = forecastPrice > lastPrice * 1.001 ? 'ALCISTA'
            : forecastPrice < lastPrice * 0.999 ? 'BAJISTA' : 'LATERAL'
          const pass = direction === 'ALCISTA'
          addLog(`${pass ? '✓' : '✗'} ${ticker}: ${direction} ($${lastPrice.toFixed(2)} → $${forecastPrice.toFixed(2)})`)
          updateTicker(paso2Results, ticker, { lastPrice, forecastPrice, forecastDirection: direction, step2: pass ? 'pass' : 'fail' })
        } catch (e) {
          if (signal.aborted) break
          addLog(`⚠ ${ticker}: error forecast — ${(e as Error).message}`)
          updateTicker(paso2Results, ticker, { step2: 'fail' })
        }
        setTickers([...paso2Results])
        await sleep(600)
      }
      setStep2Phase('done')
      if (signal.aborted) { setPhase('idle'); return }

      // ── PASO 3: Confirmación IA (Tauric) ─────────────────────
      setStep3Phase('running')
      const paso2Pass = paso2Results.filter(t => t.step2 === 'pass')
      const paso3Results = [...paso2Results]

      if (paso2Pass.length === 0) {
        addLog('⚠ Ningún ticker pasó proyección alcista.')
        setStep3Phase('done'); setStep4Phase('done'); setStep5Phase('done')
        setPhase('done'); setSummary({ created: 0, total: sixSix.length }); setActiveTicker(null); return
      }

      addLog(`📊 Confirmando ${paso2Pass.length} ticker(s) en CONFIRMACIÓN IA (moderado ~3-7 min c/u)...`)
      for (const t of paso2Pass) {
        if (signal.aborted) break
        setActiveTicker(t.ticker)
        addLog(`⟳ Analizando ${t.ticker}...`)
        updateTicker(paso3Results, t.ticker, { step3: 'running' })
        setTickers([...paso3Results])
        try {
          const today = new Date().toISOString().split('T')[0]
          const aRes = await fetch('/api/tauric/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticker: t.ticker, date: today, depth: 'moderate' }),
            signal,
          })
          if (!aRes.ok) throw new Error(`Tauric HTTP ${aRes.status}`)
          const aData = await aRes.json()
          const runId: string = aData.run_id ?? aData.id ?? ''
          if (!runId) throw new Error('Sin run_id')

          let result: string | null = null
          for (let i = 0; i < 60; i++) {
            if (signal.aborted) break
            await sleep(10_000)
            const pRes = await fetch(`/api/tauric/runs/${runId}`, { signal })
            const pData = await pRes.json()
            if (pData.status === 'completed') { result = pData.result ?? pData.signal ?? ''; break }
            if (pData.status === 'failed') throw new Error('Run failed')
          }
          if (!result) throw new Error('Timeout análisis Tauric')

          const isBuy = /\b(BUY|COMPRAR|ALCISTA|BULLISH|OVERWEIGHT)\b/i.test(result)
          addLog(`${isBuy ? '✓' : '✗'} ${t.ticker} Tauric: ${isBuy ? 'COMPRAR' : 'NO COMPRAR'}`)
          updateTicker(paso3Results, t.ticker, { step3: isBuy ? 'pass' : 'fail', tauricRecommendation: isBuy ? 'COMPRAR' : 'MANTENER' })
        } catch (e) {
          if (signal.aborted) break
          addLog(`⚠ ${t.ticker}: error Tauric — ${(e as Error).message}`)
          updateTicker(paso3Results, t.ticker, { step3: 'fail' })
        }
        setTickers([...paso3Results])
      }
      setStep3Phase('done')
      if (signal.aborted) { setPhase('idle'); return }

      // ── PASO 4: Momentum Daily Scanner ───────────────────────
      setStep4Phase('running')
      const paso3Pass = paso3Results.filter(t => t.step3 === 'pass')
      const paso4Results = [...paso3Results]

      if (paso3Pass.length === 0) {
        addLog('⚠ Ningún ticker pasó confirmación Tauric.')
        setStep4Phase('done'); setStep5Phase('done')
        setPhase('done'); setSummary({ created: 0, total: sixSix.length }); setActiveTicker(null); return
      }

      addLog(`📡 Verificando momentum Daily Scanner para ${paso3Pass.length} ticker(s)...`)
      for (const t of paso3Pass) {
        if (signal.aborted) break
        setActiveTicker(t.ticker)
        addLog(`⟳ Daily Scanner: ${t.ticker}...`)
        updateTicker(paso4Results, t.ticker, { momentum: 'running' })
        setTickers([...paso4Results])
        try {
          const mRes = await fetch('/api/daily-signals/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stocks: [t.ticker] }),
            signal,
          })
          const mData = await mRes.json()

          // 409 duplicate_task: reutilizar existing_task_id
          let taskId: string | null = null
          if (mRes.status === 409 && mData.existing_task_id) {
            taskId = mData.existing_task_id as string
            addLog(`  ↪ ${t.ticker}: usando análisis existente`)
          } else if (!mRes.ok) {
            throw new Error(mData.error ?? `HTTP ${mRes.status}`)
          } else {
            type AT = { task_id: string }
            const ids: string[] = mData?.accepted
              ? (mData.accepted as AT[]).map((x: AT) => x.task_id).filter(Boolean)
              : mData?.task_id ? [mData.task_id as string] : []
            taskId = ids[0] ?? null
          }
          if (!taskId) throw new Error('Sin task_id para Daily Scanner')

          // Poll hasta completado (max 40 × 15s = 10 min)
          let dsSignal: string | null = null
          for (let i = 0; i < 40; i++) {
            if (signal.aborted) break
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
                (s.stock_code ?? s.symbol ?? '').toUpperCase() === t.ticker
              )
              if (found) dsSignal = found.operation_advice ?? found.recommendation ?? found.signal ?? ''
              break
            }
          }
          if (!dsSignal) throw new Error('Sin resultado de Daily Scanner')

          const isMomentumBuy = /\b(BUY|COMPRAR|ALCISTA|BULLISH|STRONG_BUY|OVERWEIGHT|买入|增持)\b/i.test(dsSignal)
          addLog(`${isMomentumBuy ? '✓' : '✗'} ${t.ticker} momentum: ${isMomentumBuy ? 'COMPRAR ✓' : 'NO COMPRAR'} — ${dsSignal.slice(0, 60)}`)
          updateTicker(paso4Results, t.ticker, { momentum: isMomentumBuy ? 'pass' : 'fail' })
        } catch (e) {
          if (signal.aborted) break
          addLog(`⚠ ${t.ticker}: error Daily Scanner — ${(e as Error).message}`)
          updateTicker(paso4Results, t.ticker, { momentum: 'fail' })
        }
        setTickers([...paso4Results])
      }
      setStep4Phase('done')
      if (signal.aborted) { setPhase('idle'); return }

      // ── PASO 5: Generar informes ──────────────────────────────
      setStep5Phase('running')
      const paso4Pass = paso4Results.filter(t => t.momentum === 'pass')

      if (paso4Pass.length === 0) {
        addLog('⚠ Ningún ticker obtuvo confirmación de momentum.')
        setStep5Phase('done'); setPhase('done')
        setSummary({ created: 0, total: sixSix.length }); setActiveTicker(null); return
      }

      addLog(`📝 Generando ${paso4Pass.length} informe(s) en RECOMENDACIONES PETER LYNCH...`)
      for (const t of paso4Pass) {
        if (signal.aborted) break
        setActiveTicker(t.ticker)
        try {
          const iRes = await fetch('/api/picks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticker: t.ticker,
              precioEntradaManual: t.lastPrice ? String(t.lastPrice.toFixed(2)) : undefined,
              precioObjetivoManual: t.forecastPrice ? String(t.forecastPrice.toFixed(2)) : undefined,
              category: 'PETER_LYNCH',
            }),
            signal,
          })
          if (!iRes.ok) {
            const err = await iRes.json().catch(() => ({}))
            throw new Error(err.error ?? `HTTP ${iRes.status}`)
          }
          addLog(`✓ ${t.ticker}: informe creado — entrada $${t.lastPrice?.toFixed(2)}, objetivo $${t.forecastPrice?.toFixed(2)}`)
          updateTicker(paso4Results, t.ticker, { step5: 'done' })
        } catch (e) {
          if (signal.aborted) break
          addLog(`⚠ ${t.ticker}: error creando informe — ${(e as Error).message}`)
          updateTicker(paso4Results, t.ticker, { step5: 'fail' })
        }
        setTickers([...paso4Results])
      }

      setStep5Phase('done')
      setPhase('done')
      setActiveTicker(null)
      const created = paso4Results.filter(t => t.step5 === 'done').length
      setSummary({ created, total: sixSix.length })
      addLog(`🎉 Agente Peter completado: ${created} recomendación(es) en PETER LYNCH.`)

    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      addLog(`❌ Error fatal: ${(e as Error).message}`)
      setPhase('error')
      setActiveTicker(null)
    }
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(201,168,76,0.25)' }}>
      {/* Header */}
      <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, transparent 70%)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">🤖</span>
              <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Agente Peter</h2>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-[var(--gold)]/40 text-[var(--gold)]">PETER LYNCH</span>
            </div>
            <p className="text-xs max-w-lg" style={{ color: 'var(--text-muted)' }}>
              Pipeline de 5 filtros: INVESTIGACIÓN Lynch 6/6 → PROYECCIÓN alcista 30d →
              CONFIRMACIÓN IA Tauric → MOMENTUM Daily Scanner → genera informe en PETER LYNCH.
            </p>
          </div>
          <div className="flex gap-2">
            {phase === 'idle' || phase === 'done' || phase === 'error' ? (
              <button
                onClick={phase === 'idle' ? runAgentePeter : resetAgent}
                disabled={!isAdmin}
                className="px-5 py-2.5 text-sm font-mono tracking-widest rounded-xl bg-[var(--gold)] text-black font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {phase === 'idle' ? '▶ INICIAR AGENTE' : '↺ REINICIAR'}
              </button>
            ) : (
              <button
                onClick={stopAgent}
                className="px-5 py-2.5 text-sm font-mono tracking-widest rounded-xl border border-red-500/50 text-red-400 font-bold hover:bg-red-500/10 transition-colors"
              >
                ⛔ DETENER
              </button>
            )}
          </div>
        </div>
        {!isAdmin && (
          <p className="text-[10px] font-mono mt-2 text-amber-400">Solo el administrador puede ejecutar agentes.</p>
        )}
      </div>

      {/* Pipeline steps */}
      <div className="px-6 py-5 space-y-3" style={{ borderTop: '1px solid rgba(201,168,76,0.12)' }}>
        {[
          { num: 1, label: 'INVESTIGACIÓN LYNCH',   desc: 'Extrae acciones con score 6/6 del screener',        phaseVal: step1Phase },
          { num: 2, label: 'PROYECCIÓN 30 DÍAS',    desc: 'Verifica sesgo alcista en el forecast TimesFM',     phaseVal: step2Phase },
          { num: 3, label: 'CONFIRMACIÓN IA',       desc: 'Análisis multi-agente Tauric (moderado)',            phaseVal: step3Phase },
          { num: 4, label: 'MOMENTUM DAILY SCANNER',desc: 'Confirma señal de compra con Daily Scanner IA',     phaseVal: step4Phase },
          { num: 5, label: 'GENERANDO INFORMES',    desc: 'Crea informe en RECOMENDACIONES PETER LYNCH',       phaseVal: step5Phase },
        ].map(step => (
          <div key={step.num} className="rounded-xl border p-4" style={{
            borderColor: step.phaseVal === 'running' ? 'rgba(251,191,36,0.4)' : step.phaseVal === 'done' ? 'rgba(74,222,128,0.25)' : 'var(--border)',
            background: step.phaseVal === 'running' ? 'rgba(251,191,36,0.04)' : 'transparent',
          }}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono font-bold w-5 text-center" style={{ color: 'var(--gold)' }}>{step.num}</span>
                <p className="text-[10px] font-mono tracking-widest font-bold" style={{ color: 'var(--text-primary)' }}>{step.label}</p>
              </div>
              <StepBadge phase={step.phaseVal} />
            </div>
            <p className="text-[10px] pl-8" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>

            {/* Step 1: show 6/6 tickers */}
            {step.num === 1 && tickers.length > 0 && (
              <div className="mt-3 pl-8 flex flex-wrap gap-2">
                {tickers.map(t => (
                  <span key={t.ticker} className="text-[10px] font-mono px-2 py-0.5 rounded border border-green-500/30 bg-green-500/10 text-green-400">
                    {t.ticker}
                  </span>
                ))}
              </div>
            )}

            {/* Steps 2-5: ticker badges */}
            {tickers.length > 0 && step.num >= 2 && (
              <div className="mt-3 pl-8 flex flex-wrap gap-2">
                {tickers.map(t => {
                  const relevant = step.num === 2
                    ? t.step2 !== 'pending'
                    : step.num === 3
                    ? (t.step2 === 'pass' && t.step3 !== 'pending')
                    : step.num === 4
                    ? (t.step3 === 'pass' && t.momentum !== 'pending')
                    : t.momentum === 'pass'
                  if (!relevant) return null
                  return <TickerBadge key={t.ticker} t={t} />
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      {summary && (
        <div className="mx-6 mb-5 p-4 rounded-xl border" style={{ borderColor: 'rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.05)' }}>
          <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: 'var(--gold)' }}>RESULTADO FINAL</p>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {summary.created} recomendación(es) creadas de {summary.total} analizadas
          </p>
          {summary.created > 0 && (
            <a href="/dashboard/acciones" className="text-[10px] font-mono underline mt-1 block" style={{ color: 'var(--gold)' }}>
              Ver en RECOMENDACIONES PETER LYNCH →
            </a>
          )}
        </div>
      )}

      {/* Live log */}
      {log.length > 0 && (
        <div className="mx-6 mb-6 rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="px-4 py-2 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <p className="text-[9px] font-mono tracking-widest" style={{ color: 'var(--text-muted)' }}>LOG EN TIEMPO REAL</p>
            {activeTicker && (
              <span className="text-[9px] font-mono animate-pulse" style={{ color: 'var(--gold)' }}>⟳ {activeTicker}</span>
            )}
          </div>
          <div className="p-4 space-y-1 max-h-64 overflow-y-auto font-mono text-[10px]" style={{ background: '#0a0a0a', color: '#4ade80' }}>
            {log.map((line, i) => (
              <p key={i} className="leading-relaxed">{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
