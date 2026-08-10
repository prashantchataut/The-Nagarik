import {
  getDeskStatusCounts,
  listDeskAuthors,
  listDeskCategories,
  listDeskPublishedStories,
  payloadDeskAvailable,
  type DeskStatusCounts,
} from '@/lib/admin/payload-desk'

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

/**
 * Desk metrics from Payload only. Never lists facade fixture stories as if they were CMS content.
 */
export async function getAdminDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
  const connected = payloadDeskAvailable()
  const contentSource = process.env.CONTENT_SOURCE ?? 'facade'
  const usingDevFixtures = !connected || contentSource !== 'payload'

  if (!connected) {
    return {
      contentSource,
      usingDevFixtures: true,
      publishedTotal: 0,
      breakingCount: 0,
      scheduledHint: 'Connect DATABASE_URL to load desk metrics from Payload.',
      categoryCount: 0,
      authorCount: 0,
      payloadConnected: false,
      statusCounts: null,
      recent: [],
    }
  }

  const [stories, categories, authors, statusCounts] = await Promise.all([
    listDeskPublishedStories(8),
    listDeskCategories(),
    listDeskAuthors(),
    getDeskStatusCounts(),
  ])

  return {
    contentSource: 'payload',
    usingDevFixtures: false,
    publishedTotal: statusCounts?.published ?? stories.length,
    breakingCount: stories.filter((s) => s.isBreaking).length,
    scheduledHint: 'Scheduled → published via /api/cron/scheduled-publish',
    categoryCount: categories.length,
    authorCount: authors.length,
    payloadConnected: true,
    statusCounts,
    recent: stories.map((s) => ({
      id: s.id,
      slug: s.slug,
      categorySlug: s.categorySlug,
      title: s.titleNe,
      publishedAt: s.publishedAt,
      isBreaking: s.isBreaking,
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
      detail: hasDb ? 'configured' : 'missing - Neon or local:pg required',
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
      detail: sentryReady ? 'DSN set' : 'not claimed - DSN empty',
    },
  ]
}
