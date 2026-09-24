export interface NavItem {
  href: string
  icon: string
  label: string
  requiresClub: boolean
  /** Solo visible para el admin. */
  adminOnly?: boolean
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
    ],
  },
  {
    label: 'Club',
    items: [
      { href: '/dashboard/futuros',         icon: '📈', label: 'Futuros',             requiresClub: true },
      { href: '/dashboard/acciones',        icon: '💼', label: 'Acciones',            requiresClub: true },
    ],
  },
  {
    label: 'Agentes IA',
    items: [
      { href: '/dashboard/agentes', icon: '🤖', label: 'Agentes',  requiresClub: true, adminOnly: true },
    ],
  },
]

// Flat list kept for bottom tabs
export const navItems = navGroups.flatMap(g => g.items)

/** Grupos visibles para el usuario: quita items adminOnly y grupos vacíos. */
export function visibleNavGroups(isAdmin: boolean): NavGroup[] {
  return navGroups
    .map(g => ({ ...g, items: g.items.filter(i => !i.adminOnly || isAdmin) }))
    .filter(g => g.items.length > 0)
}
