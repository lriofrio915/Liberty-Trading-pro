import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

// Strip characters that cannot be encoded as ByteString in HTTP headers
// and normalize common Unicode punctuation in text content
function sanitizeText(text: string): string {
  return text
    .replace(/\u2014/g, '--')   // em dash —
    .replace(/\u2013/g, '-')    // en dash –
    .replace(/\u2018/g, "'")    // left single quote '
    .replace(/\u2019/g, "'")    // right single quote '
    .replace(/\u201C/g, '"')    // left double quote "
    .replace(/\u201D/g, '"')    // right double quote "
    .replace(/\u2026/g, '...')  // ellipsis …
    .replace(/[^\x00-\x7F]/g, '') // strip any remaining non-ASCII
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    const apiKey = process.env.OPENROUTER_API_KEY
    const model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3-0324'

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    // Get authenticated user
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch real trading sessions from DB
    let sessions: any[] = []
    let dbUser = null
    let ragDocs: any[] = []
    if (user) {
      try {
        dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
        // userId: prefer DB record id, fall back to authId (matches how knowledge docs are stored)
        const userId = dbUser?.id ?? user.id

        if (dbUser) {
          sessions = await prisma.tradingSession.findMany({
            where: { userId: dbUser.id },
            orderBy: { date: 'desc' },
            take: 50,
          })
        }

        // Search knowledge base — always runs regardless of dbUser
        const lastUserMsg = (messages || [])
          .filter((m: any) => m.role === 'user')
          .slice(-1)[0]?.content || ''

        if (lastUserMsg.length > 2) {
          // Split into keywords (4+ chars), search each one with OR
          const stopWords = new Set(['para', 'como', 'esto', 'esta', 'este', 'cual', 'segun', 'sobre', 'dice', 'que', 'del', 'los', 'las', 'con', 'por', 'una', 'qué', 'cómo', 'cuál', 'según'])
          const keywords = lastUserMsg
            .toLowerCase()
            .replace(/[¿?¡!.,;:()]/g, ' ')
            .split(/\s+/)
            .filter((w: string) => w.length >= 4 && !stopWords.has(w))
            .slice(0, 6)

          if (keywords.length > 0) {
            const orConditions = keywords.flatMap((kw: string) => [
              { title: { contains: kw, mode: 'insensitive' as const } },
              { content: { contains: kw, mode: 'insensitive' as const } },
              { tags: { contains: kw, mode: 'insensitive' as const } },
              { description: { contains: kw, mode: 'insensitive' as const } },
            ])

            ragDocs = await (prisma as any).knowledgeDoc.findMany({
              where: { userId, OR: orConditions },
              take: 3,
              orderBy: { createdAt: 'desc' as const },
              select: { title: true, description: true, content: true, source: true, tags: true },
            })
          }
        }
      } catch (e) {
        console.error('Vinces DB fetch error:', e)
      }
    }

    // Calculate metrics from real data
    const wins = sessions.filter(s => s.resultado === 'WIN')
    const losses = sessions.filter(s => s.resultado === 'LOSS')
    const pnlTotal = sessions.reduce((sum, s) => sum + (s.pnlNeto || 0), 0)
    const winRate = sessions.length
      ? ((wins.length / sessions.length) * 100).toFixed(1)
      : '0.0'
    const profitFactor = losses.length > 0
      ? (Math.abs(wins.reduce((s, t) => s + t.pnlNeto, 0)) /
         Math.abs(losses.reduce((s, t) => s + t.pnlNeto, 0))).toFixed(2)
      : wins.length > 0 ? 'inf' : '0.00'

    const last5 = sessions.slice(0, 5).map(s =>
      `${String(s.date).slice(0, 10)} | ${s.instrumento} | ${s.direccion} | ${s.resultado} | $${(s.pnlNeto || 0).toFixed(2)}`
    ).join('\n') || 'Sin operaciones registradas'

    const userName = dbUser?.name || user?.email || 'Trader'

    // Build RAG context from knowledge base
    const ragContext = ragDocs.length > 0
      ? `\n\nBASE DE CONOCIMIENTO (documentos relevantes del usuario):\n` +
        ragDocs.map((d: any, i: number) =>
          `[DOC ${i + 1}] ${d.title}${d.source ? ` (${d.source})` : ''}\n` +
          (d.description ? `Resumen: ${d.description}\n` : '') +
          (d.content ? `Contenido: ${d.content.slice(0, 800)}\n` : '')
        ).join('\n')
      : ''

    // Build system prompt entirely on the server — never from client input
    const systemPrompt = sanitizeText(
      `Eres Vinces, el coach de trading personal de ${userName}. ` +
      `Eres directo, analitico y honesto. No das senales de trading. ` +
      `Tu rol es coaching de ejecucion, disciplina y mejora continua. ` +
      `Cuando el usuario pregunte sobre temas financieros, usa primero la base de conocimiento si hay documentos relevantes. ` +
      `Respondes siempre en espanol de forma concisa y actionable.\n\n` +
      `DATOS REALES DEL TRADER:\n` +
      `- Total operaciones registradas: ${sessions.length}\n` +
      `- Operaciones ganadoras: ${wins.length}\n` +
      `- Operaciones perdedoras: ${losses.length}\n` +
      `- Win Rate: ${winRate}%\n` +
      `- PnL neto total: $${pnlTotal.toFixed(2)}\n` +
      `- Profit Factor: ${profitFactor}\n\n` +
      `ULTIMAS 5 OPERACIONES:\n` +
      `${last5}` +
      ragContext +
      `\n\n`+
      `Cuando el usuario pregunte por sus estadisticas, usa los datos reales de arriba. ` +
      `Se breve. Usa listas cuando ayude a la claridad.`
    )

    // Sanitize incoming user messages
    const mensajesSanitizados = (messages || []).map((m: any) => ({
      role: m.role,
      content: sanitizeText(String(m.content ?? '')),
    }))

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://libertytrading.pro',
        'X-Title': 'Liberty Trading Pro -- Vinces AI', // ASCII only — no em dash
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...mensajesSanitizados,
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error }, { status: response.status })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    return NextResponse.json({ content, ragDocsFound: ragDocs.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
