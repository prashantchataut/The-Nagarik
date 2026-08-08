/**
 * Start a user-space Postgres for local CMS work when Docker/Neon are unavailable.
 * Data lives under repo `.data/embedded-pg` (gitignored).
 *
 * Usage: pnpm --filter @thenagarik/web local:pg
 * Keep this process running while using /cms and seed.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import EmbeddedPostgres from 'embedded-postgres'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../../../..')
const dataDir = path.join(repoRoot, '.data', 'embedded-pg')
const port = Number(process.env.NAGARIK_PG_PORT ?? 5433)
const user = 'nagarik'
const password = 'nagarik_dev_password'
const database = 'nagarik'

const connectionString = `postgresql://${user}:${password}@127.0.0.1:${port}/${database}`

async function ensureEnvLocal() {
  const targets = [
    path.join(repoRoot, '.env.local'),
    path.join(repoRoot, 'apps', 'web', '.env.local'),
  ]
  for (const envPath of targets) {
    let raw = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
    const upsert = (key: string, value: string) => {
      const re = new RegExp(`^${key}=.*$`, 'm')
      if (re.test(raw)) {
        raw = raw.replace(re, `${key}=${value}`)
      } else {
        raw = `${raw.trimEnd()}\n${key}=${value}\n`
      }
    }
    upsert('DATABASE_URL', connectionString)
    upsert('CONTENT_SOURCE', 'payload')
    upsert('ALLOW_DEV_FIXTURES', 'false')
    upsert('PAYLOAD_DB_PUSH', 'true')
    if (!/^PAYLOAD_SECRET=.+/m.test(raw) || /^PAYLOAD_SECRET=\s*$/m.test(raw)) {
      upsert('PAYLOAD_SECRET', 'local-dev-payload-secret-min-32-chars!!')
    }
    if (!/^REVALIDATE_SECRET=.+/m.test(raw) || /^REVALIDATE_SECRET=\s*$/m.test(raw)) {
      upsert('REVALIDATE_SECRET', 'local-dev-revalidate-secret-32chars!')
    }
    if (!/^CRON_SECRET=.+/m.test(raw) || /^CRON_SECRET=\s*$/m.test(raw)) {
      upsert('CRON_SECRET', 'local-dev-cron-secret-at-least-32-chars!')
    }
    fs.mkdirSync(path.dirname(envPath), { recursive: true })
    fs.writeFileSync(envPath, raw.endsWith('\n') ? raw : `${raw}\n`, 'utf8')
    console.log(`[local:pg] Updated ${envPath}`)
  }
}

async function main() {
  fs.mkdirSync(dataDir, { recursive: true })
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user,
    password,
    port,
    persistent: true,
    // Windows default locale is WIN1252 — force UTF-8 for Devanagari content.
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
    onLog: (msg) => process.stdout.write(`[pg] ${msg}`),
    onError: (msg) => process.stderr.write(`[pg:err] ${String(msg)}`),
  })

  const marker = path.join(dataDir, 'PG_VERSION')
  if (!fs.existsSync(marker)) {
    console.log('[local:pg] Initialising cluster…')
    await pg.initialise()
  }

  console.log(`[local:pg] Starting on port ${port}…`)
  await pg.start()

  try {
    await pg.createDatabase(database)
    console.log(`[local:pg] Created database ${database}`)
  } catch {
    // already exists
  }

  await ensureEnvLocal()
  console.log(`[local:pg] Ready: ${connectionString.replace(password, '***')}`)
  console.log('[local:pg] Keep this process running. Next: pnpm --filter @thenagarik/web seed')

  const shutdown = async () => {
    console.log('\n[local:pg] Stopping…')
    try {
      await pg.stop()
    } catch (err) {
      console.error(err)
    }
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  // Stay alive
  await new Promise(() => {})
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
