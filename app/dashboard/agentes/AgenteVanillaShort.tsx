'use client'

import { useRef, useState } from 'react'

type Phase = 'idle' | 'running' | 'done' | 'error'

const THETA_UNIVERSE = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX',
  'AMD', 'INTC', 'ORCL', 'CSCO', 'QCOM', 'CRM', 'PYPL', 'UBER',
  'BA', 'CAT', 'GS', 'JPM', 'BAC', 'WFC', 'XOM', 'CVX',
  'DIS', 'SBUX', 'KO', 'PEP', 'MCD', 'WMT', 'TGT', 'NKE',
  'V', 'MA', 'COIN', 'MU',
]

type TickerStage = {
  ticker: string
  forecastPct?: number
  optionFound?: boolean
  optionAction?: string
  optionContract?: string
  optionStrike?: number
  optionExpiration?: string
  optionDTE?: number
  optionDelta?: number
  optionIV?: number
  optionScore?: number
  tauricPass?: boolean
  step3: 'pending' | 'pass' | 'fail'
  step4: 'pending' | 'pass' | 'fail' | 'running'
  step6: 'pending' | 'pass' | 'fail' | 'running'
  step7: 'pending' | 'done' | 'fail'
}

type Contract = {
  symbol: string
  type: string
  strike: number
  expiration: string
  dte: number
  bid?: number | null
  ask?: number | null
  mid?: number | null
  impliedVolatility?: number | null
  delta?: number | null
}
type SP = {
  strategy: string
  label: string
  score: number
  action: string
  contract: Contract
  breakeven?: number
  maxLossHint?: string
  maxProfitHint?: string
}
type OptData = {
  underlying?: { company?: string; underlyingPrice?: number }
  strategies?: Record<string, SP[]>
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
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
      <span className="font-mono font-bold" style={{ color: 'var(--gold)' }}>{t.ticker}</span>
      {t.step3 !== 'pending' && (
        <span className={`text-[9px] font-mono px-1 py-0.5 rounded border ${t.step3 === 'pass' ? 'border-green-500/40 bg-green-500/10 text-green-400' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>
          {t.step3 === 'pass' ? `✓${t.forecastPct !== undefined ? (t.forecastPct >= 0 ? '+' : '') + t.forecastPct.toFixed(1) + '%' : ''}` : `✗${t.forecastPct !== undefined ? t.forecastPct.toFixed(1) + '%' : ''}`}
        </span>
      )}
      {t.step4 !== 'pending' && (
        <span className={`text-[9px] font-mono px-1 py-0.5 rounded border ${t.step4 === 'pass' ? 'border-blue-500/40 bg-blue-500/10 text-blue-400' : t.step4 === 'running' ? 'border-yellow-500/40 text-yellow-400 animate-pulse' : 'border-red-500/40 text-red-400'}`}>
          {t.step4 === 'pass' && t.optionAction ? t.optionAction.split(' ').slice(0, 2).join(' ') : t.step4 === 'fail' ? 'OPT✗' : '⟳'}
        </span>
      )}
      {t.step6 !== 'pending' && (
        <span className={`text-[9px] font-mono px-1 py-0.5 rounded border ${t.step6 === 'pass' ? 'border-green-500/40 bg-green-500/10 text-green-400' : t.step6 === 'fail' ? 'border-red-500/40 text-red-400' : 'border-yellow-500/40 text-yellow-400 animate-pulse'}`}>
          {t.step6 === 'pass' ? 'IA✓' : t.step6 === 'fail' ? 'IA✗' : '⟳'}
        </span>
      )}
      {t.step7 === 'done' && <span className="text-[9px] font-mono px-1 py-0.5 rounded border border-blue-500/40 bg-blue-500/10 text-blue-400">📝</span>}
    </div>
  )
}

export default function AgenteVanillaShort({ isAdmin }: { isAdmin: boolean }) {
  const [phase, setPhase]           = useState<Phase>('idle')
  const [step0Phase, setStep0Phase] = useState<Phase>('idle')
  const [step2Phase, setStep2Phase] = useState<Phase>('idle')
  const [step3Phase, setStep3Phase] = useState<Phase>('idle')
  const [step4Phase, setStep4Phase] = useState<Phase>('idle')
  const [step6Phase, setStep6Phase] = useState<Phase>('idle')
  const [step7Phase, setStep7Phase] = useState<Phase>('idle')
  const [tickers, setTickers]       = useState<TickerStage[]>([])
  const [activeTicker, setActiveTicker] = useState<string | null>(null)
  const [log, setLog]               = useState<string[]>([])
  const [summary, setSummary]       = useState<{ created: number; total: number } | null>(null)
  const [savedRecs, setSavedRecs]   = useState<Array<{ id: string; ticker: string; action: string; strike: number; expiration: string; dte: number; score: number; label: string; mid?: number | null }>>([])
  const [stepsOpen, setStepsOpen]   = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  function addLog(msg: string) { setLog(prev => [...prev, msg]) }

  function resetAgent() {
    setPhase('idle')
    setStep0Phase('idle'); setStep2Phase('idle'); setStep3Phase('idle')
    setStep4Phase('idle'); setStep6Phase('idle'); setStep7Phase('idle')
    setTickers([]); setLog([]); setActiveTicker(null); setSummary(null); setSavedRecs([])
    setStepsOpen(false)
  }

  function stopAgent() {
    abortRef.current?.abort()
    setPhase('idle')
    setStep0Phase('idle'); setStep2Phase('idle'); setStep3Phase('idle')
    setStep4Phase('idle'); setStep6Phase('idle'); setStep7Phase('idle')
    setActiveTicker(null)
    addLog('⛔ Agente detenido por el usuario')
  }

  async function runAgent() {
    setStepsOpen(true)
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal
    setPhase('running'); setLog([]); setTickers([]); setSummary(null)

    try {
      // ── PASO 01: RE-EVALUACIÓN — cerrar expiradas ──────────────
      setStep0Phase('running')
      addLog('♻ Revisando opciones sell-put/covered-call expiradas...')
      try {
        const today = new Date().toISOString().split('T')[0]
        const recsRes = await fetch('/api/options-recs?strategies=sell-put,covered-call&active=true', { signal })
        if (recsRes.ok) {
          const recsData = await recsRes.json()
          const expired: Array<{ id: string; ticker: string; expiration: string }> = (recsData.recommendations ?? [])
            .filter((r: { expiration: string }) => r.expiration && r.expiration < today)
          for (const rec of expired) {
            if (signal.aborted) break
            await fetch(`/api/options-recs/${rec.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ active: false, status: 'EXPIRADA' }),
              signal,
            })
            addLog(`♻ ${rec.ticker}: expirada (${rec.expiration}) → cerrada`)
          }
          if (expired.length === 0) addLog('✓ Sin opciones expiradas pendientes')
        }
      } catch (e) {
        if (signal.aborted) { setPhase('idle'); return }
        addLog(`⚠ Re-evaluación: ${(e as Error).message}`)
      }
      setStep0Phase('done')

      // ── PASO 02: UNIVERSO THETA — 36 acciones líquidas ─────────
      setStep2Phase('running')
      addLog(`📋 Universo Theta: ${THETA_UNIVERSE.length} acciones líquidas con opciones`)
      addLog(`→ ${THETA_UNIVERSE.join(', ')}`)
      const initial: TickerStage[] = THETA_UNIVERSE.map(t => ({
        ticker: t, step3: 'pending', step4: 'pending', step6: 'pending', step7: 'pending',
      }))
      setTickers(initial)
      setStep2Phase('done')

      // ── PASO 03: TIMESFM SAFETY — excluir caídas >-5% ─────────
      setStep3Phase('running')
      addLog('🛡 Safety filter: excluir tickers con forecast ≤-5%...')
      const paso3Results: TickerStage[] = [...initial]
      for (const ticker of THETA_UNIVERSE) {
        if (signal.aborted) break
        setActiveTicker(ticker)
        try {
          const fRes = await fetch(`/api/forecast?symbol=${ticker}&horizon=30`, { signal })
          if (!fRes.ok) throw new Error(`HTTP ${fRes.status}`)
          const fData = await fRes.json()
          const lastPrice: number = fData.last_price ?? 0
          const forecastArr: number[] = fData.forecast ?? []
          const forecastPrice: number = forecastArr[forecastArr.length - 1] ?? lastPrice
          const pct = lastPrice > 0 ? ((forecastPrice - lastPrice) / lastPrice) * 100 : 0
          const pass = pct > -5.0
          addLog(`${pass ? '✓' : '✗'} ${ticker}: ${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% → ${pass ? 'SEGURO' : 'PELIGROSO (skip)'}`)
          updateTicker(paso3Results, ticker, { forecastPct: pct, step3: pass ? 'pass' : 'fail' })
        } catch (e) {
          if (signal.aborted) break
          addLog(`⚠ ${ticker}: forecast error — ${(e as Error).message}`)
          updateTicker(paso3Results, ticker, { step3: 'pass' })
        }
        setTickers([...paso3Results])
        await sleep(400)
      }
      setStep3Phase('done')
      if (signal.aborted) { setPhase('idle'); return }

      // ── PASO 04: CADENA OPCIONES — sell-put / covered-call ─────
      setStep4Phase('running')
      const paso4Candidates = paso3Results.filter(t => t.step3 === 'pass')
      if (!paso4Candidates.length) {
        addLog('⚠ Todos los tickers filtrados por safety.')
        setStep4Phase('done')
        setPhase('done'); setSummary({ created: 0, total: THETA_UNIVERSE.length }); setActiveTicker(null); return
      }
      addLog(`📊 Cadena opciones para ${paso4Candidates.length} ticker(s) seguros...`)
      const paso4Results = [...paso3Results]

      for (const t of paso4Candidates) {
        if (signal.aborted) break
        setActiveTicker(t.ticker)
        updateTicker(paso4Results, t.ticker, { step4: 'running' })
        setTickers([...paso4Results])

        try {
          const optRes = await fetch(`/api/options/analyze?ticker=${t.ticker}`, { signal })
          if (!optRes.ok) throw new Error(`HTTP ${optRes.status}`)
          const optData: OptData = await optRes.json()

          const allPicks: SP[] = [
            ...(optData.strategies?.['sell-put'] ?? []),
            ...(optData.strategies?.['covered-call'] ?? []),
          ].filter(p => {
            const d = Math.abs(p.contract.delta ?? 0)
            const iv = p.contract.impliedVolatility ?? 0
            return d >= 0.15 && d <= 0.35
              && p.contract.dte >= 21 && p.contract.dte <= 45
              && iv > 0.30
              && p.score >= 50
              && p.label !== 'EVITAR'
          }).sort((a, b) => b.score - a.score)

          if (!allPicks.length) {
            addLog(`✗ ${t.ticker}: sin contratos sell-put/covered-call con IV>30% · |Δ| 0.15-0.35 · DTE 21-45`)
            updateTicker(paso4Results, t.ticker, { step4: 'fail', optionFound: false })
          } else {
            const chosen = allPicks[0]
            const iv = ((chosen.contract.impliedVolatility ?? 0) * 100).toFixed(0)
            addLog(`✓ ${t.ticker}: ${chosen.action} IV:${iv}% Δ${chosen.contract.delta?.toFixed(2)} DTE:${chosen.contract.dte} Score:${chosen.score}`)
            updateTicker(paso4Results, t.ticker, {
              step4: 'pass', optionFound: true,
              optionAction: chosen.action,
              optionContract: chosen.contract.symbol,
              optionStrike: chosen.contract.strike,
              optionExpiration: chosen.contract.expiration,
              optionDTE: chosen.contract.dte,
              optionDelta: chosen.contract.delta ?? undefined,
              optionIV: chosen.contract.impliedVolatility ?? undefined,
              optionScore: chosen.score,
            })
            const ref = paso4Results.find(r => r.ticker === t.ticker) as TickerStage & { _optData?: OptData; _chosen?: SP }
            ref._optData = optData
            ref._chosen = chosen
          }
        } catch (e) {
          if (signal.aborted) break
          addLog(`⚠ ${t.ticker}: error — ${(e as Error).message}`)
          updateTicker(paso4Results, t.ticker, { step4: 'fail' })
        }
        setTickers([...paso4Results])
        await sleep(300)
      }
      setStep4Phase('done')
      if (signal.aborted) { setPhase('idle'); return }

      // ── PASO 05: CALIDAD (aplicado en paso 4) ──────────────────
      // IV>30% · DTE 21-45 · |Δ| 0.15-0.35 · score≥50 ya filtrados arriba

      // ── PASO 06: CONFIRMACIÓN IA — Tauric conviction ≥7 ────────
      setStep6Phase('running')
      const paso6Candidates = paso4Results.filter(t => t.step4 === 'pass')
      if (!paso6Candidates.length) {
        addLog('⚠ Ningún contrato superó los filtros de calidad.')
        setStep6Phase('done')
        setPhase('done'); setSummary({ created: 0, total: THETA_UNIVERSE.length }); setActiveTicker(null); return
      }
      addLog(`🤖 Confirmación IA para ${paso6Candidates.length} ticker(s)...`)
      const paso6Results = [...paso4Results]
      const today = new Date().toISOString().split('T')[0]

      for (const t of paso6Candidates) {
        if (signal.aborted) break
        setActiveTicker(t.ticker)
        updateTicker(paso6Results, t.ticker, { step6: 'running' })
        setTickers([...paso6Results])

        try {
          const analyzeRes = await fetch('/api/tauric/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticker: t.ticker, date: today, depth: 'moderate' }),
            signal,
          })
          if (!analyzeRes.ok) throw new Error(`Tauric HTTP ${analyzeRes.status}`)
          const aData = await analyzeRes.json()
          const runId: string = aData.run_id ?? aData.id ?? ''
          if (!runId) throw new Error('Sin run_id de Tauric')

          let conviction = false
          for (let attempt = 0; attempt < 60; attempt++) {
            if (signal.aborted) break
            await sleep(10000)
            const pollRes = await fetch(`/api/tauric/runs/${runId}`, { signal })
            if (!pollRes.ok) continue
            const pollData = await pollRes.json()
            if (pollData.status === 'completed') {
              const resultText = pollData.result ?? pollData.signal ?? pollData.recommendation ?? pollData.summary ?? ''
              const text: string = typeof resultText === 'string' ? resultText : JSON.stringify(resultText)
              conviction = /\b(BUY|COMPRAR|ALCISTA|BULLISH|OVERWEIGHT)\b/i.test(text)
              break
            }
          }

          addLog(`${conviction ? '✓' : '✗'} ${t.ticker}: Tauric ${conviction ? 'CONFIRMADO (convicción ≥7)' : 'RECHAZADO'}`)
          updateTicker(paso6Results, t.ticker, { step6: conviction ? 'pass' : 'fail', tauricPass: conviction })
        } catch (e) {
          if (signal.aborted) break
          addLog(`⚠ ${t.ticker}: Tauric error — ${(e as Error).message}`)
          updateTicker(paso6Results, t.ticker, { step6: 'fail', tauricPass: false })
        }
        setTickers([...paso6Results])
      }
      setStep6Phase('done')
      if (signal.aborted) { setPhase('idle'); return }

      // ── PASO 07: PICKS & INFORME — sin duplicados ───────────────
      setStep7Phase('running')
      const paso7Candidates = paso6Results.filter(t => t.step6 === 'pass')
      if (!paso7Candidates.length) {
        addLog('⚠ Ningún ticker aprobado por Tauric.')
        setStep7Phase('done'); setPhase('done')
        setSummary({ created: 0, total: THETA_UNIVERSE.length }); setActiveTicker(null); return
      }
      addLog(`📝 Registrando ${paso7Candidates.length} pick(s) aprobados...`)
      const finalResults = [...paso6Results]

      for (const t of paso7Candidates) {
        if (signal.aborted) break
        setActiveTicker(t.ticker)
        const ref = finalResults.find(r => r.ticker === t.ticker) as TickerStage & { _optData?: OptData; _chosen?: SP }
        const optData = ref._optData
        const chosen = ref._chosen
        if (!chosen) continue

        try {
          const iRes = await fetch('/api/options-recs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticker: t.ticker,
              company: optData?.underlying?.company ?? '',
              direction: 'NEUTRAL',
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
              source: 'vanilla_short',
            }),
            signal,
          })
          const iData = await iRes.json().catch(() => ({}))
          if (!iRes.ok) throw new Error(iData.error ?? `HTTP ${iRes.status}`)
          if (iData.skipped) {
            addLog(`ℹ ${t.ticker}: ya existe pick activo ${chosen.strategy} — omitido`)
          } else {
            addLog(`✓ ${t.ticker}: ${chosen.action} registrado`)
            if (iData.recommendation) setSavedRecs(prev => [...prev, iData.recommendation])
          }
          updateTicker(finalResults, t.ticker, { step7: 'done' })
        } catch (e) {
          if (signal.aborted) break
          addLog(`⚠ ${t.ticker}: error guardando — ${(e as Error).message}`)
          updateTicker(finalResults, t.ticker, { step7: 'fail' })
        }
        setTickers([...finalResults])
      }

      setStep7Phase('done'); setPhase('done'); setActiveTicker(null)
      const created = finalResults.filter(t => t.step7 === 'done').length
      setSummary({ created, total: THETA_UNIVERSE.length })
      addLog(`🎉 Vanilla Short completado: ${created} pick(s) registrados de ${THETA_UNIVERSE.length} analizados.`)

    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      addLog(`❌ Error fatal: ${(e as Error).message}`)
      setPhase('error'); setActiveTicker(null)
    }
  }

  const steps = [
    { num: '01', label: 'RE-EVALUACIÓN',   desc: 'Auto-close opciones sell-put/covered-call expiradas',               phaseVal: step0Phase },
    { num: '02', label: 'UNIVERSO THETA',  desc: `~36 acciones opcionales líquidas (${THETA_UNIVERSE.length} tickers)`, phaseVal: step2Phase },
    { num: '03', label: 'TIMESFM SAFETY',  desc: 'Sin caídas >-5% para sell-put · Excluir tickers peligrosos',        phaseVal: step3Phase },
    { num: '04', label: 'CADENA OPCIONES', desc: 'Sell-put / Covered-call mayor score (IV>30% · DTE 21-45)',           phaseVal: step4Phase },
    { num: '05', label: 'CALIDAD PRIMA',   desc: 'IV>30% · DTE 21-45 · |Δ| 0.15-0.35 · score≥50',                    phaseVal: step4Phase },
    { num: '06', label: 'CONFIRMACIÓN IA', desc: 'Tauric conviction ≥7 — BUY/ALCISTA/BULLISH',                        phaseVal: step6Phase },
    { num: '07', label: 'PICKS & INFORME', desc: 'Sin duplicados · solo aprobados por IA',                            phaseVal: step7Phase },
  ]

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(147,51,234,0.3)' }}>
      <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, rgba(147,51,234,0.07) 0%, transparent 70%)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">📉</span>
              <h2
                className="text-xl font-black cursor-pointer hover:opacity-80 transition-opacity select-none"
                style={{ color: 'var(--text-primary)' }}
                onClick={() => setStepsOpen(o => !o)}
                title={stepsOpen ? 'Ocultar pasos' : 'Ver pasos'}
              >
                Agente Vanilla Short {stepsOpen ? '▲' : '▼'}
              </h2>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-purple-500/40 text-purple-400">SELL PREMIUM</span>
            </div>
            <p className="text-xs max-w-lg" style={{ color: 'var(--text-muted)' }}>
              36 acciones theta → safety TimesFM &gt;-5% → sell-put/covered-call · IV&gt;30% · DTE 21-45 · |Δ| 0.15-0.35 → Tauric IA → Track record.
            </p>
          </div>
          <div className="flex gap-2">
            {phase === 'idle' || phase === 'done' || phase === 'error' ? (
              <button
                onClick={phase === 'idle' ? () => { setStepsOpen(true); runAgent() } : resetAgent}
                disabled={!isAdmin}
                className="px-5 py-2.5 text-sm font-mono tracking-widest rounded-xl font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
                style={{ background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(147,51,234,0.4)', color: '#a855f7' }}
              >
                {phase === 'idle' ? '▶ INICIAR SHORT' : '↺ REINICIAR'}
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

      {stepsOpen && (
        <div className="px-6 py-5 space-y-3" style={{ borderTop: '1px solid rgba(147,51,234,0.15)' }}>
          {steps.map(step => (
            <div key={step.num} className="rounded-xl border p-4" style={{
              borderColor: step.phaseVal === 'running' ? 'rgba(251,191,36,0.4)' : step.phaseVal === 'done' ? 'rgba(147,51,234,0.3)' : 'var(--border)',
              background: step.phaseVal === 'running' ? 'rgba(251,191,36,0.04)' : 'transparent',
            }}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono font-bold w-5 text-center text-purple-400">{step.num}</span>
                  <p className="text-[10px] font-mono tracking-widest font-bold" style={{ color: 'var(--text-primary)' }}>{step.label}</p>
                </div>
                <StepBadge phase={step.phaseVal} />
              </div>
              <p className="text-[10px] pl-8" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
              {step.num === '02' && tickers.length > 0 && (
                <div className="mt-3 pl-8 flex flex-wrap gap-2">
                  {tickers.map(t => (
                    <span key={t.ticker} className="text-[10px] font-mono px-2 py-0.5 rounded border border-purple-500/30 bg-purple-500/10 text-purple-400">{t.ticker}</span>
                  ))}
                </div>
              )}
              {tickers.length > 0 && (step.num === '03' || step.num === '04' || step.num === '05' || step.num === '06' || step.num === '07') && (
                <div className="mt-3 pl-8 flex flex-wrap gap-2">
                  {tickers.filter(t => t.step3 !== 'pending').map(t => <TickerBadge key={t.ticker} t={t} />)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {summary && (
        <div className="mx-6 mb-5 p-4 rounded-xl border" style={{ borderColor: 'rgba(147,51,234,0.3)', background: 'rgba(147,51,234,0.05)' }}>
          <p className="text-[10px] font-mono tracking-widest mb-1 text-purple-400">RESULTADO FINAL</p>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{summary.created} pick(s) registrados de {summary.total} candidatos analizados</p>
          {savedRecs.length > 0 && (
            <div className="mt-3 space-y-1">
              {savedRecs.map(r => (
                <div key={r.id} className="flex items-center gap-2 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  <span className="text-purple-400 font-bold">{r.ticker}</span>
                  <span>{r.action}</span>
                  <span>@{r.strike}</span>
                  <span>exp:{r.expiration}</span>
                  <span className="text-purple-400">{r.label}</span>
                </div>
              ))}
            </div>
          )}
          {summary.created > 0 && (
            <a href="/dashboard/opciones?tab=vanilla_short" className="text-[10px] font-mono underline mt-2 block" style={{ color: '#a855f7' }}>
              Ver en RECOMENDACIONES OPCIONES →
            </a>
          )}
        </div>
      )}

      {log.length > 0 && (
        <div className="mx-6 mb-6 rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="px-4 py-2 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <p className="text-[9px] font-mono tracking-widest" style={{ color: 'var(--text-muted)' }}>LOG EN TIEMPO REAL</p>
            {activeTicker && <span className="text-[9px] font-mono animate-pulse text-purple-400">⟳ {activeTicker}</span>}
          </div>
          <div className="p-4 space-y-1 max-h-64 overflow-y-auto font-mono text-[10px]" style={{ background: '#0a0a0a', color: '#a855f7' }}>
            {log.map((line, i) => <p key={i} className="leading-relaxed">{line}</p>)}
          </div>
        </div>
      )}
    </div>
  )
}
