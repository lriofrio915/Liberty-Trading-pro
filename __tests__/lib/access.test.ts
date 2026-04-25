import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getEffectiveAccess } from '@/lib/access'

const FIXED_NOW = new Date('2026-04-25T12:00:00.000Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('getEffectiveAccess — paid plans', () => {
  it.each(['CLUB', 'PRO', 'PORTFOLIO'] as const)('%s plan grants CLUB level access', (plan) => {
    const result = getEffectiveAccess({ plan, trialEndsAt: null })
    expect(result.level).toBe('CLUB')
    expect(result.canAccessClub).toBe(true)
    expect(result.isOnTrial).toBe(false)
    expect(result.trialDaysLeft).toBeNull()
    expect(result.trialExpired).toBe(false)
  })
})

describe('getEffectiveAccess — free plan', () => {
  it('returns FREE with no trial fields set', () => {
    const result = getEffectiveAccess({ plan: 'FREE', trialEndsAt: null })
    expect(result.level).toBe('FREE')
    expect(result.canAccessClub).toBe(false)
    expect(result.isOnTrial).toBe(false)
    expect(result.trialDaysLeft).toBeNull()
    expect(result.trialExpired).toBe(false)
  })
})

describe('getEffectiveAccess — active trial', () => {
  it('returns TRIAL level with canAccessClub when trial has not expired', () => {
    // 23 h in the future → ceil(23/24) = 1 day left
    const trialEndsAt = new Date(FIXED_NOW.getTime() + 23 * 3_600_000)
    const result = getEffectiveAccess({ plan: 'FREE', trialEndsAt })
    expect(result.level).toBe('TRIAL')
    expect(result.canAccessClub).toBe(true)
    expect(result.isOnTrial).toBe(true)
    expect(result.trialExpired).toBe(false)
  })

  it('reports 1 day left when trial ends in 23 h', () => {
    const trialEndsAt = new Date(FIXED_NOW.getTime() + 23 * 3_600_000)
    const result = getEffectiveAccess({ plan: 'FREE', trialEndsAt })
    expect(result.trialDaysLeft).toBe(1)
  })

  it('reports 7 days left when trial ends in exactly 7 days', () => {
    const trialEndsAt = new Date(FIXED_NOW.getTime() + 7 * 86_400_000)
    const result = getEffectiveAccess({ plan: 'FREE', trialEndsAt })
    expect(result.trialDaysLeft).toBe(7)
  })

  it('trial supersedes FREE plan even when plan field is FREE', () => {
    const trialEndsAt = new Date(FIXED_NOW.getTime() + 2 * 86_400_000)
    const result = getEffectiveAccess({ plan: 'FREE', trialEndsAt })
    expect(result.level).toBe('TRIAL')
  })
})

describe('getEffectiveAccess — expired trial', () => {
  it('returns FREE level with trialExpired=true', () => {
    const trialEndsAt = new Date(FIXED_NOW.getTime() - 1)  // 1 ms ago
    const result = getEffectiveAccess({ plan: 'FREE', trialEndsAt })
    expect(result.level).toBe('FREE')
    expect(result.canAccessClub).toBe(false)
    expect(result.isOnTrial).toBe(false)
    expect(result.trialDaysLeft).toBe(0)
    expect(result.trialExpired).toBe(true)
  })

  it('paid plan overrides expired trial', () => {
    const expiredTrial = new Date(FIXED_NOW.getTime() - 86_400_000)
    const result = getEffectiveAccess({ plan: 'CLUB', trialEndsAt: expiredTrial })
    expect(result.level).toBe('CLUB')
    expect(result.trialExpired).toBe(false)
  })
})
