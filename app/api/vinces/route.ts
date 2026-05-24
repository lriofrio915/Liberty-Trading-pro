import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { callAI } from '@/lib/ai-providers'

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

    // Get authenticated user
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch all data from DB in parallel
    let sessions: any[] = []
    let dbUser = null
    let ragDocs: any[] = []
    let activePlan: any = null

    if (user) {
      try {
        dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
        const userId = dbUser?.id ?? user.id

        const lastUserMsg = (messages || [])
          .filter((m: any) => m.role === 'user')
          .slice(-1)[0]?.content || ''

        // Build RAG keyword conditions
        const stopWords = new Set(['para', 'como', 'esto', 'esta', 'este', 'cual', 'segun', 'sobre', 'dice', 'que', 'del', 'los', 'las', 'con', 'por', 'una', 'qué', 'cómo', 'cuál', 'según'])
        const keywords = lastUserMsg.length > 2
          ? lastUserMsg
              .toLowerCase()
              .replace(/[¿?¡!.,;:()]/g, ' ')
              .split(/\s+/)
              .filter((w: string) => w.length >= 4 && !stopWords.has(w))
              .slice(0, 6)
          : []

        const ragConditions = keywords.length > 0
          ? keywords.flatMap((kw: string) => [
              { title: { contains: kw, mode: 'insensitive' as const } },
              { content: { contains: kw, mode: 'insensitive' as const } },
              { tags: { contains: kw, mode: 'insensitive' as const } },
              { description: { contains: kw, mode: 'insensitive' as const } },
            ])
          : null

        // Run all DB queries in parallel
        const [sessionsResult, planResult, ragResult] = await Promise.allSettled([
          dbUser
            ? prisma.tradingSession.findMany({
                where: { userId: dbUser.id },
                orderBy: { date: 'desc' },
                take: 50,
                select: {
                  date: true, instrumento: true, direccion: true, resultado: true,
                  pnlNeto: true, pnlBruto: true, comisiones: true, contratos: true,
                  entryPrice: true, exitPrice: true, stopLoss: true, takeProfit: true,
                  rrReal: true, siguioPlan: true, sentimiento: true, notas: true,
                },
              })
            : Promise.resolve([]),
          dbUser
            ? prisma.tradingPlan.findFirst({
                where: { userId: dbUser.id, active: true },
                orderBy: { createdAt: 'desc' },
              })
            : Promise.resolve(null),
          ragConditions
            ? (prisma as any).knowledgeDoc.findMany({
                where: { userId, OR: ragConditions },
                take: 3,
                orderBy: { createdAt: 'desc' as const },
                select: { title: true, description: true, content: true, source: true, tags: true },
              })
            : Promise.resolve([]),
        ])

        if (sessionsResult.status === 'fulfilled') sessions = sessionsResult.value as any[]
        if (planResult.status === 'fulfilled')     activePlan = planResult.value
        if (ragResult.status === 'fulfilled')      ragDocs = ragResult.value as any[]

      } catch (e) {
        console.error('Vinces DB fetch error:', e)
      }
    }

    // ── Metrics ────────────────────────────────────────────────────────────────
    const wins   = sessions.filter(s => s.resultado === 'WIN')
    const losses = sessions.filter(s => s.resultado === 'LOSS')
    const longs  = sessions.filter(s => s.direccion === 'LONG')
    const shorts = sessions.filter(s => s.direccion === 'SHORT')

    const pnlTotal    = sessions.reduce((sum, s) => sum + (s.pnlNeto || 0), 0)
    const winRate     = sessions.length ? ((wins.length / sessions.length) * 100).toFixed(1) : '0.0'
    const longWR      = longs.length ? ((longs.filter(s => s.resultado === 'WIN').length / longs.length) * 100).toFixed(1) : 'N/A'
    const shortWR     = shorts.length ? ((shorts.filter(s => s.resultado === 'WIN').length / shorts.length) * 100).toFixed(1) : 'N/A'
    const profitFactor = losses.length > 0
      ? (Math.abs(wins.reduce((s, t) => s + t.pnlNeto, 0)) /
         Math.abs(losses.reduce((s, t) => s + t.pnlNeto, 0))).toFixed(2)
      : wins.length > 0 ? 'inf' : '0.00'

    const outOfPlan   = sessions.filter(s => s.siguioPlan === false).length
    const rrRealAvg   = sessions.filter(s => s.rrReal != null).length > 0
      ? (sessions.filter(s => s.rrReal != null).reduce((s, t) => s + (t.rrReal || 0), 0) /
         sessions.filter(s => s.rrReal != null).length).toFixed(2)
      : 'N/A'

    const last10 = sessions.slice(0, 10).map(s =>
      `${String(s.date).slice(0, 10)} | ${s.instrumento} | ${s.direccion} | ${s.resultado} | PnL: $${(s.pnlNeto || 0).toFixed(2)}` +
      (s.rrReal != null ? ` | RR: ${s.rrReal.toFixed(2)}` : '') +
      (s.siguioPlan === false ? ' | [FUERA DE PLAN]' : '') +
      (s.sentimiento ? ` | Sentimiento: ${s.sentimiento}` : '') +
      (s.notas ? ` | Nota: ${s.notas.slice(0, 60)}` : '')
    ).join('\n') || 'Sin operaciones registradas'

    const userName = dbUser?.name || user?.email || 'Trader'

    // ── Trading plan context ───────────────────────────────────────────────────
    const planContext = activePlan
      ? `\n\nPLAN DE TRADING ACTIVO ("${activePlan.name}"):\n` +
        `- Instrumento: ${activePlan.instrumento}\n` +
        `- Capital inicial: $${activePlan.capitalInicial?.toLocaleString('en-US') ?? 'N/A'}\n` +
        `- Riesgo por trade: ${activePlan.riesgo}% ($${activePlan.riesgoPorTrade?.toFixed(2) ?? 'N/A'})\n` +
        `- RR objetivo: ${activePlan.rrRatio}:1\n` +
        `- Horario de operativa: ${activePlan.horaInicio} - ${activePlan.horaFin}\n` +
        `- Gestion del stop: ${activePlan.gestionStop}\n` +
        (activePlan.maxDrawdownPermitido ? `- Drawdown maximo permitido: ${activePlan.maxDrawdownPermitido}%\n` : '') +
        (activePlan.comisionPorTrade ? `- Comision por trade: $${activePlan.comisionPorTrade}\n` : '') +
        `- REGLAS DEL PLAN:\n${activePlan.reglas}`
      : '\n\nPLAN DE TRADING: No hay plan activo registrado.'

    // ── RAG context ────────────────────────────────────────────────────────────
    const ragContext = ragDocs.length > 0
      ? `\n\nBASE DE CONOCIMIENTO (documentos relevantes):\n` +
        ragDocs.map((d: any, i: number) =>
          `[DOC ${i + 1}] ${d.title}${d.source ? ` (${d.source})` : ''}\n` +
          (d.description ? `Resumen: ${d.description}\n` : '') +
          (d.content ? `Contenido: ${d.content.slice(0, 800)}\n` : '')
        ).join('\n')
      : ''

    // ── System prompt ──────────────────────────────────────────────────────────
    const systemPrompt = sanitizeText(
      `Eres Vinces, el coach de trading personal de ${userName}. ` +
      `Eres directo, analitico y honesto. No das senales de trading. ` +
      `Tu rol es coaching de ejecucion, disciplina y mejora continua. ` +
      `Tienes acceso al plan de trading real del usuario, sus reglas, parametros y todas sus sesiones registradas. ` +
      `Cuando evalues operaciones, compara siempre contra las reglas y parametros del plan activo. ` +
      `Cuando el usuario pregunte sobre temas financieros, usa primero la base de conocimiento si hay documentos relevantes. ` +
      `Respondes siempre en espanol de forma concisa y actionable.\n\n` +
      `METRICAS REALES DEL TRADER (${sessions.length} operaciones totales):\n` +
      `- Ganadoras: ${wins.length} | Perdedoras: ${losses.length}\n` +
      `- Win Rate global: ${winRate}%\n` +
      `- Win Rate LONG: ${longWR}% (${longs.length} ops) | Win Rate SHORT: ${shortWR}% (${shorts.length} ops)\n` +
      `- PnL neto total: $${pnlTotal.toFixed(2)}\n` +
      `- Profit Factor: ${profitFactor}\n` +
      `- RR promedio real: ${rrRealAvg}\n` +
      `- Operaciones fuera del plan: ${outOfPlan} de ${sessions.length}\n\n` +
      `ULTIMAS 10 OPERACIONES:\n${last10}` +
      planContext +
      ragContext +
      `\n\nCuando el usuario pregunte por sus estadisticas o su plan, usa los datos reales de arriba. ` +
      `Si detectas que salio del plan, mencionalo. Se breve. Usa listas cuando ayude.`
    )

    // Sanitize incoming user messages
    const mensajesSanitizados = (messages || []).map((m: any) => ({
      role: m.role,
      content: sanitizeText(String(m.content ?? '')),
    }))

    const result = await callAI({
      messages: [
        { role: 'system', content: systemPrompt },
        ...mensajesSanitizados,
      ],
      maxTokens: 1500,
      temperature: 0.7,
      httpReferer: process.env.NEXT_PUBLIC_APP_URL || 'https://libertytrading.pro',
      xTitle: 'Liberty Trading Club -- Vinces AI',
    })

    const content = result.content

    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    return NextResponse.json({ content, ragDocsFound: ragDocs.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
