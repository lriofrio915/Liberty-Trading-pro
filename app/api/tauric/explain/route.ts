import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { callAIWithSystem } from '@/lib/ai-providers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const SYSTEM = `Eres un analista financiero senior que explica señales de trading a inversores en español.
Responde SIEMPRE en español. Máximo 4 oraciones claras y concretas.
Explica: (1) qué significa la señal en términos prácticos, (2) qué factores probablemente influyeron, (3) qué debería monitorear el inversor en los próximos días.
NO inventes datos numéricos específicos de precio. NO uses jerga excesiva.`

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as {
    ticker?: string
    signal?: string
    depth?: string
    date?: string
    logs?: string[]
  }

  const { ticker = '', signal = '', depth = 'shallow', date = '', logs = [] } = body
  if (!ticker || !signal) return NextResponse.json({ error: 'ticker y signal requeridos' }, { status: 400 })

  const depthLabel = depth === 'shallow' ? 'superficial (1 analista/categoría)'
    : depth === 'moderate' ? 'moderado (3 analistas/categoría)'
    : 'profundo (todos los analistas)'

  const logsSnippet = logs.length > 0
    ? `\nRegistro del proceso:\n${logs.slice(0, 8).join('\n')}`
    : ''

  const userMsg = `Análisis de ${ticker} · Fecha: ${date} · Profundidad: ${depthLabel}
Señal final del sistema Tauric (10 agentes LLM): "${signal}"${logsSnippet}

Genera la conclusión breve para el inversor.`

  try {
    const conclusion = await callAIWithSystem(SYSTEM, userMsg, { maxTokens: 300, temperature: 0.5 })
    return NextResponse.json({ conclusion })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al generar conclusión'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
