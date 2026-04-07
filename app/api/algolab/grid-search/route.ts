// POST /api/algolab/grid-search
// Re-corre el backtest de un patrón con distintas combinaciones de TP×SL (en múltiplos de ATR)
// y devuelve la matriz de resultados para mostrar un heatmap en el frontend.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getEffectiveAccess } from '@/lib/access'
import { validateCandles, type Candle } from '@/lib/algolab-parser'
import { calcATR } from '@/lib/algolab-indicators'
import { buildDatasetMeta } from '@/lib/algolab-dataset-meta'
import { PATTERN_CATALOG } from '@/lib/algolab-patterns'

export const maxDuration = 30

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface GridCell {
  tp: number
  sl: number
  N: number
  wins: number
  winRate: number
  totalPnlPts: number
  expectancy: number
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function backtestOne(
  candles: Candle[],
  signalBarIdx: number,
  direction: 'LONG' | 'SHORT',
  atr: number,
  tpMult: number,
  slMult: number,
  maxBars = 20,
): { win: boolean; pnl: number } {
  const entryIdx = signalBarIdx + 1
  if (entryIdx >= candles.length) return { win: false, pnl: -slMult * atr }

  const entry = candles[entryIdx].o
  const tpPts = tpMult * atr
  const slPts = slMult * atr
  const tpLevel = direction === 'LONG' ? entry + tpPts : entry - tpPts
  const slLevel = direction === 'LONG' ? entry - slPts : entry + slPts

  for (let j = entryIdx; j < Math.min(entryIdx + maxBars, candles.length); j++) {
    const bar = candles[j]
    if (direction === 'LONG') {
      const tp = bar.h >= tpLevel
      const sl = bar.l <= slLevel
      if (tp && sl) return { win: false, pnl: -slPts }
      if (tp) return { win: true, pnl: tpPts }
      if (sl) return { win: false, pnl: -slPts }
    } else {
      const tp = bar.l <= tpLevel
      const sl = bar.h >= slLevel
      if (tp && sl) return { win: false, pnl: -slPts }
      if (tp) return { win: true, pnl: tpPts }
      if (sl) return { win: false, pnl: -slPts }
    }
  }

  const last = candles[Math.min(entryIdx + maxBars - 1, candles.length - 1)]
  const pnl = direction === 'LONG' ? last.c - entry : entry - last.c
  return { win: pnl > 0, pnl }
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
    const body = await req.json() as {
      datasetId: string
      patternId: string
      tpMults?: number[]
      slMults?: number[]
    }
    const { datasetId, patternId } = body
    const tpMults = body.tpMults ?? [1, 1.5, 2, 2.5, 3, 4]
    const slMults = body.slMults ?? [0.5, 0.75, 1, 1.5, 2]

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

    // ATR y metadatos
    const atrArr = calcATR(candles, 14)
    const meta = buildDatasetMeta(candles, dataset.symbol, dataset.timeframe)
    const validHours = new Set(meta.volumeWindowHours)

    // Detectar señales
    const signals: { barIndex: number; atrAtSignal: number }[] = []
    const startIdx = pattern.minBars - 1

    for (let i = startIdx; i < candles.length - 1; i++) {
      const signalHour = new Date(candles[i].t).getUTCHours()
      const prevHour = new Date(candles[i - Math.max(pattern.minBars - 1, 1)].t).getUTCHours()

      if (validHours.size < 24 && (!validHours.has(signalHour) || !validHours.has(prevHour))) continue

      const atr = atrArr[i] ?? 0
      if (atr === 0) continue

      if (pattern.detect(candles, i, atr)) {
        signals.push({ barIndex: i, atrAtSignal: atr })
      }
    }

    const N = signals.length

    // Grid search
    const grid: GridCell[] = []

    for (const tp of tpMults) {
      for (const sl of slMults) {
        let wins = 0
        let totalPnl = 0

        for (const sig of signals) {
          const result = backtestOne(candles, sig.barIndex, pattern.direction, sig.atrAtSignal, tp, sl)
          if (result.win) wins++
          totalPnl += result.pnl
        }

        const winRate = N > 0 ? wins / N : 0
        const expectancy = winRate * tp - (1 - winRate) * sl

        grid.push({ tp, sl, N, wins, winRate, totalPnlPts: totalPnl, expectancy })
      }
    }

    return NextResponse.json({
      patternId,
      patternName: pattern.name,
      direction: pattern.direction,
      totalSignals: N,
      grid,
    })
  } catch (err) {
    console.error('[algolab/grid-search POST]', err)
    return NextResponse.json({ error: 'Error interno en grid search' }, { status: 500 })
  }
}
