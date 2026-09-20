import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyPurchaseConfirmed } from '@/lib/notify-nexus'

const HOTMART_TOKEN = process.env.HOTMART_WEBHOOK_TOKEN || ''

// Map Hotmart product/offer codes to plans.
// 'CLUB' is the existing paid-access value in the Plan enum — it now represents
// "compró Liberty Quant" (the $1,000 one-time product), not the retired monthly
// subscription. Kept as-is to avoid a schema migration; see plan doc.
// Adjust these if Hotmart sends different identifiers
function planFromHotmart(event: any): 'CLUB' | null {
  const status = event?.data?.purchase?.status
  // Only upgrade on confirmed purchase
  if (!['APPROVED', 'COMPLETE', 'COMPLETED'].includes(status?.toUpperCase?.() ?? '')) return null
  return 'CLUB'
}

export async function POST(req: NextRequest) {
  // Validate token using timing-safe comparison to prevent timing attacks
  const token = req.headers.get('x-hotmart-hottok') || req.headers.get('authorization')?.replace('Bearer ', '')
  if (HOTMART_TOKEN) {
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const a = Buffer.from(token)
    const b = Buffer.from(HOTMART_TOKEN)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const plan = planFromHotmart(body)
  if (!plan) return NextResponse.json({ ok: true, skipped: true })

  // Extract buyer info from Hotmart payload
  const buyer = body?.data?.buyer
  const email = buyer?.email
  const name = buyer?.name || 'trader'
  const phone = buyer?.checkout_phone?.replace?.(/[\s\-\+\(\)]/g, '') || null

  if (!email) return NextResponse.json({ error: 'No email in payload' }, { status: 400 })

  // Update user plan
  const updated = await prisma.user.updateMany({
    where: { email: email.toLowerCase() },
    data: { plan, trialEndsAt: null }, // clear trial when paid
  })

  // If user not found, store for when they register
  if (updated.count === 0) {
    // User hasn't registered yet — pre-assign plan when they do
    // We'll handle this by storing their email→plan in a pending table
    // For now just log it
    console.log(`[Hotmart] Purchase for unregistered user: ${email}`)
  }

  // Confirmar la compra al comprador vía nexus_claw (no Evolution API directo)
  if (phone) {
    const firstName = name.split(' ')[0]
    notifyPurchaseConfirmed({
      name: firstName,
      phone,
      email,
      product: 'Liberty Quant',
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true, updated: updated.count })
}
