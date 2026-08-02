import { localizeDeck, localizeTitle } from '@thenagarik/content'
import { getContent, siteUrl } from '@/lib/content'

export const revalidate = 300

async function rssXml(locale: 'ne' | 'en') {
  const content = getContent()
  const articles = await content.listPublishedArticles({ locale })
  const categories = await content.listCategories()
  const title = locale === 'ne' ? 'द नागरिक' : 'The Nagarik'
  const items = articles
    .slice(0, 40)
    .map((a) => {
      const cat = categories.find((c) => c.id === a.categoryId)
      if (!cat) return ''
      const link = siteUrl(`/${locale}/${cat.slug}/${a.slug}`)
      return `<item>
  <title><![CDATA[${localizeTitle(a, locale)}]]></title>
  <link>${link}</link>
  <guid>${link}</guid>
  <description><![CDATA[${localizeDeck(a, locale)}]]></description>
  <pubDate>${a.publishedAt ? new Date(a.publishedAt).toUTCString() : ''}</pubDate>
</item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${title}</title>
  <link>${siteUrl(locale === 'ne' ? '/ne' : '/en')}</link>
  <description>Civic news for Nepal</description>
  ${items}
</channel>
</rss>`
}

export async function GET() {
  const xml = await rssXml('ne')
  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
