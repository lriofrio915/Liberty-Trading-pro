import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, plan, authId } = await req.json()

    if (!email || !name || !authId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validPlans = ['FREE', 'CLUB', 'PRO', 'PORTFOLIO']
    const userPlan = validPlans.includes(plan) ? plan : 'FREE'

    const user = await prisma.user.upsert({
      where: { authId },
      update: { name, phone, plan: userPlan },
      create: { email, name, phone, plan: userPlan, authId },
    })

    return NextResponse.json({ user })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
