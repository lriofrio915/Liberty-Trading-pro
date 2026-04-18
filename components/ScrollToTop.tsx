'use client'

import { useEffect, useState } from 'react'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY
      const total = document.body.scrollHeight - window.innerHeight
      if (total > 0) setVisible(scrolled / total > 0.3)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-24 right-6 z-50 w-9 h-9 rounded-full
        flex items-center justify-center
        bg-black/60 backdrop-blur-sm border border-white/10
        text-white/60 hover:text-white hover:border-yellow-500/40 hover:bg-black/80
        transition-all duration-200 opacity-70 hover:opacity-100
        shadow-lg"
      aria-label="Volver arriba"
    >
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
        <path d="M10 16V4M4 10l6-6 6 6" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
