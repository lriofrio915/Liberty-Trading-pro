import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function calcStats(opps: {
  rendimiento12pm: number | null
  rendimiento3pm: number | null
  rendimientoFlip: number | null
  farosKillSwitch: boolean | null
}[]) {
  const closed = opps.filter(o => o.rendimiento3pm !== null || o.rendimiento12pm !== null)
  if (closed.length === 0) return { total: opps.length, closed: 0, winRate: null, avgRend: null, best: null, worst: null }

  const rends = closed.map(o => {
    // Use flip rendimiento if available (signal closed early), else 3pm, else 12pm
    return o.rendimientoFlip ?? o.rendimiento3pm ?? o.rendimiento12pm ?? 0
  })
  const wins = rends.filter(r => r > 0).length
  const winRate = (wins / rends.length) * 100
  const avgRend = rends.reduce((s, r) => s + r, 0) / rends.length
  const best = Math.max(...rends)
  const worst = Math.min(...rends)

  return { total: opps.length, closed: closed.length, winRate, avgRend, best, worst }
}

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scans = await prisma.marketScan.findMany({
    orderBy: { fecha: 'desc' },
    take: 30,
    include: {
      oportunidades: {
        orderBy: { confianza: 'desc' },
      },
    },
  })

  const result = scans.map(scan => {
    const all = scan.oportunidades
    const sinFaros = all
    const conFaros = all.filter(o => o.farosKillSwitch !== true)

    return {
      id:           scan.id,
      fecha:        scan.fecha,
      hora:         scan.hora,
      sesgogeneral: scan.sesgogeneral,
      resumen:      scan.resumen,
      riskProfile:  scan.riskProfile,
      createdAt:    scan.createdAt,
      stats: {
        sinFaros: calcStats(sinFaros),
        conFaros: calcStats(conFaros),
        vetadas:  all.filter(o => o.farosKillSwitch === true).length,
      },
      oportunidades: all,
    }
  })

  return NextResponse.json(result)
}
