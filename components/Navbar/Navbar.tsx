'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { BRAND } from '@/lib/brand'

const NAV_LINKS = [
  { href: '#servicios', label: 'Servicios' },
  { href: '#sobre-luis', label: 'Sobre Luis' },
  { href: '#precios', label: 'Precio' },
]

interface NavbarProps {
  initialUser?: User | null
}

export default function Navbar({ initialUser = null }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  // Start with server-resolved user — eliminates flash of wrong buttons on hydration
  const [user, setUser] = useState<User | null>(initialUser)

  useEffect(() => {
    const supabase = createClient()

    // Sync in case session changed since SSR (e.g. tab was left open, token refreshed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)]"
      style={{ background: 'rgba(8,8,8,0.96)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex flex-col leading-none">
          <span className="headline text-lg gradient-gold">{BRAND.name}</span>
          <span className="label-mono text-[8px] hidden sm:block">{BRAND.role}</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}
              className="label-mono text-[11px] text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors">
              {link.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard"
              className="btn-gold text-[11px] py-2 px-4 rounded-md cursor-pointer select-none">
              Mi Dashboard →
            </Link>
          ) : (
            <>
              <Link href="/login"
                className="hidden sm:block label-mono text-[11px] text-[var(--text-muted)] hover:text-white transition-colors px-3 py-1.5 cursor-pointer select-none">
                Ingresar
              </Link>
              <Link href="/register"
                className="btn-gold text-[11px] py-2 px-4 rounded-md cursor-pointer select-none">
                Comenzar
              </Link>
            </>
          )}
          {/* Mobile hamburger */}
          <button className="lg:hidden text-[var(--text-secondary)] ml-1 p-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-[var(--border)] px-4 py-5 flex flex-col gap-4"
          style={{ background: 'rgba(8,8,8,0.98)' }}>
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
              className="label-mono text-[11px] text-[var(--text-secondary)] hover:text-[var(--gold)] transition-colors">
              {link.label}
            </a>
          ))}
          {user ? (
            <Link href="/dashboard" onClick={() => setMenuOpen(false)}
              className="label-mono text-[11px] text-[var(--gold)] hover:text-white transition-colors cursor-pointer">
              Mi Dashboard →
            </Link>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)}
              className="label-mono text-[11px] text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer">
              Ingresar
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
