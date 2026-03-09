'use client'

import { useEffect } from 'react'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = localStorage.getItem('lt_theme')
    if (saved === 'light') {
      document.documentElement.classList.add('light')
    }
  }, [])

  return <>{children}</>
}
