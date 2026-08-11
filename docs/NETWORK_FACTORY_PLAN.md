# Nagarik Network Factory Plan

Date: 2026-08-11 · Owner: Prashant · Repos: The-Nagarik (this), Nagarik-Watch (sibling)

The goal: turn two Nepali-first news portals (thenagarik.com, nagarikwatch.com)
into a repeatable **site factory** capable of shipping a complete, branded
Nepali news portal in one working day, scaling to ~100 sites sold or operated
as a network.

This document is the shared contract between BOTH AI agents (The Nagarik agent
and the Nagarik Watch agent). Treat it as the source of truth until superseded.

---

## 1. Honest bottleneck analysis

### 1.1 Business / strategy bottlenecks

| # | Bottleneck | Severity | Mitigation |
|---|------------|----------|------------|
| B1 | **Google network footprint.** 100 near-identical news sites (same layout, same IP range, cross-linked, thin content) is the textbook definition of a doorway/spam network. One manual action can deindex the whole portfolio. | Critical | Every site must differ in: brand, palette, typography pair, layout variant, category mix, editorial identity, hosting/DNS diversity where possible. NEVER cross-link sitewide. Unique content per site is non-negotiable for the flagship tier; syndicated content must use `canonical` to the origin. |
| B2 | **Content operations.** A portal without daily content is a dead domain. 100 sites need either 100 editorial teams, syndication, or clearly disclosed aggregation. | Critical | Tiered model: Tier A (flagships, original reporting), Tier B (niche/district portals, small stringer network), Tier C (sold to buyers who bring their own newsroom). The factory sells the SYSTEM, not the traffic. |
| B3 | **Legal identity.** Nepal requires online media registration (Department of Information & Broadcasting / Press Council norms). Each sold site needs its own publisher registration, ownership disclosure, and press accountability page. | High | The template already has `/trust`; make legal identity a required field in `site.config` and block `LAUNCH_STATUS=live` without it (partially enforced today). |
| B4 | **Revenue math.** New Nepali portals earn little from AdSense/local ads until they build traffic. Selling sites is the earlier revenue: productize the one-day build + hosting + maintenance subscription. | Medium | Price as: setup fee + monthly hosting/maintenance + optional content syndication. |

### 1.2 Infrastructure bottlenecks (the big one)

| # | Bottleneck | Severity | Reality |
|---|------------|----------|---------|
| I1 | **"Shared hosting" cannot run this stack.** This is Next.js 15 (Node 22, SSR, API routes) + Payload CMS 3 + Postgres. cPanel/PHP shared hosting will not run it. | Critical | Options ranked below (§3.3). Do NOT buy classic shared hosting for these builds; buy domains anywhere, host on Node-capable infra. |
| I2 | **100 separate deployments = operational hell.** 100 Vercel projects, 100 Neon databases, 100 env files, 100 CI pipelines. Neon free tier also caps projects. | Critical | Prefer **one multi-tenant deployment** for network-owned sites (§3.2 Model B). Separate deployments only for SOLD sites that must be independently owned. |
| I3 | **Per-site cost.** Naive: 100 × (Vercel Pro + Neon Launch) is thousands of USD/month. Multi-tenant on one beefy VPS (or one Vercel project with wildcard domains + one Postgres cluster with per-tenant schemas) is 1–2 orders of magnitude cheaper. | High | Target infra cost: < $1/site/month at network scale. |
| I4 | **Media storage.** Vercel Blob per project multiplies cost; local uploads don't survive serverless. | Medium | One S3-compatible bucket (Cloudflare R2 is cheapest, zero egress) with per-tenant prefixes. |

### 1.3 Current codebase bottlenecks (audited in this repo)

| # | Finding | Impact on factory | Fix |
|---|---------|-------------------|-----|
| C1 | Brand is hardcoded: `BRAND_NE`/`BRAND_EN` in `apps/web/src/lib/site.ts`, brand copy sprinkled in dictionaries, manifest, icons, RSS, JSON-LD. | Every clone requires manual find/replace = errors | Introduce `site.config.ts` (zod-validated) as the ONLY brand source; everything imports from it. |
| C2 | Fonts are a hardcoded Google Fonts `@import` in `globals.css`; palette lives in `@thenagarik/ui/tokens.css` (good: already pure CSS variables). | Palette swap is easy (token override file); font swap is manual | Config-driven font pair + generated `theme.css` override layer per site. |
| C3 | Layout is single-variant. All clones would look identical → footprint risk (B1). | Critical for B1 | Build **layout variants** behind config flags: hero (commanding 16:9 / split lead / mosaic), category band styles (bordered list / card grid / ticker), header styles (two-tier OnlineKhabar-style / compact single-tier). The section components already exist; add variant props. |
| C4 | Single-tenant Payload: one DB, one `users` table, collections have no tenant key. | Blocks Model B | Add `tenant` field strategy OR per-tenant DB schema. Decision needed (§3.2). |
| C5 | Dev fixtures (facade) are excellent for demos but every sold site needs seeded real categories/authors; seed script is fixture-oriented. | Slows one-day build | Parametrize `seed.ts` from `site.config` (category set, initial pages, legal identity). |
| C6 | `next.config.ts` image allowlist, CSP, and `NEXT_PUBLIC_SITE_URL` are per-site manual edits. | Error-prone | Derive all from `site.config` + env. |
| C7 | Nagarik Watch runs a DIFFERENT UI codebase ("ui just sucks"). Two diverging frontends = double maintenance forever. | Critical | Decision: The Nagarik frontend becomes the **golden template**. Nagarik Watch is REBASED onto it as tenant/theme #2. Its agent should stop polishing the old UI and start migrating content + config. |
| C8 | In-memory rate limits and `.data/*.json` fallbacks are per-instance; fine for dev, not for multi-instance prod. | Medium | Move rate limiting + newsletter + comments fully to Postgres when `DATABASE_URL` exists (comments already prefer Payload). |

---

## 2. Target architecture: the Site Factory

### 2.1 Golden template principle

- **One monorepo = one golden template** (this repo). All UI/UX improvements land here first.
- Every site is: `golden template + site.config + theme tokens + content`.
- No site ever forks components. If a site needs a variation, the variation
  becomes a config-selectable variant in the template.

### 2.2 `site.config.ts` (the heart of the factory)

Single zod-validated config consumed by both the Next app and Payload seed:

```ts
export const siteConfig = defineSite({
  id: 'thenagarik',
  domain: 'thenagarik.com',
  brand: { ne: 'द नागरिक', en: 'The Nagarik', taglineNe: '…', taglineEn: '…' },
  theme: {
    palette: 'valley-mist',        // token preset OR custom seed color
    accent: '#0b6b63',             // generates accent scale + dark mode
    fonts: { sans: 'Mukta', serif: 'Noto Serif Devanagari' },
    radius: 'editorial',           // sharp | editorial | soft
  },
  layout: {
    header: 'two-tier',            // two-tier | compact
    hero: 'commanding',            // commanding | split | mosaic
    sectionBands: ['bordered', 'cards', 'list'],
    showTicker: true,
    showPatroStrip: true,
  },
  editorial: {
    locales: ['ne', 'en'],
    categories: [ { slug: 'samachar', ne: 'समाचार', en: 'News' }, /* … */ ],
    provinces: true,
  },
  legal: { publisherName: '', registrationNo: '', address: '', editorName: '' },
  integrations: { analytics: '', adsenseId: '', socials: { fb: '', x: '' } },
})
```

Refactor order (cheap → deep):
1. `site.ts` reads from `site.config` (brand, tagline, socials). ~2h.
2. `theme.css` generation: config palette/fonts emitted as `:root` overrides
   loaded AFTER `@thenagarik/ui/tokens.css`. ~2h.
3. Layout variant props on `HeroLead`, `SectionBand`, `SiteHeader`. ~4h.
4. Seed script consumes config categories + legal identity. ~2h.

### 2.3 Deployment models (decide per site tier)

**Model A — Independent clone (for SOLD sites).**
Buyer gets: repo copy (or private template instance), own Postgres, own domain,
own Payload admin. Factory ships it in a day via the SOP (§4).
Cost: theirs. Isolation: total. This is the product you sell.

**Model B — Multi-tenant network (for sites YOU operate).**
One deployment, wildcard/mapped domains, middleware resolves
`host → tenantId → config`, one Postgres with per-tenant schema (or tenant
column). One admin with tenant-scoped RBAC. This is how 100 owned sites stay
under $100/month, not $5,000/month.

Recommendation: **build Model A first** (it is 90% done — this repo IS Model A
for one site). Add Model B only when the owned-network tier is real.

### 2.4 Hosting reality check (replaces "buy shared hosting")

| Option | Fit | Cost @ 2 sites | Cost @ 100 sites |
|--------|-----|----------------|------------------|
| Vercel (per-project) + Neon | Best DX today, already configured | Free–$20/mo | Unworkable (B/I2) |
| **1× VPS (8GB) + Coolify/Dokploy + Postgres + R2** | Best for network tier; full control; Nepal-friendly pricing | ~$20/mo total | ~$80–150/mo total (2–3 VPS + LB) |
| Classic cPanel shared hosting | **Does not run Node/Next/Payload** | n/a | n/a |

Buy: domains anywhere (Cloudflare registrar at cost), DNS on Cloudflare
(free, wildcard, caching), media on R2.

---

## 3. Cross-agent cooperation (The Nagarik agent ⇄ Nagarik Watch agent)

### 3.1 What actually needs to be shared

1. **The golden template code** — `@thenagarik/ui` tokens, components,
   `site.config` schema, Payload collections/contracts.
2. **Decisions** — which variant system, which collection schema changes.
3. **Status** — what each agent shipped, what is blocked.

### 3.2 Recommended mechanism: a shared GitHub repo (not a new protocol)

Both agents already speak git + GitHub fluently. The lowest-friction, fully
auditable channel is a third repo:

```
nagarik-network-kit/
  packages/tokens/        # palette presets + tokens.css (source of truth)
  packages/site-config/   # zod schema + defineSite()
  docs/CONTRACTS.md       # Payload collection schemas, content API shapes
  docs/DECISIONS.md       # append-only ADR log (both agents append here)
  docs/STATUS.md          # per-repo status board, updated每 session
  sites/thenagarik.config.ts
  sites/nagarikwatch.config.ts
```

Protocol: each agent (a) pulls `main` at session start, (b) appends to
`DECISIONS.md`/`STATUS.md`, (c) opens PRs for schema/token changes, (d) never
force-pushes. Humans (you) merge conflicts of intent.

### 3.3 Where an MCP server helps (optional, set up if you want it)

An MCP server is worth it for LIVE capabilities git can't give:

- **GitHub MCP server** (official, easiest): both agents get issue/PR/file
  access to the kit repo through one interface. Setup: run
  `ghcr.io/github/github-mcp-server` with a PAT scoped to the three repos.
- **Custom "network-kit" MCP** (later): tools like `get_tokens(siteId)`,
  `get_contract(collection)`, `post_status(repo, message)`,
  `scaffold_site(config)` — i.e., the factory itself as an API. Build it only
  after the config layer exists, otherwise there is nothing to serve.

Verdict: start with the shared repo TODAY (zero setup); add the GitHub MCP
server when you configure both agent environments; build the custom MCP when
the factory scaffolder exists.

### 3.4 Direct instruction to the Nagarik Watch agent

> Nagarik Watch's UI is deprecated. Do not invest further in it. Your jobs:
> (1) inventory Nagarik Watch's content model + any backend features The
> Nagarik lacks, and document them in `CONTRACTS.md`; (2) prepare a content
> export (categories, authors, articles, media manifest) importable by this
> template's seed pipeline; (3) define `sites/nagarikwatch.config.ts`
> (brand: नागरिक वाच, distinct accent palette — NOT teal — distinct font pair,
> different hero + band variants per B1); (4) review the golden template's
> contracts in this repo (`docs/READER_UX_PHASE2.md`, `src/payload/contracts.ts`)
> and file gaps as issues instead of diverging.

---

## 4. One-day site build SOP (after both flagships are done)

1. `pnpm create-site sites/<id>.config.ts` (scaffold: env, theme.css, seed data) — 30 min
2. Domain + Cloudflare DNS + SSL — 20 min
3. Provision Postgres (Neon project or VPS schema) + run migrations — 20 min
4. Seed categories/legal/admin user from config — 10 min
5. Deploy (Vercel project or Coolify app) — 30 min
6. Theme QA: dual-mode contrast (WCAG AA), Devanagari line-height ≥ 1.7, zero em-dash — 60 min
7. Layout variant selection + homepage arrangement — 60 min
8. Legal/trust page + press registration details — 30 min
9. GSC + analytics + RSS + sitemap verification — 30 min
10. Seed 10 launch articles (buyer's or syndicated-with-canonical) — 120 min
11. Lighthouse pass: LCP < 2.5s, CLS < 0.1, INP < 200ms — 45 min
12. Handover doc + CMS walkthrough — 30 min

Total: ~7.5 focused hours = one day. ✅ Feasible ONLY after §2.2 refactor.

---

## 5. TODAY: finish The Nagarik (execution order)

**Track 1 — UI/UX final pass (reference-benchmarked, page by page)**
1. Homepage: hero hierarchy vs OnlineKhabar (commanding 16:9 lead + numbered
   trending rail), section band rhythm vs ArthaKhabar (alternating band
   backgrounds `--paper-alt`), whitespace discipline vs Techpana. Kill any
   dead voids; every band gets a kicker + "सबै हेर्नुहोस्".
2. Category page: add ArthaKhabar-style kicker header + lead story + 2-col
   stream + sticky rail (trending in category, patro strip, newsletter).
3. Article page: already strong after phase 2 — verify focus mode, narrator,
   comments on mobile 360px; hero caption/credit styling.
4. Search/latest/author/patro pages: consistency sweep (kickers, band styles,
   empty states).
5. Global: mobile bottom-nav active states, drawer order, footer link audit.

**Track 2 — Backend hardening**
1. Move newsletter + rate limits to Postgres when `DATABASE_URL` present (C8).
2. Seed-from-config groundwork (§2.2 step 1: extract `site.config.ts`, wire
   `site.ts` + manifest + RSS + JSON-LD to it).
3. Payload: verify comments/authors migrations on Neon (`pnpm migrate:create`).
4. `/api` audit: consistent error shapes, `cache-control` headers.

**Track 3 — Verification (non-negotiable, per `verification-before-completion`)**
`pnpm typecheck && pnpm lint && pnpm test && pnpm build` fresh, plus runtime
smoke of the comment loop, search, patro navigation, and Lighthouse on / and
one article.

Definition of done today: both tracks complete, plan committed, kit-repo
contracts drafted, zip handed to the sibling agent.
