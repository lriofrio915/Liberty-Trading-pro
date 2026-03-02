import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const revalidate = 0

interface RawFeature {
  type?: string
  geometry?: {
    type?: string
    coordinates?: [number, number]
  }
  properties?: {
    name?: string
    url?: string
    urlpubtitle?: string
    domain?: string
    sharingimage?: string
    dateadded?: string
    fractiondate?: number
    tone?: number
    themes?: string
    persons?: string
    organizations?: string
    sourcecountry?: string
    lang?: string
  }
}

interface ProcessedEvent {
  id: string
  lat: number
  lng: number
  title: string
  url: string
  domain: string
  sourcecountry: string
  dateadded: string
  isoDate: string
  tone: number
  themes: string
  eventType: 'conflict' | 'protest' | 'disaster' | 'economic' | 'other'
  color: string
}

function parseGDELTDate(s: string): string {
  if (!s || s.length < 8) return new Date().toISOString()
  try {
    const y = s.slice(0, 4)
    const mo = s.slice(4, 6)
    const d = s.slice(6, 8)
    const h = s.slice(8, 10) || '00'
    const mi = s.slice(10, 12) || '00'
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:00Z`).toISOString()
  } catch {
    return new Date().toISOString()
  }
}

function classifyEvent(
  tone: number,
  name: string,
  themes: string
): { eventType: ProcessedEvent['eventType']; color: string } {
  const n = name.toLowerCase()
  const t = themes.toLowerCase()

  const isConflict =
    tone < -8 ||
    /\b(kill|dead|death|attack|war|bomb|shoot|explos|militar|troops|combat|weapon|armed)\b/.test(n) ||
    /kill|conflict|war/.test(t)

  const isProtest =
    !isConflict &&
    (tone < -4 ||
      /\b(protest|demonstrat|riot|unrest|strike|march|rally|uprising)\b/.test(n) ||
      /protest/.test(t))

  const isDisaster =
    !isConflict &&
    !isProtest &&
    /\b(earthquake|flood|hurricane|typhoon|disaster|tsunami|wildfire|volcano|drought|famine)\b/.test(n)

  const isEconomic =
    !isConflict &&
    !isProtest &&
    !isDisaster &&
    (tone < -2 ||
      /\b(sanction|crisis|recession|inflation|economic|market|bank|debt|currency)\b/.test(n))

  if (isConflict) return { eventType: 'conflict', color: '#ef4444' }
  if (isProtest) return { eventType: 'protest', color: '#f97316' }
  if (isDisaster) return { eventType: 'disaster', color: '#a855f7' }
  if (isEconomic) return { eventType: 'economic', color: '#eab308' }
  return { eventType: 'other', color: '#60a5fa' }
}

export async function GET(req: NextRequest) {
  const timespan = req.nextUrl.searchParams.get('timespan') ?? '24h'
  const valid = ['1h', '6h', '24h', '7d']
  const ts = valid.includes(timespan) ? timespan : '24h'

  const query = encodeURIComponent(
    'conflict OR war OR crisis OR protest OR attack OR disaster OR sanction OR earthquake'
  )
  const url = `https://api.gdeltproject.org/api/v2/geo/geo?query=${query}&mode=pointdata&maxrows=150&format=json&timespan=${ts}`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LibertyTrading/1.0)' },
      signal: AbortSignal.timeout(20_000),
    })

    if (!res.ok) throw new Error(`GDELT ${res.status}`)

    const data = await res.json()
    const rawFeatures: RawFeature[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.features)
        ? data.features
        : []

    const events: ProcessedEvent[] = rawFeatures
      .filter((f) => {
        const [lng, lat] = f.geometry?.coordinates ?? [0, 0]
        return (
          lat !== 0 &&
          lng !== 0 &&
          Math.abs(lat) <= 90 &&
          Math.abs(lng) <= 180 &&
          f.properties?.name
        )
      })
      .map((f, i) => {
        const [lng, lat] = f.geometry!.coordinates!
        const p = f.properties!
        const tone = p.tone ?? 0
        const name = p.name ?? ''
        const themes = p.themes ?? ''
        const { eventType, color } = classifyEvent(tone, name, themes)

        return {
          id: `${lat}-${lng}-${i}`,
          lat,
          lng,
          title: name,
          url: p.url ?? '',
          domain: p.domain ?? p.urlpubtitle ?? '',
          sourcecountry: p.sourcecountry ?? '',
          dateadded: p.dateadded ?? '',
          isoDate: parseGDELTDate(p.dateadded ?? ''),
          tone,
          themes,
          eventType,
          color,
        }
      })

    return NextResponse.json({
      events,
      count: events.length,
      timespan: ts,
      timestamp: Date.now(),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'GDELT fetch failed'
    // Return empty gracefully — map will show "no data" state
    return NextResponse.json({
      events: [],
      count: 0,
      timespan: ts,
      error: msg,
      timestamp: Date.now(),
    })
  }
}
