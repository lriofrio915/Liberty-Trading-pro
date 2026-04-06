// Utility helpers for cron routes — timezone-aware (America/New_York)

/**
 * Returns the current hour and minute in New York time.
 */
export function getNYHourMinute(): { hour: number; minute: number } {
  const nyStr = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })
  // toLocaleString can return "24:xx" for midnight in some runtimes; normalise to 0
  const [h, m] = nyStr.split(':').map(Number)
  return { hour: h === 24 ? 0 : h, minute: m }
}

/**
 * Returns true if the current NY time is within `windowMinutes` of `targetHour:00`.
 * Default window is ±45 minutes so either the EDT or EST cron fires inside the window,
 * while the other one (1 h off) is rejected.
 */
export function isInNYWindow(targetHour: number, windowMinutes = 45): boolean {
  const { hour, minute } = getNYHourMinute()
  const nowMins = hour * 60 + minute
  const targetMins = targetHour * 60
  return Math.abs(nowMins - targetMins) <= windowMinutes
}

/**
 * Returns true if today is a weekend in New York time.
 */
export function isNYWeekend(): boolean {
  const nyDay = new Date().toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
  })
  return nyDay === 'Sat' || nyDay === 'Sun'
}

/**
 * Returns the start and end of the current calendar day in New York time,
 * expressed as UTC Date objects suitable for Prisma date-range queries.
 *
 * This correctly handles the EST/EDT boundary (UTC-5 vs UTC-4) so that
 * a scan created at 9 am NY is always found by the 12 pm and 3 pm crons
 * on the same NY calendar day.
 */
export function getNYDayBoundaries(): { todayStart: Date; todayEnd: Date } {
  const now = new Date()

  // Current date string in NY, e.g. "4/6/2026"
  const nyDateStr = now.toLocaleDateString('en-US', { timeZone: 'America/New_York' })

  // Determine live UTC offset for America/New_York (handles DST automatically)
  const utcHour = now.getUTCHours()
  const nyHour = parseInt(
    now.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      hour12: false,
    }),
    10,
  )
  // offset will be 4 (EDT) or 5 (EST)
  const offsetHours = ((utcHour - (nyHour === 24 ? 0 : nyHour) + 24) % 24)
  const offsetStr = String(offsetHours).padStart(2, '0') + ':00'

  // Build midnight and end-of-day in NY expressed as proper UTC instants
  const todayStart = new Date(`${nyDateStr} 00:00:00 GMT-${offsetStr}`)
  const todayEnd   = new Date(`${nyDateStr} 23:59:59 GMT-${offsetStr}`)

  return { todayStart, todayEnd }
}
