import type { CollectionAfterChangeHook } from 'payload'

type ArticleDoc = {
  id: string | number
  slug?: string
  status?: string
  _status?: string
  category?: string | number | { id?: string | number; slug?: string }
  englishStatus?: string
}

function siteBaseUrl(): string | null {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  return value ? value.replace(/\/$/, '') : null
}

function revalidateSecret(): string | null {
  const secret = process.env.REVALIDATE_SECRET?.trim()
  return secret && secret.length >= 32 ? secret : null
}

async function resolveCategorySlug(
  doc: ArticleDoc,
  req: {
    payload: {
      findByID: (args: {
        collection: 'categories'
        id: string | number
        depth: number
        overrideAccess: boolean
      }) => Promise<unknown>
    }
  },
): Promise<string> {
  const category = doc.category
  if (category && typeof category === 'object' && category.slug) return String(category.slug)
  const id = typeof category === 'object' ? category.id : category
  if (id === undefined || id === null) return ''
  try {
    const categoryDoc = await req.payload.findByID({
      collection: 'categories',
      id,
      depth: 0,
      overrideAccess: true,
    })
    return String((categoryDoc as { slug?: string }).slug ?? '')
  } catch {
    return ''
  }
}

/**
 * After a published article changes, Bearer-auth revalidate the reader caches.
 * Uses the same timing-safe `/api/revalidate` contract as cron/ops.
 * Publish succeeds even if the webhook fails (logged; dynamic reads are the backstop).
 */
export const revalidatePublishedArticle: CollectionAfterChangeHook = async ({ doc, req }) => {
  const article = doc as ArticleDoc
  const isPublished = article.status === 'published' && article._status === 'published'
  if (!isPublished) return doc

  const baseUrl = siteBaseUrl()
  const secret = revalidateSecret()
  if (!baseUrl || !secret) {
    req.payload.logger.warn(
      'Publish revalidate skipped: NEXT_PUBLIC_SITE_URL and REVALIDATE_SECRET (≥32) required.',
    )
    return doc
  }

  const categorySlug = await resolveCategorySlug(article, req)
  const paths = ['/ne', '/en', '/ne/latest', '/en/latest']
  if (categorySlug && article.slug) {
    paths.push(`/ne/${categorySlug}`, `/en/${categorySlug}`)
    paths.push(`/ne/${categorySlug}/${article.slug}`, `/en/${categorySlug}/${article.slug}`)
  }

  try {
    const response = await fetch(`${baseUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        paths,
        articleId: String(article.id),
        slug: String(article.slug ?? ''),
        categorySlug,
        englishStatus: article.englishStatus ?? 'none',
      }),
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      req.payload.logger.error(
        `Reader revalidation failed (${response.status}): ${detail.slice(0, 300)}`,
      )
    }
  } catch (error) {
    req.payload.logger.error(
      `Reader revalidation failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  return doc
}
