import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getEffectiveAccess } from '@/lib/access'
import { generateStrategies } from '@/lib/algolab-engine'
import { validateCandles } from '@/lib/algolab-parser'

export const maxDuration = 60 // segundos

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const access = getEffectiveAccess({ plan: dbUser.plan, trialEndsAt: dbUser.trialEndsAt })
    if (!access.canAccessClub) {
      return NextResponse.json({ error: 'Se requiere plan Club' }, { status: 403 })
    }

    const body = await req.json()
    const { datasetId, selectedIndicators, config } = body as {
      datasetId: string
      selectedIndicators: string[]
      config: {
        spread: number
        slippage: number
        lotSize: number
        initialBalance: number
        pipValue: number
      }
    }

    if (!datasetId || !selectedIndicators?.length) {
      return NextResponse.json({ error: 'datasetId y selectedIndicators son requeridos' }, { status: 400 })
    }

    const dataset = await prisma.algoDataset.findFirst({
      where: { id: datasetId, userId: dbUser.id },
    })
    if (!dataset) return NextResponse.json({ error: 'Dataset no encontrado' }, { status: 404 })

    let candles
    try {
      candles = validateCandles(dataset.candles)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error validando candles'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    if (candles.length < 50) {
      return NextResponse.json({ error: 'Dataset insuficiente (mínimo 50 velas)' }, { status: 400 })
    }

    const backtestConfig = {
      spread:         config?.spread ?? 2,
      slippage:       config?.slippage ?? 1,
      lotSize:        config?.lotSize ?? 0.1,
      initialBalance: config?.initialBalance ?? 10000,
      pipValue:       config?.pipValue ?? 10,
      maxTradesOpen:  1,
    }

    const strategies = await generateStrategies(
      candles,
      selectedIndicators,
      dataset.symbol,
      dataset.timeframe,
      { ...backtestConfig, maxResults: 100 }
    )

    if (strategies.length === 0) {
      return NextResponse.json({ strategies: [], message: 'No se encontraron estrategias válidas con los indicadores seleccionados' })
    }

    // Guardar en DB
    const saved = await prisma.$transaction(
      strategies.slice(0, 50).map(s =>
        prisma.algoStrategy.create({
          data: {
            userId:           dbUser.id,
            datasetId:        dataset.id,
            name:             s.name,
            description:      s.description,
            rules:            s.rules as never,
            indicators:       s.indicators as never,
            netProfit:        s.result.netProfit,
            profitFactor:     s.result.profitFactor,
            sharpeRatio:      s.result.sharpeRatio,
            sortinoRatio:     s.result.sortinoRatio,
            calmarRatio:      s.result.calmarRatio,
            maxDrawdown:      s.result.maxDrawdown,
            maxDrawdownPct:   s.result.maxDrawdownPct,
            winRate:          s.result.winRate,
            totalTrades:      s.result.totalTrades,
            avgTradeDuration: s.result.avgTradeDuration,
            recoveryFactor:   s.result.recoveryFactor,
            expectancy:       s.result.expectancy,
            consecutiveWins:  s.result.consecutiveWins,
            consecutiveLosses: s.result.consecutiveLosses,
            equityCurve:      s.result.equityCurve as never,
            trades:           s.result.trades as never,
          },
        })
      )
    )

    return NextResponse.json({ strategies: saved, total: strategies.length })
  } catch (err) {
    console.error('[algolab/generate POST]', err)
    return NextResponse.json({ error: 'Error interno al generar estrategias' }, { status: 500 })
  }
}
