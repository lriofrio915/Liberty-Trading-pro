import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAIL = 'lriofrio915@gmail.com'

const PLAN_ORDER: Record<string, number> = { FREE: 0, CLUB: 1, PRO: 2, PORTFOLIO: 3 }

function sanitize(text: string): string {
  return text
    .replace(/\u2014/g, '--').replace(/\u2013/g, '-')
    .replace(/\u2018/g, "'").replace(/\u2019/g, "'")
    .replace(/\u201C/g, '"').replace(/\u201D/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/[^\x00-\x7F]/g, '')
}

// ── GET /api/opportunities — returns opportunities visible to the user's plan ──
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    const plan = dbUser?.plan ?? 'FREE'
    const userLevel = PLAN_ORDER[plan] ?? 0

    // Admin sees all
    const isAdmin = user.email === ADMIN_EMAIL

    const all = await prisma.opportunity.findMany({
      orderBy: { publishedAt: 'desc' },
      ...(isAdmin ? {} : { where: { active: true } }),
    })

    const visible = isAdmin
      ? all
      : all.filter((o) => (PLAN_ORDER[o.minPlan] ?? 1) <= userLevel)

    return NextResponse.json({ opportunities: visible, plan, isAdmin })
  } catch (err) {
    console.error('GET /api/opportunities:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ── POST /api/opportunities — admin only, creates + generates AI report ────────
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      title, ticker, instrumento, tipo, direction,
      precioEntrada, precioObjetivo, stopLoss,
      timeframe, riesgo, description, minPlan,
    } = body

    if (!title || !ticker || !instrumento || !tipo || !direction
      || precioEntrada == null || precioObjetivo == null || stopLoss == null) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // ── Generate AI report via OpenRouter (Perplexity online model for web search) ──
    let aiReport: string | null = null
    try {
      const apiKey = process.env.OPENROUTER_API_KEY
      const rr = ((precioObjetivo - precioEntrada) / (precioEntrada - stopLoss)).toFixed(2)
      const potencial = (((precioObjetivo - precioEntrada) / precioEntrada) * 100).toFixed(2)

      const prompt = sanitize(
        `Eres un analista financiero senior especializado en mercados de capitales.
Genera un informe completo y profesional de oportunidad de inversión para:

DATOS DE LA ALERTA:
- Ticker: ${ticker}
- Instrumento: ${instrumento}
- Tipo: ${tipo}
- Dirección: ${direction}
- Precio de entrada: $${precioEntrada}
- Precio objetivo: $${precioObjetivo} (potencial: +${potencial}%)
- Stop Loss: $${stopLoss}
- Ratio Riesgo/Beneficio: ${rr}x
- Horizonte temporal: ${timeframe} plazo
- Nivel de riesgo: ${riesgo}
- Resumen del analista: ${description}

ESTRUCTURA DEL INFORME:
1. RESUMEN EJECUTIVO (2-3 oraciones clave)
2. DESCRIPCION DE LA EMPRESA / ACTIVO (actividad, sector, capitalización)
3. ANALISIS TECNICO (soporte/resistencia, tendencia actual, patrones relevantes)
4. ANALISIS FUNDAMENTAL (métricas clave: P/E, EPS, ingresos, margen, deuda si aplica)
5. CATALIZADORES (por qué podría moverse hacia el objetivo)
6. RIESGOS A CONSIDERAR
7. GESTION DEL TRADE (entrada, objetivo, stop, RR, tamaño sugerido)
8. CONCLUSION Y RECOMENDACION

Usa datos reales y actualizados. Sé preciso, usa términos técnicos y escribe en español. Formato con secciones claras.`
      )

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://libertytrading.pro',
          'X-Title': 'Liberty Trading Pro -- Opportunity Report',
        },
        body: JSON.stringify({
          model: 'perplexity/sonar-pro',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 3000,
          temperature: 0.4,
        }),
      })

      const data = await res.json()
      aiReport = data.choices?.[0]?.message?.content ?? null
      if (aiReport) aiReport = aiReport.trim()
    } catch (aiErr) {
      console.error('AI report generation failed:', aiErr)
      // continue without report — can regenerate later
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        title,
        ticker: ticker.toUpperCase().trim(),
        instrumento,
        tipo,
        direction,
        precioEntrada: parseFloat(precioEntrada),
        precioObjetivo: parseFloat(precioObjetivo),
        stopLoss: parseFloat(stopLoss),
        timeframe,
        riesgo,
        description,
        aiReport,
        minPlan: minPlan ?? 'CLUB',
        active: true,
        status: 'ACTIVA',
      },
    })

    return NextResponse.json({ opportunity }, { status: 201 })
  } catch (err) {
    console.error('POST /api/opportunities:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
