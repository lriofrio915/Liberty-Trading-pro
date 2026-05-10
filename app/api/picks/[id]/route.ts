import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { callAI } from '@/lib/ai-providers'
import { fetchTickerFinancials, buildDataBlock } from '@/lib/yahoo-financials'

export const maxDuration = 60

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

// ── POST /api/picks/[id] — regenerate AI report for existing pick ──────
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.opportunity.findUnique({ where: { id: (await params).id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const yf = await fetchTickerFinancials(existing.ticker)
    const dataBlock = buildDataBlock(yf)

    // AI report generation delegated to centralized provider

    const prompt = `Eres un analista financiero senior de Liberty Trading Club. Tienes los siguientes DATOS REALES de mercado para ${yf.ticker}:

${dataBlock}

IDIOMA: Responde EXCLUSIVAMENTE en español. Todos los campos de texto narrativo deben estar en español.

Con base EXCLUSIVAMENTE en esos datos reales, genera un informe de inversión profesional.
REGLAS ESTRICTAS:
1. NO inventes cifras. Usa SOLO los números del bloque de datos reales de arriba.
2. Si un dato dice "N/D" o "N/M", indícalo así en el texto o no lo menciones.
3. El análisis cualitativo y la narrativa son tuyas, pero toda cifra debe provenir del bloque de datos.
4. Responde ÚNICAMENTE con el JSON, sin texto adicional ni bloques markdown.

{
  "ticker": "${yf.ticker}",
  "empresa": "<nombre exacto del bloque>",
  "bolsa": "<exchange exacto>",
  "precio_actual": "<precio exacto>",
  "precio_objetivo": "<precio_obj_medio exacto, o N/D>",
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
    let aiReport: string | null = null
    if (raw) {
      const start = raw.indexOf('{')
      const end = raw.lastIndexOf('}')
      aiReport = start !== -1 && end !== -1 ? raw.slice(start, end + 1).trim() : raw.trim()
    }

    if (!aiReport) {
      return NextResponse.json({ error: 'La IA no devolvió un informe válido' }, { status: 502 })
    }

    const opportunity = await prisma.opportunity.update({
      where: { id: (await params).id },
      data: { aiReport },
    })

    return NextResponse.json({ opportunity })
  } catch (err) {
    console.error('POST /api/picks/[id]:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}

// ── PATCH /api/picks/[id] — update status, active, or any field ────────
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { status, active, title, description, precioObjetivo, stopLoss, precioEntrada, precioVenta } = body

    const updated = await prisma.opportunity.update({
      where: { id: (await params).id },
      data: {
        ...(status !== undefined && { status }),
        ...(active !== undefined && { active }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(precioEntrada !== undefined && { precioEntrada: parseFloat(precioEntrada) }),
        ...(precioObjetivo !== undefined && { precioObjetivo: parseFloat(precioObjetivo) }),
        ...(stopLoss !== undefined && { stopLoss: parseFloat(stopLoss) }),
        ...('precioVenta' in body && {
          precioVenta: precioVenta === null || precioVenta === '' ? null : parseFloat(precioVenta),
        }),
      },
    })

    return NextResponse.json({ opportunity: updated })
  } catch (err) {
    console.error('PATCH /api/picks/[id]:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ── DELETE /api/picks/[id] ─────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.opportunity.delete({ where: { id: (await params).id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/picks/[id]:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
