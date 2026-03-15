import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

function normalizePnl(pnl: number, resultado: string): number {
  const abs = Math.abs(pnl)
  if (resultado === 'WIN') return abs
  if (resultado === 'LOSS') return -abs
  return pnl
}

function normalizeResultado(val: string): string {
  const v = val.toUpperCase().trim()
  if (['WIN', 'GANADOR', 'GANADORA', 'W', 'G'].includes(v)) return 'WIN'
  if (['LOSS', 'PERDEDOR', 'PERDEDORA', 'L', 'P'].includes(v)) return 'LOSS'
  return 'BREAKEVEN'
}

function normalizeDireccion(val: string): string {
  const v = val.toUpperCase().trim()
  if (['LONG', 'COMPRA', 'BUY', 'L'].includes(v)) return 'LONG'
  return 'SHORT'
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const { rows } = await req.json() as { rows: Record<string, string>[] }
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Sin filas para importar' }, { status: 400 })
    }

    const created = await prisma.$transaction(
      rows.map((r) => {
        const resultado = normalizeResultado(r.resultado || r.result || r.Resultado || '')
        const pnlRaw = parseFloat(r.pnl_neto ?? r.pnlneto ?? r.pnl ?? r.ganancia ?? r.PnL ?? '0') || 0
        const pnlNeto = normalizePnl(pnlRaw, resultado)
        const dateStr = r.fecha ?? r.date ?? r.Fecha ?? r.Date ?? ''
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) throw new Error(`Fecha inválida: "${dateStr}"`)

        return prisma.tradingSession.create({
          data: {
            userId: dbUser.id,
            date,
            instrumento: (r.instrumento ?? r.instrument ?? r.Instrumento ?? 'NQ').toUpperCase(),
            direccion: normalizeDireccion(r.direccion ?? r.direction ?? r.Direccion ?? 'LONG'),
            resultado,
            pnlBruto: parseFloat(r.pnl_bruto ?? r.pnlbruto ?? '0') || pnlNeto,
            comisiones: parseFloat(r.comisiones ?? r.commission ?? '0') || 0,
            pnlNeto,
            contratos: parseInt(r.contratos ?? r.contracts ?? r.qty ?? '1') || 1,
            entryPrice: r.entry_price ?? r.entrada ?? r.entryprice ? parseFloat(r.entry_price ?? r.entrada ?? r.entryprice ?? '') || null : null,
            exitPrice: r.exit_price ?? r.salida ?? r.exitprice ? parseFloat(r.exit_price ?? r.salida ?? r.exitprice ?? '') || null : null,
            siguioPlan: !['false', 'no', '0'].includes(String(r.siguio_plan ?? r.siguioplan ?? 'true').toLowerCase()),
            sentimiento: r.sentimiento ?? r.sentiment ?? null,
            notas: r.notas ?? r.notes ?? r.comentarios ?? null,
          },
        })
      })
    )

    return NextResponse.json({ imported: created.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
