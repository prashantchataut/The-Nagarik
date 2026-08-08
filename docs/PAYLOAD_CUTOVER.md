# Payload CMS cutover

## Prerequisites

- Neon `DATABASE_URL` (pooled) **or** local Postgres — Docker Compose **or** embedded (`pnpm --filter @thenagarik/web local:pg`) — see [LOCAL_DB.md](./LOCAL_DB.md)
- Next.js loads env from `apps/web/.env.local` (also keep repo-root `.env.local` for seed scripts)
- `PAYLOAD_SECRET` ≥ 32 chars
- `BLOB_READ_WRITE_TOKEN` (production media; optional locally)
- `REVALIDATE_SECRET` ≥ 32 chars
- `CONTENT_SOURCE=payload` when ready to leave fixtures

## Install

Packages are pinned in `apps/web` (Payload 3.85.1, Next 15.4.11 for peer alignment).

## Mount points

| Path | Purpose |
|------|---------|
| `/cms` | Payload admin UI |
| `/admin` | Ops home (algorithm desk links, env status) |
| `/admin/algorithms` | Honest algorithm registry |
| `/api/*` | Payload REST + reader APIs (`events`, `revalidate`, …) |
| `/api/cron/scheduled-publish` | Flips due scheduled articles (Bearer `CRON_SECRET`) |
| `/api/cron/ops-probe` | Env readiness probe |

`/admin/cms` redirects to `/cms`.

## Rules

1. One content path: Payload is SoT; no JSON shadow store.
2. English public pages require `englishStatus === 'published'` via shared `@thenagarik/content` gate.
3. Media: reject empty alt; require credit before save.
4. Articles `afterChange` → Bearer `POST /api/revalidate` (timing-safe).
5. Production: `PAYLOAD_DB_PUSH=false`, run migrations in CI.
6. Roles stay small: `journalist` → `editor` → `publisher` → `admin`.

## First boot

1. Set env from `.env.example` (Neon or `docker compose up -d` + [LOCAL_DB.md](./LOCAL_DB.md)).
2. `pnpm --filter @thenagarik/web dev`
3. Open `/cms`, create the first user **or** run seed (creates demo staff).
4. `pnpm --filter @thenagarik/web seed` — categories, authors, bilingual + breaking samples.
5. Set `CONTENT_SOURCE=payload` and confirm the reader loads from Postgres (no fixture banner).
6. Pitch script: [PITCH_DEMO.md](./PITCH_DEMO.md). Hardening: [PRODUCTION_HARDENING.md](./PRODUCTION_HARDENING.md).

## Contracts

See `apps/web/src/payload/contracts.ts` and collection configs under `apps/web/src/payload/collections/`.
