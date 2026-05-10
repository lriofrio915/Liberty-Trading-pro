import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { callAI } from '@/lib/ai-providers'
import { fetchTickerFinancials, buildDataBlock } from '@/lib/yahoo-financials'

export const maxDuration = 60

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

const PLAN_ORDER: Record<string, number> = { FREE: 0, CLUB: 1, PRO: 2, PORTFOLIO: 3 }

// ── GET /api/picks — returns opportunities visible to the user's plan ──
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    const plan = dbUser?.plan ?? 'FREE'
    const userLevel = PLAN_ORDER[plan] ?? 0

    const isAdmin = user.email === ADMIN_EMAIL

    const all = await prisma.opportunity.findMany({
      orderBy: { publishedAt: 'desc' },
      ...(isAdmin ? {} : {
        where: {
          OR: [
            { active: true },
            { precioVenta: { not: null } },  // cerradas con precio documentado → track record
          ],
        },
      }),
    })

    const visible = isAdmin
      ? all
      : all.filter((o: { minPlan: string | number }) => (PLAN_ORDER[o.minPlan] ?? 1) <= userLevel)

    return NextResponse.json({ opportunities: visible, plan, isAdmin })
  } catch (err) {
    console.error('GET /api/picks:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ── POST /api/picks — admin only, fetches YF data + generates AI report ─
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      ticker,
      direction    = 'COMPRA',
      timeframe    = 'MEDIANO',
      riesgo       = 'MEDIO',
      minPlan      = 'CLUB',
      stopLossPct  = 8,
      precioEntradaManual,
      precioObjetivoManual,
    } = body

    if (!ticker) {
      return NextResponse.json({ error: 'ticker es requerido' }, { status: 400 })
    }

    // ── 1. Fetch real market data from Yahoo Finance ──
    const yf = await fetchTickerFinancials(ticker.toUpperCase().trim())
    const dataBlock = buildDataBlock(yf)

    const precioEntrada = precioEntradaManual
      ? parseFloat(precioEntradaManual)
      : yf.precioActual

    // For COMPRA: target must be ABOVE entry; for VENTA: target must be BELOW entry
    const analTarget = yf.precioObjetivoMedio
    const precioObjetivo = precioObjetivoManual
      ? parseFloat(precioObjetivoManual)
      : direction === 'COMPRA'
        ? (analTarget && analTarget > precioEntrada ? analTarget : parseFloat((precioEntrada * 1.15).toFixed(2)))
        : (analTarget && analTarget < precioEntrada ? analTarget : parseFloat((precioEntrada * 0.85).toFixed(2)))

    const stopLoss = direction === 'COMPRA'
      ? parseFloat((precioEntrada * (1 - stopLossPct / 100)).toFixed(2))
      : parseFloat((precioEntrada * (1 + stopLossPct / 100)).toFixed(2))

    // ── 2. Generate structured AI report ──
    let aiReport: string | null = null
    try {

      const preciosAdmin = precioEntradaManual || precioObjetivoManual
        ? `\nPRECIOS DEFINIDOS POR EL ANALISTA (usa estos valores exactos en el informe):
- Precio de Compra recomendado: $${precioEntrada.toFixed(2)}
- Precio Objetivo: $${precioObjetivo.toFixed(2)}\n`
        : ''

      const prompt = `Eres un analista financiero senior de Liberty Trading Club. Tienes los siguientes DATOS REALES de mercado para ${yf.ticker}:

${dataBlock}
${preciosAdmin}
IDIOMA: Responde EXCLUSIVAMENTE en español. Todos los campos de texto narrativo deben estar en español.

Con base EXCLUSIVAMENTE en esos datos reales, genera un informe de inversión profesional.
REGLAS ESTRICTAS:
1. NO inventes cifras. Usa SOLO los números del bloque de datos reales de arriba.
2. Si un dato dice "N/D" o "N/M", indícalo así en el texto o no lo menciones.
3. El análisis cualitativo y la narrativa son tuyas, pero toda cifra debe provenir del bloque de datos.
4. Si hay PRECIOS DEFINIDOS POR EL ANALISTA, úsalos en precio_actual y precio_objetivo del JSON.
5. Responde ÚNICAMENTE con el JSON, sin texto adicional ni bloques markdown.

{
  "ticker": "${yf.ticker}",
  "empresa": "<nombre exacto del bloque>",
  "bolsa": "<exchange exacto>",
  "precio_actual": "${precioEntradaManual ? precioEntrada.toFixed(2) : '<precio exacto del bloque>'}",
  "precio_objetivo": "${precioObjetivoManual ? precioObjetivo.toFixed(2) : '<precio_obj_medio exacto, o N/D>'}",
  "informe_numero": "N/A",
  "resumen": "3-4 oraciones en español: qué hace la empresa, precio actual, situación financiera y tesis de inversión basada en datos reales.",
  "negocio": "2-3 párrafos en español describiendo el negocio usando la descripción del bloque. Menciona sector, industria y fuentes de ingresos.",
  "fuentes_ingresos": [
    ["Año", "Revenue", "Gross Profit", "Net Income"],
    ["2024", "<cifras exactas del bloque>", "...", "..."],
    ["2023", "<cifras exactas del bloque>", "...", "..."],
    ["2022", "<cifras exactas del bloque>", "...", "..."]
  ],
  "financieros": "2 párrafos en español con cifras EXACTAS: revenue TTM, márgenes, EBITDA, EPS, deuda, caja.",
  "valoracion": "2 párrafos en español con cifras EXACTAS: market cap, EV, P/E, P/S, EV/EBITDA, rango 52 semanas, precio objetivo y breakdown de analistas.",
  "factores_positivos": [
    ["Catalizador 1", "Descripción en español con cifras reales del bloque"],
    ["Catalizador 2", "Descripción en español con cifras reales del bloque"],
    ["Catalizador 3", "Descripción en español con cifras reales del bloque"],
    ["Catalizador 4", "Descripción en español con cifras reales del bloque"],
    ["Catalizador 5", "Descripción en español con cifras reales del bloque"]
  ],
  "factores_riesgo": [
    ["Riesgo 1", "Descripción en español con cifras reales del bloque"],
    ["Riesgo 2", "Descripción en español con cifras reales del bloque"],
    ["Riesgo 3", "Descripción en español con cifras reales del bloque"],
    ["Riesgo 4", "Descripción en español con cifras reales del bloque"],
    ["Riesgo 5", "Descripción en español con cifras reales del bloque"]
  ],
  "conclusion": "2-3 párrafos en español: recomendación, zona de entrada, precio objetivo y horizonte.",
  "mes_año": "${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}"
}`

      const result = await callAI({
        model: 'openai/gpt-4.1',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.15,
        maxTokens: 4096,
        httpReferer: process.env.NEXT_PUBLIC_APP_URL || 'https://libertytrading.pro',
        xTitle: 'Liberty Trading Pro - Investment Report',
        signal: AbortSignal.timeout(55000),
      })

      const raw = result.content || null
      if (raw) {
        const start = raw.indexOf('{')
        const end = raw.lastIndexOf('}')
        aiReport = start !== -1 && end !== -1 ? raw.slice(start, end + 1).trim() : raw.trim()
      }
    } catch (aiErr) {
      console.error('[picks] AI report generation failed:', aiErr)
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        title: `${yf.ticker} — ${direction} · ${yf.empresa}`,
        ticker: yf.ticker,
        instrumento: 'ACCION',
        tipo: 'ACCION',
        direction,
        precioEntrada,
        precioObjetivo,
        stopLoss,
        timeframe,
        riesgo,
        description: yf.descripcion.slice(0, 300),
        aiReport,
        minPlan,
        active: true,
        status: 'COMPRAR',
      },
    })

    return NextResponse.json({ opportunity }, { status: 201 })
  } catch (err) {
    console.error('POST /api/picks:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}
