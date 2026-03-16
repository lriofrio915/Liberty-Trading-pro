import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.upsert({
      where: { authId: user.id },
      update: {},
      create: {
        authId: user.id,
        email: user.email ?? user.id,
        name: (user.user_metadata?.name as string) || user.email?.split('@')[0] || 'Trader',
      },
    })

    // Stats summary
    const sessions = await prisma.tradingSession.findMany({ where: { userId: dbUser.id } })
    const wins = sessions.filter(s => s.resultado === 'WIN')
    const pnlTotal = sessions.reduce((sum, s) => sum + (s.pnlNeto || 0), 0)
    const winRate = sessions.length ? (wins.length / sessions.length) * 100 : 0
    const planesCount = await prisma.tradingPlan.count({ where: { userId: dbUser.id } })
    const certificates = await (prisma as any).certificate.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      user: dbUser,
      stats: {
        totalTrades: sessions.length,
        winRate: parseFloat(winRate.toFixed(1)),
        pnlTotal: parseFloat(pnlTotal.toFixed(2)),
        planesCount,
      },
      certificates,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, phone, avatarUrl, bio, country, tradingStyle } = await req.json()

    const dbUser = await prisma.user.update({
      where: { authId: user.id },
      data: {
        ...(name?.trim() && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(avatarUrl !== undefined && { avatarUrl: avatarUrl || null }),
        ...(bio !== undefined && { bio: bio?.trim() || null }),
        ...(country !== undefined && { country: country?.trim() || null }),
        ...(tradingStyle !== undefined && { tradingStyle: tradingStyle?.trim() || null }),
      },
    })

    return NextResponse.json({ user: dbUser })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
