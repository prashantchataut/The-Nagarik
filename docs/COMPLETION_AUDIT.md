# Completion Audit - What Actually Remains (Code)

Date: 2026-08-11 · Audited with: `ui-audit`, `design-taste-frontend`, `web-perf`,
`eeat-signals`, `payload`, `seo-audit`, `webapp-testing`, `verification-before-completion`.

Scope: CODE gaps only. Env/keys/hosting/DNS are excluded by request.
Legend: ⛔ launch blocker · 🔴 high · 🟡 medium · 🟢 polish

## 1. Launch blockers (must fix before any public launch)

| # | Finding | Evidence | Fix |
|---|---------|----------|-----|
| ⛔1 | **Site-wide `noindex`.** Root layout hardcodes `robots: { index: false, follow: false }` - the entire site is invisible to Google forever. | `app/layout.tsx:16` | Drive from `LAUNCH_STATUS`: `index: launch === 'live'`; per-page noindex stays for account/desk routes. |
| ⛔2 | **Render-blocking third-party fonts.** Google Fonts loaded via CSS `@import` in `globals.css` - blocks first paint, FOIT on Devanagari, no fallback metrics (CLS). Kills LCP < 2.5s on 3G. | `globals.css:1` | Migrate to `next/font/google` (Mukta + Noto Serif Devanagari) with `display: swap` + `adjustFontFallback`; wire into the existing `--font-*` vars. Also required for the factory's config-driven fonts. |
| ⛔3 | **No pagination anywhere.** Category, latest, search, and author pages render a fixed slice; older stories become unreachable and list pages will collapse at real archive sizes. | `[category]/page.tsx`, `latest/page.tsx` | Cursor pagination (`?page=` + `payload.find({ limit, page })`) with rel prev/next links for SEO. |
| ⛔4 | **Search does not scale.** Every query loads ALL published articles + bodies into memory and builds an index per request. Fine at 40 fixtures; O(n) at 10k articles. | `search/page.tsx` → `buildSearchIndex` | Postgres full-text search (tsvector column + GIN index via a Payload hook) behind the same UI; keep facade path for dev. |
| ⛔5 | **Engagement/ranking store is a JSON file.** `.data/engagement.json` is per-instance and lost on redeploy - trending/most-read silently break in production. | `lib/engagement.ts` | `events` Payload collection (or raw table) + windowed aggregate queries; the algorithms package already consumes normalized signals. |

## 2. High priority (product incomplete without)

| # | Finding | Fix |
|---|---------|-----|
| 🔴1 | **Reader account does not yet power features.** Interests are stored (`readers.interests`) but recommendations (`/api/recommendations`), the homepage "तपाईंका लागि" rail, and comment identity don't read them. | Feed interests into the recommender; pre-fill comments from the session; server-side bookmark sync (new `reader-bookmarks` collection) so saved stories follow the account across devices. |
| 🔴2 | **No password reset / email change for readers or staff.** Payload's forgot-password APIs exist but no routes/UI - and there is no email adapter, so tokens have no delivery path. This is the main reason journalist onboarding uses one-time passwords. | `@payloadcms/email-nodemailer` + reset routes/pages; then swap journalist approval to an invite link flow. |
| 🔴3 | **Composer has no autosave/draft recovery.** A crash mid-article loses work (data-loss audit fail). | Debounced localStorage draft + interval PATCH to `/api/journalist/articles/[id]`. |
| 🔴4 | **Theme layer + layout variants unbuilt** (factory §2.2-2.3): palette/fonts still single-preset, `HeroLead`/`SectionBand`/`SiteHeader` single-variant. This is the anti-footprint requirement for the 100-site plan. | Emit per-site `theme.css` from `site.config.theme`; variant props with config selection. |
| 🔴5 | **Comment notifications/counters absent.** No way for editors to know pending comments exist without opening the queue; no per-article comment count on cards. | Pending badge in AdminShell nav (server count), comment count in story card metadata. |
| 🔴6 | **Media pipeline gaps.** No image resizing config on the `media` collection (originals served), no focal point, no responsive `sizes` from Payload. | `upload.imageSizes` (card/hero/thumb) + serve generated sizes through `MediaRef`. |

## 3. Medium (quality/robustness)

| # | Finding | Fix |
|---|---------|-----|
| 🟡1 | No CI. Zero automated gate on PRs (verification runs only when an agent remembers). | GitHub Actions: pnpm install → typecheck → lint → test → build on PR. |
| 🟡2 | No E2E tests. All 37 tests are unit; the comment loop, auth separation, and patro navigation are verified manually per session. | Playwright suite for: reader signup/login separation, comment moderation loop, focus mode, patro month navigation. |
| 🟡3 | Rate limits are per-instance memory. Fine as abuse damping; formal limits need an edge/WAF rule or a Postgres counter. | Documented in BACKEND_RUNBOOK §4; add pg-backed limiter when multi-instance. |
| 🟡4 | `middleware.ts` locale redirect doesn't respect reader `locale` preference. | Read the reader session locale (or a cookie mirror) in middleware. |
| 🟡5 | Narrator/focus popovers lack focus traps (drawer has one); Escape handling inconsistent. | Shared `useFocusTrap` hook across drawer, narrator panel, tint menu. |
| 🟡6 | Bilingual gaps: journalist desk is ne-only; several reader components carry local COPY tables while `i18n.ts` holds the rest - two i18n systems drifting. | Consolidate on one dictionary module per surface; EN pass over the desk. |
| 🟡7 | JSON-LD is article-only. Missing `NewsMediaOrganization` sitewide, `BreadcrumbList`, and `Person` (with `sameAs`) on author pages - E-E-A-T signals half-wired. | Emit from `site.config` in the locale layout + author page. |
| 🟡8 | RSS lacks `<language>`, `<lastBuildDate>`, media enclosures, and per-category feeds (syndication tier of the network plan needs these). | Extend the two RSS routes + `/rss/[category].xml`. |
| 🟡9 | Offline pinning caches only the article HTML document, not its images/CSS - a pinned story opens half-broken offline. | SW: on `CACHE_STORY`, parse and pin critical subresources. |
| 🟡10 | `swapLocalePath` keeps the slug when switching locales on article pages even when no EN version exists → 404s (should fall back to home/category). | Check `articleHasEnglish` in the toolbar link (already done) AND in the header locale switcher (not done). |

## 4. Polish

- 🟢 Nepali digit formatting inconsistent (mixed `toNepDigit` and Latin numerals across cards/patro).
- 🟢 `MobileNav.tsx` is dead code - delete.
- 🟢 Skeletons exist but several loading.tsx routes render spinners instead of layout-matched skeletons (CLS).
- 🟢 `print` stylesheet hides everything with `form`/`button` selectors - too broad, also hides article figures inside `<form>`-adjacent layouts.
- 🟢 Patro widget converter inputs accept free text without inline validation hints.

## 5. Definition of "complete" (v1.0 launchable)

1. All ⛔ items closed, with fresh verification evidence.
2. 🔴1-🔴3 closed (accounts power features; no data-loss paths; password reset).
3. CI green on main; Playwright covering the 4 critical journeys.
4. Lighthouse (mobile, throttled): LCP < 2.5s, CLS < 0.1, INP < 200ms on home + article.
5. Factory: second theme preset renders the same build with a distinct identity.

## Account model (implemented 2026-08-11, this commit)

Readers and journalists are hard-separated:
- `readers` auth collection (no roles, no CMS access, `admin: () => false`);
  `users` remains staff-only. One session cookie = one identity; staff gates
  verify `collection === 'users'`, reader gates verify `collection === 'readers'`.
- Signup at `/[locale]/register` with an explicit account-type chooser:
  reader (instant) vs journalist (application + editorial verification).
- Journalist verification: `journalist-applications` queue → editor approves in
  `/admin/queue` → staff account created with one-time password handed over
  manually. Nobody can self-assign the journalist role.
- Reader login at `/[locale]/login`; staff login stays at `/admin/login`.
