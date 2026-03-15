import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import SidebarNav from '@/components/Sidebar/SidebarNav'
import MobileNav from '@/components/Sidebar/MobileNav'
import VincesWidget from '@/components/VincesWidget/VincesWidget'
import ThemeProvider from '@/components/ThemeProvider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <ThemeProvider>
      <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>

        {/* Desktop sidebar */}
        <aside className="w-64 min-h-screen border-r border-[var(--border)] flex-col hidden md:flex"
          style={{ background: 'var(--bg-secondary)' }}>
          <div className="px-6 h-16 flex items-center border-b border-[var(--border)]">
            <Link href="/" className="text-lg font-black gradient-gold">Liberty Trading</Link>
          </div>
          <SidebarNav email={user.email ?? ''} />
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile nav (top bar + drawer + bottom tabs) */}
          <MobileNav email={user.email ?? ''} />

          <main className="flex-1 overflow-auto">
            {/* Extra bottom padding on mobile for the tab bar */}
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
