import { getContent } from '@/lib/content'
import { getDeskStatusCounts, payloadDeskAvailable, type DeskStatusCounts } from '@/lib/admin/payload-desk'

export type AdminDashboardSnapshot = {
  contentSource: string
  usingDevFixtures: boolean
  publishedTotal: number
  breakingCount: number
  scheduledHint: string
  categoryCount: number
  authorCount: number
  payloadConnected: boolean
  statusCounts: DeskStatusCounts | null
  recent: Array<{
    id: string
    slug: string
    categorySlug: string
    title: string
    publishedAt: string | null
    isBreaking: boolean
  }>
}

export async function getAdminDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
  const content = getContent()
  const [articles, categories, authors, statusCounts] = await Promise.all([
    content.listPublishedArticles({ locale: 'ne' }),
    content.listCategories(),
    content.listAuthors(),
    getDeskStatusCounts(),
  ])

  const cards = await Promise.all(articles.slice(0, 8).map((a) => content.toStoryCard(a, 'ne')))

  return {
    contentSource: content.source,
    usingDevFixtures: content.usingDevFixtures,
    publishedTotal: statusCounts?.published ?? articles.length,
    breakingCount: articles.filter((a) => a.isBreaking).length,
    scheduledHint: 'Scheduled → published via /api/cron/scheduled-publish',
    categoryCount: categories.length,
    authorCount: authors.length,
    payloadConnected: payloadDeskAvailable(),
    statusCounts,
    recent: cards.map((c) => ({
      id: c.id,
      slug: c.slug,
      categorySlug: c.categorySlug,
      title: c.title,
      publishedAt: c.publishedAt ?? null,
      isBreaking: c.isBreaking,
    })),
  }
}

export type LaunchCheck = {
  id: string
  label: string
  ok: boolean
  detail: string
}

export function getLaunchChecks(): LaunchCheck[] {
  const hasDb = Boolean(process.env.DATABASE_URL?.trim())
  const hasSecret = Boolean(process.env.PAYLOAD_SECRET && process.env.PAYLOAD_SECRET.length >= 32)
  const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim())
  const hasRevalidate = Boolean(
    process.env.REVALIDATE_SECRET && process.env.REVALIDATE_SECRET.length >= 32,
  )
  const hasCron = Boolean(process.env.CRON_SECRET && process.env.CRON_SECRET.length >= 32)
  const contentSource = process.env.CONTENT_SOURCE ?? 'facade'
  const launch = process.env.LAUNCH_STATUS ?? 'dev'
  const fixturesAllowed = process.env.ALLOW_DEV_FIXTURES !== 'false'
  const pushOff =
    process.env.PAYLOAD_DB_PUSH === 'false' ||
    (process.env.NODE_ENV === 'production' && process.env.PAYLOAD_DB_PUSH !== 'true')
  const sentryReady = Boolean(process.env.SENTRY_DSN?.trim())

  return [
    {
      id: 'database',
      label: 'DATABASE_URL',
      ok: hasDb,
      detail: hasDb ? 'configured' : 'missing — Neon or local:pg required',
    },
    {
      id: 'payload-secret',
      label: 'PAYLOAD_SECRET',
      ok: hasSecret,
      detail: hasSecret ? '≥32 chars' : 'missing or too short',
    },
    {
      id: 'content-source',
      label: 'CONTENT_SOURCE=payload',
      ok: contentSource === 'payload' && hasDb && hasSecret,
      detail: contentSource,
    },
    {
      id: 'blob',
      label: 'BLOB_READ_WRITE_TOKEN',
      ok: hasBlob || launch !== 'live',
      detail: hasBlob ? 'configured' : 'optional in dev; required for live media',
    },
    {
      id: 'revalidate',
      label: 'REVALIDATE_SECRET',
      ok: hasRevalidate,
      detail: hasRevalidate ? '≥32 chars' : 'missing/short',
    },
    {
      id: 'cron',
      label: 'CRON_SECRET',
      ok: hasCron,
      detail: hasCron ? '≥32 chars' : 'missing/short',
    },
    {
      id: 'push',
      label: 'PAYLOAD_DB_PUSH off (prod)',
      ok: launch !== 'live' || pushOff,
      detail: process.env.PAYLOAD_DB_PUSH ?? '(default)',
    },
    {
      id: 'fixtures',
      label: 'Fixtures blocked when live',
      ok: launch !== 'live' || !fixturesAllowed,
      detail: fixturesAllowed ? 'ALLOW_DEV_FIXTURES=true' : 'fixtures blocked',
    },
    {
      id: 'sentry',
      label: 'Sentry (optional)',
      ok: true,
      detail: sentryReady ? 'DSN set' : 'not claimed — DSN empty',
    },
  ]
}
