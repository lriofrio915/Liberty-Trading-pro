import { NextRequest, NextResponse } from 'next/server'
import { runFullAnalysis, type AssetAnalysis, type DistribucionItem, type EstrategiaResult } from '@/lib/analisis-engine'

export const runtime = 'nodejs'
export const maxDuration = 60

// Re-export types for consumers that imported from here
export type { AssetAnalysis, DistribucionItem, EstrategiaResult }

export async function POST(req: NextRequest) {
  try {
    const { riskProfile = 'moderado' } = await req.json()
    const result = await runFullAnalysis(riskProfile)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/analisis] error:', err)
    return NextResponse.json({ error: 'Error al ejecutar el análisis' }, { status: 500 })
  }
}
