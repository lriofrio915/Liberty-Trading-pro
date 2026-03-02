import { NextResponse } from 'next/server'

export const revalidate = 180 // cache 3 min

interface NewsItem {
  title: string
  description: string
  link: string
  pubDate: string
  source: string
}

function stripHTML(str: string): string {
  return str.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
}

function extractCDATA(str: string): string {
  const m = str.match(/<!\[CDATA\[([\s\S]*?)\]\]>/)
  return m ? m[1].trim() : str.trim()
}

function parseTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  if (!m) return ''
  return stripHTML(extractCDATA(m[1]))
}

function parseRSS(xml: string, source: string): NewsItem[] {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
  return items.slice(0, 8).map(item => ({
    title: parseTag(item, 'title'),
    description: parseTag(item, 'description').slice(0, 180),
    link: parseTag(item, 'link') || parseTag(item, 'guid'),
    pubDate: parseTag(item, 'pubDate'),
    source,
  })).filter(i => i.title)
}

const FEEDS = [
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC World' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', source: 'NYT World' },
]

export async function GET() {
  const results = await Promise.allSettled(
    FEEDS.map(async ({ url, source }) => {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/rss+xml,application/xml' },
        signal: AbortSignal.timeout(6000),
      })
      const xml = await res.text()
      return parseRSS(xml, source)
    })
  )

  const news: NewsItem[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') news.push(...r.value)
  }

  // Sort by recency (rough), interleave sources
  const sorted = news.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0
    return db - da
  }).slice(0, 12)

  return NextResponse.json({ news: sorted, timestamp: Date.now() })
}
