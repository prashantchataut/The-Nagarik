# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: Nepali readers checking civic, political, and provincial news on mobile and desktop, often on flaky connections, wanting a calm trusted read rather than a dense portal warehouse.

Secondary: English readers (diaspora and locals) who need selective human-reviewed English coverage of the same civic beat.

Staff (Phase 2+): journalists, editors, and publishers producing original stories in an embedded CMS.

## Product Purpose

The Nagarik is a Nepali-first bilingual news portal for Nepal. It publishes original editorial journalism with an exceptional reading experience, honest discovery algorithms, and a sustainable CMS-backed content system hosted on Vercel.

Success means: readers finish stories; editors publish without dual-CMS chaos; rankings never invent engagement; English never ships unreviewed.

## Positioning

Civic ink paper for the federal republic: original news only, Nepali at `/` and English at `/en`, reading craft first, algorithms that label cold-start instead of faking live signals. Not an aggregator. Not a Reels-forward mega-portal.

## Operating Context

- Hosting: Vercel (Node Next.js origin)
- CMS: Payload 3 embedded in the same Next.js app (`/admin`)
- Database: Neon Postgres
- Media: Vercel Blob (alt + credit required)
- Locales: `ne` default, `en` secondary; articles may be monolingual or bilingual
- Algorithms: `@thenagarik/algorithms` with production | shadow | disabled | planned statuses

## Capabilities and Constraints

Confirmed for build:

- Reader surfaces: home, category, article, latest, search, trust pages
- Content façade over Payload (dev fixtures marked DEV_ONLY until CMS cutover)
- Consent-gated engagement events feeding real algorithms
- Full newsroom algorithm desk grown honestly (no fixture theater as "live")
- No competitor news scrape; no production seed corpus
- Comments default off until moderation queue is staffed
- Phase 1: no ads rack, no membership, no Reels/horoscope-as-equal-rail

Open / later: live blogs, newsletter, push, membership, legal DoIB identity in public chrome, network ads (only with accurate policy + CSP).

## Brand Commitments

- Name: The Nagarik (द नागरिक)
- Visual world: Civic Ink / Valley Mist (see DESIGN.md)
- Voice: clear civic journalism; concrete verbs; no filler marketing slang
- References to learn from (not copy): OnlineKhabar density lessons, Ratopati latest/popular, Kathmandu Post hierarchy, Kantipur packages
- Sibling project Nagarik Watch is separate; do not copy UI, seed news, or catalog IDs

## Evidence on Hand

- Plan and Nagarik Watch audit (architecture inspiration only)
- No real newsroom content yet; Phase 1 may use DEV_ONLY labeled fixtures
- DoIB / legal publisher identity not yet verified; public chrome must not claim compliance

## Product Principles

1. Reading experience beats portal clutter.
2. One content path; never invent traffic or English.
3. Algorithms earn desk status with wiring, telemetry, and kill switches.
4. Ship steadily: reader → CMS → engagement → desk breadth.
5. Legal and consent copy must match what the code actually loads.

## Accessibility & Inclusion

WCAG AA minimum for body and controls; contrast gates on; dictionary-driven UI strings for ne/en; Devanagari typography with matra/descender clearance; respect `prefers-reduced-motion` and `prefers-color-scheme`.
