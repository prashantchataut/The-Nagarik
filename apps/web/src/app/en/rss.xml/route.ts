import { localizeDeck, localizeTitle } from '@thenagarik/content'
import { getContent, siteUrl } from '@/lib/content'
import { SITE } from '@/site.config'

export const revalidate = 300

export async function GET() {
  const content = getContent()
  const articles = await content.listPublishedArticles({ locale: 'en' })
  const categories = await content.listCategories()
  const items = articles
    .slice(0, 40)
    .map((a) => {
      const cat = categories.find((c) => c.id === a.categoryId)
      if (!cat) return ''
      const link = siteUrl(`/en/${cat.slug}/${a.slug}`)
      return `<item>
  <title><![CDATA[${localizeTitle(a, 'en')}]]></title>
  <link>${link}</link>
  <guid>${link}</guid>
  <description><![CDATA[${localizeDeck(a, 'en')}]]></description>
  <pubDate>${a.publishedAt ? new Date(a.publishedAt).toUTCString() : ''}</pubDate>
</item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${SITE.brand.en}</title>
  <link>${siteUrl('/en')}</link>
  <description>${SITE.brand.taglineEn} (English)</description>
  ${items}
</channel>
</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
