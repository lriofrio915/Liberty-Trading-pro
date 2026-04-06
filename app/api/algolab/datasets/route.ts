import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { parseMT5CSV, detectTimeframe, mergeCandles } from '@/lib/algolab-parser'

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ datasets: [] })

    const datasets = await prisma.algoDataset.findMany({
      where: { userId: dbUser.id },
      select: {
        id: true, symbol: true, timeframe: true, provider: true,
        dateFrom: true, dateTo: true, candleCount: true,
        createdAt: true, updatedAt: true,
        _count: { select: { strategies: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ datasets })
  } catch (err) {
    console.error('[algolab/datasets GET]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const symbol = (formData.get('symbol') as string || '').toUpperCase().trim()
    const provider = (formData.get('provider') as string || 'Otro').trim()

    if (!file || !symbol) {
      return NextResponse.json({ error: 'Se requiere archivo y símbolo' }, { status: 400 })
    }

    const content = await file.text()
    const candles = parseMT5CSV(content)

    if (candles.length < 10) {
      return NextResponse.json({ error: 'CSV inválido o insuficientes datos (mínimo 10 velas)' }, { status: 400 })
    }

    const timeframe = detectTimeframe(candles)
    const dateFrom = new Date(candles[0].t)
    const dateTo = new Date(candles[candles.length - 1].t)

    // Upsert: si ya existe dataset para userId+symbol+timeframe+provider, actualiza
    const existing = await prisma.algoDataset.findUnique({
      where: { userId_symbol_timeframe_provider: { userId: dbUser.id, symbol, timeframe, provider } },
    })

    if (existing) {
      const merged = mergeCandles(existing.candles as never[], candles)
      const updated = await prisma.algoDataset.update({
        where: { id: existing.id },
        data: {
          candles: merged as never,
          candleCount: merged.length,
          dateFrom: new Date(merged[0].t),
          dateTo: new Date(merged[merged.length - 1].t),
        },
      })
      return NextResponse.json({ dataset: updated, merged: true })
    }

    const dataset = await prisma.algoDataset.create({
      data: {
        userId: dbUser.id,
        symbol, timeframe, provider,
        dateFrom, dateTo,
        candleCount: candles.length,
        candles: candles as never,
      },
    })

    return NextResponse.json({ dataset }, { status: 201 })
  } catch (err) {
    console.error('[algolab/datasets POST]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
