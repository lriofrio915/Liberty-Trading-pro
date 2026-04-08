import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getEffectiveAccess } from '@/lib/access'
import SidebarNav from '@/components/Sidebar/SidebarNav'
import MobileNav from '@/components/Sidebar/MobileNav'
import TopBar from '@/components/Dashboard/TopBar'
import VincesWidget from '@/components/VincesWidget/VincesWidget'
import ThemeProvider from '@/components/ThemeProvider'
import TrialBanner from '@/components/TrialBanner/TrialBanner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { id: true, plan: true, trialEndsAt: true },
  }).catch(() => null)

  const access = dbUser
    ? getEffectiveAccess({ plan: dbUser.plan, trialEndsAt: dbUser.trialEndsAt })
    : { isOnTrial: false, trialDaysLeft: null, trialExpired: false, canAccessClub: false, level: 'FREE' as const }

  const initialNotifCount = dbUser
    ? await prisma.notification.count({ where: { userId: dbUser.id, read: false } }).catch(() => 0)
    : 0

  return (
    <ThemeProvider>
      <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>

        {/* Desktop sidebar */}
        <aside className="w-64 min-h-screen border-r border-[var(--border)] flex-col hidden md:flex"
          style={{ background: 'var(--bg-secondary)' }}>
          <div className="px-6 h-16 flex items-center border-b border-[var(--border)]">
            <Link href="/" className="text-lg font-black gradient-gold">Liberty Trading</Link>
          </div>
          <SidebarNav email={user.email ?? ''} canAccessClub={access.canAccessClub} />
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile nav (top bar + drawer + bottom tabs) */}
          <MobileNav email={user.email ?? ''} canAccessClub={access.canAccessClub} initialNotifCount={initialNotifCount} />

          {/* Desktop top bar — user controls (hidden on mobile) */}
          <TopBar email={user.email ?? ''} initialNotifCount={initialNotifCount} />

          {/* Trial banner — shown when on trial or expired */}
          <TrialBanner
            isOnTrial={access.isOnTrial}
            trialExpired={access.trialExpired}
            daysLeft={access.trialDaysLeft}
          />

          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-8 pb-24 md:pb-8">
              {children}
            </div>
          </main>
        </div>

        <VincesWidget />
      </div>
    </ThemeProvider>
  )
}
