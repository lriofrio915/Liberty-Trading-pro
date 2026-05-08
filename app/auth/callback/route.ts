import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { notifyNewRegistration } from '@/lib/notify-nexus'

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

        // Notify nexus_claw about new registration
        if (dbUser) {
          notifyNewRegistration({
            name: meta.name || user.email!,
            email: user.email!,
            phone: meta.phone || null,
            plan: String(plan),
          }).catch(() => {})
        }
      }

      return NextResponse.redirect(`${origin}/login?confirmed=1`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link-invalido`)
}
