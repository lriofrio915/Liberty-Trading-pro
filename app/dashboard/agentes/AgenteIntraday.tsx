'use client'

import { useRef, useState } from 'react'

type Phase = 'idle' | 'running' | 'done' | 'error'

type TickerStage = {
  ticker: string
  lastPrice?: number
  change24hPct?: number
  adrPct?: number
  recentCloses?: number[]
  sesgo?: 'COMPRA' | 'VENTA' | 'NEUTRAL'
  razon?: string
  confianza?: number
  slPct?: number
  tpPct?: number
  slPrice?: number
  tpPrice?: number
  tauricPass?: boolean
  stepScreen: 'pending' | 'pass' | 'fail'
  stepBias: 'pending' | 'pass' | 'fail' | 'running'
  stepTauric: 'pending' | 'pass' | 'fail' | 'running'
  stepSave: 'pending' | 'done' | 'fail'
}

const VOLATILITY_UNIVERSE = [
  'NVDA', 'TSLA', 'AMD', 'META', 'AMZN', 'NFLX', 'GOOGL',
  'AAPL', 'MSFT', 'COIN', 'MSTR', 'HOOD', 'PLTR', 'SOFI',
  'CRWD', 'SMCI', 'ARM', 'RIVN', 'LCID', 'SNOW', 'RBLX',
  'PYPL', 'SQ', 'UPST',
]

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
  const sesgoCls = t.sesgo === 'COMPRA'
    ? 'border-green-500/40 bg-green-500/10 text-green-400'
    : t.sesgo === 'VENTA'
    ? 'border-red-500/40 bg-red-500/10 text-red-400'
    : 'border-[var(--border)] text-[var(--text-muted)]'

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
      <span className="font-mono font-bold text-xs" style={{ color: 'var(--gold)' }}>{t.ticker}</span>
      {t.adrPct != null && (
        <span className="text-[9px] font-mono text-orange-400">ADR {t.adrPct.toFixed(1)}%</span>
      )}
      {t.stepBias !== 'pending' && t.sesgo && (
        <span className={`text-[9px] font-mono px-1 py-0.5 rounded border ${sesgoCls}`}>
          {t.sesgo === 'COMPRA' ? '↑ LARGO' : t.sesgo === 'VENTA' ? '↓ CORTO' : '↔ NEUTRAL'}
        </span>
      )}
      {t.stepTauric !== 'pending' && (
        <span className={`text-[9px] font-mono px-1 py-0.5 rounded border ${
          t.stepTauric === 'pass' ? 'border-green-500/40 bg-green-500/10 text-green-400'
          : t.stepTauric === 'fail' ? 'border-red-500/40 text-red-400'
          : 'border-yellow-500/40 text-yellow-400 animate-pulse'
        }`}>
          {t.stepTauric === 'pass' ? 'IA✓' : t.stepTauric === 'fail' ? 'IA✗' : '⟳'}
        </span>
      )}
      {t.stepSave === 'done' && (
        <span className="text-[9px] font-mono px-1 py-0.5 rounded border border-orange-500/40 bg-orange-500/10 text-orange-400">📝</span>
      )}
    </div>
  )
}

export default function AgenteIntraday({ isAdmin }: { isAdmin: boolean }) {
  const [phase, setPhase]           = useState<Phase>('idle')
  const [step1Phase, setStep1Phase] = useState<Phase>('idle')
  const [step2Phase, setStep2Phase] = useState<Phase>('idle')
  const [step3Phase, setStep3Phase] = useState<Phase>('idle')
  const [step4Phase, setStep4Phase] = useState<Phase>('idle')
  const [step5Phase, setStep5Phase] = useState<Phase>('idle')
  const [step6Phase, setStep6Phase] = useState<Phase>('idle')
  const [tickers, setTickers]       = useState<TickerStage[]>([])
  const [activeTicker, setActiveTicker] = useState<string | null>(null)
  const [log, setLog]               = useState<string[]>([])
  const [summary, setSummary]       = useState<{ created: number; total: number } | null>(null)
  const [stepsOpen, setStepsOpen]   = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  function addLog(msg: string) { setLog(prev => [...prev, msg]) }

  function resetAgent() {
    setPhase('idle')
    setStep1Phase('idle'); setStep2Phase('idle'); setStep3Phase('idle')
    setStep4Phase('idle'); setStep5Phase('idle'); setStep6Phase('idle')
    setTickers([]); setLog([]); setActiveTicker(null); setSummary(null)
    setStepsOpen(false)
  }

  function stopAgent() {
    abortRef.current?.abort()
    setPhase('idle')
    setStep1Phase('idle'); setStep2Phase('idle'); setStep3Phase('idle')
    setStep4Phase('idle'); setStep5Phase('idle'); setStep6Phase('idle')
    setActiveTicker(null)
    addLog('⛔ Agente detenido por el usuario')
  }

  async function runAgenteIntraday() {
    setStepsOpen(true)
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal
    setPhase('running'); setLog([]); setTickers([]); setSummary(null)

    try {
      // ── PASO 1: CHECK EXISTENTES ──────────────────────────────
      setStep1Phase('running')
      addLog('🔍 Verificando picks INTRADAY activos existentes...')
      try {
        const existRes = await fetch('/api/picks', { signal })
        if (existRes.ok) {
          const existData = await existRes.json()
          const intradayActive = (existData.opportunities ?? []).filter(
            (o: { category: string; active: boolean }) => o.category === 'INTRADAY' && o.active
          )
          if (intradayActive.length > 0) {
            addLog(`ℹ ${intradayActive.length} pick(s) INTRADAY activos de sesiones anteriores`)
          } else {
            addLog('✓ Sin picks intraday activos previos')
          }
        }
      } catch (e) {
        if (signal.aborted) { setPhase('idle'); return }
        addLog('⚠ No se pudo verificar picks existentes')
      }
      setStep1Phase('done')
      if (signal.aborted) { setPhase('idle'); return }

      // ── PASO 2: UNIVERSO VOLÁTIL ──────────────────────────────
      setStep2Phase('running')
      addLog(`📋 Universo: ${VOLATILITY_UNIVERSE.length} acciones de alta volatilidad`)
      const initial: TickerStage[] = VOLATILITY_UNIVERSE.map(t => ({
        ticker: t, stepScreen: 'pending', stepBias: 'pending', stepTauric: 'pending', stepSave: 'pending',
      }))
      setTickers(initial)
      setStep2Phase('done')

      // ── PASO 3: FILTRO ADR ────────────────────────────────────
      setStep3Phase('running')
      addLog('📊 Calculando ADR% — filtrando acciones con rango diario ≥2.0%...')

      type Candidate = { ticker: string; lastPrice: number; change24hPct: number; adrPct: number; recentCloses: number[] }
      let candidates: Candidate[] = []
      try {
        const screenRes = await fetch('/api/intraday/screen', { signal })
        if (!screenRes.ok) throw new Error(`HTTP ${screenRes.status}`)
        const screenData = await screenRes.json()
        candidates = screenData.candidates ?? []
        addLog(`✓ ${candidates.length}/${VOLATILITY_UNIVERSE.length} tickers con ADR ≥2.0%`)
        for (const c of candidates) {
          addLog(`  ${c.ticker}: ADR ${c.adrPct.toFixed(1)}% | $${c.lastPrice.toFixed(2)} | 24h: ${c.change24hPct >= 0 ? '+' : ''}${c.change24hPct.toFixed(2)}%`)
        }
      } catch (e) {
        if (signal.aborted) { setPhase('idle'); return }
        addLog(`❌ Error en screener: ${(e as Error).message}`)
        setStep3Phase('error'); setPhase('error'); return
      }

      const paso3Results = [...initial]
      for (const t of initial) {
        const found = candidates.find(c => c.ticker === t.ticker)
        updateTicker(paso3Results, t.ticker, {
          stepScreen: found ? 'pass' : 'fail',
          lastPrice: found?.lastPrice,
          change24hPct: found?.change24hPct,
          adrPct: found?.adrPct,
          recentCloses: found?.recentCloses,
        })
      }
      setTickers([...paso3Results])
      setStep3Phase('done')
      if (signal.aborted) { setPhase('idle'); return }

      if (!candidates.length) {
        addLog('⚠ Ningún ticker supera el filtro ADR ≥2.0%. Mercado poco volátil hoy.')
        setStep4Phase('done'); setStep5Phase('done'); setStep6Phase('done')
        setPhase('done'); setSummary({ created: 0, total: VOLATILITY_UNIVERSE.length }); setActiveTicker(null); return
      }

      // ── PASO 4: SESGO MAIA ────────────────────────────────────
      setStep4Phase('running')
      addLog(`🤖 Analizando sesgo MAIA para ${candidates.length} ticker(s)...`)
      const paso4Results = [...paso3Results]

      for (const c of candidates) {
        if (signal.aborted) break
        setActiveTicker(c.ticker)
        addLog(`⟳ MAIA: ${c.ticker}...`)
        updateTicker(paso4Results, c.ticker, { stepBias: 'running' })
        setTickers([...paso4Results])

        try {
          const biasRes = await fetch('/api/intraday/bias', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticker: c.ticker,
              lastPrice: c.lastPrice,
              adrPct: c.adrPct,
              change24hPct: c.change24hPct,
              recentCloses: c.recentCloses,
            }),
            signal,
          })
          if (!biasRes.ok) throw new Error(`HTTP ${biasRes.status}`)
          const { sesgo, razon, confianza } = await biasRes.json() as {
            sesgo: 'COMPRA' | 'VENTA' | 'NEUTRAL'
            razon: string
            confianza: number
          }
          const pass = sesgo === 'COMPRA' || sesgo === 'VENTA'
          addLog(`${pass ? '✓' : '✗'} ${c.ticker}: ${sesgo} (${confianza}%) — ${razon}`)
          updateTicker(paso4Results, c.ticker, { sesgo, razon, confianza, stepBias: pass ? 'pass' : 'fail' })
        } catch (e) {
          if (signal.aborted) break
          addLog(`⚠ ${c.ticker}: error MAIA — ${(e as Error).message}`)
          updateTicker(paso4Results, c.ticker, { stepBias: 'fail' })
        }
        setTickers([...paso4Results])
        await sleep(300)
      }
      setStep4Phase('done')
      if (signal.aborted) { setPhase('idle'); return }

      // ── PASO 5: CONFIRMACIÓN TAURIC ───────────────────────────
      setStep5Phase('running')
      const paso5Candidates = paso4Results.filter(t => t.stepBias === 'pass')

      if (!paso5Candidates.length) {
        addLog('⚠ Ningún ticker con sesgo COMPRA o VENTA de MAIA.')
        setStep5Phase('done'); setStep6Phase('done')
        setPhase('done'); setSummary({ created: 0, total: VOLATILITY_UNIVERSE.length }); setActiveTicker(null); return
      }

      addLog(`🤖 Confirmación Tauric para ${paso5Candidates.length} ticker(s)...`)
      const paso5Results = [...paso4Results]
      const today = new Date().toISOString().split('T')[0]

      for (const t of paso5Candidates) {
        if (signal.aborted) break
        setActiveTicker(t.ticker)
        addLog(`⟳ Tauric: ${t.ticker}...`)
        updateTicker(paso5Results, t.ticker, { stepTauric: 'running' })
        setTickers([...paso5Results])

        try {
          const aRes = await fetch('/api/tauric/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticker: t.ticker, date: today, depth: 'moderate' }),
            signal,
          })
          if (!aRes.ok) throw new Error(`Tauric HTTP ${aRes.status}`)
          const { run_id: runId } = await aRes.json() as { run_id?: string }
          if (!runId) throw new Error('Sin run_id de Tauric')

          let conviction = false
          for (let i = 0; i < 60; i++) {
            if (signal.aborted) break
            await sleep(10_000)
            const pRes = await fetch(`/api/tauric/runs/${runId}`, { signal })
            if (!pRes.ok) continue
            const pData = await pRes.json()
            if (pData.status === 'completed') {
              conviction = /BUY|COMPRAR|ALCISTA|BULLISH|OVERWEIGHT/i.test(JSON.stringify(pData))
              break
            }
            if (pData.status === 'failed') throw new Error('Tauric run failed')
          }

          addLog(`${conviction ? '✓' : '✗'} ${t.ticker}: Tauric ${conviction ? 'CONFIRMADO' : 'RECHAZADO'}`)
          updateTicker(paso5Results, t.ticker, { stepTauric: conviction ? 'pass' : 'fail', tauricPass: conviction })
        } catch (e) {
          if (signal.aborted) break
          addLog(`⚠ ${t.ticker}: error Tauric — ${(e as Error).message}`)
          updateTicker(paso5Results, t.ticker, { stepTauric: 'fail', tauricPass: false })
        }
        setTickers([...paso5Results])
      }
      setStep5Phase('done')
      if (signal.aborted) { setPhase('idle'); return }

      // ── PASO 6: GUARDAR PICKS INTRADAY ────────────────────────
      setStep6Phase('running')
      const paso6Candidates = paso5Results.filter(t => t.stepTauric === 'pass')

      if (!paso6Candidates.length) {
        addLog('⚠ Ningún ticker aprobado por Tauric.')
        setStep6Phase('done'); setPhase('done')
        setSummary({ created: 0, total: VOLATILITY_UNIVERSE.length }); setActiveTicker(null); return
      }

      addLog(`📝 Guardando ${paso6Candidates.length} pick(s) intraday con SL/TP basados en ADR...`)
      const finalResults = [...paso5Results]

      for (const t of paso6Candidates) {
        if (signal.aborted) break
        setActiveTicker(t.ticker)

        const adrPct = t.adrPct ?? 2.5
        const slPct = Math.max(1.0, Math.min(3.0, parseFloat((0.4 * adrPct).toFixed(2))))
        const tpPct = Math.max(2.0, Math.min(6.0, parseFloat((0.8 * adrPct).toFixed(2))))
        const entry = t.lastPrice ?? 0
        const isLong = t.sesgo === 'COMPRA'
        const tpPrice = parseFloat((isLong ? entry * (1 + tpPct / 100) : entry * (1 - tpPct / 100)).toFixed(2))
        const slPrice = parseFloat((isLong ? entry * (1 - slPct / 100) : entry * (1 + slPct / 100)).toFixed(2))

        try {
          const iRes = await fetch('/api/picks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticker: t.ticker,
              direction: isLong ? 'COMPRA' : 'VENTA',
              timeframe: 'CORTO',
              riesgo: 'ALTO',
              minPlan: 'CLUB',
              stopLossPct: slPct,
              precioEntradaManual: String(entry.toFixed(2)),
              precioObjetivoManual: String(tpPrice),
              category: 'INTRADAY',
            }),
            signal,
          })
          const iData = await iRes.json().catch(() => ({}))
          if (!iRes.ok) throw new Error((iData as { error?: string }).error ?? `HTTP ${iRes.status}`)
          addLog(`✓ ${t.ticker}: ${isLong ? 'LARGO' : 'CORTO'} | Entrada $${entry.toFixed(2)} | SL $${slPrice.toFixed(2)} (${slPct.toFixed(1)}%) | TP $${tpPrice} (${tpPct.toFixed(1)}%)`)
          updateTicker(finalResults, t.ticker, { stepSave: 'done', slPct, tpPct, slPrice, tpPrice })
        } catch (e) {
          if (signal.aborted) break
          addLog(`⚠ ${t.ticker}: error guardando — ${(e as Error).message}`)
          updateTicker(finalResults, t.ticker, { stepSave: 'fail' })
        }
        setTickers([...finalResults])
      }

      setStep6Phase('done'); setPhase('done'); setActiveTicker(null)
      const created = finalResults.filter(t => t.stepSave === 'done').length
      setSummary({ created, total: VOLATILITY_UNIVERSE.length })
      addLog(`🎉 Intraday completado: ${created} pick(s) guardados de ${VOLATILITY_UNIVERSE.length} analizados.`)

    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      addLog(`❌ Error fatal: ${(e as Error).message}`)
      setPhase('error'); setActiveTicker(null)
    }
  }

  const steps = [
    { num: 1, label: 'CHECK EXISTENTES',    desc: 'Revisa picks INTRADAY activos de sesiones anteriores',                       phaseVal: step1Phase },
    { num: 2, label: 'UNIVERSO VOLÁTIL',    desc: `${VOLATILITY_UNIVERSE.length} acciones alta volatilidad (NVDA, TSLA, AMD, COIN, CRWD...)`, phaseVal: step2Phase },
    { num: 3, label: 'FILTRO ADR',          desc: 'ADR ≥2.0% — promedio del rango diario (high-low) de los últimos 10 días',    phaseVal: step3Phase },
    { num: 4, label: 'SESGO MAIA',          desc: 'Motor IA MAIA determina dirección intradia: COMPRA / VENTA / NEUTRAL',       phaseVal: step4Phase },
    { num: 5, label: 'CONFIRMACIÓN TAURIC', desc: 'Análisis multi-agente Tauric — confirma convicción direccional (~3-7 min)',  phaseVal: step5Phase },
    { num: 6, label: 'GUARDAR PICKS',       desc: 'SL = 0.4×ADR · TP = 0.8×ADR · R:R 1:2 · Categoría INTRADAY',              phaseVal: step6Phase },
  ]

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(251,146,60,0.25)' }}>
      <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.07) 0%, transparent 70%)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">⚡</span>
              <h2
                className="text-xl font-black cursor-pointer hover:opacity-80 transition-opacity select-none"
                style={{ color: 'var(--text-primary)' }}
                onClick={() => setStepsOpen(o => !o)}
                title={stepsOpen ? 'Ocultar pasos' : 'Ver pasos'}
              >
                Agente Intraday {stepsOpen ? '▲' : '▼'}
              </h2>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border text-orange-400" style={{ borderColor: 'rgba(251,146,60,0.4)' }}>INTRADAY</span>
            </div>
            <p className="text-xs max-w-lg" style={{ color: 'var(--text-muted)' }}>
              Alta volatilidad ADR ≥2% → Sesgo MAIA (largo/corto) → Confirmación Tauric → SL/TP basado en ADR (R:R 1:2).
            </p>
          </div>
          <div className="flex gap-2">
            {phase === 'idle' || phase === 'done' || phase === 'error' ? (
              <button
                onClick={phase === 'idle' ? () => { setStepsOpen(true); runAgenteIntraday() } : resetAgent}
                disabled={!isAdmin}
                className="px-5 py-2.5 text-sm font-mono tracking-widest rounded-xl font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
                style={{ background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.4)', color: '#fb923c' }}
              >
                {phase === 'idle' ? '▶ INICIAR INTRADAY' : '↺ REINICIAR'}
              </button>
            ) : (
              <button onClick={stopAgent}
                className="px-5 py-2.5 text-sm font-mono tracking-widest rounded-xl border border-red-500/50 text-red-400 font-bold hover:bg-red-500/10 transition-colors">
                ⛔ DETENER
              </button>
            )}
          </div>
        </div>
        {!isAdmin && (
          <p className="text-[10px] font-mono mt-2 text-amber-400">Solo el administrador puede ejecutar agentes.</p>
        )}
      </div>

      {stepsOpen && (
        <div className="px-6 py-5 space-y-3" style={{ borderTop: '1px solid rgba(251,146,60,0.12)' }}>
          {steps.map(step => (
            <div key={step.num} className="rounded-xl border p-4" style={{
              borderColor: step.phaseVal === 'running' ? 'rgba(251,146,60,0.4)'
                : step.phaseVal === 'done' ? 'rgba(74,222,128,0.25)'
                : 'var(--border)',
              background: step.phaseVal === 'running' ? 'rgba(251,146,60,0.04)' : 'transparent',
            }}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono font-bold w-5 text-center text-orange-400">{step.num}</span>
                  <p className="text-[10px] font-mono tracking-widest font-bold" style={{ color: 'var(--text-primary)' }}>{step.label}</p>
                </div>
                <StepBadge phase={step.phaseVal} />
              </div>
              <p className="text-[10px] pl-8" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>

              {step.num === 2 && tickers.length > 0 && (
                <div className="mt-3 pl-8 flex flex-wrap gap-2">
                  {tickers.map(t => (
                    <span key={t.ticker} className="text-[10px] font-mono px-2 py-0.5 rounded border text-orange-400"
                      style={{ borderColor: 'rgba(251,146,60,0.3)', background: 'rgba(251,146,60,0.05)' }}>
                      {t.ticker}
                    </span>
                  ))}
                </div>
              )}
              {tickers.length > 0 && step.num >= 3 && (
                <div className="mt-3 pl-8 flex flex-wrap gap-2">
                  {tickers.filter(t => {
                    if (step.num === 3) return t.stepScreen !== 'pending'
                    if (step.num === 4) return t.stepScreen === 'pass' && t.stepBias !== 'pending'
                    if (step.num === 5) return t.stepBias === 'pass' && t.stepTauric !== 'pending'
                    return t.stepTauric === 'pass'
                  }).map(t => <TickerBadge key={t.ticker} t={t} />)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {summary && (
        <div className="mx-6 mb-5 p-4 rounded-xl border" style={{ borderColor: 'rgba(251,146,60,0.3)', background: 'rgba(251,146,60,0.05)' }}>
          <p className="text-[10px] font-mono tracking-widest mb-1 text-orange-400">RESULTADO FINAL</p>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {summary.created} pick(s) intraday de {summary.total} candidatos analizados
          </p>
          {summary.created > 0 && (
            <a href="/dashboard/acciones" className="text-[10px] font-mono underline mt-1 block text-orange-400">
              Ver en OPORTUNIDADES →
            </a>
          )}
        </div>
      )}

      {log.length > 0 && (
        <div className="mx-6 mb-6 rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="px-4 py-2 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <p className="text-[9px] font-mono tracking-widest" style={{ color: 'var(--text-muted)' }}>LOG EN TIEMPO REAL</p>
            {activeTicker && (
              <span className="text-[9px] font-mono animate-pulse text-orange-400">⟳ {activeTicker}</span>
            )}
          </div>
          <div className="p-4 space-y-1 max-h-64 overflow-y-auto font-mono text-[10px]"
            style={{ background: '#0a0a0a', color: '#fb923c' }}>
            {log.map((line, i) => <p key={i} className="leading-relaxed">{line}</p>)}
          </div>
        </div>
      )}
    </div>
  )
}
