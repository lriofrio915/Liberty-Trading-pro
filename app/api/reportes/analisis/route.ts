import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

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

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

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

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://libertytrading.pro',
        'X-Title': 'Liberty Trading Pro -- Report Analysis',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3-0324',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.5,
      }),
    })

    const data = await res.json()
    const analysis = data.choices?.[0]?.message?.content ?? null

    return NextResponse.json({ analysis })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
