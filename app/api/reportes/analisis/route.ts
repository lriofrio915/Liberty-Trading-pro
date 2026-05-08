import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { callAI } from '@/lib/ai-providers'

function sanitize(text: string): string {
  return text
    .replace(/\u2014/g, '--').replace(/\u2013/g, '-')
    .replace(/\u2018/g, "'").replace(/\u2019/g, "'")
    .replace(/\u201C/g, '"').replace(/\u201D/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/[^\x00-\x7F]/g, '')
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { stats, periodLabel, sessions } = await req.json()

    if (!process.env.OPENROUTER_API_KEY && !process.env.MINIMAX_API_KEY) {
      return NextResponse.json({ error: 'No AI provider configured' }, { status: 500 })
    }

    // Build a compact sessions summary (last 20 for context)
    const sessionLines = (sessions as any[])
      .slice(0, 20)
      .map((s: any) =>
        `${String(s.date).slice(0, 10)} | ${s.instrumento} | ${s.direccion} | ${s.resultado} | PnL: $${(s.pnlNeto || 0).toFixed(2)}${s.notas ? ` | Nota: ${s.notas}` : ''}`
      )
      .join('\n')

    const prompt = sanitize(
      `Eres Vinces, coach de trading experto. Analiza el siguiente reporte de operativa del periodo: ${periodLabel}\n\n` +
      `METRICAS DEL PERIODO:\n` +
      `- Total operaciones: ${stats.total}\n` +
      `- Ganadoras: ${stats.wins} | Perdedoras: ${stats.losses} | BE: ${stats.breakevens}\n` +
      `- Win Rate: ${stats.winRate.toFixed(1)}%\n` +
      `- PnL Neto: $${stats.pnlNeto.toFixed(2)}\n` +
      `- PnL Bruto: $${stats.pnlBruto.toFixed(2)}\n` +
      `- Comisiones: $${stats.comisiones.toFixed(2)}\n` +
      `- Profit Factor: ${stats.profitFactor.toFixed(2)}\n` +
      `- RR Promedio: ${stats.rrPromedio.toFixed(2)}\n` +
      `- Max Drawdown: $${stats.maxDrawdown.toFixed(2)}\n` +
      `- Mejor trade: $${stats.mejorTrade.toFixed(2)}\n` +
      `- Peor trade: $${stats.peorTrade.toFixed(2)}\n` +
      `- Disciplina (% siguio plan): ${stats.disciplina.toFixed(1)}%\n\n` +
      `OPERACIONES DEL PERIODO (ultimas 20):\n${sessionLines}\n\n` +
      `Genera un analisis coaching conciso con estas secciones:\n` +
      `1. RESUMEN DEL PERIODO (2-3 oraciones)\n` +
      `2. PUNTOS FUERTES\n` +
      `3. AREAS DE MEJORA\n` +
      `4. PATRONES DETECTADOS (horarios, instrumentos, dias, emociones si hay notas)\n` +
      `5. RECOMENDACIONES CONCRETAS (3 acciones especificas)\n\n` +
      `Sé directo, honesto y actionable. Escribe en espanol. Maximo 400 palabras.`
    )

    const result = await callAI({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1000,
      temperature: 0.5,
      httpReferer: process.env.NEXT_PUBLIC_APP_URL || 'https://libertytrading.pro',
      xTitle: 'Liberty Trading Pro -- Report Analysis',
    })

    const analysis = result.content || null

    return NextResponse.json({ analysis })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
