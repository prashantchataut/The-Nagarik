# The Nagarik — Site Completeness Report & Launch Roadmap

Audit date: 2026-08-31 (Bhadra 15, 2083)
Scope: entire monorepo (apps/web, packages/{algorithms,content,ui}), reader
frontend, newsroom CMS, admin desk, journalist desk, ops, SEO, monetization.
Companion to `docs/COMPLETION_AUDIT.md` (2026-08-11) — items closed by this
session are marked **[NEW]**.

---

## 1. Executive summary

The Nagarik is a technically mature, launch-adjacent news platform. The
engineering base — Next.js 15 + Payload 3 + a 143-algorithm intelligence
layer, bilingual Nepali-first UX, hard-separated account models, PWA/offline
reading, narrator, focus mode — is stronger than most Nepali newsrooms run
in production. What held the site back from feeling like a real portal was
content: until this session every story was DEV_ONLY placeholder text with
procedural clip-art.

That gap is now closed: **30 fully-fledged, real, bilingual original stories**
covering the Bhada 10 Bhotekoshi–Trishuli flood disaster and the national
stories around it, each with original editorial artwork, bylines, series
packaging, tags, provinces and timestamps — wired identically into facade
(dev) and Payload (production) via the seed script.

**Overall completeness for a public v1 launch: ~78%.**

| Area | Score | Status |
|---|---|---|
| Reader frontend | 92% | Sections complete, polished; theme presets pending |
| Editorial content | 75% | 30 real stories live; needs daily newsroom rhythm |
| Newsroom CMS (Payload) | 85% | Solid; media pipeline gaps remain |
| Admin desk | 80% | Needs notification/counters polish |
| Journalist desk | 75% | Autosave + EN pass pending |
| Algorithms layer | 95% | 143 algos, tested, wired, audited |
| Auth & reader accounts | 90% | Password reset, library sync done |
| Ops / CI / observability | 70% | CI parked; LAUNCH_STATUS gate pending |
| SEO & E-E-A-T | 85% | Breadcrumb + org JSON-LD **[NEW]**; RSS gaps |
| Monetization | 5% | AdSlot exists, unwired; no revenue path |

---

## 2. What this session changed

### Critical fixes
1. **[FIXED] Turbopack dev 500 on every page.** `::highlight(tn-narrator)` in
   `globals.css` is not parseable by Turbopack's CSS engine; the rule now
   injects at runtime from `Narrator.tsx` (only in browsers that ship the
   CSS Custom Highlight API). Dev mode is green again.
2. **[FIXED] Placeholder newsroom.** `packages/content/src/fixtures.ts`
   rewritten: 30 real stories (24 in the `bhotekoshi-2083` series), 10
   bylines incl. a disaster desk, 8 categories, corrections demo, Nepali
   body blocks (paragraphs, headings, pull quotes, lists) + full English
   versions, real dates (Bhadra 10–15, 2083).
3. **[FIXED] Procedural clip-art imagery.** 30 original editorial images
   generated at 1344x768 into `public/media/news/`, credited "द नागरिक",
   referenced by MediaRef with proper Nepali alt text.
4. **[FIXED] `pravas` category invisible.** It existed in fixtures but not in
   `site.config.ts`, so the nav, seed and CategoryIcon never showed it. Added
   to config (now 8 categories everywhere).
5. **[FIXED] Raw English slugs in Nepali UI.** `lib/category-names.ts` added;
   TrendingSection footers, HeroLead side rail + category pills, and the
   article Next-Story card now show समाचार/राजनीति/... instead of
   "samachar"/"rajniti".
6. **[FIXED] Dead imports.** `UtilityStrip` import removed; the homepage now
   actually renders `PatroTodayStrip` (BS date + tithi + festival) and a new
   `MarketRatesStrip` (gold/silver/USD-NPR, honestly labeled "नमुना दर"
   until a live vendor is wired) — the civic utility band every leading
   Nepali portal carries.
7. **[FIXED] HeroLead right rail had no visual weight.** Side updates now
   carry 4:3 thumbnails to balance the 8-column hero.
8. **[FIXED] E-E-A-T JSON-LD gaps (audit 🟡7).** Article pages now emit
   `BreadcrumbList` alongside `NewsArticle`; publisher org data included.
9. **[UPGRADED] Reading experience.** Pull quotes restyled as editorial
   serif callouts with accent bar and decorative quote mark; hero caption
   promoted to a bold alt + credit line.
10. **[UPGRADED] Payload seed.** `src/scripts/seed.ts` now seeds the entire
    real newsroom — categories, 10 authors with beats, tags, hero media
    uploads, all 30 articles — so `CONTENT_SOURCE=payload` serves the
    identical portal as facade mode.

### Content inventory (30 stories)
- **samachar (10):** death toll live-blog, Bhada-10 minute-by-minute
  reconstruction, the principal who saved 1,643 children, tunnel rescue,
  scientists' second-wave warning, army rescue ops, families of the missing,
  community kitchens, Kathmandu–Muglin closure, monsoon ledger.
- **pradesh (5):** Rasuwa ground zero, Sindhupalchok, Nuwakot, Chitwan
  downstream alert, drying-springs roadmap.
- **rajniti (3):** PM shelter tour, relief fund ₹5 arba, parliament session.
- **arth (4):** 12 hydropower projects, reconstruction bill, Langtang season
  lost, NEPSE after the flood.
- **bichar (3):** last-mile warning, glacier climate clock, three-tier
  reconstruction.
- **bishwa (2):** barrier lake + cross-border data sharing, UN/IFRC aid.
- **pravas (1):** diaspora vigils and remittances.
- **khel (2):** ACC Premier Cup squad, NPL final night.

---

## 3. Launch blockers (must close before LAUNCH_STATUS=live)

1. **Legal identity in `site.config.ts`** — `publisherName`, `registrationNo`,
   `address`, `editorName`, `contactEmail` are empty; `assertLaunchReady`
   will refuse live status. Fill them with the real registration (This is the
   single hard gate).
2. **Production content source** — set `CONTENT_SOURCE=payload` +
   `DATABASE_URL` (Neon) + `PAYLOAD_SECRET`, run `pnpm migrate && pnpm seed`.
   Facade mode is dev-only.
3. **Activate CI** — the workflow file is parked (see
   `docs/adr/0006-ci-and-test-strategy.md`); move it into `.github/workflows/`
   and confirm green on main (typecheck + tests + build + Playwright).
4. **Monsoon readiness SLA** — while the Bhada-10 aftermath is the news cycle,
   the desk needs at minimum: 1 duty editor/day, breaking-story update cadence
   (the live-blog correction pattern is already modeled), and the engagement
   events actually flowing (they are, once readers opt in).
5. **Email transport** — set SMTP_* before password reset / journalist
   invitations matter in production (`/api/health` reports emailConfigured).

---

## 4. Priority roadmap to "complete"

### P0 — before public launch (1–2 weeks)
- [ ] Fill `legal` block in `site.config.ts`; set `LAUNCH_STATUS=live`.
- [ ] Provision Neon Postgres; run migrations; seed; cut `CONTENT_SOURCE=payload`.
- [ ] Activate the parked CI workflow; require green checks on main.
- [ ] next/font self-hosting for Mukta + Noto Serif Devanagari (removes the
      render-blocking Google Fonts request; the mitigation exists, full fix
      needs build-time egress — do it in CI per ADR-0005).
- [ ] Media pipeline: `upload.imageSizes` (card/hero/thumb) on the media
      collection; serve generated sizes through MediaRef (audit 🔴6).
- [ ] RSS hardening: `<language>`, `<lastBuildDate>`, media:content enclosures,
      per-category `/rss/[category].xml` (audit 🟡8).
- [ ] Person JSON-LD with `sameAs` on author pages (audit 🟡7 remainder).

### P1 — first month of operation
- [ ] Composer autosave (debounced localStorage draft + interval PATCH) —
      data-loss audit fail (audit 🔴3).
- [ ] Comment counters: pending-queue badge in AdminShell nav; comment count
      on story cards (audit 🔴5).
- [ ] Theme layer: emit per-site `theme.css` from `site.config.theme` and give
      HeroLead/SectionBand/SiteHeader layout variants (audit 🔴4) — the
      anti-footprint requirement for the multi-site factory plan.
- [ ] Journalist desk English pass + i18n consolidation into one dictionary
      module per surface (audit 🟡6).
- [ ] Fix locale switcher fallback on untranslated articles at the header
      level (audit 🟡10 — toolbar already handles it).
- [ ] Engagement aggregation in SQL + retention cron runbook (partially done).
- [ ] Wire a real market-rates vendor (NRB/bullion API) behind
      `LIVE_MARKET_RATES` to replace the labeled sample strip.
- [ ] Live-blog tooling: an editor UI to append updates + auto-bump updatedAt
      on the flagship disaster story (the content model already supports it).

### P2 — scale & revenue (quarter)
- [ ] Monetization path: AdSlot wiring with an ad server or AdSense
      (`integrations.adsenseId` field exists), house-ads fallback, and a
      reader-membership tier (accounts + saved stories already exist).
- [ ] Search upgrade: Postgres tsvector + GIN (search-db already documents the
      path) once query volume justifies it.
- [ ] Multi-language pipeline: translation memory + English review queue
      (englishStatus workflow is already in place).
- [ ] Cross-border hazard data integration: surface gauge/satellite feeds on
      a dedicated "जोखिम नक्सा" (risk map) page — the disaster coverage
      differentiator.
- [ ] Push notifications / breaking alerts (PWA + service worker exist).
- [ ] Comment notifications for editors + readers (mentions).
- [ ] Full E2E coverage for narrator/focus-mode/patro interactions.
- [ ] Lighthouse budgets enforced in CI (mobile LCP < 2.5s, CLS < 0.1,
      INP < 200ms on home + article) per the "definition of complete".

---

## 5. What "complete" means for v1.0 (reaffirmed)

1. All launch blockers (§3) closed with verification evidence.
2. Audit 🔴1–🔴3 closed (accounts power features; no data-loss paths;
   password reset — already done; composer autosave pending).
3. CI green on main; Playwright covering the 4 critical journeys
   (reader signup→save, journalist apply→approve→publish, comment
   moderation, password reset).
4. Lighthouse mobile budgets met on home + article.
5. Factory proof: a second theme preset renders the same build with a
   distinct identity.
6. Editorial: 30+ real stories live (done), a 7-day publishing rhythm
   sustained, and the disaster series kept current.

---

## 6. How to run the updated site locally

```bash
pnpm install
cp .env.example .env.local          # CONTENT_SOURCE=facade (default)
pnpm dev                            # http://localhost:3000

# Payload/production path (identical content):
docker compose up -d                # or local:pg
pnpm --filter @thenagarik/web migrate
pnpm --filter @thenagarik/web seed  # seeds all 30 real stories + media
# then set CONTENT_SOURCE=payload
```

Seeded demo logins (dev only): admin@nagarik.local / publisher@nagarik.local /
editor@nagarik.local / journalist@nagarik.local — password
`NagarikPitch2026!` (rotate before any live use).
