import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { sendWA } from '@/lib/sendWA'

const TRIAL_DAYS = 14

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const meta = user.user_metadata || {}
        const validPlans = ['FREE', 'CLUB', 'PRO', 'PORTFOLIO']
        const plan = validPlans.includes(meta.plan) ? meta.plan : 'FREE'
        const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 86_400_000)
        const displayName = meta.name && !meta.name.includes('@') ? meta.name.split(' ')[0] : 'trader'

        const dbUser = await prisma.user.upsert({
          where: { authId: user.id },
          update: { name: meta.name || user.email!, phone: meta.phone || null },
          create: {
            email: user.email!,
            name: meta.name || user.email!,
            phone: meta.phone || null,
            plan,
            authId: user.id,
            trialEndsAt,
          },
        }).catch(() => null)

        // Send welcome WA if phone available
        if (dbUser && meta.phone) {
          const phone = meta.phone.replace(/[\s\-\+\(\)]/g, '')
          const msg = `¡Hola ${displayName}! 👋 Bienvenido a *Liberty Trading Pro*.

Tu cuenta está activa. Tienes *${TRIAL_DAYS} días de prueba GRATUITA* para explorar todas las funcionalidades:

📈 Track Record
🎯 Oportunidades de mercado
🎓 Academia completa
🤝 Comunidad de traders
🤖 Vinces (IA asistente)
📊 Reportes avanzados

Después del período de prueba puedes continuar con el *Plan Club* para mantener acceso completo.

¡Empieza hoy! 🚀
${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
          sendWA(phone, msg).catch(() => {})
        }
      }

      return NextResponse.redirect(`${origin}/login?confirmed=1`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link-invalido`)
}
