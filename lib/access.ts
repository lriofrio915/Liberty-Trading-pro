export type AccessLevel = 'FREE' | 'TRIAL' | 'CLUB'

interface UserAccess {
  plan: string
  trialEndsAt: Date | null
}

export interface EffectiveAccess {
  level: AccessLevel
  canAccessClub: boolean
  isOnTrial: boolean
  trialDaysLeft: number | null
  trialExpired: boolean
}

export function getEffectiveAccess(user: UserAccess): EffectiveAccess {
  const isPaid = ['CLUB', 'PRO', 'PORTFOLIO'].includes(user.plan)

  if (isPaid) {
    return { level: 'CLUB', canAccessClub: true, isOnTrial: false, trialDaysLeft: null, trialExpired: false }
  }

  if (user.trialEndsAt) {
    const now = new Date()
    if (user.trialEndsAt > now) {
      const daysLeft = Math.ceil((user.trialEndsAt.getTime() - now.getTime()) / 86_400_000)
      return { level: 'TRIAL', canAccessClub: true, isOnTrial: true, trialDaysLeft: daysLeft, trialExpired: false }
    }
    // Trial existed but expired
    return { level: 'FREE', canAccessClub: false, isOnTrial: false, trialDaysLeft: 0, trialExpired: true }
  }

  return { level: 'FREE', canAccessClub: false, isOnTrial: false, trialDaysLeft: null, trialExpired: false }
}
