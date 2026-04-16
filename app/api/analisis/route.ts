import { NextRequest, NextResponse } from 'next/server'
import { runFullAnalysis, type AssetAnalysis, type DistribucionItem, type EstrategiaResult } from '@/lib/analisis-engine'

export const runtime = 'nodejs'
export const maxDuration = 60

// Re-export types for consumers that imported from here
export type { AssetAnalysis, DistribucionItem, EstrategiaResult }

export async function POST(req: NextRequest) {
  try {
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
