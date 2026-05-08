import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/scan-today
 * Returns today's MarketScan with its ScanOpportunity[] for the CFD signals table.
 * Auto-populated by the 09:00am cron job.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

  const scan = await prisma.marketScan.findFirst({
    where: { fecha: { gte: today, lt: tomorrow } },
    include: {
      oportunidades: {
        orderBy: { confianza: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!scan) {
    return NextResponse.json({ scan: null, oportunidades: [] })
  }

  return NextResponse.json({
    scan: {
      id: scan.id,
      fecha: scan.fecha,
      hora: scan.hora,
      sesgogeneral: scan.sesgogeneral,
      resumen: scan.resumen,
    },
    oportunidades: scan.oportunidades,
  })
}
