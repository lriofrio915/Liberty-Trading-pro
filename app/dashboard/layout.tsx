import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import SidebarNav from '@/components/Sidebar/SidebarNav'
import { navItems } from '@/components/Sidebar/navConfig'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside className="w-64 min-h-screen border-r border-[var(--border)] flex flex-col hidden md:flex"
        style={{ background: 'var(--bg-secondary)' }}>
        <div className="px-6 h-16 flex items-center border-b border-[var(--border)]">
          <Link href="/" className="text-lg font-black gradient-gold">Liberty Trading</Link>
        </div>

        <SidebarNav />

        <div className="px-4 py-4 border-t border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)] mb-1 truncate">{user.email}</div>
          <form action="/api/auth/logout" method="POST">
            <button className="text-xs text-[var(--text-muted)] hover:text-[var(--red)] transition-colors">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="md:hidden border-b border-[var(--border)] px-4 h-14 flex items-center justify-between"
          style={{ background: 'var(--bg-secondary)' }}>
          <Link href="/" className="text-base font-black gradient-gold">Liberty Trading</Link>
          <div className="flex gap-2 overflow-x-auto">
            {navItems.slice(0, 3).map((item) => (
              <Link key={item.href} href={item.href}
                className="text-xl p-1 text-[var(--text-secondary)] hover:text-[var(--gold)]">
                {item.icon}
              </Link>
            ))}
          </div>
        </div>

        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  )
}
