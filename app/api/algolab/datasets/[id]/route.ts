import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { parseMT5CSV, mergeCandles } from '@/lib/algolab-parser'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const dataset = await prisma.algoDataset.findFirst({
      where: { id: params.id, userId: dbUser.id },
      include: {
        strategies: {
          select: {
            id: true, name: true, description: true, profitFactor: true,
            netProfit: true, sharpeRatio: true, maxDrawdownPct: true,
            winRate: true, totalTrades: true, expectancy: true,
            recoveryFactor: true, sortinoRatio: true, calmarRatio: true,
            consecutiveWins: true, consecutiveLosses: true, avgTradeDuration: true,
            createdAt: true, indicators: true, rules: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        patternReport: {
          select: {
            id: true, meta: true, stats: true, totalScanned: true, createdAt: true, updatedAt: true,
          },
        },
      },
    })

    if (!dataset) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ dataset })
  } catch (err) {
    console.error('[algolab/datasets/[id] GET]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const dataset = await prisma.algoDataset.findFirst({
      where: { id: params.id, userId: dbUser.id },
    })
    if (!dataset) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Eliminar estrategias primero, luego dataset
    await prisma.algoStrategy.deleteMany({ where: { datasetId: params.id } })
    await prisma.algoDataset.delete({ where: { id: params.id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[algolab/datasets/[id] DELETE]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const dataset = await prisma.algoDataset.findFirst({
      where: { id: params.id, userId: dbUser.id },
    })
    if (!dataset) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Se requiere archivo' }, { status: 400 })

    const content = await file.text()
    const newCandles = parseMT5CSV(content)
    if (newCandles.length < 5) {
      return NextResponse.json({ error: 'CSV inválido' }, { status: 400 })
    }

    const merged = mergeCandles(dataset.candles as never[], newCandles)
    const updated = await prisma.algoDataset.update({
      where: { id: params.id },
      data: {
        candles: merged as never,
        candleCount: merged.length,
        dateFrom: new Date(merged[0].t),
        dateTo: new Date(merged[merged.length - 1].t),
      },
    })

    return NextResponse.json({ dataset: updated, added: merged.length - (dataset.candleCount || 0) })
  } catch (err) {
    console.error('[algolab/datasets/[id] PATCH]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
