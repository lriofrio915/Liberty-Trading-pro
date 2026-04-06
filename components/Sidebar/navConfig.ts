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
      { href: '/dashboard/planes',       icon: '📋', label: 'Planes',          requiresClub: false },
      { href: '/dashboard/championship', icon: '🏆', label: 'Championship',    requiresClub: false },
      { href: '/dashboard/monitor',      icon: '🌍', label: 'Monitor Mundial', requiresClub: false },
    ],
  },
  {
    label: 'Club',
    items: [
      { href: '/dashboard/analisis',       icon: '🔍', label: 'Análisis',      requiresClub: true },
      { href: '/dashboard/oportunidades', icon: '🎯', label: 'Oportunidades', requiresClub: true },
      { href: '/dashboard/track-record',  icon: '📈', label: 'Track Record',  requiresClub: true },
      { href: '/dashboard/reportes',      icon: '📄', label: 'Reportes',      requiresClub: true },
      { href: '/dashboard/comunidad',     icon: '🤝', label: 'Comunidad',     requiresClub: true },
      { href: '/dashboard/academia',      icon: '🎓', label: 'Academia',      requiresClub: true },
      { href: '/dashboard/algolab',        icon: '🤖', label: 'AlgoLab',      requiresClub: true },
    ],
  },
]

// Flat list kept for bottom tabs
export const navItems = navGroups.flatMap(g => g.items)
