import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

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

        await prisma.user.upsert({
          where: { authId: user.id },
          update: { name: meta.name || user.email!, phone: meta.phone || null },
          create: {
            email: user.email!,
            name: meta.name || user.email!,
            phone: meta.phone || null,
            plan,
            authId: user.id,
          },
        }).catch(() => {})
      }

      return NextResponse.redirect(`${origin}/login?confirmed=1`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link-invalido`)
}
