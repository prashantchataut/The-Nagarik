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
network-operated sites. The full strategy, bottleneck analysis, architecture
(site.config layer, theme tokens, layout variants, Model A independent clones
vs Model B multi-tenant), hosting decisions (no cPanel shared hosting — Node
infra only), and the cross-agent cooperation protocol live in
`docs/NETWORK_FACTORY_PLAN.md`. Read it before writing code and treat it as
the contract with the Nagarik Watch agent. Coordination happens through the
shared `nagarik-network-kit` GitHub repo (DECISIONS.md / STATUS.md / CONTRACTS.md);
pull it at session start, append your status/decisions, PR any schema or token
changes.

## Current state
- PR #2 (branch `arena/019feca8-the-nagarik`) delivered: reader account
  surface, journalist profile workbench (+authors.user/avatar/beats), the
  autonomous BS 2070–2095 patro engine, focus reading mode + TTS narrator,
  de-clustered article toolbar, moderated threaded comments (+/admin/queue
  panel), live breaking ticker, newsletter cards, offline bookmarks (SW v2).
  Notes: `docs/READER_UX_PHASE2.md`.
- Verification is green: `pnpm typecheck | lint | test | build`.

## Your tasks this session (in order)
1. **Factory refactor step 1**: extract `apps/web/src/site.config.ts`
   (zod-validated per `NETWORK_FACTORY_PLAN.md` §2.2). Wire `lib/site.ts`,
   dictionaries' brand strings, `manifest.ts`, icons, RSS, and JSON-LD to it.
   Nothing brand-specific may remain hardcoded outside the config.
2. **Theme layer**: make palette + font pair config-driven. Emit a per-site
   `theme.css` override loaded after `@thenagarik/ui/tokens.css`. Prove it by
   adding a second preset (`sindoor` red-orange, for Nagarik Watch) and a
   `THEME_PRESET` env toggle. Maintain WCAG AA in both light/dark.
3. **Layout variants** (anti-footprint requirement): add variant props to
   `HeroLead` (`commanding | split | mosaic`), `SectionBand`
   (`bordered | cards | list`), `SiteHeader` (`two-tier | compact`), selected
   from `site.config.layout`. Default = current look, pixel-identical.
4. **UI/UX final pass** benchmarked against OnlineKhabar (two-tier header,
   numbered trending, commanding hero), Ratopati (utilities integration),
   Techpana (whitespace/16:9 discipline), Nepalkhabar (bylines/hashtags),
   ArthaKhabar (kickers, band background differentiation): homepage rhythm,
   category page (kicker header + lead + stream + sticky rail), mobile 360px
   sweep of article tools (focus mode, narrator, comments).
5. **Backend hardening**: Postgres-backed newsletter + rate limiting when
   `DATABASE_URL` exists; seed script reads categories/legal identity from
   `site.config`; consistent API error shapes.
6. **Kit repo sync**: write the resulting config schema + token presets +
   collection contracts into `nagarik-network-kit` (or `docs/CONTRACTS.md`
   here if the kit repo doesn't exist yet) so the Nagarik Watch agent can
   start its migration.

## Skills to apply
`verification-before-completion` (fresh `pnpm test`, `typecheck`, `lint`,
`build` before claiming done), `ui-audit` (focus management, ≥44px targets,
data-loss prevention, a11y markup), `design-taste-frontend` (dual-mode tokens,
zero em-dash, Devanagari line-height ≥1.7, anti-default variance),
`impeccable`, `ui-ux-pro-max`, `payload` (collection/RBAC correctness),
`eeat-signals` (bylines, corrections, schema markup), `web-perf`
(LCP < 2.5s, CLS < 0.1, INP < 200ms), plus `redesign-existing-projects` and
`brandkit` for the theming layer.

## Constraints
- The golden template rule: no site-specific forks; variations become config
  variants. Backward compatible: with the default config, the current site
  must render pixel-identical.
- Never regress the Civic Newsroom token system, zero em-dash rule, or the
  ne-first/en-second content model.
- Work only on the session branch; commit with evidence; end with fresh
  verification output and an updated `STATUS.md` entry for the sibling agent.

---

### Mirrored prompt for the Nagarik Watch agent (hand this to it)

You are the Nagarik Watch agent. Your UI codebase is **deprecated** — do not
polish it further. The Nagarik repo is the golden template (see its
`docs/NETWORK_FACTORY_PLAN.md`, included in the handoff zip). This session:
(1) inventory Nagarik Watch's content model, features, and any backend
capability the template lacks → document in `CONTRACTS.md`; (2) build a
content export (categories, authors, articles with body blocks, media
manifest) matching the template's `@thenagarik/content` types; (3) author
`sites/nagarikwatch.config.ts` — brand नागरिक वाच, a distinct non-teal palette
(e.g. sindoor red-orange), different font pairing and hero/band variants (the
network must not share a visual footprint); (4) file every template gap as an
issue/DECISIONS.md entry instead of diverging. Apply the same skills list and
verification discipline as above.
