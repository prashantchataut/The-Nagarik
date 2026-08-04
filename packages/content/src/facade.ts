import {
  articleHasEnglish,
  estimateReadTimeMinutes,
  localizeBody,
  localizeDeck,
  localizeTitle,
} from './english'
import { fixtureArticles, fixtureAuthors, fixtureCategories } from './fixtures'
import type { Article, Author, Category, Locale, StoryCard } from './types'

export type ContentSource = 'facade' | 'payload'

export type ContentFacade = {
  source: ContentSource
  usingDevFixtures: boolean
  listCategories: () => Promise<Category[]>
  getCategoryBySlug: (slug: string) => Promise<Category | null>
  listAuthors: () => Promise<Author[]>
  getAuthorById: (id: string) => Promise<Author | null>
  listPublishedArticles: (opts?: { categorySlug?: string; locale?: Locale }) => Promise<Article[]>
  getArticleBySlug: (categorySlug: string, slug: string) => Promise<Article | null>
  toStoryCard: (article: Article, locale: Locale) => Promise<StoryCard>
  getRelated: (article: Article, locale: Locale, limit?: number) => Promise<StoryCard[]>
  getPackagePeers: (article: Article, locale: Locale, limit?: number) => Promise<StoryCard[]>
}

function publishedOnly(articles: Article[]): Article[] {
  return articles.filter((a) => a.status === 'published' && a.publishedAt)
}

function visibleForLocale(article: Article, locale?: Locale): boolean {
  if (!locale || locale === 'ne') return true
  return articleHasEnglish(article)
}

export function createFacadeContent(options: {
  allowDevFixtures: boolean
}): ContentFacade {
  if (!options.allowDevFixtures) {
    throw new Error('DEV fixtures disabled. Set CONTENT_SOURCE=payload with a database.')
  }

  const categories = fixtureCategories
  const authors = fixtureAuthors
  const articles = fixtureArticles

  async function toStoryCard(article: Article, locale: Locale): Promise<StoryCard> {
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
    source: 'facade',
    usingDevFixtures: true,
    async listCategories() {
      return categories
    },
    async getCategoryBySlug(slug) {
      return categories.find((c) => c.slug === slug) ?? null
    },
    async listAuthors() {
      return authors
    },
    async getAuthorById(id) {
      return authors.find((a) => a.id === id) ?? null
    },
    async listPublishedArticles(opts) {
      let list = publishedOnly(articles).filter((a) => visibleForLocale(a, opts?.locale))
      if (opts?.categorySlug) {
        const cat = categories.find((c) => c.slug === opts.categorySlug)
        list = list.filter((a) => a.categoryId === cat?.id)
      }
      return list.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    },
    async getArticleBySlug(categorySlug, slug) {
      const cat = categories.find((c) => c.slug === categorySlug)
      if (!cat) return null
      const article = publishedOnly(articles).find((a) => a.slug === slug && a.categoryId === cat.id)
      return article ?? null
    },
    toStoryCard,
    async getRelated(article, locale, limit = 5) {
      const pool = publishedOnly(articles)
        .filter((a) => a.id !== article.id && visibleForLocale(a, locale))
        .filter((a) => a.categoryId === article.categoryId)
        .slice(0, limit)
      return Promise.all(pool.map((a) => toStoryCard(a, locale)))
    },
    async getPackagePeers(article, locale, limit = 6) {
      if (!article.packageId) return []
      const pool = publishedOnly(articles)
        .filter((a) => a.id !== article.id && visibleForLocale(a, locale))
        .filter((a) => a.packageId === article.packageId)
        .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
        .slice(0, limit)
      return Promise.all(pool.map((a) => toStoryCard(a, locale)))
    },
  }
}
