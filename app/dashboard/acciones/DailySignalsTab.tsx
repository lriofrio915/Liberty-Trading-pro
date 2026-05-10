'use client'

import { useEffect, useRef, useState } from 'react'

type ServerStatus = 'checking' | 'online' | 'offline'
type TelegramStatus = 'unchecked' | 'testing' | 'ok' | 'error'

type Signal = {
  id?: string | number
  stock_code?: string
  stock_name?: string
  symbol?: string
  name?: string
  // daily_stock_analysis native fields
  operation_advice?: string   // 买入/卖出/持有/增持/减持
  sentiment_score?: number    // 0-100
  // generic fallbacks
  signal?: string
  recommendation?: string
  score?: number
  summary?: string
  analysis?: string
  analysis_detail?: string
  timestamp?: string
  date?: string
  created_at?: string
}

type TaskStatus = {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number | null
}

const LS_BOT_TOKEN = 'ds_telegram_bot_token'
const LS_CHAT_ID   = 'ds_telegram_chat_id'
const LS_STOCKS    = 'ds_stock_list'

const DEFAULT_STOCKS = 'AAPL,NVDA,TSLA,MSFT,AMZN'

function signalBadge(sig?: string): { label: string; color: string } {
  const up = (sig ?? '').toUpperCase()
  // Chinese signals: 买入=buy, 卖出=sell, 持有=hold, 增持=accumulate, 减持=reduce
  if (up.includes('买入') || up.includes('BUY') || up.includes('COMPRAR') || up.includes('ALCISTA') || up.includes('BULLISH') || up.includes('STRONG_BUY') || up.includes('OVERWEIGHT'))
    return { label: 'COMPRAR', color: 'bg-green-500/20 border-green-500/40 text-green-400' }
  if (up.includes('卖出') || up.includes('SELL') || up.includes('VENDER') || up.includes('BAJISTA') || up.includes('BEARISH') || up.includes('STRONG_SELL'))
    return { label: 'VENDER', color: 'bg-red-500/20 border-red-500/40 text-red-400' }
  if (up.includes('减持') || up.includes('UNDERWEIGHT') || up.includes('REDUCE'))
    return { label: 'REDUCIR', color: 'bg-orange-500/20 border-orange-500/40 text-orange-400' }
  if (up.includes('增持') || up.includes('ACCUMULATE'))
    return { label: 'ACUMULAR', color: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' }
  return { label: 'MANTENER', color: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' }
}

function lsGet(key: string, def = ''): string {
  try { return localStorage.getItem(key) ?? def } catch { return def }
}
function lsSet(key: string, val: string) {
  try { localStorage.setItem(key, val) } catch {}
}

export default function DailySignalsTab({ isAdmin, defaultTickers }: { isAdmin: boolean; defaultTickers?: string }) {
  const [serverStatus, setServerStatus] = useState<ServerStatus>('checking')
  const [showConfig, setShowConfig]     = useState(false)
  const [previewMode, setPreviewMode]   = useState(false)

  const [botToken, setBotToken]   = useState(() => lsGet(LS_BOT_TOKEN))
  const [chatId, setChatId]       = useState(() => lsGet(LS_CHAT_ID))
  const [stockList, setStockList] = useState(() => lsGet(LS_STOCKS) || defaultTickers || DEFAULT_STOCKS)
  const [tgStatus, setTgStatus]   = useState<TelegramStatus>('unchecked')
  const [tgError, setTgError]     = useState<string | null>(null)

  const [analyzing, setAnalyzing]   = useState(false)
  const [elapsed, setElapsed]       = useState(0)
  const [signals, setSignals]       = useState<Signal[]>([])
  const [runError, setRunError]     = useState<string | null>(null)
  const [taskProgress, setTaskProgress] = useState<number | null>(null)
  const [scanEmpty, setScanEmpty]   = useState(false)

  const [sendingTg, setSendingTg] = useState(false)

  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const botTokRef  = useRef(lsGet(LS_BOT_TOKEN))
  const chatIdRef  = useRef(lsGet(LS_CHAT_ID))

  useEffect(() => { botTokRef.current = botToken }, [botToken])
  useEffect(() => { chatIdRef.current = chatId }, [chatId])

  useEffect(() => {
    checkStatus()
    fetchResults()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (pollRef.current) clearInterval(pollRef.current)
  }, [])

  useEffect(() => {
    if (defaultTickers && !lsGet(LS_STOCKS)) {
      setStockList(defaultTickers)
    }
  }, [defaultTickers])

  async function checkStatus() {
    setServerStatus('checking')
    try {
      const r = await fetch('/api/daily-signals/status')
      const d = await r.json() as { online: boolean }
      setServerStatus(d.online ? 'online' : 'offline')
    } catch {
      setServerStatus('offline')
    }
  }

  async function fetchResults(): Promise<Signal[]> {
    try {
      const r = await fetch('/api/daily-signals/results')
      if (!r.ok) return []
      const d = await r.json()
      console.debug('[DailyScanner] history raw:', d)
      const list: Signal[] = Array.isArray(d) ? d
        : Array.isArray(d?.items) ? d.items
        : Array.isArray(d?.results) ? d.results
        : Array.isArray(d?.data) ? d.data : []
      setSignals(list)
      return list
    } catch (e) {
      console.debug('[DailyScanner] fetchResults error:', e)
      return []
    }
  }

  async function sendTelegramSpanish(list: Signal[]) {
    const tok = botTokRef.current
    const cid = chatIdRef.current
    if (!tok || !cid || list.length === 0) return
    setSendingTg(true)
    try {
      await fetch('/api/daily-signals/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signals: list, bot_token: tok, chat_id: cid }),
      })
    } catch { /* silent — Telegram send is best-effort */ }
    finally { setSendingTg(false) }
  }

  async function testTelegram() {
    lsSet(LS_BOT_TOKEN, botToken)
    lsSet(LS_CHAT_ID, chatId)
    setTgStatus('testing')
    setTgError(null)
    try {
      const r = await fetch('/api/daily-signals/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_token: botToken, chat_id: chatId }),
      })
      const d = await r.json() as { ok: boolean; error?: string }
      setTgStatus(d.ok ? 'ok' : 'error')
      if (!d.ok) setTgError(d.error ?? 'Error desconocido')
    } catch (err) {
      setTgStatus('error')
      setTgError(err instanceof Error ? err.message : 'Error de red')
    }
  }

  function saveConfig() {
    lsSet(LS_BOT_TOKEN, botToken)
    lsSet(LS_CHAT_ID, chatId)
    lsSet(LS_STOCKS, stockList)
    setShowConfig(false)
  }

  async function runAnalysis() {
    setAnalyzing(true)
    setRunError(null)
    setElapsed(0)
    setTaskProgress(null)
    setScanEmpty(false)
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)

    try {
      const r = await fetch('/api/daily-signals/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stocks: stockList.split(/[\s,]+/).filter(Boolean) }),
      })
      const d = await r.json()
      if (!r.ok) {
        setRunError(d.error ?? `Error ${r.status}`)
        stopTimer()
        setAnalyzing(false)
        return
      }

      // Response: { accepted: [{task_id, stock_code, status}], ... }
      // OR legacy: { task_id: "..." }
      type AcceptedTask = { task_id: string; stock_code?: string }
      const taskIds: string[] = d?.accepted
        ? (d.accepted as AcceptedTask[]).map(t => t.task_id).filter(Boolean)
        : d?.task_id ? [d.task_id as string] : []

      console.debug('[DailyScanner] accepted tasks:', taskIds)

      if (taskIds.length > 0) {
        let attempts = 0
        pollRef.current = setInterval(async () => {
          if (++attempts > 60) {
            clearInterval(pollRef.current!)
            stopTimer()
            setAnalyzing(false)
            setRunError('El escaneo tardó demasiado (>15 min). Intenta de nuevo.')
            return
          }
          try {
            const results = await Promise.all(
              taskIds.map(id =>
                fetch(`/api/daily-signals/tasks?task_id=${id}`)
                  .then(r => r.json() as Promise<TaskStatus>)
                  .catch(() => ({ task_id: id, status: 'pending', progress: null } as TaskStatus))
              )
            )
            console.debug('[DailyScanner] poll results:', results)

            const doneCount = results.filter(t => t.status === 'completed' || t.status === 'failed').length
            const avgProgress = Math.round(
              results.reduce((s, t) => s + (t.progress ?? 0), 0) / results.length
            )
            setTaskProgress(avgProgress > 0 ? avgProgress : null)

            if (doneCount === taskIds.length) {
              clearInterval(pollRef.current!)
              stopTimer()
              setAnalyzing(false)
              setTaskProgress(null)
              const allFailed = results.every(t => t.status === 'failed')
              if (allFailed) {
                setRunError('Todos los análisis fallaron. Revisa los logs del servidor.')
              } else {
                const list = await fetchResults()
                if (list.length === 0) {
                  setScanEmpty(true)
                } else {
                  sendTelegramSpanish(list)
                }
              }
            }
          } catch (e) {
            console.debug('[DailyScanner] poll error:', e)
          }
        }, 15_000)
      } else {
        // No tasks queued (e.g. all duplicates)
        const msg = typeof d?.message === 'string' ? d.message : ''
        stopTimer()
        setAnalyzing(false)
        if (msg) setRunError(`Servidor: ${msg}`)
        else setScanEmpty(true)
      }
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Error desconocido')
      stopTimer()
      setAnalyzing(false)
    }
  }

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const elapsedStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  const telegramReady = botToken && chatId

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Header */}
      <div className="rounded-xl border p-5" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.06) 0%, transparent 70%)', borderColor: 'rgba(201,168,76,0.2)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: 'var(--gold)' }}>
              DAILY SCANNER — ESCANEO DE PORTAFOLIO CON IA
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Analiza múltiples acciones simultáneamente con IA. Genera señales BUY/SELL/HOLD
              para tu portafolio y las envía automáticamente a Telegram.
            </p>
          </div>

          {/* Server status badge + admin preview toggle */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono
              ${serverStatus === 'online'   ? 'border-green-500/40 text-green-400 bg-green-500/10' : ''}
              ${serverStatus === 'offline'  ? 'border-red-500/40 text-red-400 bg-red-500/10' : ''}
              ${serverStatus === 'checking' ? 'border-[var(--border)] text-[var(--text-muted)]' : ''}
            `}>
              <span className={`w-1.5 h-1.5 rounded-full ${serverStatus === 'online' ? 'bg-green-400 animate-pulse' : serverStatus === 'offline' ? 'bg-red-400' : 'bg-[var(--text-muted)] animate-pulse'}`} />
              {serverStatus === 'online' ? 'ONLINE' : serverStatus === 'offline' ? 'OFFLINE' : '…'}
            </div>
            <button onClick={checkStatus} className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
              {serverStatus === 'checking' ? 'verificando…' : 'verificar'}
            </button>
            {isAdmin && (
              <button
                onClick={() => setPreviewMode(v => !v)}
                className={`text-[9px] font-mono tracking-widest px-2.5 py-1 rounded-full border transition-colors ${
                  previewMode
                    ? 'border-[var(--gold)] text-[var(--gold)] bg-[var(--gold)]/10'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--gold-dark)]'
                }`}
                title="Ver como usuario normal"
              >
                {previewMode ? '◉ SALIR VISTA USUARIO' : '◎ VISTA USUARIO'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Offline notice */}
      {serverStatus === 'offline' && (
        isAdmin && !previewMode ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
            <p className="text-xs font-bold font-mono" style={{ color: 'var(--gold)' }}>SERVIDOR NO DISPONIBLE — SETUP REQUERIDO</p>
            <div className="space-y-2 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              <p>El servidor Daily Scanner no está corriendo. Para activarlo en Fly.io:</p>
              <pre className="text-[10px] rounded-lg p-3 overflow-x-auto" style={{ background: '#0d0d0d', color: '#4ade80' }}>{`cd ~/Desktop/Desarrollo\\ de\\ Software/daily-signals-runtime
flyctl apps create daily-signals-liberty
flyctl deploy
flyctl secrets set \\
  STOCK_LIST="AAPL,NVDA,TSLA" \\
  OPENAI_BASE_URL="https://openrouter.ai/api/v1" \\
  OPENAI_API_KEY="sk-or-..." \\
  OPENAI_MODEL="deepseek/deepseek-chat-v3-0324" \\
  TELEGRAM_BOT_TOKEN="..." \\
  TELEGRAM_CHAT_ID="..."`}</pre>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Agrega <code className="px-1 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>DAILY_SIGNALS_BASE_URL=https://daily-signals-liberty.fly.dev</code> a tu <code>.env.local</code>
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-xs font-mono text-amber-400">Servidor en mantenimiento. Intenta de nuevo más tarde.</p>
          </div>
        )
      )}

      {/* Config panel — admin only, hidden in preview mode */}
      {isAdmin && !previewMode && (
        <div className="card">
          <button
            onClick={() => setShowConfig(v => !v)}
            className="w-full flex items-center justify-between"
          >
            <p className="text-[10px] font-mono tracking-widest" style={{ color: 'var(--gold)' }}>CONFIGURACIÓN</p>
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{showConfig ? '▲ CERRAR' : '▼ EXPANDIR'}</span>
          </button>

          {showConfig && (
            <div className="mt-4 space-y-4">
              {/* Stock list */}
              <div>
                <label className="text-[10px] font-mono tracking-widest block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  ACCIONES A MONITOREAR <span className="opacity-50">(separadas por coma)</span>
                </label>
                <input
                  value={stockList}
                  onChange={e => setStockList(e.target.value.toUpperCase())}
                  placeholder="AAPL,NVDA,TSLA,MSFT,AMZN"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--gold)] font-mono text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--gold-dark)]"
                />
                <p className="text-[9px] mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
                  Para cambiar la lista permanente en Fly.io: <code>flyctl secrets set STOCK_LIST="..."</code>
                </p>
              </div>

              {/* Telegram */}
              <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: 'rgba(201,168,76,0.2)', background: 'rgba(201,168,76,0.03)' }}>
                <p className="text-[10px] font-mono tracking-widest" style={{ color: 'var(--gold)' }}>TELEGRAM</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-mono tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>BOT TOKEN</label>
                    <input
                      type="password"
                      value={botToken}
                      onChange={e => setBotToken(e.target.value)}
                      placeholder="1234567890:ABC..."
                      className="w-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] font-mono text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--gold-dark)]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>CHAT ID</label>
                    <input
                      type="text"
                      value={chatId}
                      onChange={e => setChatId(e.target.value)}
                      placeholder="-100123456789 o @channel"
                      className="w-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] font-mono text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--gold-dark)]"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    disabled={!botToken || !chatId || tgStatus === 'testing'}
                    onClick={testTelegram}
                    className="px-4 py-1.5 text-[10px] font-mono tracking-widest rounded-lg border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-40 hover:border-[var(--gold-dark)]"
                  >
                    {tgStatus === 'testing' ? 'ENVIANDO…' : 'PROBAR CONEXIÓN'}
                  </button>
                  {tgStatus === 'ok'    && <span className="text-[10px] font-mono text-green-400">✓ Mensaje enviado correctamente</span>}
                  {tgStatus === 'error' && <span className="text-[10px] font-mono text-red-400">✗ {tgError}</span>}
                </div>
                <p className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  Crea tu bot con <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="underline">@BotFather</a> en Telegram. El Chat ID puedes obtenerlo con <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="underline">@userinfobot</a>.
                </p>
              </div>

              <button
                onClick={saveConfig}
                className="px-5 py-2 text-xs font-mono tracking-widest rounded-xl bg-[var(--gold)] text-black font-bold hover:opacity-90"
              >
                GUARDAR CONFIGURACIÓN
              </button>
            </div>
          )}

          {/* Config summary when collapsed */}
          {!showConfig && (
            <div className="mt-3 flex items-center gap-4 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
              <span>Stocks: <span style={{ color: 'var(--text-secondary)' }}>{stockList}</span></span>
              <span className={telegramReady ? 'text-green-400' : ''}>
                {telegramReady ? '📬 Telegram configurado' : '⚠ Telegram no configurado'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Run control */}
      <div className="card space-y-4">
        <p className="text-[10px] font-mono tracking-widest" style={{ color: 'var(--gold)' }}>EJECUTAR ESCANEO</p>

        {!analyzing ? (
          <div className="space-y-3">
            <button
              disabled={serverStatus !== 'online'}
              onClick={runAnalysis}
              className="w-full py-3 text-sm font-mono tracking-widest rounded-xl bg-[var(--gold)] text-black font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              EJECUTAR ESCANEO →
            </button>
            {serverStatus !== 'online' && (
              <p className="text-[10px] font-mono text-center" style={{ color: 'var(--text-muted)' }}>
                El servidor debe estar ONLINE para ejecutar el análisis
              </p>
            )}
            {!telegramReady && (
              <p className="text-[10px] font-mono text-center" style={{ color: 'var(--text-muted)' }}>
                Configura Telegram para recibir las señales en tu canal
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <svg className="animate-spin h-5 w-5 flex-shrink-0" style={{ color: 'var(--gold)' }} viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {taskProgress != null && taskProgress > 0 ? `Procesando… ${taskProgress}%` : 'En cola — analizando acciones…'}
                </p>
                <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{elapsedStr} transcurrido</p>
              </div>
            </div>
            <div
              className="rounded-lg border p-3 font-mono text-xs"
              style={{ background: '#0d0d0d', borderColor: 'var(--border)', color: '#4ade80' }}
            >
              <span className="animate-pulse">Analizando {lsGet(LS_STOCKS, DEFAULT_STOCKS).split(',').length} acciones con IA…</span>
              {telegramReady && <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Las señales se enviarán a Telegram al completar.</p>}
            </div>
          </div>
        )}

        {runError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-xs text-red-400 font-mono">⚠ {runError}</p>
          </div>
        )}
      </div>

      {/* Signals grid */}
      {signals.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono tracking-widest" style={{ color: 'var(--gold)' }}>
              SEÑALES — {signals.length} ACCIONES
            </p>
            <button
              onClick={fetchResults}
              className="text-[9px] font-mono"
              style={{ color: 'var(--text-muted)' }}
            >
              ACTUALIZAR
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {signals.map((s, i) => {
              const symbol = s.stock_code ?? s.symbol ?? '—'
              const name   = s.stock_name ?? s.name
              const sig    = s.operation_advice ?? s.recommendation ?? s.signal ?? ''
              const { label, color } = signalBadge(sig)
              const scoreVal = s.sentiment_score ?? s.score
              const summary = s.summary ?? s.analysis ?? s.analysis_detail ?? ''
              const ts = s.date ?? s.created_at ?? s.timestamp ?? ''
              return (
                <div
                  key={s.id ?? symbol ?? i}
                  className="rounded-xl border p-4 space-y-2"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                  {/* Signal badge + ticker */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-base font-black font-mono" style={{ color: 'var(--text-primary)' }}>
                        {symbol}
                      </p>
                      {name && <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{name}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${color}`}>
                        {label}
                      </span>
                      {sig && <span className="text-[9px] font-mono opacity-50" style={{ color: 'var(--text-muted)' }}>{sig}</span>}
                    </div>
                  </div>

                  {/* Score */}
                  {scoreVal != null && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${Math.min(scoreVal, 100)}%`,
                            background: scoreVal >= 70 ? '#4ade80' : scoreVal >= 40 ? '#facc15' : '#f87171',
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-mono flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                        {scoreVal}/100
                      </span>
                    </div>
                  )}

                  {/* Summary */}
                  {summary && (
                    <p className="text-[11px] leading-relaxed line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
                      {summary}
                    </p>
                  )}

                  {/* Timestamp */}
                  {ts && (
                    <p className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
                      {ts}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {signals.length === 0 && !analyzing && serverStatus === 'online' && !scanEmpty && (
        <div className="text-center py-12 border border-dashed rounded-xl" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>Sin señales — ejecuta el primer escaneo</p>
        </div>
      )}

      {/* Scan completed but no results */}
      {scanEmpty && !analyzing && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-2">
          <p className="text-xs font-bold font-mono" style={{ color: 'var(--gold)' }}>ESCANEO COMPLETÓ SIN SEÑALES</p>
          <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            La tarea terminó pero el historial está vacío. Posibles causas:
          </p>
          <ul className="text-[11px] font-mono list-disc list-inside space-y-0.5" style={{ color: 'var(--text-muted)' }}>
            <li>LLM no configurado — verifica OPENAI_API_KEY en Fly.io secrets</li>
            <li>Fuente de datos de mercado no disponible para tickers US</li>
            <li>El servidor necesita más tiempo — prueba con 1 sola acción primero</li>
          </ul>
          <a
            href="https://fly.io/apps/daily-signals-liberty/monitoring"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono underline"
            style={{ color: 'var(--gold)' }}
          >
            Ver logs en Fly.io →
          </a>
        </div>
      )}

      {/* Sending indicator */}
      {sendingTg && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[11px] font-mono"
          style={{ borderColor: 'rgba(201,168,76,0.2)', background: 'rgba(201,168,76,0.04)', color: 'var(--gold)' }}>
          <span className="animate-pulse">●</span>
          Traduciendo y enviando señales al Telegram…
        </div>
      )}

      {/* Telegram footer */}
      <div className="rounded-lg border px-4 py-3 flex items-center gap-2 text-[10px] font-mono"
        style={{ borderColor: 'var(--border)', color: telegramReady ? '#4ade80' : 'var(--text-muted)' }}>
        {telegramReady ? (
          <>
            <span>📬</span>
            <span>Telegram configurado — las señales se enviarán a tu canal al ejecutar el escaneo</span>
          </>
        ) : (
          <>
            <span>⚠</span>
            <span>Telegram no configurado — abre Configuración para conectar tu canal</span>
          </>
        )}
      </div>

    </div>
  )
}
