'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navItems } from './navConfig'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function SidebarNav() {
  const pathname = usePathname()

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className="flex-1 px-3 py-6 flex flex-col">
      <div className="space-y-1 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer text-sm ${
              pathname === item.href
                ? 'bg-yellow-500/20 text-yellow-400 border-l-2 border-yellow-400'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 w-full text-gray-500 hover:text-red-400 hover:bg-red-900/10 transition-colors text-sm font-mono tracking-widest mt-4"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16,17 21,12 16,7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        CERRAR SESION
      </button>
    </nav>
  )
}
