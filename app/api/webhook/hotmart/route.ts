import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWA } from '@/lib/sendWA'

const HOTMART_TOKEN = process.env.HOTMART_WEBHOOK_TOKEN || ''

// Map Hotmart product/offer codes to plans
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

  // Send WA confirmation
  if (phone) {
    const firstName = name.split(' ')[0]
    const msg = `🎉 ¡Bienvenido al *Club Liberty Trading Pro*, ${firstName}!

Tu suscripción está activa. Ahora tienes acceso completo a:

📈 Track Record ilimitado
🎯 Oportunidades de mercado en tiempo real
🎓 Academia completa con todos los módulos
🤝 Comunidad exclusiva de traders
🤖 Vinces (IA asistente personal)
📊 Reportes avanzados y análisis

Ingresa ahora: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

¡A operar! 🚀`
    sendWA(phone, msg).catch(() => {})
  }

  return NextResponse.json({ ok: true, updated: updated.count })
}
