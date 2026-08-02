# Payload CMS cutover

## Prerequisites

- Neon `DATABASE_URL` (pooled)
- `PAYLOAD_SECRET` ≥ 32 chars
- `BLOB_READ_WRITE_TOKEN`
- `REVALIDATE_SECRET` ≥ 32 chars

## Install (when ready)

```bash
pnpm --filter @thenagarik/web add payload @payloadcms/next @payloadcms/db-postgres @payloadcms/richtext-lexical @payloadcms/storage-vercel-blob sharp graphql
```

## Rules

1. One content path: Payload is SoT; delete any temptation to revive JSON shadow stores.
2. English public pages require `englishStatus === 'published'` via shared `@thenagarik/content` gate.
3. Media: reject empty alt; require credit before publish.
4. `afterChange` on Articles → HMAC/Bearer revalidate to `/api/revalidate`.
5. Production: `push: false`, run migrations in CI.

## Roles

`journalist` → `editor` → `publisher` → `admin` (keep small).

## Contracts

See `apps/web/src/payload/contracts.ts` and `payload.config.ts`.
