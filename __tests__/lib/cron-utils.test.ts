import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  getNYHourMinute,
  isInNYWindow,
  isNYWeekend,
  getNYDayBoundaries,
} from '@/lib/cron-utils'

afterEach(() => {
  vi.restoreAllMocks()
})

// ── getNYHourMinute ─────────────────────────────────────────────────────────────

describe('getNYHourMinute', () => {
  it('returns hour and minute within valid ranges', () => {
    const { hour, minute } = getNYHourMinute()
    expect(hour).toBeGreaterThanOrEqual(0)
    expect(hour).toBeLessThanOrEqual(23)
    expect(minute).toBeGreaterThanOrEqual(0)
    expect(minute).toBeLessThanOrEqual(59)
  })

  it('normalises midnight string "24:00" to hour 0', () => {
    vi.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('24:00')
    expect(getNYHourMinute().hour).toBe(0)
    expect(getNYHourMinute().minute).toBe(0)
  })

  it('parses a standard time string correctly', () => {
    vi.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('9:30')
    const { hour, minute } = getNYHourMinute()
    expect(hour).toBe(9)
    expect(minute).toBe(30)
  })
})

// ── isInNYWindow ────────────────────────────────────────────────────────────────

describe('isInNYWindow', () => {
  it('returns true when exactly on the target hour', () => {
    vi.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('9:00')
    expect(isInNYWindow(9)).toBe(true)
  })

  it('returns true 44 minutes before target (within 45-min window)', () => {
    vi.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('8:16')
    // |8h16m - 9h00m| = 44 min ≤ 45 → true
    expect(isInNYWindow(9)).toBe(true)
  })

  it('returns true exactly at the 45-minute boundary', () => {
    vi.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('8:15')
    // |8h15m - 9h00m| = 45 = 45 → true
    expect(isInNYWindow(9)).toBe(true)
  })

  it('returns false 46 minutes before target (just outside window)', () => {
    vi.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('8:14')
    // |8h14m - 9h00m| = 46 > 45 → false
    expect(isInNYWindow(9)).toBe(false)
  })

  it('returns true 45 minutes after target', () => {
    vi.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('9:45')
    expect(isInNYWindow(9)).toBe(true)
  })

  it('returns false 46 minutes after target', () => {
    vi.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('9:46')
    expect(isInNYWindow(9)).toBe(false)
  })

  it('respects a custom window size', () => {
    vi.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('9:20')
    // diff = 20 min
    expect(isInNYWindow(9, 30)).toBe(true)   // 20 ≤ 30
    expect(isInNYWindow(9, 15)).toBe(false)  // 20 > 15
  })

  it('works correctly for target hour 0 (midnight)', () => {
    vi.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('0:10')
    expect(isInNYWindow(0)).toBe(true)  // 10 min diff
  })
})

// ── isNYWeekend ─────────────────────────────────────────────────────────────────

describe('isNYWeekend', () => {
  it('returns false on Monday', () => {
    vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('Mon')
    expect(isNYWeekend()).toBe(false)
  })

  it('returns false on Friday', () => {
    vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('Fri')
    expect(isNYWeekend()).toBe(false)
  })

  it('returns true on Saturday', () => {
    vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('Sat')
    expect(isNYWeekend()).toBe(true)
  })

  it('returns true on Sunday', () => {
    vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('Sun')
    expect(isNYWeekend()).toBe(true)
  })
})

// ── getNYDayBoundaries ──────────────────────────────────────────────────────────

describe('getNYDayBoundaries', () => {
  it('returns Date objects for todayStart and todayEnd', () => {
    const { todayStart, todayEnd } = getNYDayBoundaries()
    expect(todayStart).toBeInstanceOf(Date)
    expect(todayEnd).toBeInstanceOf(Date)
  })

  it('todayEnd is after todayStart', () => {
    const { todayStart, todayEnd } = getNYDayBoundaries()
    expect(todayEnd.getTime()).toBeGreaterThan(todayStart.getTime())
  })

  it('the range spans approximately 24 hours', () => {
    const { todayStart, todayEnd } = getNYDayBoundaries()
    const diffHours = (todayEnd.getTime() - todayStart.getTime()) / 3_600_000
    // 23:59:59 = 23.999... hours
    expect(diffHours).toBeGreaterThan(23.9)
    expect(diffHours).toBeLessThan(24.1)
  })

  it('returns valid (non-NaN) timestamps', () => {
    const { todayStart, todayEnd } = getNYDayBoundaries()
    expect(isNaN(todayStart.getTime())).toBe(false)
    expect(isNaN(todayEnd.getTime())).toBe(false)
  })
})
