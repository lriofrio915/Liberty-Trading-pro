'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLang } from '@/contexts/LanguageContext'

export default function Navbar() {
  const { lang, setLang, t } = useLang()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { href: '#servicios', label: t('Servicios', 'Services') },
    { href: '#precios', label: t('Planes', 'Plans') },
    { href: '#sobre-luis', label: t('Sobre Luis', 'About Luis') },
    { href: '/p2p', label: 'P2P Crypto' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)]"
      style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-black gradient-gold tracking-tight">
            Liberty Trading Pro
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--gold)] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Lang toggle */}
          <button
            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
            className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors px-2 py-1 border border-[var(--border)] rounded"
          >
            {lang === 'es' ? 'EN' : 'ES'}
          </button>

          <Link href="/login" className="hidden sm:block text-sm text-[var(--text-secondary)] hover:text-white transition-colors">
            {t('Ingresar', 'Login')}
          </Link>

          <Link href="/register" className="btn-gold text-sm py-2 px-4 rounded-lg">
            {t('Comenzar', 'Get Started')}
          </Link>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-[var(--text-secondary)] ml-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[var(--border)] px-4 py-4 flex flex-col gap-4"
          style={{ background: '#000' }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--gold)] transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/login" onClick={() => setMenuOpen(false)}
            className="text-sm text-[var(--text-secondary)] hover:text-white">
            {t('Ingresar', 'Login')}
          </Link>
        </div>
      )}
    </nav>
  )
}
