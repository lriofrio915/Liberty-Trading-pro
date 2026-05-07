import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, authId } = await req.json()

    if (!email || !name || !authId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const user = await prisma.user.upsert({
      where: { authId },
      update: { name, phone },
      create: { email, name, phone, plan: 'FREE', authId },
    })

    return NextResponse.json({ user })
  } catch (err: any) {
    console.error('[Register] Error:', err?.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
