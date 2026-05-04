import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET /api/cfds/signals — últimas 50 señales guardadas */
export async function GET(_req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const signals = await prisma.cfdSignal.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(signals)
}

/** POST /api/cfds/signals — guardar batch de señales del análisis */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const signals: unknown[] = Array.isArray(body.signals) ? body.signals : []

  if (signals.length === 0) {
    return NextResponse.json({ error: 'No hay señales para guardar' }, { status: 400 })
  }

  const created = await prisma.cfdSignal.createMany({
    data: signals.map((s: any) => ({
      simbolo:       String(s.simbolo ?? ''),
      nombre:        String(s.nombre ?? ''),
      sector:        String(s.sector ?? ''),
      sesgo:         String(s.sesgo ?? 'COMPRA'),
      confianza:     Number(s.confianza ?? 70),
      razon:         String(s.razon ?? ''),
      precioEntrada: Number(s.precioEntrada ?? 0),
      stopLoss:      Number(s.stopLoss ?? 0),
      takeProfit:    Number(s.takeProfit ?? 0),
      lotaje:        Number(s.lotaje ?? 0.01),
      riesgoUsd:     Number(s.riesgoUsd ?? 10),
      rrRatio:       Number(s.rrRatio ?? 2),
      riskProfile:   String(s.riskProfile ?? 'moderado'),
      farosSesgo:    s.farosSesgo ? String(s.farosSesgo) : null,
      farosRegimen:  s.farosRegimen ? String(s.farosRegimen) : null,
      psiScore:      s.psiScore != null ? Number(s.psiScore) : null,
      killSwitch:    Boolean(s.killSwitch ?? false),
    })),
    skipDuplicates: false,
  })

  return NextResponse.json({ saved: created.count }, { status: 201 })
}
