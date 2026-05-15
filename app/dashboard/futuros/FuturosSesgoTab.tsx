'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { computeFuturesLevels, getFuturesSpec } from '@/lib/futures-specs'

// ── Types ──────────────────────────────────────────────────────────────────────

interface IndexAsset {
  simbolo: string
  nombre: string
  precio: number
  cambio24h: number
  sesgo: 'COMPRA' | 'VENTA' | 'NEUTRAL'
  confianza: number
  razon: string
  riesgo: string
}

interface ScanSignal {
  stock_code?: string
  symbol?: string
  operation_advice?: string
  recommendation?: string
  signal?: string
  sentiment_score?: number
  score?: number
}

interface FuturesSignal {
  simbolo: string
  nombre: string
  sesgo: 'COMPRA' | 'VENTA'
  confianza: number
  precioEntrada: number
  stopLoss: number
  takeProfit: number
  lotaje: number
  razon: string
  sector: string
  riskProfile: string
  riesgoUsd: number
  rrRatio: number
}

interface TrackRec {
  id: string
  simbolo: string
  nombre: string
  sesgo: string
  confianza: number
  precioEntrada: number
  stopLoss: number
  takeProfit: number
  lotaje: number
  resultado: string
  pnlUsd: number | null
  closedPrice: number | null
  createdAt: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ETF_MAP: Record<string, string> = { QQQ: 'NQ', SPY: 'SP500', IWM: 'RUSSELL' }

const INDEX_NAMES: Record<string, string> = {
  NQ:      'Micro Nasdaq (MNQ)',
  SP500:   'Micro S&P 500 (MES)',
  RUSSELL: 'Micro Russell (M2K)',
}

function normalizeBias(signal: string): 'COMPRA' | 'VENTA' | 'NEUTRAL' {
  const u = signal.toUpperCase()
  if (u.includes('BUY') || u.includes('COMPRAR') || u.includes('ALCISTA') || u.includes('买入') || u.includes('增持')) return 'COMPRA'
  if (u.includes('SELL') || u.includes('VENDER') || u.includes('BAJISTA') || u.includes('卖出') || u.includes('减持')) return 'VENTA'
  return 'NEUTRAL'
}

function getETMinutes(): { mins: number; day: number } {
  const now = new Date()
  // Use Intl to get the correct America/New_York time (handles EDT/EST switch automatically)
  const etParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric', minute: 'numeric', hour12: false,
    weekday: 'narrow',
  }).formatToParts(now)
  const hour   = parseInt(etParts.find(p => p.type === 'hour')?.value   ?? '0', 10)
  const minute = parseInt(etParts.find(p => p.type === 'minute')?.value ?? '0', 10)
  const weekday = etParts.find(p => p.type === 'weekday')?.value ?? ''
  // weekday narrow: M=Mon, T=Tue, W=Wed, T=Thu, F=Fri, S=Sat, S=Sun
  const dayMap: Record<string, number> = { S: -1, M: 1, T: 2, W: 3, F: 5 }
  // Safer: use a full date part to get the day-of-week number
  const etDateStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
  }).format(now)
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const day = dayNames.indexOf(etDateStr)
  return { mins: hour * 60 + minute, day }
}

// 3:43–3:48 PM ET window — forced EOD close 15 min before market close
function isEODCloseWindow(): boolean {
  const { mins, day } = getETMinutes()
  if (day === 0 || day === 6) return false
  return mins >= 15 * 60 + 43 && mins <= 15 * 60 + 48
}

function marketCloseCountdown(): string {
  const { mins, day } = getETMinutes()
  if (day === 0 || day === 6) return 'Fin de semana'
  const eodMins = 15 * 60 + 45 // 3:45 PM ET
  if (mins >= eodMins) return 'Cierre EOD pasado'
  const diff = eodMins - mins
  return `${Math.floor(diff / 60)}h ${diff % 60}m al cierre EOD`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FuturosSesgoTab({ isAdmin }: { isAdmin: boolean }) {
  const [phase1, setPhase1]       = useState<'idle'|'running'|'done'|'error'>('idle')
  const [phase2, setPhase2]       = useState<'idle'|'running'|'done'|'error'>('idle')
  const [scanBias, setScanBias]   = useState<Record<string, { sesgo: 'COMPRA'|'VENTA'|'NEUTRAL'; conf: number }>>({})
  const [idxBias, setIdxBias]     = useState<IndexAsset[]>([])
  const [confirmed, setConfirmed] = useState<FuturesSignal[]>([])
  const [savedCount, setSavedCount] = useState<number | null>(null)
  const [trackRecs, setTrackRecs] = useState<TrackRec[]>([])
  const [rowEdits, setRowEdits]   = useState<Record<string, { resultado: string; pnlUsd: string; closedPrice: string }>>({})
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [log, setLog]             = useState<string[]>([])
  const [lastPriceCheck, setLastPriceCheck] = useState<Date | null>(null)
  const [priceChecking, setPriceChecking]   = useState(false)
  const [countdown, setCountdown] = useState(marketCloseCountdown())
  const priceMapRef = useRef<Record<string, number>>({})

  const addLog = (msg: string) => setLog(prev => [...prev, msg])

  // Countdown ticker
  useEffect(() => {
    const id = setInterval(() => setCountdown(marketCloseCountdown()), 30000)
    return () => clearInterval(id)
  }, [])

  const loadTrackRecs = useCallback(async () => {
    try {
      const res = await fetch('/api/cfds/signals?sector=Futuros')
      if (res.ok) {
        const data = await res.json()
        setTrackRecs(Array.isArray(data) ? data : data.recommendations ?? [])
      }
    } catch {}
  }, [])

  useEffect(() => { loadTrackRecs() }, [loadTrackRecs])

  // ── Auto TP/SL price check ─────────────────────────────────────────────────

  const checkPriceLevels = useCallback(async (pm: Record<string, number>, forceEOD = false) => {
    setPriceChecking(true)
    try {
      const pending = trackRecs.filter(r => r.resultado === 'PENDIENTE')
      let changed = false
      for (const sig of pending) {
        const currentPrice = pm[sig.simbolo]
        if (!currentPrice || currentPrice <= 0) continue
        const isCompra = sig.sesgo === 'COMPRA'
        const spec = getFuturesSpec(sig.simbolo)

        let resultado: string
        let rawPnl: number
        if (forceEOD) {
          const priceDiff = isCompra
            ? currentPrice - sig.precioEntrada
            : sig.precioEntrada - currentPrice
          rawPnl = priceDiff * spec.pointValue
          if (rawPnl > 0) resultado = 'GANADA'
          else if (rawPnl < 0) resultado = 'PERDIDA'
          else resultado = 'BREAKEVEN'
        } else {
          const hitTP = isCompra ? currentPrice >= sig.takeProfit : currentPrice <= sig.takeProfit
          const hitSL = isCompra ? currentPrice <= sig.stopLoss  : currentPrice >= sig.stopLoss
          if (!hitTP && !hitSL) continue
          resultado = hitTP ? 'GANADA' : 'PERDIDA'
          rawPnl = hitTP ? spec.tpUsd : -spec.slUsd
        }
        await fetch(`/api/cfds/signals/${sig.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resultado, closedPrice: currentPrice, pnlUsd: parseFloat(rawPnl.toFixed(2)) }),
        })
        changed = true
      }
      if (changed) await loadTrackRecs()
      setLastPriceCheck(new Date())
    } catch {} finally {
      setPriceChecking(false)
    }
  }, [trackRecs, loadTrackRecs])

  // EOD auto-close: check every 60s for the 3:43-3:48 PM ET window, then force-close
  const eodTriggeredRef = useRef(false)
  useEffect(() => {
    const tick = async () => {
      if (!isEODCloseWindow()) { eodTriggeredRef.current = false; return }
      if (eodTriggeredRef.current) return  // only once per day
      eodTriggeredRef.current = true
      try {
        const res = await fetch('/api/futures/analyze', { method: 'POST' })
        if (!res.ok) return
        const data = await res.json()
        const pm: Record<string, number> = {}
        for (const a of (data.activos ?? []) as IndexAsset[]) {
          if (a.precio > 0) pm[a.simbolo] = a.precio
        }
        priceMapRef.current = pm
        await checkPriceLevels(pm, true)  // forceEOD = true
      } catch {}
    }
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [checkPriceLevels])

  // Manual refresh
  const handlePriceRefresh = async () => {
    setPriceChecking(true)
    try {
      const res = await fetch('/api/futures/analyze', { method: 'POST' })
      if (!res.ok) return
      const data = await res.json()
      const pm: Record<string, number> = {}
      for (const a of (data.activos ?? []) as IndexAsset[]) {
        if (a.precio > 0) pm[a.simbolo] = a.precio
      }
      priceMapRef.current = pm
      await checkPriceLevels(pm)
    } catch {} finally { setPriceChecking(false) }
  }

  // ── Auto-save ──────────────────────────────────────────────────────────────

  const autoSaveSignals = useCallback(async (sigs: FuturesSignal[]) => {
    if (sigs.length === 0) return
    try {
      const res = await fetch('/api/cfds/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signals: sigs }),
      })
      if (res.ok) {
        const d = await res.json()
        if (d.saved > 0) setSavedCount(d.saved)
        await loadTrackRecs()
      }
    } catch {}
  }, [loadTrackRecs])

  // Reconcile confirmed signals + auto-save + check levels
  useEffect(() => {
    if (phase2 !== 'done' || idxBias.length === 0) return
    const final: FuturesSignal[] = []
    const pm: Record<string, number> = {}

    for (const idx of idxBias) {
      if (idx.precio > 0) pm[idx.simbolo] = idx.precio
      if (idx.simbolo === 'VIX' || idx.sesgo === 'NEUTRAL' || idx.confianza < 65) continue
      const scanEntry = scanBias[idx.simbolo]
      if (scanEntry && scanEntry.sesgo !== 'NEUTRAL' && scanEntry.sesgo !== idx.sesgo) continue
      const levels = computeFuturesLevels(idx.sesgo, idx.precio, idx.simbolo)
      final.push({
        simbolo: idx.simbolo,
        nombre: INDEX_NAMES[idx.simbolo] ?? idx.nombre,
        sesgo: idx.sesgo,
        confianza: Math.max(idx.confianza, scanEntry?.conf ?? 0),
        precioEntrada: idx.precio,
        stopLoss: levels.stopLoss,
        takeProfit: levels.takeProfit,
        lotaje: levels.lotaje,
        razon: idx.razon,
        sector: 'Futuros',
        riskProfile: 'moderado',
        riesgoUsd: levels.riesgoUsd,
        rrRatio: levels.rrRatio,
      })
    }

    priceMapRef.current = pm
    setConfirmed(final)

    // Auto-save and check price levels
    if (final.length > 0) autoSaveSignals(final)
    if (Object.keys(pm).length > 0) checkPriceLevels(pm)
  }, [phase2, idxBias, scanBias, autoSaveSignals, checkPriceLevels])

  // ── Main analysis runner ───────────────────────────────────────────────────

  const runAnalysis = async () => {
    setPhase1('running'); setPhase2('idle')
    setScanBias({}); setIdxBias([]); setConfirmed([]); setSavedCount(null); setLog([])

    try {
      addLog('📡 Iniciando Daily Scanner para QQQ, SPY, IWM...')
      let scanDone = false

      const scanRes = await fetch('/api/daily-signals/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stocks: ['QQQ', 'SPY', 'IWM'] }),
      })

      if (scanRes.ok) {
        // Capture task_id if returned (async mode) — use specific task polling instead of global history
        const scanInit = await scanRes.json().catch(() => ({})) as Record<string, unknown>
        const taskId = (scanInit?.task_id ?? scanInit?.taskId) as string | undefined

        const extractEtfSignals = (data: unknown): ScanSignal[] => {
          const d = data as Record<string, unknown>
          const raw = Array.isArray(data) ? data : d?.results ?? d?.result ?? []
          return (Array.isArray(raw) ? raw : []).filter((s: ScanSignal) =>
            Object.keys(ETF_MAP).includes((s.stock_code ?? s.symbol ?? '').toUpperCase())
          )
        }

        for (let i = 0; i < 12 && !scanDone; i++) {
          await new Promise(r => setTimeout(r, 8000))
          addLog(`⟳ Consultando resultados... (${i + 1}/12)`)
          const pollUrl = taskId
            ? `/api/daily-signals/tasks?task_id=${taskId}`
            : '/api/daily-signals/results'
          const rr = await fetch(pollUrl)
          if (rr.ok) {
            const data = await rr.json() as Record<string, unknown>
            // Skip if task still pending/running
            if (data?.status === 'pending' || data?.status === 'running') continue
            const payload = data?.status === 'completed' ? (data?.result ?? data) : data
            const etfSignals = extractEtfSignals(payload)
            if (etfSignals.length > 0) {
              const bm: Record<string, { sesgo: 'COMPRA'|'VENTA'|'NEUTRAL'; conf: number }> = {}
              for (const s of etfSignals) {
                const sym = (s.stock_code ?? s.symbol ?? '').toUpperCase()
                const sig = s.operation_advice ?? s.recommendation ?? s.signal ?? ''
                bm[ETF_MAP[sym]] = { sesgo: normalizeBias(sig), conf: s.sentiment_score ?? s.score ?? 65 }
              }
              setScanBias(bm)
              addLog(`✓ Daily Scanner: ${etfSignals.length} señales`)
              scanDone = true
            }
          }
        }
      }
      if (!scanDone) addLog('⚠ Daily Scanner timeout — continuando sin ETF filter')
      setPhase1('done')

      setPhase2('running')
      addLog('🔍 Iniciando Analizador de Índices (9:15 AM ET, 1min)...')
      const idxRes = await fetch('/api/futures/analyze', { method: 'POST' })
      if (!idxRes.ok) throw new Error('Analizador de Índices falló')
      const idxData = await idxRes.json()
      setIdxBias(idxData.activos ?? [])
      addLog(`✓ Analizador: ${(idxData.activos ?? []).filter((a: IndexAsset) => a.simbolo !== 'VIX').length} índices`)
      setPhase2('done')
    } catch (e) {
      addLog(`❌ Error: ${(e as Error).message}`)
      setPhase1(p => p === 'idle' ? 'error' : 'done')
      setPhase2('error')
    }
  }

  // ── Row editing ────────────────────────────────────────────────────────────

  const handleSaveRow = async (id: string) => {
    const edit = rowEdits[id]
    if (!edit) return
    setUpdatingId(id)
    try {
      await fetch(`/api/cfds/signals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultado: edit.resultado,
          pnlUsd: edit.pnlUsd ? parseFloat(edit.pnlUsd) : undefined,
          closedPrice: edit.closedPrice ? parseFloat(edit.closedPrice) : undefined,
        }),
      })
      setTrackRecs(prev => prev.map(r => r.id === id ? {
        ...r, resultado: edit.resultado,
        pnlUsd: edit.pnlUsd ? parseFloat(edit.pnlUsd) : r.pnlUsd,
        closedPrice: edit.closedPrice ? parseFloat(edit.closedPrice) : r.closedPrice,
      } : r))
      setRowEdits(prev => { const n = { ...prev }; delete n[id]; return n })
    } catch {} finally { setUpdatingId(null) }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  const fmt = (n: number, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })

  const phaseBadge = (p: 'idle'|'running'|'done'|'error') => {
    if (p === 'idle')    return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[var(--border)]" style={{ color: 'var(--text-muted)' }}>EN ESPERA</span>
    if (p === 'running') return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-yellow-500/40 bg-yellow-500/10 text-yellow-400 animate-pulse">● EJECUTANDO</span>
    if (p === 'done')    return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-green-500/40 bg-green-500/10 text-green-400">✓ COMPLETADO</span>
    return                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-red-500/40 bg-red-500/10 text-red-400">✗ ERROR</span>
  }

  const ganadas  = trackRecs.filter(r => r.resultado === 'GANADA').length
  const cerradas = trackRecs.filter(r => r.resultado !== 'PENDIENTE').length
  const totalPnl = trackRecs.reduce((s, r) => s + (r.pnlUsd ?? 0), 0)
  const winRate  = cerradas > 0 ? Math.round((ganadas / cerradas) * 100) : null
  const isRunning = phase1 === 'running' || phase2 === 'running'

  return (
    <div className="space-y-5">
      {/* Strategy info header */}
      <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(201,168,76,0.2)', background: 'linear-gradient(135deg, rgba(201,168,76,0.05) 0%, transparent 70%)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div>
            <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: 'var(--gold)' }}>ESTRATEGIA DUAL-FILTER — MICRO FUTUROS INTRADÍA</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Daily Scanner ETFs → Analizador de Índices IA → Señal CONFIRMADA con SL/TP automático.
              1 entrada máxima por índice por día. Señales auto-guardadas.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 text-right text-[10px] font-mono flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
            <span>📅 Temporalidad: <strong style={{ color: 'var(--gold)' }}>1 min</strong></span>
            <span>⏰ Análisis: <strong style={{ color: 'var(--gold)' }}>9:15 AM ET</strong></span>
            <span>🔔 Cierre EOD: <strong style={{ color: 'var(--gold)' }}>3:45 PM ET</strong></span>
            <span style={{ color: 'var(--text-muted)' }}>{countdown}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={runAnalysis}
            disabled={isRunning}
            className="px-5 py-2 rounded-xl text-xs font-mono tracking-widest font-bold transition-all disabled:opacity-50"
            style={{ background: 'var(--gold-dark)', color: '#000' }}
          >
            {isRunning ? '⟳ ANALIZANDO...' : '▶ INICIAR ANÁLISIS'}
          </button>
          <button
            onClick={handlePriceRefresh}
            disabled={priceChecking}
            className="px-4 py-2 rounded-xl text-xs font-mono border transition-all disabled:opacity-50"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            {priceChecking ? '⟳ Verificando...' : '🔄 Actualizar precios'}
          </button>
          {lastPriceCheck && (
            <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
              Última verificación: {lastPriceCheck.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {savedCount !== null && (
            <span className="text-[10px] font-mono text-green-400">✓ {savedCount} auto-guardadas</span>
          )}
        </div>
      </div>

      {/* Phase steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { num: 1, label: 'DAILY SCANNER ETFs', desc: 'QQQ (NQ) · SPY (SP500) · IWM (Russell)', phase: phase1 },
          { num: 2, label: 'ANALIZADOR DE ÍNDICES IA', desc: 'NQ · SP500 · RUSSELL · VIX — temporalidad 1min', phase: phase2 },
        ].map(step => (
          <div key={step.num} className="rounded-xl border p-4" style={{
            borderColor: step.phase === 'running' ? 'rgba(251,191,36,0.4)' : step.phase === 'done' ? 'rgba(74,222,128,0.25)' : 'var(--border)',
            background: step.phase === 'running' ? 'rgba(251,191,36,0.04)' : 'transparent',
          }}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--gold)' }}>{step.num}</span>
                <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{step.label}</span>
              </div>
              {phaseBadge(step.phase)}
            </div>
            <p className="text-[10px] pl-4" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
            {step.num === 1 && Object.keys(scanBias).length > 0 && (
              <div className="mt-2 pl-4 flex flex-wrap gap-1.5">
                {Object.entries(scanBias).map(([sym, b]) => (
                  <span key={sym} className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${b.sesgo === 'COMPRA' ? 'border-green-500/40 bg-green-500/10 text-green-400' : b.sesgo === 'VENTA' ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>
                    {sym} {b.sesgo}
                  </span>
                ))}
              </div>
            )}
            {step.num === 2 && idxBias.filter(a => a.simbolo !== 'VIX').length > 0 && (
              <div className="mt-2 pl-4 flex flex-wrap gap-1.5">
                {idxBias.filter(a => a.simbolo !== 'VIX').map(a => (
                  <span key={a.simbolo} className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${a.sesgo === 'COMPRA' ? 'border-green-500/40 bg-green-500/10 text-green-400' : a.sesgo === 'VENTA' ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>
                    {a.simbolo} {a.sesgo} {a.confianza}%
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="px-4 py-1.5" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <p className="text-[9px] font-mono tracking-widest" style={{ color: 'var(--text-muted)' }}>LOG</p>
          </div>
          <div className="p-3 space-y-0.5 max-h-24 overflow-y-auto font-mono text-[10px]" style={{ background: '#0a0a0a', color: '#4ade80' }}>
            {log.map((l, i) => <p key={i}>{l}</p>)}
          </div>
        </div>
      )}

      {/* Confirmed signals (current session) */}
      {confirmed.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(201,168,76,0.3)' }}>
          <div className="flex items-center justify-between px-4 py-2" style={{ background: 'rgba(201,168,76,0.08)', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
            <span className="text-[10px] font-mono tracking-widest font-bold" style={{ color: 'var(--gold)' }}>SEÑALES DEL ANÁLISIS</span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-green-500/40 text-green-400">✓ Auto-guardadas</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)' }}>
                  {['Índice', 'Dir', 'Conf', 'Entrada', 'Stop Loss', 'Take Profit', 'Razón'].map(h => (
                    <th key={h} className="px-3 py-2 text-left whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {confirmed.map(sig => (
                  <tr key={sig.simbolo} className="border-b border-[var(--border)]"
                    style={{ borderLeft: `3px solid ${sig.sesgo === 'COMPRA' ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}` }}>
                    <td className="px-3 py-2 font-bold" style={{ color: 'var(--gold)' }}>{sig.nombre}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${sig.sesgo === 'COMPRA' ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
                        {sig.sesgo}
                      </span>
                    </td>
                    <td className="px-3 py-2" style={{ color: sig.confianza >= 75 ? 'var(--gold)' : 'var(--text-secondary)' }}>{sig.confianza}%</td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-secondary)' }}>{fmt(sig.precioEntrada)}</td>
                    <td className="px-3 py-2 text-red-400">{fmt(sig.stopLoss)}</td>
                    <td className="px-3 py-2 text-green-400">{fmt(sig.takeProfit)}</td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-muted)' }}>{sig.razon}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Track Record */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-mono tracking-widest font-bold" style={{ color: 'var(--gold)' }}>TRACK RECORD — FUTUROS INTRADÍA</p>
            {trackRecs.length > 0 && (
              <div className="flex gap-3 text-[9px] font-mono">
                <span style={{ color: 'var(--text-muted)' }}>{trackRecs.length} ops</span>
                {winRate !== null && <span className={winRate >= 50 ? 'text-green-400' : 'text-red-400'}>{winRate}% WR</span>}
                <span className={totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}>{totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(0)}</span>
              </div>
            )}
          </div>
          <button onClick={loadTrackRecs} className="label-mono text-[9px] px-2 py-1 rounded border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            ↺
          </button>
        </div>

        {trackRecs.length === 0 ? (
          <div className="rounded-xl border p-6 text-center text-[10px] font-mono" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            Sin señales. Corre el análisis a las 9:15 AM ET.
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] font-mono">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)' }}>
                    {['Fecha', 'Índice', 'Dir', 'Entrada', 'SL', 'TP', 'Resultado', 'P&L', ...(isAdmin ? ['Acc.'] : [])].map(h => (
                      <th key={h} className="px-3 py-2 text-left whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trackRecs.map(rec => {
                    const isClosed = rec.resultado !== 'PENDIENTE'
                    const edit = rowEdits[rec.id]
                    return (
                      <tr key={rec.id} className="border-b border-[var(--border)]"
                        style={{
                          opacity: isClosed ? 0.6 : 1,
                          filter: isClosed ? 'saturate(0.5)' : undefined,
                          borderLeft: `3px solid ${rec.sesgo === 'COMPRA' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                        }}>
                        <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                          {new Date(rec.createdAt).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', timeZone: 'America/Guayaquil' })}
                        </td>
                        <td className="px-3 py-2 font-bold whitespace-nowrap" style={{ color: 'var(--gold)' }}>{rec.simbolo}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${rec.sesgo === 'COMPRA' ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
                            {rec.sesgo}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{fmt(rec.precioEntrada)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-red-400">{fmt(rec.stopLoss)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-green-400">{fmt(rec.takeProfit)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {isAdmin ? (
                            <select value={edit?.resultado ?? rec.resultado}
                              onChange={e => setRowEdits(prev => ({ ...prev, [rec.id]: { resultado: e.target.value, pnlUsd: String(edit?.pnlUsd ?? rec.pnlUsd ?? ''), closedPrice: String(edit?.closedPrice ?? rec.closedPrice ?? '') } }))}
                              className="text-[9px] font-mono bg-transparent border border-[var(--border)] rounded px-1 py-0.5"
                              style={{ color: rec.resultado === 'GANADA' ? '#4ade80' : rec.resultado === 'PERDIDA' ? '#f87171' : rec.resultado === 'BREAKEVEN' ? '#facc15' : 'var(--text-muted)' }}>
                              {['PENDIENTE','GANADA','PERDIDA','BREAKEVEN'].map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          ) : (
                            <span className={`text-[9px] font-bold ${rec.resultado === 'GANADA' ? 'text-green-400' : rec.resultado === 'PERDIDA' ? 'text-red-400' : rec.resultado === 'BREAKEVEN' ? 'text-yellow-400' : ''}`}
                              style={rec.resultado === 'PENDIENTE' ? { color: 'var(--text-muted)' } : {}}>
                              {rec.resultado}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {isAdmin ? (
                            <input type="number" step="0.01" placeholder="0.00"
                              value={edit?.pnlUsd ?? (rec.pnlUsd != null ? String(rec.pnlUsd) : '')}
                              onChange={e => setRowEdits(prev => ({ ...prev, [rec.id]: { resultado: edit?.resultado ?? rec.resultado, pnlUsd: e.target.value, closedPrice: String(edit?.closedPrice ?? rec.closedPrice ?? '') } }))}
                              className="text-[9px] font-mono bg-transparent border border-[var(--border)] rounded px-1 py-0.5 w-16"
                              style={{ color: 'var(--text-secondary)' }} />
                          ) : (
                            <span className={rec.pnlUsd != null ? (rec.pnlUsd >= 0 ? 'text-green-400' : 'text-red-400') : ''} style={rec.pnlUsd == null ? { color: 'var(--text-muted)' } : {}}>
                              {rec.pnlUsd != null ? `${rec.pnlUsd >= 0 ? '+' : ''}$${Math.abs(rec.pnlUsd).toFixed(2)}` : '—'}
                            </span>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="px-3 py-2 whitespace-nowrap">
                            {!!edit && (
                              <button onClick={() => handleSaveRow(rec.id)} disabled={updatingId === rec.id}
                                className="text-[9px] px-1.5 py-0.5 rounded border font-semibold"
                                style={{ borderColor: 'rgba(234,179,8,0.5)', color: 'rgb(234,179,8)' }}>
                                {updatingId === rec.id ? '...' : 'Guardar'}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
