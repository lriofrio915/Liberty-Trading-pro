export interface NavItem {
  href: string
  icon: string
  label: string
  requiresClub: boolean
}

export interface NavGroup {
  label: string | null
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: null,
    items: [
      { href: '/dashboard',              icon: '📊', label: 'Dashboard',       requiresClub: false },
      { href: '/dashboard/academia',     icon: '🎓', label: 'Academia',        requiresClub: false },
      { href: '/dashboard/comunidad',    icon: '🤝', label: 'Comunidad',       requiresClub: false },
      { href: '/dashboard/championship', icon: '🏆', label: 'Championship',    requiresClub: false },
      { href: '/dashboard/monitor',      icon: '🌍', label: 'Monitor Mundial', requiresClub: false },
    ],
  },
  {
    label: 'Club',
    items: [
      { href: '/dashboard/planes',        icon: '📋', label: 'Plan de Trading',          requiresClub: true },
      { href: '/dashboard/analisis',      icon: '🧭', label: 'Sesgo del Día',            requiresClub: true },
      { href: '/dashboard/oportunidades', icon: '📈', label: 'Oportunidades de Inversión', requiresClub: true },
      { href: '/dashboard/track-record',  icon: '📊', label: 'Track Record',              requiresClub: true },
      { href: '/dashboard/reportes',      icon: '📄', label: 'Reportes',                  requiresClub: true },
      { href: '/dashboard/vibe',          icon: '🧠', label: 'Copiloto IA',               requiresClub: true },
    ],
  },
]

// Flat list kept for bottom tabs
export const navItems = navGroups.flatMap(g => g.items)
