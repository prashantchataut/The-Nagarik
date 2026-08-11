import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Articles } from './collections/Articles'
import { Authors } from './collections/Authors'
import { Categories } from './collections/Categories'
import { Comments } from './collections/Comments'
import { JournalistApplications } from './collections/JournalistApplications'
import { Media } from './collections/Media'
import { NewsletterSubscribers } from './collections/NewsletterSubscribers'
import { Readers } from './collections/Readers'
import { Tags } from './collections/Tags'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Build-safe env access.
 * Payload config is imported at `next build` via `/api/[payload]`.
 * Placeholders keep the module evaluable; real env is required at runtime.
 */
const isBuild = process.env.NEXT_PHASE === 'phase-production-build'
/** Placeholders keep `next build` and facade-only boots importable; onInit enforces real secrets for CMS. */
const PAYLOAD_SECRET =
  process.env.PAYLOAD_SECRET?.trim() ||
  'build-placeholder-not-used-at-runtime-min-32-chars'
const DATABASE_URL =
  process.env.DATABASE_URL?.trim() ||
  'postgres://build-placeholder.not.used.at.runtime/db'
const SERVER_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3000'

/**
 * Extra origins allowed to send cookie-authenticated requests (CSRF list).
 * Needed when the app is reached through more than one public origin
 * (preview domains, multi-domain tenants). Comma-separated.
 */
const EXTRA_CSRF_ORIGINS = (process.env.PAYLOAD_CSRF_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean)

function validateAtBoot() {
  if (isBuild) return
  const secret = process.env.PAYLOAD_SECRET?.trim()
  if (!secret || secret.length < 32) {
    throw new Error('PAYLOAD_SECRET must be set and at least 32 characters to use /cms.')
  }
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error('DATABASE_URL must be set to use /cms. Reader can run on CONTENT_SOURCE=facade without Neon.')
  }
}

/**
 * Payload CMS for The Nagarik.
 * Admin UI at `/cms` so custom ops stay at `/admin` and `/admin/algorithms`.
 * One content path: Postgres via Neon. No JSON shadow store.
 */
export default buildConfig({
  secret: PAYLOAD_SECRET,
  serverURL: SERVER_URL,
  csrf: [SERVER_URL, ...EXTRA_CSRF_ORIGINS],
  routes: {
    admin: '/cms',
  },
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · The Nagarik CMS',
      title: 'द नागरिक',
    },
  },
  collections: [Users, Readers, Media, Categories, Authors, Tags, Articles, Comments, NewsletterSubscribers, JournalistApplications],
  plugins: [
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()),
      collections: {
        media: {
          prefix: 'the-nagarik/media',
        },
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
      clientUploads: true,
      addRandomSuffix: true,
      cacheControlMaxAge: 31_536_000,
    }),
  ],
  editor: lexicalEditor(),
  upload: {
    abortOnLimit: true,
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  },
  onInit: validateAtBoot,
  db: postgresAdapter({
    pool: {
      connectionString: DATABASE_URL,
    },
    push:
      process.env.PAYLOAD_DB_PUSH !== undefined
        ? process.env.PAYLOAD_DB_PUSH === 'true'
        : process.env.NODE_ENV !== 'production',
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
