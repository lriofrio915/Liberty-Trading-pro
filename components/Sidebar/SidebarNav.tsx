'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/dashboard/vinces', icon: '🤖', label: 'Vinces AI' },
  { href: '/dashboard/oportunidades', icon: '🎯', label: 'Oportunidades' },
  { href: '/dashboard/track-record', icon: '📈', label: 'Track Record' },
  { href: '/dashboard/planes', icon: '📋', label: 'Planes' },
  { href: '/dashboard/reportes', icon: '📄', label: 'Reportes' },
  { href: '/dashboard/monitor', icon: '🌍', label: 'Monitor Mundial' },
]

export { navItems }

export default function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-6 space-y-1">
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
    </nav>
  )
}
