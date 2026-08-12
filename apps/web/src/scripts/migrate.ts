/**
 * Programmatic migration runner - bypasses the `payload` CLI, which breaks
 * on Node 22/24 ESM interop (require() of a top-level-await graph).
 *
 * Usage (env from .env.local via patch-next-env or --env-file):
 *   pnpm --filter @thenagarik/web migrate:create [name]   # generate
 *   pnpm --filter @thenagarik/web migrate                 # apply
 *   pnpm --filter @thenagarik/web migrate:status          # inspect
 *
 * Production: PAYLOAD_DB_PUSH=false and apply migrations in release.
 */
import { getPayload } from 'payload'
import config from '../payload/payload.config'

async function main() {
  const command = process.argv[2] ?? 'migrate'
  const secret = process.env.PAYLOAD_SECRET?.trim()
  if (!secret || secret.length < 32) throw new Error('PAYLOAD_SECRET (>=32) required')
  if (!process.env.DATABASE_URL?.trim()) throw new Error('DATABASE_URL required')

  const payload = await getPayload({ config })

  switch (command) {
    case 'create': {
      const migrationName = process.argv[3] ?? `migration_${Date.now()}`
      await payload.db.createMigration({ payload, migrationName, forceAcceptWarning: true })
      console.log(`[migrate] created migration: ${migrationName}`)
      break
    }
    case 'status': {
      await payload.db.migrateStatus()
      break
    }
    case 'fresh': {
      await payload.db.migrateFresh({ forceAcceptWarning: true })
      console.log('[migrate] fresh migration applied')
      break
    }
    default: {
      await payload.db.migrate()
      console.log('[migrate] migrations applied')
    }
  }
  process.exit(0)
}

main().catch((error) => {
  console.error('[migrate] failed:', error)
  process.exit(1)
})
