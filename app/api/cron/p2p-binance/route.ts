// Cron: cada 15 min, 24/7 — monitor de precios P2P Binance USDT/USD (Ecuador)
//
// Binance está bloqueado desde Vercel serverless (ver app/api/prices/route.ts),
// así que el fetch lo hace el VPS via scripts/p2p-binance-cron.sh y POSTea aquí
// las ofertas crudas de ambos lados: { buy: data[], sell: data[] }.
//
// Alertas via nexus_claw → WhatsApp:
//  - COMPRA: mejor precio para comprar USDT (tradeType=BUY) <= P2P_BUY_THRESHOLD (default 0.995)
//  - VENTA:  mejor precio para vender USDT (tradeType=SELL) >= P2P_SELL_THRESHOLD (default 1.005)
// Cooldown de 2h por lado para no repetir la misma alerta cada 15 min.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyP2PBinance, type P2PBestOffer } from '@/lib/notify-nexus'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const BUY_THRESHOLD = parseFloat(process.env.P2P_BUY_THRESHOLD || '0.995')
const SELL_THRESHOLD = parseFloat(process.env.P2P_SELL_THRESHOLD || '1.005')
const ALERT_COOLDOWN_MS = 2 * 60 * 60 * 1000

interface BinanceAd {
  adv: {
    price: string
    minSingleTransAmount: string
    maxSingleTransAmount: string
    tradeMethods: { identifier?: string | null; tradeMethodName?: string | null }[]
  }
  advertiser: { nickName?: string | null }
}

function validateCron(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization') ?? ''
  const query = new URL(req.url).searchParams.get('secret') ?? ''
  return auth === `Bearer ${secret}` || query === secret
}

function parseBest(ads: BinanceAd[]): P2PBestOffer | null {
  const ad = ads[0]
  if (!ad?.adv?.price) return null
  const price = parseFloat(ad.adv.price)
  if (!Number.isFinite(price)) return null
  return {
    price,
    banks: ad.adv.tradeMethods
      .map(m => m.tradeMethodName || m.identifier || '')
      .filter(Boolean),
    minAmount: ad.adv.minSingleTransAmount,
    maxAmount: ad.adv.maxSingleTransAmount,
    nickName: ad.advertiser?.nickName || 'desconocido',
  }
}

function topOffers(ads: BinanceAd[]) {
  return ads.slice(0, 3).map(ad => ({
    precio: ad.adv.price,
    bancos: ad.adv.tradeMethods.map(m => m.identifier ?? '').filter(s => s !== ''),
    rango: `${ad.adv.minSingleTransAmount}-${ad.adv.maxSingleTransAmount}`,
    nickName: ad.advertiser?.nickName ?? '',
  }))
}

export async function POST(req: NextRequest) {
  if (!validateCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { buy?: BinanceAd[]; sell?: BinanceAd[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Body inválido — se espera { buy: [...], sell: [...] } con ofertas de Binance P2P' },
      { status: 400 },
    )
  }

  const bestBuy = parseBest(body.buy ?? [])
  const bestSell = parseBest(body.sell ?? [])
  if (!bestBuy || !bestSell) {
    return NextResponse.json(
      { error: 'Sin ofertas válidas', buyOk: !!bestBuy, sellOk: !!bestSell },
      { status: 400 },
    )
  }

  try {
    const buyTriggered = bestBuy.price <= BUY_THRESHOLD
    const sellTriggered = bestSell.price >= SELL_THRESHOLD

    // Cooldown: no repetir alerta del mismo lado si ya se notificó en las últimas 2h
    const cooldownStart = new Date(Date.now() - ALERT_COOLDOWN_MS)
    const [recentBuyAlert, recentSellAlert] = await Promise.all([
      buyTriggered
        ? prisma.p2PPriceLog.findFirst({
            where: { buyAlert: true, timestamp: { gte: cooldownStart } },
            select: { id: true },
          })
        : null,
      sellTriggered
        ? prisma.p2PPriceLog.findFirst({
            where: { sellAlert: true, timestamp: { gte: cooldownStart } },
            select: { id: true },
          })
        : null,
    ])

    const buyAlert = buyTriggered && !recentBuyAlert
    const sellAlert = sellTriggered && !recentSellAlert

    await prisma.p2PPriceLog.create({
      data: {
        buyPrice: bestBuy.price,
        sellPrice: bestSell.price,
        buyAlert,
        sellAlert,
        detalle: {
          buy: topOffers(body.buy ?? []),
          sell: topOffers(body.sell ?? []),
        },
      },
    })

    if (buyAlert) {
      void notifyP2PBinance({ tipo: 'COMPRA', oferta: bestBuy, umbral: BUY_THRESHOLD })
    }
    if (sellAlert) {
      void notifyP2PBinance({ tipo: 'VENTA', oferta: bestSell, umbral: SELL_THRESHOLD })
    }

    return NextResponse.json({
      buyPrice: bestBuy.price,
      sellPrice: bestSell.price,
      buyAlert,
      sellAlert,
      buyCooldown: buyTriggered && !buyAlert,
      sellCooldown: sellTriggered && !sellAlert,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[cron/p2p-binance]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
