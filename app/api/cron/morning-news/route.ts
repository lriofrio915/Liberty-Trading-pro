import { NextRequest, NextResponse } from 'next/server'
import { notifyMorningNews } from '@/lib/notify-nexus'

export const maxDuration = 60

type Region = 'asia' | 'europa' | 'eeuu'

interface NewsItem {
  title: string
  description: string
  link: string
  pubDate: string
  source: string
  region: Region
}

interface FeedDef {
  url: string
  source: string
  region: Region
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

function parseRSS(xml: string, source: string, region: Region): NewsItem[] {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
  return items.slice(0, 5).map(item => ({
    title: parseTag(item, 'title'),
    description: parseTag(item, 'description').slice(0, 180),
    link: parseTag(item, 'link') || parseTag(item, 'guid'),
    pubDate: parseTag(item, 'pubDate'),
    source,
    region,
  })).filter(i => i.title)
}

const FEEDS: FeedDef[] = [
  // Asia — pasó mientras Ecuador dormía (UTC-5)
  { url: 'https://www.scmp.com/rss/5/feed',          source: 'SCMP',           region: 'asia' },
  { url: 'https://asia.nikkei.com/rss/feed/nar',     source: 'Nikkei Asia',    region: 'asia' },
  // Europa
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml',          source: 'BBC Business',  region: 'europa' },
  { url: 'https://www.ft.com/rss/home',                             source: 'Financial Times', region: 'europa' },
  // EEUU / Américas
  { url: 'https://feeds.reuters.com/reuters/businessNews',          source: 'Reuters',       region: 'eeuu' },
  { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',   source: 'CNBC',          region: 'eeuu' },
  { url: 'https://feeds.marketwatch.com/marketwatch/topstories/',   source: 'MarketWatch',   region: 'eeuu' },
  { url: 'https://finance.yahoo.com/news/rssindex',                 source: 'Yahoo Finance', region: 'eeuu' },
  { url: 'https://www.barrons.com/xml/rss/3_7016.xml',              source: "Barron's",      region: 'eeuu' },
]

async function translateNews(items: NewsItem[]): Promise<NewsItem[]> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return items
  try {
    const toTranslate = items.map(({ title, description, link, pubDate, source, region }) => ({ title, description, link, pubDate, source, region }))
    const prompt = `Translate ONLY the "title" and "description" fields from English to Spanish. Keep "link", "pubDate", "source", "region" unchanged. Return ONLY a valid JSON array with the same structure, no extra text.\nNews: ${JSON.stringify(toTranslate)}`
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 4000,
      }),
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) {
      console.error('[morning-news] Groq translate failed:', res.status, await res.text().catch(() => ''))
      return items
    }
    const data = await res.json()
    const text: string = data.choices?.[0]?.message?.content ?? ''
    const cleaned = text.replace(/```[\w]*\n?/g, '').replace(/```/g, '')
    const match = cleaned.match(/\[[\s\S]*\]/)
    if (!match) {
      console.error('[morning-news] Groq translate: no JSON array in response:', text.slice(0, 200))
      return items
    }
    return JSON.parse(match[0]) as NewsItem[]
  } catch (err) {
    console.error('[morning-news] Groq translate error:', err)
    return items
  }
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = await Promise.allSettled(
    FEEDS.map(async ({ url, source, region }) => {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/rss+xml,application/xml' },
        signal: AbortSignal.timeout(7000),
      })
      const xml = await res.text()
      return parseRSS(xml, source, region)
    })
  )

  const allNews: NewsItem[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') allNews.push(...r.value)
  }

  // Sort by date descending, then take top 3 per region
  allNews.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0
    return db - da
  })

  const byRegion: Record<Region, NewsItem[]> = { asia: [], europa: [], eeuu: [] }
  for (const item of allNews) {
    if (byRegion[item.region].length < 3) byRegion[item.region].push(item)
  }

  const selected = [...byRegion.asia, ...byRegion.europa, ...byRegion.eeuu]
  const translated = await translateNews(selected).catch(() => selected)

  void notifyMorningNews(translated)

  return NextResponse.json({
    ok: true,
    count: translated.length,
    byRegion: { asia: byRegion.asia.length, europa: byRegion.europa.length, eeuu: byRegion.eeuu.length },
  })
}
