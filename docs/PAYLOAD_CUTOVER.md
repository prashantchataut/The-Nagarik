# Payload CMS cutover

## Prerequisites

- Neon `DATABASE_URL` (pooled)
- `PAYLOAD_SECRET` ≥ 32 chars
- `BLOB_READ_WRITE_TOKEN` (production media; optional locally)
- `REVALIDATE_SECRET` ≥ 32 chars
- `CONTENT_SOURCE=payload` when ready to leave fixtures

## Install

Packages are pinned in `apps/web` (Payload 3.85.1, Next 15.4.11 for peer alignment).

```bash
pnpm --filter @thenagarik/web add payload@3.85.1 @payloadcms/next@3.85.1 @payloadcms/db-postgres@3.85.1 @payloadcms/richtext-lexical@3.85.1 @payloadcms/storage-vercel-blob@3.85.1 @payloadcms/ui@3.85.1 graphql@^16.9.0 sharp
```

## Mount points

| Path | Purpose |
|------|---------|
| `/cms` | Payload admin UI |
| `/admin` | Ops home (algorithm desk links, env status) |
| `/admin/algorithms` | Honest algorithm registry |
| `/api/*` | Payload REST + existing reader APIs (`events`, `revalidate`, …) |

`/admin/cms` redirects to `/cms`.

## Rules

1. One content path: Payload is SoT; no JSON shadow store.
2. English public pages require `englishStatus === 'published'` via shared `@thenagarik/content` gate.
3. Media: reject empty alt; require credit before save.
4. Articles `afterChange` → Bearer `POST /api/revalidate` (timing-safe).
5. Production: `PAYLOAD_DB_PUSH=false`, run migrations in CI.
6. Roles stay small: `journalist` → `editor` → `publisher` → `admin`.

## First boot

1. Set env from `.env.example`.
2. `pnpm --filter @thenagarik/web dev`
3. Open `/cms`, create the first user (bootstraps as `admin`).
4. Seed categories / authors, publish an article with bodyNe JSON blocks.
5. Set `CONTENT_SOURCE=payload` and confirm the reader loads from Neon.

## Contracts

See `apps/web/src/payload/contracts.ts` and collection configs under `apps/web/src/payload/collections/`.
