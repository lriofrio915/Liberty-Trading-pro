import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { runFullAnalysis, type AssetAnalysis, type DistribucionItem, type EstrategiaResult } from '@/lib/analisis-engine'

export const runtime = 'nodejs'
export const maxDuration = 60

// Re-export types for consumers that imported from here
export type { AssetAnalysis, DistribucionItem, EstrategiaResult }

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Plan check — only non-FREE users can trigger paid analysis
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } })
    if (!dbUser || dbUser.plan === 'FREE') {
      return NextResponse.json({ error: 'Plan upgrade required for market analysis' }, { status: 403 })
    }

    const { riskProfile = 'moderado' } = await req.json()
    const result = await Promise.race([
      runFullAnalysis(riskProfile),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Análisis timeout: los agentes tardaron demasiado. Intenta nuevamente.')),
          65000
        )
      ),
    ])
    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/analisis] error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al ejecutar el análisis' },
      { status: 500 }
    )
  }
}
