# ADR 0007: Email adapter, password reset, and the synced reader library

Date: 2026-08-12
Status: accepted

## Context

Two 🔴 audit items blocked real reader accounts: no email delivery path
(so no password reset - a dead end for locked-out readers and the reason
journalist onboarding was a manual password handover), and account data
that powered nothing (bookmarks/history lived only in localStorage).

## Decisions

### 1. Email: nodemailer over SMTP env, console fallback, health-surfaced

- `payload.config.ts` wires `@payloadcms/email-nodemailer` only when
  `SMTP_HOST/SMTP_USER/SMTP_PASS/EMAIL_FROM` are all present; otherwise
  Payload's console logger runs (visible in dev, harmless in CI).
- NOT a launch blocker in `assertLaunchReady` - a portal can go live with
  manual support - but `/api/health` now reports `emailConfigured` so the
  network ops dashboard sees the gap. From-name comes from `site.config`
  (factory rule: no hardcoded brand).
- Reader reset emails are bilingual (reader's stored locale), built by
  `lib/email.ts#transactionalHtml` (table layout + inline styles), and link
  to the reader-facing `/{locale}/reset-password?token=` page - never /cms.

### 2. Password reset flow

- `/api/reader/forgot-password`: rate-limited, honeypotted, and
  **anti-enumeration** - identical `{ok:true,status:'sent'}` for known and
  unknown emails.
- `/api/reader/reset-password`: consumes the token, sets the new password,
  and logs the reader in immediately (the token already proved email
  ownership; a second login step is pure friction).
- Journalist approval now sends a set-your-password email via the users
  collection's forgot-password flow when SMTP is configured
  (`inviteEmailSent` in the API response, panel de-emphasises the one-time
  password to a backup). Manual handover remains the fallback.
- Verification: `scripts/verify-password-reset.ts` proves the full loop
  against a live server (token issue -> public endpoint -> session cookie
  -> old password dead). E2E specs pin the HTTP contract.

### 3. Reader library: server-merge with tombstones

- `readers.savedStories` / `readers.readingHistory` (jsonb, capped 100/60)
  + `/api/reader/library` GET/PUT/DELETE. The client pushes its device
  state; the SERVER merges (union by storyId, newest timestamp wins) so any
  number of devices converge regardless of sync order.
- **Tombstones** (`readers.libraryTombstones`, cap 300): deletions record
  `{storyId, deletedAt}`; a stale device pushing a deleted item back loses
  unless its copy is genuinely newer than the deletion (a real re-save).
  Without this, every delete resurrects - the classic sync bug.
- Anonymous readers: zero network calls, library stays device-local
  (privacy-first default unchanged; HistoryPanel copy updated to stay
  truthful about logged-in sync).
- Client layer `components/account/library-sync.ts`: debounced pushes from
  bookmark toggles (1.5s) and reading progress (8s), pull-on-mount in the
  account panels, sync after login/register/reset.

### 4. Personalization on an ISR homepage

`ForYouStrip` is client-rendered after hydration from device/account
signals via `/api/recommendations` (interests come from the account when
logged in, device profile otherwise). The ISR HTML stays identical and
cacheable for everyone; visitors with no signals get nothing - no empty
shell, no layout shift, `data-nosnippet` so it never leaks into snippets.

### 5. Untranslated-article locale switching

`/en/{category}/{slug}` for a story without a published English version now
redirects to the Nepali original instead of 404ing (audit item closed);
`robots: noindex` on that path was already in place.

## Alternatives rejected

- Requiring email for launch: too strict for the factory's smallest sites.
- A separate `reader-bookmarks` collection: heavier (joins, N rows per
  reader) with no query need - the library is only ever read whole per
  reader; jsonb keeps it one row, one round trip.
- Client-side merge: two devices syncing in different orders diverge;
  the server is the only place a total order exists.
