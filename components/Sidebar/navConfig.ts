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
      { href: '/dashboard/flujo',           icon: '🌊', label: 'Flujo del Dinero',   requiresClub: true },
      { href: '/dashboard/futuros',         icon: '📈', label: 'Futuros',             requiresClub: true },
      { href: '/dashboard/acciones',        icon: '💼', label: 'Acciones',            requiresClub: true },
      { href: '/dashboard/opciones',        icon: '⌁', label: 'Opciones',            requiresClub: true },
      { href: '/dashboard/analisis',        icon: '📊', label: 'CFDs',                requiresClub: true },
      { href: '/dashboard/vibe',            icon: '🧠', label: 'Laboratorio Quant',   requiresClub: true },
    ],
  },
]

// Flat list kept for bottom tabs
export const navItems = navGroups.flatMap(g => g.items)
