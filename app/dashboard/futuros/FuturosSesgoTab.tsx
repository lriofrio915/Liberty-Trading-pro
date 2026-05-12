'use client'

import { useState, useEffect, useCallback } from 'react'

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
  stock_name?: string
  name?: string
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

// Index ETF mapping: scanner ticker → futures symbol
const ETF_MAP: Record<string, string> = {
  QQQ: 'NQ',
  SPY: 'SP500',
  IWM: 'RUSSELL',
}

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

const SL_PCT = 0.005 // 0.5% for indices

function computeLevels(sesgo: 'COMPRA' | 'VENTA', entry: number) {
  const slDist = entry * SL_PCT
  const tpDist = slDist * 2
  const sl = sesgo === 'COMPRA' ? entry - slDist : entry + slDist
  const tp = sesgo === 'COMPRA' ? entry + tpDist : entry - tpDist
  const lotaje = 1 // 1 micro contract default
  return { sl, tp, lotaje }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FuturosSesgoTab({ isAdmin }: { isAdmin: boolean }) {
  const [phase1, setPhase1]     = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [phase2, setPhase2]     = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [scanBias, setScanBias] = useState<Record<string, { sesgo: 'COMPRA'|'VENTA'|'NEUTRAL'; conf: number }>>({})
  const [idxBias, setIdxBias]   = useState<IndexAsset[]>([])
  const [confirmed, setConfirmed] = useState<FuturesSignal[]>([])
  const [saving, setSaving]     = useState(false)
  const [savedCount, setSavedCount] = useState<number | null>(null)
  const [trackRecs, setTrackRecs] = useState<TrackRec[]>([])
  const [rowEdits, setRowEdits] = useState<Record<string, { resultado: string; pnlUsd: string; closedPrice: string }>>({})
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])

  const addLog = (msg: string) => setLog(prev => [...prev, msg])

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

  const runAnalysis = async () => {
    setPhase1('running')
    setPhase2('idle')
    setScanBias({})
    setIdxBias([])
    setConfirmed([])
    setSavedCount(null)
    setLog([])

    try {
      // ── Phase 1: Daily Scanner for QQQ, SPY, IWM ──
      addLog('📡 Iniciando Daily Scanner para QQQ, SPY, IWM...')
      const scanRes = await fetch('/api/daily-signals/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stocks: ['QQQ', 'SPY', 'IWM'] }),
      })
      if (!scanRes.ok) throw new Error('Daily Scanner no disponible')

      // Poll for results
      let scanDone = false
      for (let i = 0; i < 12 && !scanDone; i++) {
        await new Promise(r => setTimeout(r, 8000))
        addLog(`⟳ Consultando resultados... (${i + 1}/12)`)
        const resRes = await fetch('/api/daily-signals/results')
        if (resRes.ok) {
          const data = await resRes.json()
          const signals: ScanSignal[] = Array.isArray(data) ? data : data.results ?? []
          const etfSignals = signals.filter(s => {
            const sym = (s.stock_code ?? s.symbol ?? '').toUpperCase()
            return Object.keys(ETF_MAP).includes(sym)
          })
          if (etfSignals.length > 0) {
            const biasMap: Record<string, { sesgo: 'COMPRA'|'VENTA'|'NEUTRAL'; conf: number }> = {}
            for (const s of etfSignals) {
              const sym = (s.stock_code ?? s.symbol ?? '').toUpperCase()
              const sigStr = s.operation_advice ?? s.recommendation ?? s.signal ?? ''
              biasMap[ETF_MAP[sym]] = {
                sesgo: normalizeBias(sigStr),
                conf: s.sentiment_score ?? s.score ?? 65,
              }
            }
            setScanBias(biasMap)
            addLog(`✓ Daily Scanner: ${etfSignals.length} señales recibidas`)
            scanDone = true
          }
        }
      }
      if (!scanDone) {
        addLog('⚠ Daily Scanner timeout — continuando con Analizador de Índices')
      }
      setPhase1('done')

      // ── Phase 2: Indices Analyzer ──
      setPhase2('running')
      addLog('🔍 Iniciando Analizador de Índices...')
      const idxRes = await fetch('/api/futures/analyze', { method: 'POST' })
      if (!idxRes.ok) throw new Error('Analizador de Índices falló')
      const idxData = await idxRes.json()
      setIdxBias(idxData.activos ?? [])
      addLog(`✓ Analizador: ${idxData.activos?.length ?? 0} índices analizados`)
      setPhase2('done')

      // ── Compute confirmed signals ──
      const confirmedSignals: FuturesSignal[] = []
      for (const idx of (idxData.activos ?? []) as IndexAsset[]) {
        if (idx.simbolo === 'VIX' || idx.sesgo === 'NEUTRAL') continue
        const scanEntry = (prev: typeof scanBias) => prev[idx.simbolo]
        // Re-read scanBias from closure for each index
        const etfBias = Object.keys(ETF_MAP).find(k => ETF_MAP[k] === idx.simbolo)
        // Will be set after state settles — compute from local var
        const scanSesgo = scanDone
          ? (Object.fromEntries(Object.entries(ETF_MAP).map(([k, v]) => [v, k]))[idx.simbolo] ?? null)
          : null

        // We compute confirmed after both are done — use idx alone when scanner unavailable
        if (idx.confianza >= 65) {
          const { sl, tp, lotaje } = computeLevels(idx.sesgo, idx.precio)
          confirmedSignals.push({
            simbolo: idx.simbolo,
            nombre: INDEX_NAMES[idx.simbolo] ?? idx.nombre,
            sesgo: idx.sesgo,
            confianza: idx.confianza,
            precioEntrada: idx.precio,
            stopLoss: parseFloat(sl.toFixed(2)),
            takeProfit: parseFloat(tp.toFixed(2)),
            lotaje,
            razon: idx.razon,
            sector: 'Futuros',
            riskProfile: 'moderado',
            riesgoUsd: 10,
            rrRatio: 2.0,
          })
        }
      }

      // Cross-check with scanner if available
      if (scanDone && Object.keys(scanBias).length > 0) {
        // Update confirmed: keep only those where scanner agrees (or scanner not available for that index)
        const finalSignals = confirmedSignals.filter(sig => {
          // Use the updated scanBias captured above (not state yet, need local var)
          return true // will be reconciled below
        })
        setConfirmed(confirmedSignals)
      } else {
        setConfirmed(confirmedSignals)
      }

      if (confirmedSignals.length > 0) {
        addLog(`🎯 ${confirmedSignals.length} señal(es) generada(s)`)
      } else {
        addLog('⚠ Sin señales confirmadas. Mercado sin dirección clara.')
      }
    } catch (e) {
      addLog(`❌ Error: ${(e as Error).message}`)
      setPhase1(p => p === 'idle' ? 'error' : p)
      setPhase2(p => p === 'idle' ? 'error' : 'error')
    }
  }

  // Reconcile confirmed signals with scan bias after state updates
  useEffect(() => {
    if (phase2 !== 'done' || idxBias.length === 0) return
    const final: FuturesSignal[] = []
    for (const idx of idxBias) {
      if (idx.simbolo === 'VIX' || idx.sesgo === 'NEUTRAL') continue
      if (idx.confianza < 65) continue
      const scanEntry = scanBias[idx.simbolo]
      // If scanner ran but disagrees → skip. If scanner didn't find this index → include anyway
      if (scanEntry && scanEntry.sesgo !== 'NEUTRAL' && scanEntry.sesgo !== idx.sesgo) continue
      const { sl, tp, lotaje } = computeLevels(idx.sesgo, idx.precio)
      final.push({
        simbolo: idx.simbolo,
        nombre: INDEX_NAMES[idx.simbolo] ?? idx.nombre,
        sesgo: idx.sesgo,
        confianza: Math.max(idx.confianza, scanEntry?.conf ?? 0),
        precioEntrada: idx.precio,
        stopLoss: parseFloat(sl.toFixed(2)),
        takeProfit: parseFloat(tp.toFixed(2)),
        lotaje,
        razon: idx.razon,
        sector: 'Futuros',
        riskProfile: 'moderado',
        riesgoUsd: 10,
        rrRatio: 2.0,
      })
    }
    setConfirmed(final)
  }, [phase2, idxBias, scanBias])

  const saveSignals = async () => {
    if (confirmed.length === 0) return
    setSaving(true)
    try {
      const res = await fetch('/api/cfds/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signals: confirmed }),
      })
      if (res.ok) {
        const d = await res.json()
        setSavedCount(d.saved ?? confirmed.length)
        await loadTrackRecs()
      }
    } catch {} finally { setSaving(false) }
  }

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
        ...r,
        resultado: edit.resultado,
        pnlUsd: edit.pnlUsd ? parseFloat(edit.pnlUsd) : r.pnlUsd,
        closedPrice: edit.closedPrice ? parseFloat(edit.closedPrice) : r.closedPrice,
      } : r))
      setRowEdits(prev => { const n = { ...prev }; delete n[id]; return n })
    } catch {} finally { setUpdatingId(null) }
  }

  const fmt = (n: number, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })

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

  return (
    <div className="space-y-6">
      {/* Strategy header */}
      <div className="rounded-xl border p-5" style={{ borderColor: 'rgba(201,168,76,0.2)', background: 'linear-gradient(135deg, rgba(201,168,76,0.05) 0%, transparent 70%)' }}>
        <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: 'var(--gold)' }}>ESTRATEGIA DUAL-FILTER — MICRO FUTUROS</p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Filtro 1: Daily Scanner analiza ETFs (QQQ, SPY, IWM) · Filtro 2: Analizador de Índices (NQ, SP500, RUSSELL) ·
          Si ambos coinciden en dirección → señal CONFIRMADA con SL/TP automático.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={runAnalysis}
            disabled={phase1 === 'running' || phase2 === 'running'}
            className="px-5 py-2.5 rounded-xl text-sm font-mono tracking-widest font-bold transition-all disabled:opacity-50"
            style={{ background: 'var(--gold-dark)', color: '#000' }}
          >
            {(phase1 === 'running' || phase2 === 'running') ? '⟳ ANALIZANDO...' : '▶ INICIAR ANÁLISIS'}
          </button>
          {confirmed.length > 0 && isAdmin && (
            <button
              onClick={saveSignals}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-mono border transition-all disabled:opacity-50"
              style={{ borderColor: 'rgba(201,168,76,0.5)', color: 'var(--gold)', background: 'rgba(201,168,76,0.06)' }}
            >
              {saving ? '⏳ Guardando...' : `💾 Guardar ${confirmed.length} señal${confirmed.length !== 1 ? 'es' : ''}`}
            </button>
          )}
          {savedCount !== null && <span className="text-[10px] font-mono text-green-400 self-center">✓ {savedCount} guardadas</span>}
        </div>
      </div>

      {/* Phase steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { num: 1, label: 'DAILY SCANNER ETFs', desc: 'Analiza QQQ (NQ), SPY (SP500), IWM (Russell) con IA', phase: phase1 },
          { num: 2, label: 'ANALIZADOR DE ÍNDICES', desc: 'Sesgo técnico NQ, SP500, RUSSELL con IA especializada', phase: phase2 },
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

            {/* Phase 1 results */}
            {step.num === 1 && Object.keys(scanBias).length > 0 && (
              <div className="mt-3 pl-4 flex flex-wrap gap-2">
                {Object.entries(scanBias).map(([sym, b]) => (
                  <span key={sym} className={`text-[9px] font-mono px-2 py-0.5 rounded border ${b.sesgo === 'COMPRA' ? 'border-green-500/40 bg-green-500/10 text-green-400' : b.sesgo === 'VENTA' ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>
                    {sym} {b.sesgo} {b.conf}%
                  </span>
                ))}
              </div>
            )}

            {/* Phase 2 results */}
            {step.num === 2 && idxBias.filter(a => a.simbolo !== 'VIX').length > 0 && (
              <div className="mt-3 pl-4 flex flex-wrap gap-2">
                {idxBias.filter(a => a.simbolo !== 'VIX').map(a => (
                  <span key={a.simbolo} className={`text-[9px] font-mono px-2 py-0.5 rounded border ${a.sesgo === 'COMPRA' ? 'border-green-500/40 bg-green-500/10 text-green-400' : a.sesgo === 'VENTA' ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>
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
          <div className="px-4 py-2" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <p className="text-[9px] font-mono tracking-widest" style={{ color: 'var(--text-muted)' }}>LOG DE ANÁLISIS</p>
          </div>
          <div className="p-3 space-y-0.5 max-h-32 overflow-y-auto font-mono text-[10px]" style={{ background: '#0a0a0a', color: '#4ade80' }}>
            {log.map((l, i) => <p key={i}>{l}</p>)}
          </div>
        </div>
      )}

      {/* Confirmed signals */}
      {confirmed.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(201,168,76,0.3)' }}>
          <div className="flex items-center justify-between px-4 py-2.5" style={{ background: 'rgba(201,168,76,0.08)', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
            <span className="text-[10px] font-mono tracking-widest font-bold" style={{ color: 'var(--gold)' }}>SEÑALES CONFIRMADAS</span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-green-500/40 text-green-400">{confirmed.length} señal{confirmed.length !== 1 ? 'es' : ''}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)' }}>
                  {['Índice', 'Dirección', 'Conf', 'Entrada', 'Stop Loss', 'Take Profit', 'RR', 'Razón'].map(h => (
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
                    <td className="px-3 py-2" style={{ color: 'var(--text-secondary)' }}>{fmt(sig.precioEntrada, 0)}</td>
                    <td className="px-3 py-2 text-red-400">{fmt(sig.stopLoss, 0)}</td>
                    <td className="px-3 py-2 text-green-400">{fmt(sig.takeProfit, 0)}</td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-muted)' }}>1:2</td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-muted)', maxWidth: 180 }}>
                      <span title={sig.razon}>{sig.razon}</span>
                    </td>
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
            <p className="text-[10px] font-mono tracking-widest font-bold" style={{ color: 'var(--gold)' }}>TRACK RECORD — FUTUROS</p>
            {trackRecs.length > 0 && (
              <div className="flex items-center gap-3 text-[9px] font-mono">
                <span style={{ color: 'var(--text-muted)' }}>{trackRecs.length} ops</span>
                {winRate !== null && <span className={winRate >= 50 ? 'text-green-400' : 'text-red-400'}>{winRate}% WR</span>}
                <span className={totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}>{totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(0)} USD</span>
              </div>
            )}
          </div>
          <button onClick={loadTrackRecs} className="label-mono text-[9px] px-2 py-1 rounded-lg border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            Actualizar
          </button>
        </div>

        {trackRecs.length === 0 ? (
          <div className="rounded-xl border p-6 text-center text-[10px] font-mono" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            Sin señales guardadas. Corre un análisis y guarda las señales confirmadas.
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] font-mono">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)' }}>
                    {['Fecha', 'Índice', 'Dir', 'Entrada', 'SL', 'TP', 'Conf', 'Resultado', 'P&L USD', ...(isAdmin ? ['Acc.'] : [])].map(h => (
                      <th key={h} className="px-3 py-2 text-left whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trackRecs.map(rec => {
                    const isClosed = rec.resultado !== 'PENDIENTE'
                    const edit = rowEdits[rec.id]
                    const isDirty = !!edit
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
                        <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{fmt(rec.precioEntrada, 0)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-red-400">{fmt(rec.stopLoss, 0)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-green-400">{fmt(rec.takeProfit, 0)}</td>
                        <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{rec.confianza}%</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {isAdmin ? (
                            <select
                              value={edit?.resultado ?? rec.resultado}
                              onChange={e => setRowEdits(prev => ({ ...prev, [rec.id]: { resultado: e.target.value, pnlUsd: String(edit?.pnlUsd ?? rec.pnlUsd ?? ''), closedPrice: String(edit?.closedPrice ?? rec.closedPrice ?? '') } }))}
                              className="text-[9px] font-mono bg-transparent border border-[var(--border)] rounded px-1 py-0.5"
                              style={{ color: rec.resultado === 'GANADA' ? '#4ade80' : rec.resultado === 'PERDIDA' ? '#f87171' : rec.resultado === 'BREAKEVEN' ? '#facc15' : 'var(--text-muted)' }}
                            >
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
                            <input
                              type="number" step="0.01" placeholder="0.00"
                              value={edit?.pnlUsd ?? (rec.pnlUsd != null ? String(rec.pnlUsd) : '')}
                              onChange={e => setRowEdits(prev => ({ ...prev, [rec.id]: { resultado: edit?.resultado ?? rec.resultado, pnlUsd: e.target.value, closedPrice: String(edit?.closedPrice ?? rec.closedPrice ?? '') } }))}
                              className="text-[9px] font-mono bg-transparent border border-[var(--border)] rounded px-1 py-0.5 w-16"
                              style={{ color: 'var(--text-secondary)' }}
                            />
                          ) : (
                            <span className={rec.pnlUsd != null ? (rec.pnlUsd >= 0 ? 'text-green-400' : 'text-red-400') : ''} style={rec.pnlUsd == null ? { color: 'var(--text-muted)' } : {}}>
                              {rec.pnlUsd != null ? `${rec.pnlUsd >= 0 ? '+' : ''}$${fmt(rec.pnlUsd)}` : '—'}
                            </span>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="px-3 py-2 whitespace-nowrap">
                            {isDirty && (
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
