# Next Session Prompt (copy-paste)

Use this verbatim in the next session with The Nagarik agent. A mirrored
version (with the role swapped) can be given to the Nagarik Watch agent.

---

You are working on **The Nagarik** (द नागरिक), a Nepali-first civic news portal:
Next.js 15 (App Router) + TypeScript + Tailwind v4 + embedded Payload CMS 3 +
Neon Postgres, monorepo with `@thenagarik/ui` (Valley Mist token system),
`@thenagarik/content`, `@thenagarik/algorithms`.

## Business context (read first)
We operate two portals — thenagarik.com (this repo, the **golden template**)
and nagarikwatch.com (sibling repo, its UI is deprecated and will be rebased
onto this template as tenant #2). The plan is a **site factory**: ship a
complete branded Nepali news portal in one day, scale toward ~100 sold or
network-operated sites. Strategy and contracts: `docs/NETWORK_FACTORY_PLAN.md`.

## Session start ritual (sandbox resets between turns)
1. `git fetch origin arena/019feca8-the-nagarik && git reset --hard FETCH_HEAD`
2. `corepack enable && corepack prepare pnpm@9.15.4 --activate`; `pnpm install --prefer-offline` if node_modules is gone.
3. `pnpm --filter @thenagarik/web local:pg` (background; port 5433; writes both `.env.local` files incl. `NEXT_PUBLIC_SITE_URL=http://localhost:3000`).
4. `sed -i 's/^PAYLOAD_DB_PUSH=true/PAYLOAD_DB_PUSH=false/' .env.local apps/web/.env.local`
5. `pnpm --filter @thenagarik/web migrate && pnpm --filter @thenagarik/web seed`
6. Build once, serve with `npx next start -p 3000 -H 0.0.0.0` from `apps/web`.
7. Before claiming anything done: `pnpm typecheck && pnpm lint && pnpm test`,
   claim auditor (`pnpm --filter @thenagarik/web exec node --import tsx ../../packages/algorithms/scripts/audit-production-claims.mjs`),
   and `CRON_SECRET='local-dev-cron-secret-at-least-32-chars!' pnpm --filter @thenagarik/web test:e2e:api`
   against the running server. Commit + push every session (remote is the source of truth).

## Current state (2026-08-12, PR #2, HEAD after CI/E2E session)
- Reader UX phase 2, dual hard-separated accounts, algorithms batches 1+2
  (143 executable fns, 68 honest production caps), Signals Desk, search
  autocomplete, brigading alerts, pagination, DB search — all shipped earlier.
- **CI**: `.github/workflows/ci.yml` — quality job (typecheck/lint/unit/claim-audit)
  + build-e2e job (Postgres 16 service, migrate, seed, build, Playwright).
  ADR 0006 documents the strategy and the traps.
- **E2E**: `apps/web/e2e/` — 15 api-project tests green locally (auth
  separation, login gate, comment moderation loop, rate limiter fires, cron
  auth, health) + 5 chromium smoke tests that only run in CI (no browser CDN
  egress in the sandbox). Comment API contract: 201 persisted / 200 silent drop.
- **Cookie fix**: session cookie `Secure` now keyed off NEXT_PUBLIC_SITE_URL
  scheme (`cookieSecure()` in `lib/auth/session-cookie.ts`), not NODE_ENV.
- **Retention**: `/api/cron/engagement-retention` (Bearer CRON_SECRET,
  `ENGAGEMENT_RETENTION_DAYS` default 14) prunes engagement_events.
- **Signal gating**: Signals Desk suppresses burst/surprise below
  `MIN_SIGNAL_EVENTS = 12` impressions per 2h window; UI shows an n<12 chip.

## Your tasks this session (in order)
1. **Watch CI go green on PR #2** — first run may surface CI-only issues
   (chromium smoke selectors, service container timing). Fix forward.
2. **Email adapter + password reset**: nodemailer adapter behind env
   (`SMTP_*` or Resend), Payload forgot-password flow for readers, replace
   the manual journalist password handover with an invite email when
   configured (keep manual fallback).
3. **Reader account depth**: server-side bookmark/history sync (collections +
   routes), interests feeding the homepage mix (not just Up-Next).
4. **Factory theme presets**: `sindoor` preset + `THEME_PRESET` toggle, layout
   variants (anti-footprint) per `NETWORK_FACTORY_PLAN.md`.
5. Backlog (docs/CONTINUING_BACKLOG.md): newsletter digest cron, headline A/B
   composer, composer autosave, tsvector search index, payload-types generation,
   locale-switcher 404s, focus-trap fixes for narrator/tint popovers.

Be brutally honest in the final report: what is verified, what is assumed,
what is still open.
