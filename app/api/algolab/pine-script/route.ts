// POST /api/algolab/pine-script
// Genera código Pine Script v5 para un patrón específico.

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { getEffectiveAccess } from '@/lib/access'
import { generatePineScript } from '@/lib/algolab-pine-script'
import { PATTERN_CATALOG } from '@/lib/algolab-patterns'

export const maxDuration = 10

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const access = getEffectiveAccess({ plan: dbUser.plan, trialEndsAt: dbUser.trialEndsAt })
    if (!access.canAccessClub) {
      return NextResponse.json({ error: 'Se requiere plan Club' }, { status: 403 })
    }

    const body = await req.json()
    const { patternId } = body as { patternId: string }
    if (!patternId) return NextResponse.json({ error: 'patternId es requerido' }, { status: 400 })

    const pattern = PATTERN_CATALOG.find(p => p.id === patternId)
    if (!pattern) return NextResponse.json({ error: 'Patrón no encontrado' }, { status: 404 })

    const code = generatePineScript(patternId, pattern.name, pattern.direction)
    return NextResponse.json({ code, patternId, patternName: pattern.name })
  } catch (err) {
    console.error('[algolab/pine-script POST]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
