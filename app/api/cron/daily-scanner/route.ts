import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { dailySignalsJSON, DailySignalsError } from '@/lib/daily-signals'
import { notifyAccionesDailyScanner } from '@/lib/notify-nexus'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const CRON_SECRET = process.env.CRON_SECRET || ''

interface TaskStatus {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number | null
  error?: string
}

interface Signal {
  stock_code?: string
  symbol?: string
  operation_advice?: string
  sentiment_score?: number
  summary?: string
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization') ?? ''
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch active tickers from DB (same logic as AccionesClient activeTickers)
  const opps = await prisma.opportunity.findMany({
    where: {
      active: true,
      OR: [{ precioVenta: null }, { precioVenta: 0 }],
    },
    select: { ticker: true },
  })

  const tickers = [...new Set(opps.map(o => o.ticker).filter(Boolean))]

  if (tickers.length === 0) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'no_active_tickers' })
  }

  // Trigger analysis
  type AnalyzeResp = {
    accepted?: { task_id: string }[]
    task_id?: string
    existing_task_id?: string
  }

  let taskIds: string[]
  try {
    const data = await dailySignalsJSON<AnalyzeResp>('/api/v1/analysis/analyze', {
      method: 'POST',
      body: JSON.stringify({ stock_codes: tickers, async_mode: true }),
    }, 55_000)

    taskIds = data?.accepted
      ? data.accepted.map(t => t.task_id).filter(Boolean)
      : data?.task_id ? [data.task_id]
      : data?.existing_task_id ? [data.existing_task_id]
      : []
  } catch (err) {
    const msg = err instanceof DailySignalsError ? err.message : 'Daily Signals no disponible'
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  if (taskIds.length === 0) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'no_tasks_queued' })
  }

  // Poll until all tasks complete (max 20 × 15s = 5 min)
  let attempts = 0
  while (attempts < 20) {
    await sleep(15_000)
    attempts++

    const statuses = await Promise.all(
      taskIds.map(id =>
        dailySignalsJSON<TaskStatus>(`/api/v1/analysis/status/${id}`, {}, 8_000)
          .catch(() => ({ task_id: id, status: 'pending' as const, progress: null }))
      )
    )

    const allDone = statuses.every(t => t.status === 'completed' || t.status === 'failed')
    if (!allDone) continue

    const allFailed = statuses.every(t => t.status === 'failed')
    if (allFailed) {
      return NextResponse.json({ error: 'All analysis tasks failed', tickers }, { status: 500 })
    }

    // Fetch results and filter to our tickers
    const tickerSet = new Set(tickers.map(t => t.toUpperCase()))
    const seen = new Set<string>()

    type HistoryResp = Signal[] | { items?: Signal[]; results?: Signal[]; data?: Signal[] }
    const raw = await dailySignalsJSON<HistoryResp>('/api/v1/history?page=1&page_size=100', {}, 10_000)
      .catch(() => [] as Signal[])

    const allSignals: Signal[] = Array.isArray(raw) ? raw
      : Array.isArray((raw as { items?: Signal[] }).items) ? (raw as { items: Signal[] }).items
      : Array.isArray((raw as { results?: Signal[] }).results) ? (raw as { results: Signal[] }).results
      : Array.isArray((raw as { data?: Signal[] }).data) ? (raw as { data: Signal[] }).data
      : []

    const signals = allSignals.filter(s => {
      const sym = (s.stock_code ?? s.symbol ?? '').toUpperCase()
      if (!sym || !tickerSet.has(sym) || seen.has(sym)) return false
      seen.add(sym)
      return true
    })

    if (signals.length > 0) {
      await notifyAccionesDailyScanner(signals, tickers, true)
    }

    return NextResponse.json({ ok: true, signals: signals.length, tickers, attempts })
  }

  return NextResponse.json({ error: 'Polling timeout after 5 minutes', tickers }, { status: 504 })
}
