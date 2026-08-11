# Backend Runbook - The Nagarik (golden template)

Date: 2026-08-11. Status: backend production-path verified end to end against
a real Postgres (embedded PG 18, migrations applied, config-driven seed,
Payload-backed reader APIs).

## 1. Configuration model

- `apps/web/src/site.config.ts` - THE brand source (zod-validated by
  `lib/site-schema.ts`). Feeds: `lib/site.ts`, i18n brand strings, manifest,
  root metadata, RSS, article JSON-LD publisher, and the seed script's
  category set. `assertLaunchReady` blocks `LAUNCH_STATUS=live` without a
  legal identity.
- Env contract: `.env.example`. New: `PAYLOAD_CSRF_ORIGINS` (extra origins
  allowed for cookie-authenticated staff requests; serverURL always allowed).

## 2. Database lifecycle (production path)

```bash
pnpm --filter @thenagarik/web local:pg        # or Docker/Neon
PAYLOAD_DB_PUSH=false pnpm --filter @thenagarik/web migrate:create <name>
PAYLOAD_DB_PUSH=false pnpm --filter @thenagarik/web migrate
PAYLOAD_DB_PUSH=false pnpm --filter @thenagarik/web migrate:status
PAYLOAD_DB_PUSH=false pnpm --filter @thenagarik/web seed
```

- Migrations run through `src/scripts/migrate.ts` (programmatic runner; the
  `payload` CLI breaks on Node 22/24 ESM interop).
- `src/scripts/patch-next-env.cjs` loads Next-style env files AND patches the
  `@next/env` v16 interop shape that Payload's `bin/loadEnv` destructures.
- Initial migration `20260811_133542_init` covers the full schema (22 tables)
  including `comments`, `newsletter_subscribers`, `authors_beats`,
  `users_sessions`.
- Seeding acts as the demo admin user so the publish-gate hooks stay strict
  (no anonymous publishing, ever). `LAUNCH_STATUS=live` skips demo users.

## 3. Collections (Payload 3)

| Collection | Purpose | Public access |
|---|---|---|
| users | Staff auth, roles journalist→editor→publisher→admin | none |
| articles | Bilingual stories, publish gates, drafts | published only |
| authors | Bylines + `avatar`, `beats[]`, `user` link | read |
| categories / tags / media | Taxonomy + uploads | read |
| comments | Threaded reader comments, `pending→approved/rejected` | approved only |
| newsletter-subscribers | Email list (PII: editors+ only) | none |

Reader writes NEVER hit Payload REST directly: `create` access is staff-only;
the validated server routes insert with `overrideAccess` after zod + honeypot
+ rate limiting.

## 4. API surface (reader-facing contract)

All reader APIs return `{ ok: true, ...data }` or `{ ok: false, code, message }`
(`lib/api/http.ts`; codes: invalid, rate-limit, unauthorized, forbidden,
not-found, cms-offline, server-error).

| Route | Method | Notes |
|---|---|---|
| /api/health | GET | site id, contentSource, cmsConfigured, launchStatus |
| /api/breaking | GET | ticker feed, 30s cache, degrades to empty ok |
| /api/comments | GET/POST | 4 posts / IP / 10 min, consent + honeypot |
| /api/admin/comments | GET/POST | editor+ session (facade: dev-only) |
| /api/newsletter | POST | 6 / IP / 10 min, dedupe, resubscribe = opt-in |
| /api/journalist/profile | GET/PUT | contributor session; creates linked author |
| /api/staff/login·logout·me | POST/GET | Payload cookie session |

Rate limiting: `lib/api/rate-limit.ts` (sliding window, per instance, bounded
keys). Strict global limits belong at the edge (Cloudflare) per
PRODUCTION_HARDENING.md.

## 5. Storage fallbacks (facade mode without a DB)

comments + newsletter fall back to gitignored `.data/*.json` so the full
reader loop works in demos; Payload wins automatically whenever
DATABASE_URL + PAYLOAD_SECRET exist. Engagement events unchanged.

## 6. Auth + CSRF behaviour (verified)

- Cookie `payload-token`; header `Authorization: JWT <token>` also accepted.
- Payload rejects cookie-authenticated requests from non-allowlisted Origins
  and from clients that send neither Origin nor `Sec-Fetch-Site` (curl).
  Browsers always pass. Multi-origin deployments must set
  `PAYLOAD_CSRF_ORIGINS`.

## 7. Verified end-to-end (embedded PG, prod build)

1. `/api/health` → `contentSource: payload`, `cmsConfigured: true`
2. Homepage serves seeded DB content, zero fixtures
3. Staff login → journalist profile PUT → `authors` row created with
   user link + beats (confirmed via SQL)
4. Anonymous comment POST → pending row → editor approve → public GET
5. Anonymous moderation attempt → 401
6. Newsletter POST → row in `newsletter_subscribers`; duplicate →
   `created: false`
7. `payload_migrations` shows `20260811_133542_init` batch 1
