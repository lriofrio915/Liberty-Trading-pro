import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'

/**
 * GET /api/mt5/download-ea
 * Returns the LibertyAutoTrade.mq5 file with the user's EA secret pre-filled.
 * Generates a secret if the user doesn't have one yet.
 */
export async function GET(_req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { authId: session.user.id } })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Get or create MT5Account with EA secret
  let mt5Account = await prisma.mT5Account.findUnique({ where: { userId: dbUser.id } })

  if (!mt5Account) {
    // Create a placeholder MT5Account for EA-only usage
    const secret = randomBytes(32).toString('hex')
    mt5Account = await prisma.mT5Account.create({
      data: {
        userId: dbUser.id,
        metaApiAccountId: `ea-only-${dbUser.id}`,
        login: '0',
        mt5EaSecret: secret,
      },
    })
  } else if (!mt5Account.mt5EaSecret) {
    const secret = randomBytes(32).toString('hex')
    mt5Account = await prisma.mT5Account.update({
      where: { id: mt5Account.id },
      data: { mt5EaSecret: secret },
    })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tu-dominio.com'

  // Read template EA file and inject user's secret + app URL
  let eaContent: string
  try {
    const templatePath = join(process.cwd(), 'mql5', 'LibertyAutoTrade.mq5')
    eaContent = readFileSync(templatePath, 'utf8')
    eaContent = eaContent
      .replace('input string InpAppUrl    = "https://libertytrading.pro";', `input string InpAppUrl    = "${appUrl}";`)
      .replace('input string InpEaSecret  = "";', `input string InpEaSecret  = "${mt5Account.mt5EaSecret}";`)
  } catch {
    return NextResponse.json({ error: 'EA template not found' }, { status: 500 })
  }

  return new NextResponse(eaContent, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="LibertyAutoTrade.mq5"',
    },
  })
}
