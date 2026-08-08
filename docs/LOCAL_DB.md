# Local Postgres

Three options, same env contract. Prefer Neon for Vercel; use Docker or embedded Postgres for local CMS work.

## Option A — Docker Compose (preferred when Docker Desktop is installed)

```bash
docker compose up -d
```

```env
DATABASE_URL=postgresql://nagarik:nagarik_dev_password@127.0.0.1:5432/nagarik
```

## Option B — Embedded Postgres (no Docker / no admin install)

Keeps a cluster under `.data/embedded-pg` and writes `.env.local`:

```bash
pnpm --filter @thenagarik/web local:pg
```

Leave that process running. Connection uses port **5433** by default (`NAGARIK_PG_PORT` to override).

`local:pg` writes `DATABASE_URL` + `CONTENT_SOURCE=payload` to **both** repo-root `.env.local` and `apps/web/.env.local` (Next only auto-loads the latter).

If `embedded-postgres` postinstall was blocked by pnpm, run `pnpm approve-builds` once and reinstall.

## Option C — Neon

Create a project, copy the **pooled** connection string into `DATABASE_URL` on `.env.local` and Vercel.

## Shared env after DB is up

```env
PAYLOAD_SECRET=local-dev-payload-secret-min-32-chars!!
REVALIDATE_SECRET=local-dev-revalidate-secret-32chars!
CRON_SECRET=local-dev-cron-secret-at-least-32-chars!
CONTENT_SOURCE=payload
PAYLOAD_DB_PUSH=true
ALLOW_DEV_FIXTURES=true
LAUNCH_STATUS=dev
```

## First CMS user + seed

```bash
pnpm --filter @thenagarik/web seed
pnpm --filter @thenagarik/web dev
# Open http://localhost:3000/cms — demo logins in PITCH_DEMO.md
```

Seed creates demo staff (`*@nagarik.local`) and sample articles. See [PITCH_DEMO.md](./PITCH_DEMO.md).

## Stop

- Docker: `docker compose down` (add `-v` to wipe)
- Embedded: Ctrl+C the `local:pg` process (data persists under `.data/embedded-pg`)
