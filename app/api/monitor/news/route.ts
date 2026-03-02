import { NextResponse } from 'next/server'
import Parser from 'rss-parser'

export const runtime = 'nodejs'
export const revalidate = 300

interface Article {
  title: string
  description: string
  link: string
  pubDate: string
  source: string
  image?: string
}

const FEEDS: { url: string; source: string }[] = [
  { url: 'https://feeds.bbci.co.uk/mundo/rss.xml', source: 'BBC Mundo' },
  { url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada', source: 'El País' },
]

export async function GET() {
  const parser = new Parser({
    customFields: {
      item: [
        ['media:content', 'mediaContent'],
        ['media:thumbnail', 'mediaThumbnail'],
        ['enclosure', 'enclosure'],
      ],
    },
    requestOptions: { timeout: 8000 },
  })

  const results = await Promise.allSettled(
    FEEDS.map(async ({ url, source }) => {
      const feed = await parser.parseURL(url)
      return (feed.items ?? []).slice(0, 10).map((item) => {
        // Try to extract image from multiple possible fields
        const image =
          (item as any).mediaContent?.$.url ||
          (item as any).mediaThumbnail?.$.url ||
          (item as any).enclosure?.url ||
          undefined

        return {
          title: item.title ?? '',
          description: (item.contentSnippet ?? item.content ?? '').slice(0, 220).replace(/<[^>]+>/g, ''),
          link: item.link ?? '',
          pubDate: item.pubDate ?? item.isoDate ?? '',
          source,
          image,
        } as Article
      })
    })
  )

  const articles: Article[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') articles.push(...r.value)
  }

  const sorted = articles
    .filter((a) => a.title && a.link)
    .sort((a, b) => {
      const da = a.pubDate ? new Date(a.pubDate).getTime() : 0
      const db = b.pubDate ? new Date(b.pubDate).getTime() : 0
      return db - da
    })
    .slice(0, 20)

  return NextResponse.json({ articles: sorted, timestamp: Date.now() })
}
