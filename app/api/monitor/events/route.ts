import { NextRequest, NextResponse } from 'next/server'
import Parser from 'rss-parser'

export const runtime = 'nodejs'
export const revalidate = 300

// ── Country / region keyword → coordinates mapping ───────────────────────────

const GEO: Record<string, { lat: number; lng: number; label: string }> = {
  // Americas
  'estados unidos': { lat: 38.9, lng: -77.0, label: 'EE. UU.' },
  'eeuu': { lat: 38.9, lng: -77.0, label: 'EE. UU.' },
  'washington': { lat: 38.9, lng: -77.0, label: 'EE. UU.' },
  'trump': { lat: 38.9, lng: -77.0, label: 'EE. UU.' },
  'biden': { lat: 38.9, lng: -77.0, label: 'EE. UU.' },
  'canada': { lat: 56.13, lng: -106.35, label: 'Canadá' },
  'canadá': { lat: 56.13, lng: -106.35, label: 'Canadá' },
  'méxico': { lat: 23.63, lng: -102.55, label: 'México' },
  'mexico': { lat: 23.63, lng: -102.55, label: 'México' },
  'brasil': { lat: -14.23, lng: -51.93, label: 'Brasil' },
  'brazil': { lat: -14.23, lng: -51.93, label: 'Brasil' },
  'argentina': { lat: -38.4, lng: -63.62, label: 'Argentina' },
  'colombia': { lat: 4.57, lng: -74.3, label: 'Colombia' },
  'venezuela': { lat: 6.42, lng: -66.58, label: 'Venezuela' },
  'perú': { lat: -9.19, lng: -75.02, label: 'Perú' },
  'peru': { lat: -9.19, lng: -75.02, label: 'Perú' },
  'chile': { lat: -35.67, lng: -71.54, label: 'Chile' },
  'ecuador': { lat: -1.83, lng: -78.18, label: 'Ecuador' },
  'cuba': { lat: 21.52, lng: -77.78, label: 'Cuba' },
  'haití': { lat: 18.97, lng: -72.29, label: 'Haití' },
  'haiti': { lat: 18.97, lng: -72.29, label: 'Haití' },
  // Europe
  'rusia': { lat: 55.75, lng: 37.62, label: 'Rusia' },
  'russia': { lat: 55.75, lng: 37.62, label: 'Rusia' },
  'moscú': { lat: 55.75, lng: 37.62, label: 'Rusia' },
  'kremlin': { lat: 55.75, lng: 37.62, label: 'Rusia' },
  'putin': { lat: 55.75, lng: 37.62, label: 'Rusia' },
  'ucrania': { lat: 48.38, lng: 31.17, label: 'Ucrania' },
  'ukraine': { lat: 48.38, lng: 31.17, label: 'Ucrania' },
  'kiev': { lat: 50.45, lng: 30.52, label: 'Ucrania' },
  'kyiv': { lat: 50.45, lng: 30.52, label: 'Ucrania' },
  'zelenski': { lat: 48.38, lng: 31.17, label: 'Ucrania' },
  'alemania': { lat: 51.16, lng: 10.45, label: 'Alemania' },
  'germany': { lat: 51.16, lng: 10.45, label: 'Alemania' },
  'berlín': { lat: 52.52, lng: 13.4, label: 'Alemania' },
  'france': { lat: 46.23, lng: 2.21, label: 'Francia' },
  'francia': { lat: 46.23, lng: 2.21, label: 'Francia' },
  'paris': { lat: 48.86, lng: 2.35, label: 'Francia' },
  'macron': { lat: 46.23, lng: 2.21, label: 'Francia' },
  'reino unido': { lat: 55.38, lng: -3.44, label: 'Reino Unido' },
  'Gran Bretaña': { lat: 55.38, lng: -3.44, label: 'R. Unido' },
  'uk': { lat: 55.38, lng: -3.44, label: 'R. Unido' },
  'londres': { lat: 51.51, lng: -0.13, label: 'R. Unido' },
  'españa': { lat: 40.46, lng: -3.75, label: 'España' },
  'spain': { lat: 40.46, lng: -3.75, label: 'España' },
  'madrid': { lat: 40.42, lng: -3.7, label: 'España' },
  'italia': { lat: 41.87, lng: 12.57, label: 'Italia' },
  'italy': { lat: 41.87, lng: 12.57, label: 'Italia' },
  'roma': { lat: 41.9, lng: 12.5, label: 'Italia' },
  'polonia': { lat: 51.92, lng: 19.15, label: 'Polonia' },
  'turquía': { lat: 38.96, lng: 35.24, label: 'Turquía' },
  'turkey': { lat: 38.96, lng: 35.24, label: 'Turquía' },
  'erdogan': { lat: 38.96, lng: 35.24, label: 'Turquía' },
  'suecia': { lat: 60.13, lng: 18.64, label: 'Suecia' },
  'noruega': { lat: 60.47, lng: 8.47, label: 'Noruega' },
  'bielorrusia': { lat: 53.71, lng: 27.95, label: 'Bielorrusia' },
  'serbia': { lat: 44.02, lng: 21.01, label: 'Serbia' },
  'hungría': { lat: 47.16, lng: 19.5, label: 'Hungría' },
  // Middle East
  'israel': { lat: 31.05, lng: 34.85, label: 'Israel' },
  'netanyahu': { lat: 31.05, lng: 34.85, label: 'Israel' },
  'tel aviv': { lat: 32.08, lng: 34.78, label: 'Israel' },
  'gaza': { lat: 31.35, lng: 34.31, label: 'Gaza' },
  'palestina': { lat: 31.95, lng: 35.24, label: 'Palestina' },
  'palestino': { lat: 31.95, lng: 35.24, label: 'Palestina' },
  'hamas': { lat: 31.35, lng: 34.31, label: 'Gaza' },
  'hezbollah': { lat: 33.89, lng: 35.5, label: 'Líbano' },
  'líbano': { lat: 33.89, lng: 35.5, label: 'Líbano' },
  'libano': { lat: 33.89, lng: 35.5, label: 'Líbano' },
  'beirut': { lat: 33.89, lng: 35.5, label: 'Líbano' },
  'siria': { lat: 34.8, lng: 38.99, label: 'Siria' },
  'syria': { lat: 34.8, lng: 38.99, label: 'Siria' },
  'irán': { lat: 32.43, lng: 53.69, label: 'Irán' },
  'iran': { lat: 32.43, lng: 53.69, label: 'Irán' },
  'teherán': { lat: 35.69, lng: 51.39, label: 'Irán' },
  'irak': { lat: 33.22, lng: 43.68, label: 'Irak' },
  'iraq': { lat: 33.22, lng: 43.68, label: 'Irak' },
  'arabia saudita': { lat: 23.89, lng: 45.08, label: 'Arabia Saudita' },
  'saudi': { lat: 23.89, lng: 45.08, label: 'Arabia Saudita' },
  'yemen': { lat: 15.55, lng: 48.52, label: 'Yemen' },
  'houthi': { lat: 15.55, lng: 48.52, label: 'Yemen' },
  'huthi': { lat: 15.55, lng: 48.52, label: 'Yemen' },
  'egipto': { lat: 26.82, lng: 30.8, label: 'Egipto' },
  'egypt': { lat: 26.82, lng: 30.8, label: 'Egipto' },
  'jordania': { lat: 30.59, lng: 36.24, label: 'Jordania' },
  'qatar': { lat: 25.35, lng: 51.18, label: 'Qatar' },
  // Asia
  'china': { lat: 35.86, lng: 104.19, label: 'China' },
  'beijing': { lat: 39.91, lng: 116.39, label: 'China' },
  'xi jinping': { lat: 35.86, lng: 104.19, label: 'China' },
  'taiwan': { lat: 23.69, lng: 120.96, label: 'Taiwán' },
  'taipéi': { lat: 25.03, lng: 121.56, label: 'Taiwán' },
  'corea del norte': { lat: 40.34, lng: 127.51, label: 'Corea del Norte' },
  'kim jong': { lat: 40.34, lng: 127.51, label: 'Corea del Norte' },
  'corea del sur': { lat: 35.91, lng: 127.77, label: 'Corea del Sur' },
  'japón': { lat: 36.2, lng: 138.25, label: 'Japón' },
  'japon': { lat: 36.2, lng: 138.25, label: 'Japón' },
  'tokio': { lat: 35.69, lng: 139.69, label: 'Japón' },
  'india': { lat: 20.59, lng: 78.96, label: 'India' },
  'nueva delhi': { lat: 28.61, lng: 77.21, label: 'India' },
  'pakistán': { lat: 30.38, lng: 69.35, label: 'Pakistán' },
  'pakistan': { lat: 30.38, lng: 69.35, label: 'Pakistán' },
  'afganistán': { lat: 33.94, lng: 67.71, label: 'Afganistán' },
  'taliban': { lat: 33.94, lng: 67.71, label: 'Afganistán' },
  'myanmar': { lat: 21.91, lng: 95.96, label: 'Myanmar' },
  'birmania': { lat: 21.91, lng: 95.96, label: 'Myanmar' },
  'tailandia': { lat: 15.87, lng: 100.99, label: 'Tailandia' },
  'filipinas': { lat: 12.88, lng: 121.77, label: 'Filipinas' },
  'indonesia': { lat: -0.79, lng: 113.92, label: 'Indonesia' },
  'bangladesh': { lat: 23.68, lng: 90.36, label: 'Bangladesh' },
  // Africa
  'nigeria': { lat: 9.08, lng: 8.68, label: 'Nigeria' },
  'sudán': { lat: 12.86, lng: 30.22, label: 'Sudán' },
  'sudan': { lat: 12.86, lng: 30.22, label: 'Sudán' },
  'etiopía': { lat: 9.15, lng: 40.49, label: 'Etiopía' },
  'somalia': { lat: 5.15, lng: 46.2, label: 'Somalia' },
  'kenia': { lat: -0.02, lng: 37.91, label: 'Kenia' },
  'congo': { lat: -4.03, lng: 21.76, label: 'Congo' },
  'mali': { lat: 17.57, lng: -3.99, label: 'Mali' },
  'niger': { lat: 17.61, lng: 8.08, label: 'Níger' },
  'burkina faso': { lat: 12.36, lng: -1.53, label: 'Burkina Faso' },
  'mozambique': { lat: -18.67, lng: 35.53, label: 'Mozambique' },
  'sudáfrica': { lat: -30.56, lng: 22.94, label: 'Sudáfrica' },
  'libia': { lat: 26.34, lng: 17.23, label: 'Libia' },
  'marruecos': { lat: 31.79, lng: -7.09, label: 'Marruecos' },
  'argelia': { lat: 28.03, lng: 1.66, label: 'Argelia' },
  'túnez': { lat: 33.89, lng: 9.54, label: 'Túnez' },
  // International
  'nato': { lat: 50.88, lng: 4.47, label: 'OTAN' },
  'otan': { lat: 50.88, lng: 4.47, label: 'OTAN' },
  'onu': { lat: 40.75, lng: -73.97, label: 'ONU' },
  'fmi': { lat: 38.9, lng: -77.04, label: 'FMI' },
  'banco mundial': { lat: 38.9, lng: -77.04, label: 'Banco Mundial' },
  'g7': { lat: 51.16, lng: 10.45, label: 'G7' },
  'g20': { lat: -15.78, lng: -47.93, label: 'G20' },
}

// ── RSS feeds (same as news route) ────────────────────────────────────────────

const FEEDS = [
  { url: 'https://feeds.bbci.co.uk/mundo/rss.xml', source: 'BBC Mundo' },
  { url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada', source: 'El País' },
  { url: 'https://rss.dw.com/rdf/rss-es-all', source: 'DW Español' },
  { url: 'https://www.france24.com/es/rss', source: 'France 24' },
]

function extractLocations(text: string): Array<{ lat: number; lng: number; label: string }> {
  const lower = text.toLowerCase()
  const found = new Map<string, { lat: number; lng: number; label: string }>()

  for (const [keyword, geo] of Object.entries(GEO)) {
    if (lower.includes(keyword)) {
      // Use label as key to avoid duplicates for same country
      if (!found.has(geo.label)) {
        found.set(geo.label, geo)
      }
    }
  }

  return Array.from(found.values())
}

function jitter(val: number, amount = 1.5): number {
  return val + (Math.random() - 0.5) * amount
}

export async function GET(_req: NextRequest) {
  const parser = new Parser({
    requestOptions: { timeout: 8000 },
  })

  const features: any[] = []

  const results = await Promise.allSettled(
    FEEDS.map(async ({ url, source }) => {
      const feed = await parser.parseURL(url)
      return (feed.items ?? []).slice(0, 15).map(item => ({
        title: item.title ?? '',
        description: (item.contentSnippet ?? '').slice(0, 300),
        link: item.link ?? '',
        pubDate: item.pubDate ?? item.isoDate ?? '',
        source,
      }))
    })
  )

  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    for (const article of r.value) {
      const text = `${article.title} ${article.description}`
      const locations = extractLocations(text)
      for (const loc of locations) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [jitter(loc.lng, 1.2), jitter(loc.lat, 1.2)],
          },
          properties: {
            name: article.title.slice(0, 100),
            SOURCEURL: article.link,
            url: article.link,
            DATEADDED: article.pubDate,
            dateadded: article.pubDate,
            domain: article.source,
            sourcecountry: loc.label,
            tone: undefined,
          },
        })
      }
    }
  }

  // Deduplicate: max 3 events per country label
  const countByLabel: Record<string, number> = {}
  const deduplicated = features.filter(f => {
    const label = f.properties.sourcecountry
    countByLabel[label] = (countByLabel[label] ?? 0) + 1
    return countByLabel[label] <= 3
  })

  return NextResponse.json({
    type: 'FeatureCollection',
    features: deduplicated,
  })
}
