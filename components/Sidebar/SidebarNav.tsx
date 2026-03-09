'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { navItems } from './navConfig'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

// ── Theme toggle ───────────────────────────────────────────────────────────────

function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('lt_theme')
    setIsDark(saved !== 'light')
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
    <button
      onClick={toggle}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
    >
      {/* Track */}
      <div className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${isDark ? 'bg-[var(--gold-dark)]' : 'bg-[var(--border)]'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isDark ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
      <span className="font-mono tracking-wider text-[9px] uppercase">
        {isDark ? 'Modo oscuro' : 'Modo claro'}
      </span>
    </button>
  )
}

// ── Gear dropdown ──────────────────────────────────────────────────────────────

function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-[var(--text-muted)] truncate">{email}</div>
        </div>
        <button
          onClick={() => setOpen(v => !v)}
          title="Opciones de cuenta"
          className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${open ? 'bg-[var(--gold)]/20 text-[var(--gold)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}`}
        >
          {/* Gear icon */}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute bottom-full left-2 right-2 mb-1 rounded-xl border border-[var(--border)] shadow-2xl overflow-hidden z-50"
          style={{ background: 'var(--bg-card)' }}>
          <Link
            href="/dashboard/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Mi Perfil
          </Link>
          <Link
            href="/dashboard/retiros"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            Retiros
          </Link>
          <div className="border-t border-[var(--border)]" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--text-muted)] hover:text-[var(--red)] hover:bg-red-900/10 transition-colors w-full"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main nav ───────────────────────────────────────────────────────────────────

export default function SidebarNav({ email }: { email: string }) {
  const pathname = usePathname()

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

      {/* Bottom section */}
      <div className="border-t border-[var(--border)] pt-2 space-y-1">
        <ThemeToggle />
        <UserMenu email={email} />
      </div>
    </nav>
  )
}
