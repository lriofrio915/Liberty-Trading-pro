import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export async function DELETE() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const activas = await prisma.optionRecommendation.findMany({
    where: { status: 'ACTIVA', active: true },
    orderBy: { publishedAt: 'desc' },
  })

  const seen = new Map<string, boolean>()
  const toDeactivate: string[] = []
  for (const rec of activas) {
    const key = `${rec.ticker}|${rec.strategy}`
    if (seen.has(key)) {
      toDeactivate.push(rec.id)
    } else {
      seen.set(key, true)
    }
  }

  if (toDeactivate.length > 0) {
    await prisma.optionRecommendation.updateMany({
      where: { id: { in: toDeactivate } },
      data: { active: false },
    })
  }

  return NextResponse.json({ deleted: toDeactivate.length })
}
