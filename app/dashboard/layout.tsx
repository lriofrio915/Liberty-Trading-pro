import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
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
  // getSession() reads JWT from cookie — no network round-trip (~0ms).
  // Prisma query moved out of layout so the shell renders immediately on navigation.
  // Individual pages and client components load plan/notif data asynchronously.
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) redirect('/login')

  // Defaults — pages and client components load the real values asynchronously
  const canAccessClub = true   // SidebarNav shows all items; pages enforce access
  const initialNotifCount = 0  // TopBar fetches real count client-side on mount

  return (
    <ThemeProvider>
      <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>

        {/* Desktop sidebar */}
        <aside className="w-64 min-h-screen border-r border-[var(--border)] flex-col hidden md:flex"
          style={{ background: 'var(--bg-secondary)' }}>
          <div className="px-6 h-16 flex items-center border-b border-[var(--border)]">
            <Link href="/" className="text-lg font-black gradient-gold">Liberty Trading</Link>
          </div>
          <SidebarNav email={user.email ?? ''} canAccessClub={canAccessClub} />
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile nav (top bar + drawer + bottom tabs) */}
          <MobileNav email={user.email ?? ''} canAccessClub={canAccessClub} initialNotifCount={initialNotifCount} />

          {/* Desktop top bar — user controls (hidden on mobile) */}
          <TopBar email={user.email ?? ''} initialNotifCount={initialNotifCount} />

          {/* Trial banner — loads asynchronously via client component */}
          <TrialBanner
            isOnTrial={false}
            trialExpired={false}
            daysLeft={null}
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
