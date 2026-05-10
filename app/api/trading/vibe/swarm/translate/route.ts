import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { callAI } from '@/lib/ai-providers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text } = await req.json().catch(() => ({ text: '' }))
  if (!text) return NextResponse.json({ error: 'text requerido' }, { status: 400 })

  try {
    const result = await callAI({
      messages: [
        {
          role: 'system',
          content:
            'Eres un traductor financiero profesional especializado en mercados de capitales. ' +
            'Traduce el siguiente reporte de análisis financiero al español latino, ' +
            'manteniendo todos los términos técnicos estándar del sector (ETF, yield, spread, MVRV, etc.), ' +
            'los nombres de activos, tickers y siglas (BTC, SPX, TLT, etc.) tal cual. ' +
            'Conserva exactamente el formato Markdown del original (tablas, negritas, encabezados). ' +
            'No añadas ni quites información.',
        },
        { role: 'user', content: text },
      ],
      maxTokens: 4000,
      temperature: 0.1,
    })
    return NextResponse.json({ translated: result.content })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error de traducción'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
