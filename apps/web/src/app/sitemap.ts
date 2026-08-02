import type { MetadataRoute } from 'next'
import { articleHasEnglish } from '@thenagarik/content'
import { getContent, siteUrl } from '@/lib/content'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = getContent()
  const articles = await content.listPublishedArticles()
  const categories = await content.listCategories()

  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl('/ne'), changeFrequency: 'hourly', priority: 1 },
    { url: siteUrl('/en'), changeFrequency: 'hourly', priority: 0.9 },
  ]

  for (const c of categories) {
    entries.push({ url: siteUrl(`/ne/${c.slug}`), changeFrequency: 'hourly', priority: 0.7 })
    entries.push({ url: siteUrl(`/en/${c.slug}`), changeFrequency: 'hourly', priority: 0.6 })
  }

  for (const a of articles) {
    const cat = categories.find((c) => c.id === a.categoryId)
    if (!cat || !a.publishedAt) continue
    const ageHours = (Date.now() - new Date(a.publishedAt).getTime()) / 3600_000
    const priority = Math.max(0.3, Math.min(0.9, 0.9 - ageHours / 200))
    entries.push({
      url: siteUrl(`/ne/${cat.slug}/${a.slug}`),
      lastModified: a.updatedAt ?? a.publishedAt,
      changeFrequency: 'daily',
      priority,
    })
    if (articleHasEnglish(a)) {
      entries.push({
        url: siteUrl(`/en/${cat.slug}/${a.slug}`),
        lastModified: a.updatedAt ?? a.publishedAt,
        changeFrequency: 'daily',
        priority: priority * 0.95,
      })
    }
  }

  return entries
}
