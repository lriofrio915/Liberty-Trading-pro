// GET /api/lab/scans
// Returns scan history with opportunities — admin only

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// Admin emails allowed to access the lab
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())

export async function GET(req: NextRequest) {
  // Auth check
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase())
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '30'), 90)
  const offset = parseInt(url.searchParams.get('offset') ?? '0')

  const [scans, total] = await Promise.all([
    prisma.marketScan.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        oportunidades: {
          orderBy: { confianza: 'desc' },
        },
      },
    }),
    prisma.marketScan.count(),
  ])

  return NextResponse.json({ scans, total, limit, offset })
}
