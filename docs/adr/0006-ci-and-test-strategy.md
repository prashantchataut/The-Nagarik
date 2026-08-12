# ADR 0006: CI pipeline and test strategy

Date: 2026-08-12
Status: accepted

## Context

Everything shipped so far (dual-account separation, moderation loop, algorithm
registry honesty, cron surfaces) was verified manually per session. Nothing
stopped a regression from landing on `main`. Two sandbox constraints shaped
the design:

1. The dev sandbox has no egress to the Playwright browser CDN, so
   browser-based tests cannot run there.
2. The app requires Postgres for any meaningful E2E (facade mode would
   invalidate every auth/moderation assertion).

## Decision

**Two-lane GitHub Actions pipeline** (parked at `.github/workflows-pending/ci.yml`;
the sandbox GitHub App token lacks the `workflows` permission, so a human must
`git mv` it into `.github/workflows/` once - see the README next to it):

- `quality`: typecheck, lint, all workspace unit tests, and the algorithm
  registry claim auditor (`packages/algorithms/scripts/audit-production-claims.mjs`).
  The auditor failing the build makes "no fake production claims" a machine-
  enforced invariant, not a promise.
- `build-e2e`: Postgres 16 service container on port 5433 (mirrors local
  embedded-pg), real migrations (`PAYLOAD_DB_PUSH=false`), real seed, real
  `next build`, then Playwright.

**Two-project Playwright suite** (`apps/web/playwright.config.ts`):

- `api` project (`*.api.spec.ts`): request-context only, no browser binary.
  Runs in the sandbox AND in CI. Covers the invariants that must never break
  silently: reader/staff hard separation, login gating, the full comment
  moderation loop, per-IP rate limiting, cron bearer auth, health.
- `chromium` project (`*.ui.spec.ts`): real-browser smoke (front page,
  story hop, login form with >= 44px tap target, login-first account gate,
  search combobox). CI-only until sandbox egress changes.

## Consequences and traps encoded in the suite

- **Cookie `Secure` is keyed off `NEXT_PUBLIC_SITE_URL` scheme, not
  `NODE_ENV`** (`lib/auth/session-cookie.ts#cookieSecure`). A prod-mode
  server on plain http (CI, local `next start`) previously issued `Secure`
  cookies that every compliant client silently dropped - sessions worked in
  dev and broke in prod-mode testing. Https deployments still get `Secure`.
- Payload cookie auth is CSRF-protected via fetch metadata: the `api`
  project sends `sec-fetch-site: same-origin` exactly like a browser.
- Rate limiter state lives in the server process: specs forge per-run
  x-forwarded-for IPs (`e2e/helpers.ts#forgedIp`), and one spec asserts the
  limiter actually fires (5th comment from one IP -> 429).
- Comment API contract: **201 = persisted, 200 = silent drop** (spam/dup
  honeypot paths). The moderation-loop spec relies on 201 to prove real
  persistence.
- Next streams layout redirects as `200 + meta refresh` once the shell has
  flushed; the login-gate spec accepts both that and a plain 3xx.

## Alternatives rejected

- Single browser-only suite: cannot run in the sandbox, and API-level
  contracts (status codes, cookie flags) are better asserted directly.
- Mocked DB for E2E: would not have caught the enum, CSRF, or cookie-flag
  classes of bugs that motivated this ADR.
