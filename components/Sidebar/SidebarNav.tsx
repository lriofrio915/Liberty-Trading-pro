'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navGroups } from './navConfig'

const ADMIN_EMAIL = 'lriofrio915@gmail.com'

// ── Main nav ───────────────────────────────────────────────────────────────────

export default function SidebarNav({ email, canAccessClub }: { email: string; canAccessClub: boolean }) {
  const pathname = usePathname()
  const isAdmin = email === ADMIN_EMAIL

  return (
    <nav className="flex-1 px-3 py-4 flex flex-col">
      <div className="flex-1 space-y-5">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-4 mb-1.5 text-[9px] uppercase tracking-widest font-semibold"
                style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href
                const locked = item.requiresClub && !canAccessClub
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                      active
                        ? 'bg-yellow-500/20 text-yellow-400 border-l-2 border-yellow-400'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {locked && <span className="text-[10px]" style={{ color: '#444' }}>🔒</span>}
                  </Link>
                )
              })}
              {gi === navGroups.length - 1 && isAdmin && (
                <>
                  <Link
                    href="/dashboard/leads"
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                      pathname === '/dashboard/leads'
                        ? 'bg-yellow-500/20 text-yellow-400 border-l-2 border-yellow-400'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="text-base">⚙️</span>
                    <span>Administración</span>
                  </Link>
                  <Link
                    href="/dashboard/clientes"
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                      pathname === '/dashboard/clientes'
                        ? 'bg-yellow-500/20 text-yellow-400 border-l-2 border-yellow-400'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="text-base">🤝</span>
                    <span>Clientes KYC</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

    </nav>
  )
}
