# Reader Experience Phase 2 - Implementation Notes

Date: 2026-08-10 · Branch: `arena/019feca8-the-nagarik`

This phase delivers profile surfaces, the autonomous patro engine, reading view
refinements, moderated comments, and editorial enhancements on top of the
PR #1 Civic Newsroom baseline.

## 1. Profile surfaces

- **Reader account (`/[locale]/account`)**: interactive client surface
  (`ReaderAccountClient`) with saved bookmarks, reading history with progress
  bars (both from `localStorage`), theme / text size / focus-tint preferences,
  JSON data export, and confirm-guarded destructive actions. No reader PII
  ever leaves the device.
- **Journalist profile workbench (`/journalist/profile`)**: self-serve byline
  editor for newsroom staff. Nepali + English bios, avatar upload (through the
  existing `/api/journalist/media` gate), up to six beat specializations, and
  a published portfolio rail. Backed by `PUT /api/journalist/profile`, which
  links (or creates) the `authors` document owned by the signed-in user via
  the new `authors.user` relationship.
- **Payload `authors` collection** gained `avatar` (media upload), `beats`
  (array), and `user` (relationship) fields; the public author page and
  article author cards now render portraits and beat pills.
- Profile links with active states in the desktop utility bar, mobile drawer,
  and the mobile bottom navigation.

## 2. Autonomous calendar and event engine

- `bs-calendar.ts` now covers **BS 2070–2095** (`BS_MIN_YEAR` / `BS_MAX_YEAR`;
  2091–2095 projected from the official periodic month-length pattern).
- `panchang.ts` gained an autonomous engine:
  - `eventsInBsMonth(year, month)`: Sankranti (day 1 of every solar month),
    fixed BS and AD observances, tithi-rule lunar festivals, and generated
    Ekadashi / Purnima / Amavasya markers for any supported month.
  - `resolveLunarRule` anchors each festival cluster to the new moon inside
    its anchor month (shukla tithis resolve forward, krishna backward), so
    Dashain / Tihar stay on one lunation even across solar month boundaries.
  - `upcomingPatroEvents(anchor)` recalculates relative to any BS date.
- `NepaliPatroWidget` upcoming sidebar now follows the month being browsed
  and the grid/holiday list renders generated events with holiday coloring.
- Tests: `apps/web/src/lib/patro-engine.test.ts` (10 assertions incl. full
  2070–2095 round trips and Dashain fortnight geometry).

## 3. Reading view refinements

- **Toolbar**: `px-4 py-3`, `gap-3 sm:gap-4`, rounded pill controls (44px
  minimum touch targets), and divider-separated tool groups.
- **Focus mode** (`FocusModeToggle`): hides all chrome via `[data-focus-hide]`
  CSS, centers the article column (`[data-article-grid]`), and offers Warm
  Paper / Night / Pure White tints implemented as token-cascade overrides.
  Escape exits; state never leaks across navigation.
- **Narrator** (`ArticleNarrator`): Web Speech API with sentence-by-sentence
  playback, Devanagari-based language detection (`ne-NP` / `en-US` with voice
  fallbacks), CSS Custom Highlight API sentence highlighting (block-level
  fallback), play / pause / resume / stop, and speed control.
- **Search**: masthead form gained a visible submit button; fixed the
  reference-before-declaration crash in `/[locale]/search` category filtering.

## 4. Comments with moderation and consent

- `comments` Payload collection (pending → approved/rejected, threaded via
  `parent`, salted `ipHash`, no raw IPs). Public REST creation is disabled;
  only the validated server route inserts records.
- `POST /api/comments`: zod validation, honeypot, explicit publish-consent
  requirement, per-IP rate limiting (4 per 10 minutes).
- `CommentsSection` on every article: threaded replies (one level), inline
  validation, `aria-live` status, moderation policy notice.
- Moderation: `CommentModerationPanel` in `/admin/queue` +
  `/api/admin/comments` (editor+ staff session; facade mode allows local
  moderation only outside `LAUNCH_STATUS=live`). Also editable in Payload CMS.
- Storage falls back to `.data/comments.json` when Neon is not configured so
  the full loop works in facade/dev mode.

## 5. Editorial enhancements

- **Breaking ticker**: `BreakingStrip` polls `/api/breaking` every 60s with a
  pulsing live dot when `isBreaking` stories are active (`aria-live=polite`).
- **Newsletter**: `NewsletterCard` (footer + article sidebar) with client
  validation and `/api/newsletter` (rate limited, deduped, hashed storage).
- **PWA offline**: `sw.js` v2 pins bookmarked stories into a `tn-saved-v1`
  cache on `CACHE_STORY` messages from the bookmark button; saved stories
  win the offline lookup and unpin on removal.

## Verification (fresh runs)

- `pnpm typecheck` · `pnpm lint` · `pnpm test` (28 passing) · `pnpm build`
- Runtime smoke: search + category filter, comment create → moderate →
  publish loop, rate limits (429), newsletter validation, breaking feed,
  focus/narrator markup present on article pages.
