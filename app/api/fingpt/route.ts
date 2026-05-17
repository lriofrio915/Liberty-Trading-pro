import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { callAI } from '@/lib/ai-providers'
import { extractJSON, repairJSON } from '@/lib/analisis-engine'

export const runtime = 'nodejs'
export const maxDuration = 60

type Mode = 'sentiment' | 'qa' | 'signals'

const ASSETS_DEFAULT = ['BTC', 'ETH', 'SPY', 'QQQ', 'NQ=F', 'ES=F', 'GC=F', 'CL=F', 'EUR/USD', 'AAPL', 'TSLA', 'NVDA']

async function runSentiment(input: string): Promise<object> {
  const system = `Eres FinGPT, modelo especializado en análisis de sentimiento financiero del framework AI4Finance-Foundation.
Tu tarea: analizar texto financiero y clasificar su sentimiento de mercado.
Responde ÚNICAMENTE con JSON válido, sin texto extra:
{"label":"positive|negative|neutral","score":85,"reasoning":"explicación breve en español","keywords":["palabra1","palabra2"]}`

  const raw = await callAI({
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: `Texto a analizar:\n\n${input}` },
    ],
    maxTokens: 400,
    temperature: 0.1,
    xTitle: 'FinGPT Sentiment',
  })

  const json = repairJSON(extractJSON(raw.content))
  return JSON.parse(json)
}

async function runQA(input: string): Promise<string> {
  const system = `Eres FinGPT, asistente financiero experto del framework AI4Finance-Foundation.
Tienes conocimiento profundo de mercados financieros, análisis técnico y fundamental, renta variable, renta fija, divisas, commodities, derivados y macroeconomía.
Responde en español de forma precisa, educativa y estructurada. Máximo 4 párrafos.`

  const raw = await callAI({
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: input },
    ],
    maxTokens: 800,
    temperature: 0.4,
    xTitle: 'FinGPT QA',
  })

  return raw.content
}

async function runSignals(assets: string[]): Promise<object> {
  const list = assets.join(', ')
  const system = `Eres FinGPT Forecaster, especializado en generar señales de trading basadas en análisis de sentimiento de mercado.
Para cada activo proporcionado, evalúa el contexto de mercado actual (condiciones macroeconómicas, tendencias del sector, correlaciones) y genera una señal.
Responde ÚNICAMENTE con JSON válido, sin texto extra:
{"activos":[{"simbolo":"BTC","sesgo":"COMPRA","confianza":78,"razon":"explicación breve en español"}]}`

  const raw = await callAI({
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: `Analiza el sentimiento de mercado y genera señales para los siguientes activos: ${list}` },
    ],
    maxTokens: 1200,
    temperature: 0.2,
    xTitle: 'FinGPT Signals',
  })

  const json = repairJSON(extractJSON(raw.content))
  return JSON.parse(json)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { email: user.email } })
    if (!dbUser || dbUser.plan === 'FREE') {
      return NextResponse.json({ error: 'Plan upgrade required' }, { status: 403 })
    }

    const body = await req.json()
    const mode: Mode = body.mode

    if (mode === 'sentiment') {
      if (!body.input || typeof body.input !== 'string') {
        return NextResponse.json({ error: 'input requerido' }, { status: 400 })
      }
      const result = await runSentiment(body.input)
      return NextResponse.json(result)
    }

    if (mode === 'qa') {
      if (!body.input || typeof body.input !== 'string') {
        return NextResponse.json({ error: 'input requerido' }, { status: 400 })
      }
      const answer = await runQA(body.input)
      return NextResponse.json({ answer })
    }

    if (mode === 'signals') {
      const assets: string[] = Array.isArray(body.assets) && body.assets.length > 0
        ? body.assets
        : ASSETS_DEFAULT
      const result = await runSignals(assets)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'mode inválido' }, { status: 400 })
  } catch (err) {
    console.error('[/api/fingpt] error:', err)
    const msg = err instanceof Error ? err.message : 'Error inesperado'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
