import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const timespan = req.nextUrl.searchParams.get('timespan') ?? '24h'
  const valid = ['1h', '6h', '24h', '7d']
  const ts = valid.includes(timespan) ? timespan : '24h'

  const query = encodeURIComponent(
    'conflict OR war OR attack OR crisis OR protest OR disaster OR sanction'
  )
  const url =
    `https://api.gdeltproject.org/api/v2/geo/geo?query=${query}` +
    `&mode=pointdata&maxrows=200&format=geojson&timespan=${ts}`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LibertyTrading/1.0)' },
      signal: AbortSignal.timeout(20_000),
      next: { revalidate: 300 },
    })
    if (!res.ok) throw new Error(`GDELT ${res.status}`)
    const data = await res.json()
    // Pass through raw GeoJSON — { type: "FeatureCollection", features: [...] }
    return Response.json(data)
  } catch {
    return Response.json({ type: 'FeatureCollection', features: [] })
  }
}
