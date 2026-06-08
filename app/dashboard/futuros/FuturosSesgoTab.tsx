'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { computeFuturesLevels } from '@/lib/futures-specs'

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
  razon: string
  createdAt: string
  openEntryAt: string | null
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INDEX_NAMES: Record<string, string> = {
  NQ:      'Micro Nasdaq (MNQ)',
  SP500:   'Micro S&P 500 (MES)',
  RUSSELL: 'Micro Russell (M2K)',
  DOW:     'Dow Jones',
}

function getETMinutes(): { mins: number; day: number } {
  const now = new Date()
  const etDateStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
  }).format(now)
  const etParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric', minute: 'numeric', hour12: false,
  }).formatToParts(now)
  const hour   = parseInt(etParts.find(p => p.type === 'hour')?.value   ?? '0', 10)
  const minute = parseInt(etParts.find(p => p.type === 'minute')?.value ?? '0', 10)
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const day = dayNames.indexOf(etDateStr)
  return { mins: hour * 60 + minute, day }
}

function marketCloseCountdown(): string {
  const { mins, day } = getETMinutes()
  if (day === 0 || day === 6) return 'Fin de semana'
  const eodMins = 15 * 60 + 45
  if (mins >= eodMins) return 'Cierre EOD pasado'
  const diff = eodMins - mins
  return `${Math.floor(diff / 60)}h ${diff % 60}m al cierre EOD`
}

function vixInterpretation(vixPrice: number): { label: string; color: string; description: string } {
  if (vixPrice > 25) return { label: 'MIEDO ELEVADO', color: '#f87171', description: 'Posible oportunidad contraria — mercado sobrevendido' }
  if (vixPrice < 13) return { label: 'COMPLACENCIA', color: '#facc15', description: 'Riesgo de corrección — mercado excesivamente optimista' }
  return { label: 'NORMAL', color: '#4ade80', description: 'Volatilidad en rango estable — condiciones operables' }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FuturosSesgoTab({ isAdmin }: { isAdmin: boolean }) {
  const [video, setVideo]           = useState<{ youtubeUrl: string; title: string | null }>({ youtubeUrl: '', title: null })
  const [editMode, setEditMode]     = useState(false)
  const [editUrl, setEditUrl]       = useState('')
  const [editTitle, setEditTitle]   = useState('')
  const [saving, setSaving]         = useState(false)
  const [phase, setPhase]           = useState<'idle'|'running'|'done'|'error'>('idle')
  const [idxBias, setIdxBias]       = useState<IndexAsset[]>([])
  const [metodologia, setMetodologia] = useState<string>('')
  const [confirmed, setConfirmed]   = useState<FuturesSignal[]>([])
  const [trackRecs, setTrackRecs]   = useState<TrackRec[]>([])
  const [log, setLog]               = useState<string[]>([])
  const [countdown, setCountdown]   = useState(marketCloseCountdown())

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    return match?.[1] || ''
  }

  const loadVideo = useCallback(async () => {
    try {
      const res = await fetch('/api/section-video?section=futuros')
      if (res.ok) {
        const data = await res.json()
        if (data.youtubeUrl) setVideo(data)
      }
    } catch {}
  }, [])

  useEffect(() => { loadVideo() }, [loadVideo])

  const saveVideo = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/section-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'futuros', youtubeUrl: editUrl, title: editTitle }),
      })
      if (res.ok) {
        setVideo({ youtubeUrl: editUrl, title: editTitle })
        setEditMode(false)
      }
    } catch {} finally { setSaving(false) }
  }

  const addLog = (msg: string) => setLog(prev => [...prev, msg])

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

  // Auto-refresh cada 5 min para capturar nuevas señales del cron de 8:15am
  useEffect(() => {
    const id = setInterval(() => loadTrackRecs(), 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [loadTrackRecs])

  // Reconcile — solo muestra resultados, NO guarda a DB (el cron de 8:15am guarda)
  useEffect(() => {
    if (phase !== 'done' || idxBias.length === 0) return
    const final: FuturesSignal[] = []

    for (const idx of idxBias) {
      if (idx.simbolo === 'VIX' || idx.simbolo === 'DOW') continue
      if (idx.sesgo === 'NEUTRAL' || idx.confianza < 65) continue
      const levels = computeFuturesLevels(idx.sesgo, idx.precio, idx.simbolo)
      final.push({
        simbolo: idx.simbolo,
        nombre: INDEX_NAMES[idx.simbolo] ?? idx.nombre,
        sesgo: idx.sesgo,
        confianza: idx.confianza,
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

    setConfirmed(final)
  }, [phase, idxBias])

  // ── Main analysis runner ───────────────────────────────────────────────────

  const runAnalysis = async () => {
    setPhase('running')
    setIdxBias([]); setConfirmed([]); setLog([]); setMetodologia('')

    try {
      addLog('🔍 Iniciando análisis MAIA de índices...')
      const res = await fetch('/api/futures/analyze', { method: 'POST' })
      if (!res.ok) throw new Error('Análisis de índices falló')
      const data = await res.json()
      const activos: IndexAsset[] = data.activos ?? []
      setIdxBias(activos)
      setMetodologia(data.metodologia ?? '')
      addLog(`✓ Análisis completado: ${activos.filter(a => a.simbolo !== 'VIX').length} índices analizados`)
      const actionable = activos.filter(a => a.simbolo !== 'VIX' && a.simbolo !== 'DOW' && a.sesgo !== 'NEUTRAL' && a.confianza >= 65)
      if (actionable.length > 0) {
        addLog(`→ ${actionable.length} señal(es) con confianza ≥ 65%: ${actionable.map(a => `${a.simbolo} ${a.sesgo}`).join(', ')}`)
      } else {
        addLog('→ Sin señales accionables (confianza insuficiente o sesgo NEUTRAL)')
      }
      setPhase('done')
    } catch (e) {
      addLog(`❌ Error: ${(e as Error).message}`)
      setPhase('error')
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  const fmt = (n: number, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })

  const phaseBadge = (p: 'idle'|'running'|'done'|'error') => {
    if (p === 'idle')    return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[var(--border)]" style={{ color: 'var(--text-muted)' }}>EN ESPERA</span>
    if (p === 'running') return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-yellow-500/40 bg-yellow-500/10 text-yellow-400 animate-pulse">● EJECUTANDO</span>
    if (p === 'done')    return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-green-500/40 bg-green-500/10 text-green-400">✓ COMPLETADO</span>
    return                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-red-500/40 bg-red-500/10 text-red-400">✗ ERROR</span>
  }

  const isRunning = phase === 'running'

  const vixAsset = idxBias.find(a => a.simbolo === 'VIX')
  const vixInfo  = vixAsset ? vixInterpretation(vixAsset.precio) : null

  return (
    <div className="space-y-5">
      {/* Strategy info header */}
      <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(201,168,76,0.2)', background: 'linear-gradient(135deg, rgba(201,168,76,0.05) 0%, transparent 70%)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div>
            <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: 'var(--gold)' }}>MAIA ÍNDICES — MICRO FUTUROS INTRADÍA</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Agente especializado de análisis de índices (sistema MAIA). Evalúa NQ, S&P 500, Russell 2000, Dow Jones y VIX con datos en tiempo real para determinar el sesgo diario.
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
        </div>
      </div>

      {/* Phase step */}
      <div className="rounded-xl border p-4" style={{
        borderColor: phase === 'running' ? 'rgba(251,191,36,0.4)' : phase === 'done' ? 'rgba(74,222,128,0.25)' : 'var(--border)',
        background: phase === 'running' ? 'rgba(251,191,36,0.04)' : 'transparent',
      }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--gold)' }}>1</span>
            <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--text-primary)' }}>ANALIZADOR MAIA — ÍNDICES</span>
          </div>
          {phaseBadge(phase)}
        </div>
        <p className="text-[10px] pl-4" style={{ color: 'var(--text-muted)' }}>NQ · S&P 500 · Russell 2000 · Dow Jones · VIX — datos en tiempo real</p>
        {idxBias.filter(a => a.simbolo !== 'VIX').length > 0 && (
          <div className="mt-2 pl-4 flex flex-wrap gap-1.5">
            {idxBias.map(a => (
              <span key={a.simbolo} className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${a.sesgo === 'COMPRA' ? 'border-green-500/40 bg-green-500/10 text-green-400' : a.sesgo === 'VENTA' ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>
                {a.simbolo} {a.sesgo} {a.confianza}%
              </span>
            ))}
          </div>
        )}
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

      {/* Informativo de análisis */}
      {phase === 'done' && idxBias.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.3)' }}>
          <div className="px-4 py-2" style={{ background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid rgba(139,92,246,0.2)' }}>
            <span className="text-[10px] font-mono tracking-widest font-bold" style={{ color: '#a78bfa' }}>CÓMO SE DETERMINÓ EL SESGO</span>
          </div>
          <div className="p-4 space-y-4">
            {/* Metodología */}
            {metodologia && (
              <div>
                <p className="text-[9px] font-mono tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>METODOLOGÍA</p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{metodologia}</p>
              </div>
            )}

            {/* VIX */}
            {vixAsset && vixInfo && (
              <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${vixInfo.color}30` }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-mono tracking-widest" style={{ color: 'var(--text-muted)' }}>NIVEL VIX</p>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ color: vixInfo.color, background: `${vixInfo.color}15`, border: `1px solid ${vixInfo.color}30` }}>
                    {vixInfo.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-mono font-bold" style={{ color: vixInfo.color }}>{vixAsset.precio.toFixed(2)}</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{vixInfo.description}</span>
                </div>
              </div>
            )}

            {/* Razonamiento por índice */}
            <div>
              <p className="text-[9px] font-mono tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>RAZONAMIENTO POR ÍNDICE</p>
              <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <table className="w-full text-[10px] font-mono">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)' }}>
                      {['Índice', 'Precio', 'Sesgo', 'Conf.', 'Razonamiento IA'].map(h => (
                        <th key={h} className="px-3 py-2 text-left whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {idxBias.map(a => (
                      <tr key={a.simbolo} className="border-b border-[var(--border)]">
                        <td className="px-3 py-2 font-bold whitespace-nowrap" style={{ color: 'var(--gold)' }}>{a.simbolo}</td>
                        <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{fmt(a.precio, a.precio < 100 ? 2 : 0)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${a.sesgo === 'COMPRA' ? 'bg-green-500/15 text-green-400 border border-green-500/30' : a.sesgo === 'VENTA' ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'border border-[var(--border)] text-[var(--text-muted)]'}`}>
                            {a.sesgo}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap" style={{ color: a.confianza >= 75 ? 'var(--gold)' : 'var(--text-secondary)' }}>{a.confianza}%</td>
                        <td className="px-3 py-2" style={{ color: 'var(--text-secondary)' }}>{a.razon}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[9px] mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Señales accionables: índices con confianza ≥ 65% y sesgo COMPRA/VENTA (excluye VIX y DOW). SL/TP calculado según specs de contratos micro (MNQ $2/pt, MES $5/pt, M2K $5/pt).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmed signals */}
      {confirmed.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(201,168,76,0.3)' }}>
          <div className="flex items-center justify-between px-4 py-2" style={{ background: 'rgba(201,168,76,0.08)', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
            <span className="text-[10px] font-mono tracking-widest font-bold" style={{ color: 'var(--gold)' }}>SEÑALES DEL ANÁLISIS</span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-[var(--border)]" style={{ color: 'var(--text-muted)' }}>Vista del momento</span>
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

      {/* Video del profesional */}
      <div className="rounded-xl border p-5" style={{ borderColor: 'rgba(201,168,76,0.18)', background: 'linear-gradient(135deg, rgba(201,168,76,0.04) 0%, transparent 70%)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-mono tracking-widest" style={{ color: 'var(--gold)' }}>VIDEO DEL PROFESIONAL</p>
          {isAdmin && (
            <button
              onClick={() => { setEditMode(!editMode); if (!editMode) { setEditUrl(video.youtubeUrl); setEditTitle(video.title || '') } }}
              className="text-[10px] font-mono tracking-widest px-3 py-1 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--gold)]"
            >
              {editMode ? 'CANCELAR' : 'EDITAR'}
            </button>
          )}
        </div>

        {editMode && (
          <div className="space-y-3 mb-4">
            <input
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              placeholder="URL de YouTube"
              className="w-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] text-xs px-4 py-2 rounded-lg focus:outline-none focus:border-[var(--gold-dark)] font-mono"
            />
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Título del video (opcional)"
              className="w-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] text-xs px-4 py-2 rounded-lg focus:outline-none focus:border-[var(--gold-dark)] font-mono"
            />
            <button
              onClick={saveVideo}
              disabled={!editUrl || saving}
              className="px-4 py-2 text-xs font-mono tracking-widest rounded-lg bg-[var(--gold)] text-black disabled:opacity-50"
            >
              {saving ? 'GUARDANDO…' : 'GUARDAR'}
            </button>
          </div>
        )}

        {video.youtubeUrl ? (
          <div className="aspect-video rounded-lg overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeId(video.youtubeUrl)}`}
              title={video.title || 'Video de Futuros'}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed rounded-lg" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs text-[var(--text-muted)]">El administrador aún no ha publicado un video para esta sección.</p>
          </div>
        )}
      </div>

      {/* Track Record */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-mono tracking-widest font-bold" style={{ color: 'var(--gold)' }}>TRACK RECORD — FUTUROS INTRADÍA</p>
            {trackRecs.length > 0 && (
              <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>{trackRecs.length} ops</span>
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
                    {['Fecha', 'Índice', 'Dir', 'Conf.', 'Razón'].map(h => (
                      <th key={h} className="px-3 py-2 text-left whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trackRecs.map(rec => (
                    <tr key={rec.id} className="border-b border-[var(--border)]"
                      style={{
                        borderLeft: `3px solid ${rec.sesgo === 'COMPRA' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                      }}>
                      <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {new Date(rec.openEntryAt ?? rec.createdAt).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/New_York' })}
                      </td>
                      <td className="px-3 py-2 font-bold whitespace-nowrap" style={{ color: 'var(--gold)' }}>{rec.simbolo}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${rec.sesgo === 'COMPRA' ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
                          {rec.sesgo}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap" style={{ color: rec.confianza >= 75 ? 'var(--gold)' : 'var(--text-secondary)' }}>
                        {rec.confianza}%
                      </td>
                      <td className="px-3 py-2" style={{ color: 'var(--text-muted)' }}>{rec.razon}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
