import type { ContentFacade } from './facade'
import { articleHasEnglish, estimateReadTimeMinutes, localizeBody, localizeDeck, localizeTitle } from './english'
import type { Article, Author, Category, Locale, StoryCard } from './types'

/**
 * Payload Local API adapter skeleton.
 * Replace `fetchPublished` with Payload Local API once Neon + admin are live.
 */
export function createPayloadContent(client: {
  listCategories: () => Promise<Category[]>
  listAuthors: () => Promise<Author[]>
  listPublishedArticles: () => Promise<Article[]>
  getArticleBySlug: (categorySlug: string, slug: string) => Promise<Article | null>
}): ContentFacade {
  async function toStoryCard(article: Article, locale: Locale): Promise<StoryCard> {
    const categories = await client.listCategories()
    const authors = await client.listAuthors()
    const category = categories.find((c) => c.id === article.categoryId)
    const authorNames = article.authorIds
      .map((id) => authors.find((a) => a.id === id))
      .filter(Boolean)
      .map((a) => (locale === 'en' && a!.nameEn ? a!.nameEn : a!.nameNe))
    const body = localizeBody(article, locale)
    return {
      id: article.id,
      slug: article.slug,
      categorySlug: category?.slug ?? 'samachar',
      title: localizeTitle(article, locale),
      deck: localizeDeck(article, locale),
      publishedAt: article.publishedAt,
      isBreaking: article.isBreaking,
      hero: article.hero,
      authorNames,
      readTimeMinutes: estimateReadTimeMinutes(body, locale),
      hasEnglish: articleHasEnglish(article),
      province: article.province,
    }
  }

  return {
    source: 'payload',
    usingDevFixtures: false,
    listCategories: client.listCategories,
    async getCategoryBySlug(slug) {
      return (await client.listCategories()).find((c) => c.slug === slug) ?? null
    },
    listAuthors: client.listAuthors,
    async getAuthorById(id) {
      return (await client.listAuthors()).find((a) => a.id === id) ?? null
    },
    async listPublishedArticles(opts) {
      let list = (await client.listPublishedArticles()).filter((a) => a.status === 'published')
      if (opts?.locale === 'en') list = list.filter((a) => articleHasEnglish(a))
      if (opts?.categorySlug) {
        const cats = await client.listCategories()
        const cat = cats.find((c) => c.slug === opts.categorySlug)
        list = list.filter((a) => a.categoryId === cat?.id)
      }
      return list.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    },
    getArticleBySlug: client.getArticleBySlug,
    toStoryCard,
    async getRelated(article, locale, limit = 5) {
      const pool = (await client.listPublishedArticles())
        .filter((a) => a.id !== article.id && a.status === 'published')
        .filter((a) => (locale === 'en' ? articleHasEnglish(a) : true))
        .filter((a) => a.categoryId === article.categoryId)
        .slice(0, limit)
      return Promise.all(pool.map((a) => toStoryCard(a, locale)))
    },
    async getPackagePeers(article, locale, limit = 6) {
      if (!article.packageId) return []
      const pool = (await client.listPublishedArticles())
        .filter((a) => a.id !== article.id && a.status === 'published')
        .filter((a) => (locale === 'en' ? articleHasEnglish(a) : true))
        .filter((a) => a.packageId === article.packageId)
        .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
        .slice(0, limit)
      return Promise.all(pool.map((a) => toStoryCard(a, locale)))
    },
  }
}
