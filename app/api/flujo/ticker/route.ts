import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { computeFarosMetrics } from '@/lib/faros-metrics'
import {
  calcNetMoneyFlow,
  calcMFI,
  getConclusion,
  type FlujoDineroAsset,
} from '../route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const symbol = req.nextUrl.searchParams.get('symbol')?.trim().toUpperCase()
  const name   = req.nextUrl.searchParams.get('name') ?? symbol ?? ''
  const sector = req.nextUrl.searchParams.get('sector') ?? 'Personalizado'

  if (!symbol) return NextResponse.json({ error: 'symbol requerido' }, { status: 400 })

  try {
    const { fetchYahooOHLCV } = await import('@/lib/analisis-engine')
    const ohlcv = await fetchYahooOHLCV(symbol, symbol)

    if (!ohlcv || ohlcv.closes.length < 10) {
      return NextResponse.json(
        { error: `Datos insuficientes para ${symbol}. Verifica que el ticker sea válido en Yahoo Finance.` },
        { status: 404 },
      )
    }

    const faros           = computeFarosMetrics(ohlcv)
    const netMoneyFlowPct = calcNetMoneyFlow(ohlcv, 5)
    const mfi             = calcMFI(ohlcv, 14)
    const conclusion      = getConclusion(faros, mfi)
    const currentPrice    = ohlcv.closes[ohlcv.closes.length - 1] ?? 0

    const asset: FlujoDineroAsset = {
      ...faros,
      nombre: name,
      sector,
      currentPrice,
      netMoneyFlowPct,
      mfi,
      conclusion,
    }

    return NextResponse.json(asset)
  } catch (err) {
    const msg = err instanceof Error ? err.message : `Error obteniendo datos para ${symbol}`
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
