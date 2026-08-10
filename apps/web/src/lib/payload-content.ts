import { getPayload } from 'payload'
import { createPayloadContent, type ContentFacade } from '@thenagarik/content'
import config from '@payload-config'
import { mapArticle, mapAuthor, mapCategory } from '@/payload/mappers'

/**
 * Local API client for CONTENT_SOURCE=payload.
 * One path only — no JSON shadow store.
 */
export function createPayloadContentClient(): ContentFacade {
  async function payload() {
    return getPayload({ config })
  }

  return createPayloadContent({
    async listCategories() {
      const p = await payload()
      const result = await p.find({
        collection: 'categories',
        limit: 200,
        depth: 0,
        overrideAccess: true,
      })
      return result.docs.map((doc) => mapCategory(doc as Record<string, unknown>))
    },

    async listAuthors() {
      const p = await payload()
      const result = await p.find({
        collection: 'authors',
        limit: 500,
        depth: 1,
        overrideAccess: true,
      })
      return result.docs.map((doc) => mapAuthor(doc as Record<string, unknown>))
    },

    async listPublishedArticles() {
      const p = await payload()
      const result = await p.find({
        collection: 'articles',
        where: {
          and: [
            { status: { equals: 'published' } },
            { _status: { equals: 'published' } },
          ],
        },
        limit: 200,
        depth: 2,
        overrideAccess: true,
        sort: '-publishedAt',
      })
      return result.docs.map((doc) => mapArticle(doc as Record<string, unknown>))
    },

    async getArticleBySlug(categorySlug, slug) {
      const p = await payload()
      const categories = await p.find({
        collection: 'categories',
        where: { slug: { equals: categorySlug } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      const category = categories.docs[0]
      if (!category) return null

      const result = await p.find({
        collection: 'articles',
        where: {
          and: [
            { slug: { equals: slug } },
            { category: { equals: category.id } },
            { status: { equals: 'published' } },
            { _status: { equals: 'published' } },
          ],
        },
        limit: 1,
        depth: 2,
        overrideAccess: true,
      })
      const doc = result.docs[0]
      return doc ? mapArticle(doc as Record<string, unknown>) : null
    },
  })
}
