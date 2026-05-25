import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { runAgent, repairJSON } from '@/lib/analisis-engine'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      ticker: string
      lastPrice: number
      adrPct: number
      change24hPct: number
      recentCloses: number[]
    }
    const { ticker, lastPrice, adrPct, change24hPct, recentCloses } = body
    if (!ticker || !lastPrice) {
      return NextResponse.json({ error: 'ticker y lastPrice requeridos' }, { status: 400 })
    }

    const trendPct = recentCloses && recentCloses.length >= 2
      ? ((recentCloses[recentCloses.length - 1] - recentCloses[0]) / recentCloses[0] * 100).toFixed(2)
      : '0.00'

    const closesStr = (recentCloses ?? []).map((p: number) => `$${p.toFixed(2)}`).join(' → ')

    const systemPrompt = `Eres MAIA, analista experto de trading intradia con 20 años de experiencia en acciones de alta volatilidad del NYSE y NASDAQ.
Tu objetivo es determinar el sesgo direccional para operar intradia basándote exclusivamente en el momentum de precio reciente.
Responde ÚNICAMENTE con un JSON válido. Sin texto adicional. Sin bloques markdown.`

    const userMessage = `Analiza ${ticker} para trading intradia de hoy:

DATOS DE PRECIO:
- Precio actual: $${lastPrice.toFixed(2)}
- Cambio 24h: ${change24hPct >= 0 ? '+' : ''}${change24hPct.toFixed(2)}%
- ADR promedio (rango diario): ${adrPct.toFixed(2)}%
- Tendencia 5 días: ${Number(trendPct) >= 0 ? '+' : ''}${trendPct}%
- Últimos 5 cierres: ${closesStr}

Determina el sesgo intradia considerando momentum, tendencia reciente y contexto de volatilidad.

Responde con este JSON exacto (sin más texto):
{
  "sesgo": "COMPRA",
  "razon": "momentum alcista sostenido con soporte en MA",
  "confianza": 72
}

Valores permitidos para "sesgo": "COMPRA" | "VENTA" | "NEUTRAL"
"confianza": número entero 0-100
"razon": string máximo 100 caracteres`

    const raw = await runAgent(systemPrompt, userMessage, 200)
    const fixed = repairJSON(raw)
    const parsed = JSON.parse(fixed) as { sesgo?: string; razon?: string; confianza?: number }

    const sesgo = (['COMPRA', 'VENTA', 'NEUTRAL'] as const).includes(parsed.sesgo as 'COMPRA' | 'VENTA' | 'NEUTRAL')
      ? (parsed.sesgo as 'COMPRA' | 'VENTA' | 'NEUTRAL')
      : 'NEUTRAL'
    const razon = typeof parsed.razon === 'string' ? parsed.razon.slice(0, 120) : ''
    const confianza = typeof parsed.confianza === 'number'
      ? Math.max(0, Math.min(100, Math.round(parsed.confianza)))
      : 50

    return NextResponse.json({ sesgo, razon, confianza })
  } catch (err) {
    console.error('[intraday/bias]', err)
    return NextResponse.json({ error: 'Bias analysis failed' }, { status: 500 })
  }
}
