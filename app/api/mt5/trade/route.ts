import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const METAAPI_BASE = 'https://mt-client-api-v1.new-york.agiliumtrade.ai'

// POST /api/mt5/trade — place a trade via MetaAPI
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const mt5Account = await prisma.mT5Account.findUnique({ where: { userId: dbUser.id } })
    if (!mt5Account) {
      return NextResponse.json({ error: 'No tienes una cuenta MT5 conectada' }, { status: 400 })
    }

    const body = await req.json()
    const { symbol, type, volume, sl, tp, comment } = body

    if (!symbol || !type || !volume) {
      return NextResponse.json({ error: 'symbol, type y volume son requeridos' }, { status: 400 })
    }
    if (!['BUY', 'SELL'].includes(type)) {
      return NextResponse.json({ error: 'type debe ser BUY o SELL' }, { status: 400 })
    }
    if (volume <= 0 || volume > 100) {
      return NextResponse.json({ error: 'volume debe ser entre 0.01 y 100' }, { status: 400 })
    }

    const token = process.env.METAAPI_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'MetaAPI no configurado en el servidor' }, { status: 503 })
    }

    const tradeRecord = await prisma.mT5Trade.create({
      data: {
        mt5AccountId: mt5Account.id,
        symbol,
        type,
        volume,
        sl: sl ?? null,
        tp: tp ?? null,
        comment: comment ?? `Liberty AI — ${type} ${symbol}`,
        status: 'PENDING',
      },
    })

    const metaPayload = {
      actionType: type === 'BUY' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL',
      symbol,
      volume,
      ...(sl ? { stopLoss: sl } : {}),
      ...(tp ? { takeProfit: tp } : {}),
      comment: tradeRecord.comment,
    }

    const metaRes = await fetch(
      `${METAAPI_BASE}/users/current/accounts/${mt5Account.metaApiAccountId}/trade`,
      {
        method: 'POST',
        headers: {
          'auth-token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metaPayload),
        signal: AbortSignal.timeout(15000),
      }
    )

    const metaData = await metaRes.json().catch(() => ({}))

    if (!metaRes.ok) {
      await prisma.mT5Trade.update({
        where: { id: tradeRecord.id },
        data: { status: 'FAILED', errorMessage: metaData?.message ?? `HTTP ${metaRes.status}` },
      })
      return NextResponse.json(
        { error: metaData?.message ?? 'Error al ejecutar la operación en MT5' },
        { status: 400 }
      )
    }

    const updated = await prisma.mT5Trade.update({
      where: { id: tradeRecord.id },
      data: {
        status: 'OPEN',
        metaApiOrderId: metaData?.orderId ?? metaData?.positionId ?? null,
        openedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, trade: updated, metaResponse: metaData })
  } catch (err) {
    console.error('[POST /api/mt5/trade]', err)
    return NextResponse.json({ error: 'Error al ejecutar la operación' }, { status: 500 })
  }
}
