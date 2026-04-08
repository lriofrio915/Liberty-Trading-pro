'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { navItems, navGroups } from './navConfig'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import NotificationBell from '@/components/Notifications/NotificationBell'

const ADMIN_EMAIL = 'lriofrio915@gmail.com'

// Bottom tab items (most used)
const BOTTOM_TABS = [
  { href: '/dashboard',            icon: '📊', label: 'Inicio' },
  { href: '/dashboard/track-record', icon: '📈', label: 'Record' },
  { href: '/dashboard/comunidad',  icon: '🤝', label: 'Comunidad' },
  { href: '/dashboard/academia',   icon: '🎓', label: 'Academia' },
]

function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)
  useEffect(() => {
    setIsDark(localStorage.getItem('lt_theme') !== 'light')
  }, [])
  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.remove('light')
      localStorage.setItem('lt_theme', 'dark')
    } else {
      document.documentElement.classList.add('light')
      localStorage.setItem('lt_theme', 'light')
    }
  }
  return (
    <button onClick={toggle}
      className="flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors"
      style={{ color: 'var(--text-muted)' }}>
      <span className="text-base">{isDark ? '🌙' : '☀️'}</span>
      <span>{isDark ? 'Modo oscuro' : 'Modo claro'}</span>
      <div className={`ml-auto relative w-9 h-5 rounded-full transition-colors ${isDark ? 'bg-[var(--gold-dark)]' : 'bg-[var(--border)]'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isDark ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
    </button>
  )
}

export default function MobileNav({ email, canAccessClub, initialNotifCount }: { email: string; canAccessClub: boolean; initialNotifCount: number }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const isAdmin = email === ADMIN_EMAIL

  // Close drawer on route change
  useEffect(() => { setOpen(false) }, [pathname])

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  async function logout() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const adminItem = isAdmin ? { href: '/dashboard/leads', icon: '⚙️', label: 'Administración', requiresClub: false } : null

  return (
    <>
      {/* ── Top bar ── */}
      <div className="md:hidden sticky top-0 z-40 border-b border-[var(--border)] px-4 h-14 flex items-center justify-between"
        style={{ background: 'var(--bg-secondary)' }}>
        <Link href="/dashboard" className="text-base font-black gradient-gold">
          Liberty Trading
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell initialCount={initialNotifCount} />
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col gap-1.5 p-2 rounded-lg transition-colors hover:bg-white/5"
            aria-label="Abrir menú"
          >
            <span className="block w-5 h-0.5 rounded" style={{ background: 'var(--text-secondary)' }} />
            <span className="block w-5 h-0.5 rounded" style={{ background: 'var(--text-secondary)' }} />
            <span className="block w-4 h-0.5 rounded" style={{ background: 'var(--text-secondary)' }} />
          </button>
        </div>
      </div>

      {/* ── Drawer overlay ── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Drawer panel ── */}
      <div
        className={`md:hidden fixed top-0 left-0 bottom-0 z-50 flex flex-col w-72 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 h-14 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}>
          <Link href="/" className="text-base font-black gradient-gold">Liberty Trading</Link>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-white transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="px-4 mb-1.5 text-[9px] uppercase tracking-widest font-semibold"
                  style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const active = pathname === item.href
                  const locked = item.requiresClub && !canAccessClub
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                        active
                          ? 'bg-yellow-500/20 text-yellow-400 border-l-2 border-yellow-400'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="text-lg w-6 flex-shrink-0 text-center">{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {locked && <span className="text-[10px]" style={{ color: '#444' }}>🔒</span>}
                      {active && !locked && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-400" />}
                    </Link>
                  )
                })}
                {gi === navGroups.length - 1 && adminItem && (
                  <Link
                    href={adminItem.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                      pathname === adminItem.href
                        ? 'bg-yellow-500/20 text-yellow-400 border-l-2 border-yellow-400'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="text-lg w-6 flex-shrink-0 text-center">{adminItem.icon}</span>
                    <span className="flex-1">{adminItem.label}</span>
                  </Link>
                )}
              </div>
            </div>
          ))}

          {/* Ajustes */}
          <div>
            <p className="px-4 mb-1.5 text-[9px] uppercase tracking-widest font-semibold"
              style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
              Ajustes
            </p>
            <div className="space-y-0.5">
              {[
                { href: '/dashboard/profile',      icon: '👤', label: 'Mi Perfil'     },
                { href: '/dashboard/conocimiento',  icon: '📚', label: 'Conocimiento'  },
                { href: '/dashboard/retiros',       icon: '💸', label: 'Retiros'       },
              ].map(item => {
                const active = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                      active ? 'bg-yellow-500/20 text-yellow-400 border-l-2 border-yellow-400' : 'text-gray-500 hover:bg-white/5 hover:text-white'
                    }`}>
                    <span className="text-lg w-6 flex-shrink-0 text-center">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-400" />}
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Bottom: theme + user + logout */}
        <div className="border-t flex-shrink-0 pb-safe" style={{ borderColor: 'var(--border)' }}>
          <ThemeToggle />
          <div className="px-4 py-2">
            <p className="text-[11px] truncate mb-2" style={{ color: 'var(--text-muted)' }}>{email}</p>
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm transition-colors hover:bg-red-900/20"
              style={{ color: '#ef4444' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom tab bar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {BOTTOM_TABS.map(tab => {
          const active = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href))
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors"
              style={{ color: active ? 'var(--gold)' : 'var(--text-muted)' }}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {active && <span className="absolute top-0 w-8 h-0.5 rounded-b" style={{ background: 'var(--gold)' }} />}
            </Link>
          )
        })}
        {/* "Más" button opens drawer */}
        <button
          onClick={() => setOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <span className="text-xl leading-none">☰</span>
          <span className="text-[10px] font-medium">Más</span>
        </button>
      </div>
    </>
  )
}
