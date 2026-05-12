'use client'

import { useRef, useState } from 'react'

type Phase = 'idle' | 'running' | 'done' | 'error'

type TickerStage = {
  ticker: string
  lastPrice?: number
  forecastPrice?: number
  forecastDirection?: string
  tauricDirection?: string
  directionMatch?: boolean
  optionFound?: boolean
  optionAction?: string
  optionContract?: string
  optionStrike?: number
  optionExpiration?: string
  optionDTE?: number
  optionScore?: number
  step1: 'pass'
  step2: 'pending' | 'alcista' | 'bajista' | 'fail'
  step3: 'pending' | 'pass' | 'fail' | 'running'
  step4: 'pending' | 'pass' | 'fail' | 'running'
  step5: 'pending' | 'done' | 'fail'
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

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
  const s2Color = t.step2 === 'alcista' ? 'border-green-500/40 bg-green-500/10 text-green-400'
    : t.step2 === 'bajista' ? 'border-red-500/40 bg-red-500/10 text-red-400'
    : t.step2 === 'fail' ? 'border-[var(--border)] text-[var(--text-muted)]'
    : 'border-[var(--border)] text-[var(--text-muted)]'
  const s3Color = t.step3 === 'pass' ? 'border-green-500/40 bg-green-500/10 text-green-400'
    : t.step3 === 'fail' ? 'border-red-500/40 bg-red-500/10 text-red-400'
    : t.step3 === 'running' ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400 animate-pulse'
    : 'border-[var(--border)] text-[var(--text-muted)]'
  const s4Color = t.step4 === 'pass' ? 'border-green-500/40 bg-green-500/10 text-green-400'
    : t.step4 === 'fail' ? 'border-red-500/40 bg-red-500/10 text-red-400'
    : t.step4 === 'running' ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400 animate-pulse'
    : 'border-[var(--border)] text-[var(--text-muted)]'

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
      <span className="font-mono font-bold" style={{ color: 'var(--gold)' }}>{t.ticker}</span>
      {t.step2 !== 'pending' && (
        <span className={`text-[9px] font-mono px-1 py-0.5 rounded border ${s2Color}`}>
          {t.step2 === 'alcista' ? '↑ALCISTA' : t.step2 === 'bajista' ? '↓BAJISTA' : '✗'}
        </span>
      )}
      {t.step3 !== 'pending' && (
        <span className={`text-[9px] font-mono px-1 py-0.5 rounded border ${s3Color}`}>
          {t.step3 === 'pass' ? `IA:${t.tauricDirection ?? '✓'}` : t.step3 === 'fail' ? 'IA✗' : '⟳'}
        </span>
      )}
      {t.step4 !== 'pending' && (
        <span className={`text-[9px] font-mono px-1 py-0.5 rounded border ${s4Color}`}>
          {t.step4 === 'pass' && t.optionAction ? `${t.optionAction.split(' ').slice(0,2).join(' ')}` : t.step4 === 'fail' ? 'OPT✗' : '⟳'}
        </span>
      )}
      {t.step5 === 'done' && (
        <span className="text-[9px] font-mono px-1 py-0.5 rounded border border-blue-500/40 bg-blue-500/10 text-blue-400">📝</span>
      )}
    </div>
  )
}

export default function AgenteVanilla({ isAdmin }: { isAdmin: boolean }) {
  const [phase, setPhase]           = useState<Phase>('idle')
  const [step1Phase, setStep1Phase] = useState<Phase>('idle')
  const [step2Phase, setStep2Phase] = useState<Phase>('idle')
  const [step4Phase, setStep4Phase] = useState<Phase>('idle')
  const [step5Phase, setStep5Phase] = useState<Phase>('idle')
  const [tickers, setTickers]       = useState<TickerStage[]>([])
  const [activeTicker, setActiveTicker] = useState<string | null>(null)
  const [log, setLog]               = useState<string[]>([])
  const [summary, setSummary]       = useState<{ created: number; total: number } | null>(null)
  const [stepsOpen, setStepsOpen]   = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  function addLog(msg: string) { setLog(prev => [...prev, msg]) }

  function resetAgent() {
    setPhase('idle')
    setStep1Phase('idle'); setStep2Phase('idle')
    setStep4Phase('idle'); setStep5Phase('idle')
    setTickers([]); setLog([]); setActiveTicker(null); setSummary(null)
    setStepsOpen(false)
  }

  function stopAgent() {
    abortRef.current?.abort()
    setPhase('idle')
    setStep1Phase('idle'); setStep2Phase('idle')
    setStep4Phase('idle'); setStep5Phase('idle')
    setActiveTicker(null)
    addLog('⛔ Agente detenido por el usuario')
  }

  async function runAgenteVanilla() {
    setStepsOpen(true)
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal
    setPhase('running'); setLog([]); setTickers([]); setSummary(null)

    try {
      // ── PASO 1: Lynch 6/6 ─────────────────────────────────────
      setStep1Phase('running')
      addLog('🔍 Cargando screener INVESTIGACIÓN (score 6/6)...')
      const lynchRes = await fetch('/api/screener/lynch', { signal })
      if (!lynchRes.ok) throw new Error(`Screener HTTP ${lynchRes.status}`)
      const lynchData = await lynchRes.json()
      const sixSix: string[] = (lynchData.results ?? [])
        .filter((r: { score: number }) => r.score === 6)
        .map((r: { ticker: string }) => r.ticker)

      if (!sixSix.length) {
        addLog('⚠ Sin acciones con score 6/6.')
        setStep1Phase('done'); setPhase('done'); return
      }
      addLog(`✓ ${sixSix.length} acciones 6/6: ${sixSix.join(', ')}`)
      const initial: TickerStage[] = sixSix.map(t => ({
        ticker: t, step1: 'pass', step2: 'pending', step3: 'pending', step4: 'pending', step5: 'pending',
      }))
      setTickers(initial)
      setStep1Phase('done')

      // ── PASO 2: Proyección 30d (ALCISTA o BAJISTA) ────────────
      setStep2Phase('running')
      addLog('📈 Verificando proyección 30 días (alcista Y bajista sirven)...')
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
          const pctChange = ((forecastPrice - lastPrice) / lastPrice) * 100
          let direction: 'ALCISTA' | 'BAJISTA' | 'LATERAL' = 'LATERAL'
          if (pctChange > 0.1) direction = 'ALCISTA'
          else if (pctChange < -0.1) direction = 'BAJISTA'
          const pass = direction !== 'LATERAL'
          addLog(`${pass ? '✓' : '✗'} ${ticker}: ${direction} (${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1)}%)`)
          updateTicker(paso2Results, ticker, {
            lastPrice, forecastPrice, forecastDirection: direction,
            step2: direction === 'ALCISTA' ? 'alcista' : direction === 'BAJISTA' ? 'bajista' : 'fail',
          })
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

      // ── PASO 3: Análisis de opciones (directo desde proyección) ──
      setStep4Phase('running')
      const paso3Pass = paso2Results.filter(t => t.step2 === 'alcista' || t.step2 === 'bajista')
      const paso4Results = [...paso2Results]

      if (!paso3Pass.length) {
        addLog('⚠ Ningún ticker con dirección clara (todo LATERAL).')
        setStep4Phase('done'); setStep5Phase('done')
        setPhase('done'); setSummary({ created: 0, total: sixSix.length }); setActiveTicker(null); return
      }

      addLog(`📊 Analizando opciones para ${paso3Pass.length} ticker(s)...`)
      type Contract = { symbol: string; type: string; strike: number; expiration: string; dte: number; bid?: number | null; ask?: number | null; mid?: number | null; impliedVolatility?: number | null; delta?: number | null }
      type SP = { strategy: string; label: string; score: number; action: string; contract: Contract; breakeven?: number; maxLossHint?: string; maxProfitHint?: string }
      type OptData = { underlying?: { company?: string; underlyingPrice?: number }; recommendation?: SP | null; strategies?: Record<string, SP[]> }

      for (const t of paso3Pass) {
        if (signal.aborted) break
        setActiveTicker(t.ticker)
        addLog(`⟳ Opciones: ${t.ticker}...`)
        updateTicker(paso4Results, t.ticker, { step4: 'running' })
        setTickers([...paso4Results])

        try {
          const optRes = await fetch(`/api/options/analyze?ticker=${t.ticker}`, { signal })
          if (!optRes.ok) throw new Error(`Options HTTP ${optRes.status}`)
          const optData: OptData = await optRes.json()

          const relevantStrategies = t.step2 === 'alcista'
            ? ['buy-call', 'sell-put']
            : ['buy-put', 'covered-call']

          const rec = optData.recommendation ?? null
          let chosen: SP | null = null

          if (rec && rec.label === 'IDEAL' && rec.contract.dte >= 30 && relevantStrategies.includes(rec.strategy)) {
            chosen = rec
          } else {
            for (const strat of relevantStrategies) {
              const picks: SP[] = optData.strategies?.[strat] ?? []
              const ideal = picks
                .filter(p => p.label === 'IDEAL' && p.contract.dte >= 30)
                .sort((a, b) => b.score - a.score)[0]
              if (ideal) { chosen = ideal; break }
            }
          }

          if (!chosen) {
            addLog(`✗ ${t.ticker}: sin contrato IDEAL con DTE ≥ 30 en estrategias ${relevantStrategies.join('/')}`)
            updateTicker(paso4Results, t.ticker, { step4: 'fail', optionFound: false })
          } else {
            addLog(`✓ ${t.ticker}: ${chosen.action} — ${chosen.contract.symbol} Strike $${chosen.contract.strike} exp.${chosen.contract.expiration} DTE:${chosen.contract.dte} Score:${chosen.score}`)
            updateTicker(paso4Results, t.ticker, {
              step4: 'pass',
              optionFound: true,
              optionAction: chosen.action,
              optionContract: chosen.contract.symbol,
              optionStrike: chosen.contract.strike,
              optionExpiration: chosen.contract.expiration,
              optionDTE: chosen.contract.dte,
              optionScore: chosen.score,
            })
            // Store optData ref for step 5
            ;(paso4Results.find(r => r.ticker === t.ticker) as TickerStage & { _optData?: OptData; _chosen?: SP })._optData = optData
            ;(paso4Results.find(r => r.ticker === t.ticker) as TickerStage & { _optData?: OptData; _chosen?: SP })._chosen = chosen
          }
        } catch (e) {
          if (signal.aborted) break
          addLog(`⚠ ${t.ticker}: error opciones — ${(e as Error).message}`)
          updateTicker(paso4Results, t.ticker, { step4: 'fail' })
        }
        setTickers([...paso4Results])
        await sleep(300)
      }
      setStep4Phase('done')
      if (signal.aborted) { setPhase('idle'); return }

      // ── PASO 5: Registrar recomendaciones ─────────────────────
      setStep5Phase('running')
      const paso4Pass = paso4Results.filter(t => t.step4 === 'pass')

      if (!paso4Pass.length) {
        addLog('⚠ Ningún contrato IDEAL encontrado.')
        setStep5Phase('done'); setPhase('done')
        setSummary({ created: 0, total: sixSix.length }); setActiveTicker(null); return
      }

      addLog(`📝 Registrando ${paso4Pass.length} recomendación(es) de opciones...`)
      for (const t of paso4Pass) {
        if (signal.aborted) break
        setActiveTicker(t.ticker)
        const extra = t as TickerStage & { _optData?: OptData; _chosen?: SP }
        const optData = extra._optData
        const chosen = extra._chosen
        if (!chosen) continue

        try {
          const iRes = await fetch('/api/options-recs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticker: t.ticker,
              company: optData?.underlying?.company ?? '',
              direction: t.step2 === 'alcista' ? 'ALCISTA' : 'BAJISTA',
              strategy: chosen.strategy,
              action: chosen.action,
              contractSymbol: chosen.contract.symbol,
              contractType: chosen.contract.type,
              strike: chosen.contract.strike,
              expiration: chosen.contract.expiration,
              dte: chosen.contract.dte,
              score: chosen.score,
              label: chosen.label,
              underlyingPrice: optData?.underlying?.underlyingPrice ?? 0,
              bid: chosen.contract.bid,
              ask: chosen.contract.ask,
              mid: chosen.contract.mid,
              impliedVolatility: chosen.contract.impliedVolatility,
              delta: chosen.contract.delta,
              breakeven: chosen.breakeven,
              maxLossHint: chosen.maxLossHint,
              maxProfitHint: chosen.maxProfitHint,
            }),
            signal,
          })
          if (!iRes.ok) {
            const err = await iRes.json().catch(() => ({}))
            throw new Error(err.error ?? `HTTP ${iRes.status}`)
          }
          addLog(`✓ ${t.ticker}: ${chosen.action} registrado en track record de opciones`)
          updateTicker(paso4Results, t.ticker, { step5: 'done' })
        } catch (e) {
          if (signal.aborted) break
          addLog(`⚠ ${t.ticker}: error guardando — ${(e as Error).message}`)
          updateTicker(paso4Results, t.ticker, { step5: 'fail' })
        }
        setTickers([...paso4Results])
      }

      setStep5Phase('done'); setPhase('done'); setActiveTicker(null)
      const created = paso4Results.filter(t => t.step5 === 'done').length
      setSummary({ created, total: sixSix.length })
      addLog(`🎉 Agente Vanilla completado: ${created} recomendación(es) de opciones registradas.`)

    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      addLog(`❌ Error fatal: ${(e as Error).message}`)
      setPhase('error'); setActiveTicker(null)
    }
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(201,168,76,0.25)' }}>
      <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.07) 0%, transparent 70%)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">🎯</span>
              <h2
                className="text-xl font-black cursor-pointer hover:opacity-80 transition-opacity select-none"
                style={{ color: 'var(--text-primary)' }}
                onClick={() => setStepsOpen(o => !o)}
                title={stepsOpen ? 'Ocultar pasos' : 'Ver pasos'}
              >
                Agente Vanilla {stepsOpen ? '▲' : '▼'}
              </h2>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-[var(--gold)]/40 text-[var(--gold)]">OPCIONES</span>
            </div>
            <p className="text-xs max-w-lg" style={{ color: 'var(--text-muted)' }}>
              Lynch 6/6 → Proyección (ALCISTA→CALL/PUT venta | BAJISTA→PUT/CALL venta) → Contrato IDEAL DTE ≥ 30 → Track record opciones.
            </p>
          </div>
          <div className="flex gap-2">
            {phase === 'idle' || phase === 'done' || phase === 'error' ? (
              <button onClick={phase === 'idle' ? () => { setStepsOpen(true); runAgenteVanilla() } : resetAgent} disabled={!isAdmin}
                className="px-5 py-2.5 text-sm font-mono tracking-widest rounded-xl bg-[var(--gold)] text-black font-bold disabled:opacity-40 hover:opacity-90 transition-opacity">
                {phase === 'idle' ? '▶ INICIAR AGENTE' : '↺ REINICIAR'}
              </button>
            ) : (
              <button onClick={stopAgent}
                className="px-5 py-2.5 text-sm font-mono tracking-widest rounded-xl border border-red-500/50 text-red-400 font-bold hover:bg-red-500/10 transition-colors">
                ⛔ DETENER
              </button>
            )}
          </div>
        </div>
        {!isAdmin && <p className="text-[10px] font-mono mt-2 text-amber-400">Solo el administrador puede ejecutar agentes.</p>}
      </div>

      {stepsOpen && <div className="px-6 py-5 space-y-3" style={{ borderTop: '1px solid rgba(201,168,76,0.12)' }}>
        {[
          { num: 1, label: 'INVESTIGACIÓN LYNCH',    desc: 'Score 6/6 — universo completo de acciones',                         phaseVal: step1Phase },
          { num: 2, label: 'PROYECCIÓN 30 DÍAS',     desc: 'ALCISTA → busca CALL/PUT venta | BAJISTA → busca PUT/CALL venta',   phaseVal: step2Phase },
          { num: 3, label: 'ANÁLISIS DE OPCIONES',   desc: 'Busca contrato IDEAL con DTE ≥ 30 días en la dirección de la proyección', phaseVal: step4Phase },
          { num: 4, label: 'REGISTRAR RECOMENDACIÓN',desc: 'Guarda en track record de opciones para seguimiento',                phaseVal: step5Phase },
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
            {step.num === 1 && tickers.length > 0 && (
              <div className="mt-3 pl-8 flex flex-wrap gap-2">
                {tickers.map(t => (
                  <span key={t.ticker} className="text-[10px] font-mono px-2 py-0.5 rounded border border-green-500/30 bg-green-500/10 text-green-400">{t.ticker}</span>
                ))}
              </div>
            )}
            {tickers.length > 0 && step.num >= 2 && (
              <div className="mt-3 pl-8 flex flex-wrap gap-2">
                {tickers.map(t => {
                  const relevant = step.num === 2 ? t.step2 !== 'pending'
                    : step.num === 3 ? ((t.step2 === 'alcista' || t.step2 === 'bajista') && t.step3 !== 'pending')
                    : step.num === 4 ? (t.step3 === 'pass' && t.step4 !== 'pending')
                    : t.step4 === 'pass'
                  if (!relevant) return null
                  return <TickerBadge key={t.ticker} t={t} />
                })}
              </div>
            )}
          </div>
        ))}
      </div>}

      {summary && (
        <div className="mx-6 mb-5 p-4 rounded-xl border" style={{ borderColor: 'rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.05)' }}>
          <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: 'var(--gold)' }}>RESULTADO FINAL</p>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{summary.created} recomendación(es) de opciones de {summary.total} analizadas</p>
          {summary.created > 0 && (
            <a href="/dashboard/acciones" className="text-[10px] font-mono underline mt-1 block" style={{ color: 'var(--gold)' }}>Ver en Track Record de Opciones →</a>
          )}
        </div>
      )}

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
