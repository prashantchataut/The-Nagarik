# Continuing backlog

Updated as work ships. Next prompt should take the top **Next slice**.

## Shipped (this implementation)

- PRODUCT.md + DESIGN.md (Civic Ink / Valley Mist)
- pnpm monorepo: `apps/web`, `packages/{content,algorithms,ui}`
- Nepali-first locale routing (`/` → `/ne`, `/en`)
- Reader MVP: home, category, article reading UX, latest, search, about, trust
- Content façade + DEV_ONLY fixtures (no production seed path when live+fixtures off)
- Unified English gate (`englishStatus === published`)
- SEO: metadata, JSON-LD, sitemap, RSS (ne/en)
- Consent-gated engagement API + cold-start honest trending/most-read
- `@thenagarik/algorithms`: ranking, trending, search BM25, recommend, moderation, notify
- Algorithm desk at `/admin/algorithms` with 232 capabilities (production/shadow/planned honesty)
- Revalidate + cron auth with `timingSafeEqual`
- Payload contracts, collections shapes, publish gates, CMS setup at `/admin/cms`
- Payload Local API adapter skeleton in `@thenagarik/content`
- Nagarik Watch gap report + P0 patches applied on Watch (cron timing-safe, EN gate, Sentry honesty, comments auth)

## Next slice (recommended)

1. Connect Neon + install Payload packages; mount real admin at `/admin/cms` using `apps/web/src/payload/collections.ts`
2. Implement `CONTENT_SOURCE=payload` client wiring in `apps/web/src/lib/content.ts`
3. Media upload to Vercel Blob with alt+credit hard-required before publish
4. Wire publish `afterChange` → `/api/revalidate`

## Then

- Reading-progress continue-reading capability → production
- Volume-gated CF when ≥25 consented readers
- Real Sentry only when SDK installed
- Comments remain off until Turnstile + queue SLA
- Watch remaining P0: ads/CSP/legal triangle, DoIB identity

## Blocked

- DoIB / legal publisher chrome (needs verified env values)
- Network ads (needs legal copy + CSP mode allowlist first)
