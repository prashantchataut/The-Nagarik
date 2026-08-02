# Nagarik Watch — critical gap report

Separate track from The Nagarik. Source: local audit of `Nagarik Watch`. Apply on that repo in the kill order below.

## P0 — fix first

1. **Legal/ads/CSP/consent triangle**
   - Cookies/privacy claim no third-party ad trackers while AdSense/GAM modes exist
   - CSP `script-src` cannot load network ads
   - `NetworkAdScripts` ignores consent bus mid-session
   - Remediation: mode-aware legal copy + CMP + CSP allowlists; subscribe to consent events

2. **Sentry stub**
   - `lib/observability/sentry.ts` only `console.error`s
   - Remediation: install `@sentry/nextjs` or stop claiming Sentry in launch gates

3. **Anonymous comments**
   - No Turnstile; inventable display name; empty ban list
   - Remediation: auth and/or Turnstile; default comments off; seed banned words

4. **DoIB / brand collision**
   - Publisher identity env-empty; ADR-001 open
   - Remediation: verify registration before `LAUNCH_STATUS=live`

5. **English gate divergence**
   - Payload requires `englishStatus=published`; JSON path accepts any EN fields
   - Remediation: one `isEnglishPublished()` shared helper; CI on Payload path

6. **Cron auth**
   - Bearer compare not timing-safe; workflow can default to production URL
   - Remediation: `timingSafeEqual`; require explicit `CRON_BASE_URL`; secret ≥32

## P1

- Lazy runtime DDL on serverless (comments/polls/rate-limit)
- ADR/doc duplicates and stale claims (ADR-007/008)
- `implementation-status.md` over-VERIFIED
- CI forces `CONTENT_SOURCE=json` — Payload unproven
- Media alt invented from filename; credits optional
- Article chrome + multi ad slots crowd reading; EN caption uses NE field
- i18n dictionary ignored; hardcoded ternaries; comment body always `bodyNe`
- A11y e2e ignores color contrast
- Staff MFA off by default with no live hard-stop
- No DSAR export/delete
- Dual CF Pages / OpenNext scripts despite Vercel ADR
- House ads `alt=""`; moderation verdict named `publish` → `pending`

## P2

- PWA stale-offline risk; hollow NEPSE/utilities
- Thin E2E for consent/ads/MFA/cron/media
- Dependency sprawl (CF/OpenNext/PGlite)
- Membership code noise; algorithm catalog overpromises
- Dark true-black Devanagari fatigue
- Breaking push fanout without caps

## Algorithm desk (Watch-specific)

- ~232 “live” = fixture-runnable inventory, not 232 ML systems
- Weighted ranker not homepage primary; trust/LTV hard-zero
- Breaking auto-boost skipped when Payload canonical
- Personalize default `browser-reader`; related pool = last 40

## Kill order

1. Legal/ads/CSP/consent → 2. Real Sentry or rename → 3. Comments CAPTCHA/auth + default off → 4. Unify English gate + Payload CI → 5. Cron auth/topology → 6. Migrations-only ops DB + media alt/credit → 7. Article chrome/ad diet + contrast a11y

## Status for The Nagarik track

Gap report delivered in this file. **P0 patches applied on Nagarik Watch (2026-08-02):**

- `cron-auth.ts`: timing-safe Bearer compare; secret ≥ 32
- `json-store.ts`: `englishStatus` + fail-closed public English (`articleHasPublicEnglish`)
- `sentry.ts`: DSN alone no longer reports `ready: true`
- `comments/route.ts`: sign-in required (anonymous inventable names closed)

Remaining Watch P0 (next Watch session): ads/CSP/legal triangle, DoIB identity, CAPTCHA on top of auth.
