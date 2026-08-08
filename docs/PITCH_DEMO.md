# Pitch demo script (≤10 minutes)

Local/pitch passwords from seed: `NagarikPitch2026!`  
Accounts: `admin@nagarik.local`, `publisher@nagarik.local`, `editor@nagarik.local`, `journalist@nagarik.local`

**Rotate these before any real production launch.**

## Preconditions

1. Postgres running (Neon pooled URL **or** `docker compose up -d`).
2. `.env.local` has `DATABASE_URL`, `PAYLOAD_SECRET` (≥32), `REVALIDATE_SECRET` (≥32).
3. `pnpm --filter @thenagarik/web seed` completed.
4. `CONTENT_SOURCE=payload`.

## Walkthrough

1. Open `/admin` — confirm Database + Payload secret show configured; CMS ready = yes.
2. Open `/cms` — sign in as `publisher@nagarik.local`.
3. **Articles** list: show filters/columns (`status`, `englishStatus`, `isBreaking`).
4. Open **संसद्मा आज विशेष बैठक** — point at breaking checkbox + published bilingual fields.
5. Open **नागरिक अधिकार…** — `englishStatus=none`; show `/en/...` 404/not found vs Nepali URL works.
6. Create a short draft: Nepali title + deck + category + author → set status Published → Save.
7. Open `/ne` — new story appears (revalidate hook); fixture banner must be **absent**.
8. Optional: `/ne/utilities/nepali-patro` — calendar works; gold/forex labeled as sample rates.

## Vercel cutover (when Neon ready)

1. Set Production env: `DATABASE_URL` (Neon pooled), `PAYLOAD_SECRET`, `BLOB_READ_WRITE_TOKEN`, `REVALIDATE_SECRET`, `CRON_SECRET`, `CONTENT_SOURCE=payload`, `PAYLOAD_DB_PUSH=false`.
2. Generate/apply migrations (`docs` → `apps/web/src/payload/migrations`).
3. Redeploy.
4. First admin via `/cms` if empty, then run seed from a trusted machine against prod DB **once**.
5. Cron: `scheduled-publish` every 15m + nightly `ops-probe` (see `vercel.json`).

Until Neon exists, local pitch uses embedded Postgres (`pnpm --filter @thenagarik/web local:pg`) — see [LOCAL_DB.md](./LOCAL_DB.md).

## Honest claims for the room

- Say: original journalism CMS, bilingual English gate, honest cold-start rankings.
- Do **not** claim: live gold/forex APIs, DoIB registration, network ads, Sentry (unless DSN wired).
