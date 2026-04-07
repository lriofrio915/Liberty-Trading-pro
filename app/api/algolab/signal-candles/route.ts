// POST /api/algolab/signal-candles
// Detecta señales de un patrón dado y devuelve detalles de cada señal (fecha, precio, ATR, resultado)
// para el Visualizador de velas en PatternReport.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getEffectiveAccess } from '@/lib/access'
import { validateCandles, type Candle } from '@/lib/algolab-parser'
import { calcATR } from '@/lib/algolab-indicators'
import { buildDatasetMeta } from '@/lib/algolab-dataset-meta'
import { PATTERN_CATALOG } from '@/lib/algolab-patterns'

export const maxDuration = 20

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface SignalDetail {
  idx: number
  date: string
  direction: 'LONG' | 'SHORT'
  entryPrice: number
  tpPrice: number
  slPrice: number
  atr: number
  result: 'WIN' | 'LOSS' | 'TIMEOUT'
  pnlPts: number
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function backtestSignal(
  candles: Candle[],
  signalBarIdx: number,
  direction: 'LONG' | 'SHORT',
  atr: number,
  maxBars = 20,
): { result: 'WIN' | 'LOSS' | 'TIMEOUT'; pnlPts: number } {
  const TP_MULT = 3
  const SL_MULT = 1

  const entryIdx = signalBarIdx + 1
  if (entryIdx >= candles.length) return { result: 'TIMEOUT', pnlPts: -SL_MULT * atr }

  const entry = candles[entryIdx].o
  const tpPts = TP_MULT * atr
  const slPts = SL_MULT * atr
  const tpLevel = direction === 'LONG' ? entry + tpPts : entry - tpPts
  const slLevel = direction === 'LONG' ? entry - slPts : entry + slPts

  for (let j = entryIdx; j < Math.min(entryIdx + maxBars, candles.length); j++) {
    const bar = candles[j]
    if (direction === 'LONG') {
      const tp = bar.h >= tpLevel
      const sl = bar.l <= slLevel
      if (tp && sl) return { result: 'LOSS', pnlPts: -slPts }
      if (tp) return { result: 'WIN', pnlPts: tpPts }
      if (sl) return { result: 'LOSS', pnlPts: -slPts }
    } else {
      const tp = bar.l <= tpLevel
      const sl = bar.h >= slLevel
      if (tp && sl) return { result: 'LOSS', pnlPts: -slPts }
      if (tp) return { result: 'WIN', pnlPts: tpPts }
      if (sl) return { result: 'LOSS', pnlPts: -slPts }
    }
  }

  const last = candles[Math.min(entryIdx + maxBars - 1, candles.length - 1)]
  const pnl = direction === 'LONG' ? last.c - entry : entry - last.c
  return { result: 'TIMEOUT', pnlPts: pnl }
}

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  })
}

// ─── ROUTE ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Auth
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const access = getEffectiveAccess({ plan: dbUser.plan, trialEndsAt: dbUser.trialEndsAt })
    if (!access.canAccessClub) {
      return NextResponse.json({ error: 'Se requiere plan Club' }, { status: 403 })
    }

    // Payload
    const body = await req.json() as { datasetId: string; patternId: string; limit?: number }
    const { datasetId, patternId } = body
    const limit = Math.min(body.limit ?? 50, 200)

    if (!datasetId || !patternId) {
      return NextResponse.json({ error: 'datasetId y patternId son requeridos' }, { status: 400 })
    }

    // Cargar dataset
    const dataset = await prisma.algoDataset.findFirst({
      where: { id: datasetId, userId: dbUser.id },
    })
    if (!dataset) return NextResponse.json({ error: 'Dataset no encontrado' }, { status: 404 })

    // Validar candles
    let candles: Candle[]
    try {
      const all = validateCandles(dataset.candles)
      candles = all.length > 10000 ? all.slice(-10000) : all
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error validando candles'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    // Encontrar patrón
    const pattern = PATTERN_CATALOG.find(p => p.id === patternId)
    if (!pattern) return NextResponse.json({ error: 'Patrón no encontrado' }, { status: 404 })

    // ATR y ventana de volumen
    const atrArr = calcATR(candles, 14)
    const meta = buildDatasetMeta(candles, dataset.symbol, dataset.timeframe)
    const validHours = new Set(meta.volumeWindowHours)

    const TP_MULT = 3
    const SL_MULT = 1

    // Detectar señales y evaluarlas
    const signals: SignalDetail[] = []
    const startIdx = pattern.minBars - 1

    for (let i = startIdx; i < candles.length - 1; i++) {
      const signalHour = new Date(candles[i].t).getUTCHours()
      const prevHour = new Date(candles[i - Math.max(pattern.minBars - 1, 1)].t).getUTCHours()

      if (validHours.size < 24 && (!validHours.has(signalHour) || !validHours.has(prevHour))) continue

      const atr = atrArr[i] ?? 0
      if (atr === 0) continue

      if (pattern.detect(candles, i, atr)) {
        const entryIdx = i + 1
        const entryPrice = candles[entryIdx]?.o ?? candles[i].c
        const tpPrice = pattern.direction === 'LONG'
          ? entryPrice + TP_MULT * atr
          : entryPrice - TP_MULT * atr
        const slPrice = pattern.direction === 'LONG'
          ? entryPrice - SL_MULT * atr
          : entryPrice + SL_MULT * atr

        const bt = backtestSignal(candles, i, pattern.direction, atr)

        signals.push({
          idx: i,
          date: fmtDate(candles[i].t),
          direction: pattern.direction,
          entryPrice: +entryPrice.toFixed(5),
          tpPrice: +tpPrice.toFixed(5),
          slPrice: +slPrice.toFixed(5),
          atr: +atr.toFixed(5),
          result: bt.result,
          pnlPts: +bt.pnlPts.toFixed(4),
        })
      }
    }

    // Devolver las últimas `limit` señales (más recientes primero)
    const latest = signals.slice(-limit).reverse()

    return NextResponse.json({
      patternId,
      patternName: pattern.name,
      direction: pattern.direction,
      totalSignals: signals.length,
      signals: latest,
    })
  } catch (err) {
    console.error('[algolab/signal-candles POST]', err)
    return NextResponse.json({ error: 'Error interno en signal-candles' }, { status: 500 })
  }
}
