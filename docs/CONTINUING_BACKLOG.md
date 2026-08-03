# Continuing backlog

Updated as work ships. Next prompt should take the top **Next slice**.

## Shipped (this implementation)

- PRODUCT.md + DESIGN.md (Civic Ink / Valley Mist)
- pnpm monorepo: `apps/web`, `packages/{content,algorithms,ui}`
- Nepali-first locale routing (`/` → `/ne`, `/en`)
- Reader MVP: home, category, article reading UX, latest, search, about, trust
- Frontend redesign: full-bleed asymmetric hero, dated latest list, dual trending/most-read, province feature, opinion stack, visual mosaic; local editorial imagery; mobile nav
- Content façade + DEV_ONLY fixtures (no production seed path when live+fixtures off)
- Unified English gate (`englishStatus === published`)
- SEO: metadata, JSON-LD, sitemap, RSS (ne/en)
- Consent-gated engagement API + cold-start honest trending/most-read
- `@thenagarik/algorithms`: ranking, trending, search BM25, recommend, moderation, notify
- Algorithm desk at `/admin/algorithms` with 232 capabilities (production/shadow/planned honesty)
- Revalidate + cron auth with `timingSafeEqual`
- Payload 3.85 embedded: collections, `/cms` admin, Blob plugin (alt+credit required), publish→Bearer revalidate, `CONTENT_SOURCE=payload` Local API client
- Seed script: `pnpm --filter @thenagarik/web seed`
- **Production on Vercel:** https://the-nagarik.vercel.app (GitHub linked, `rootDirectory=apps/web`, currently `CONTENT_SOURCE=facade`)

## Next slice (recommended)

1. Commit + push local Payload/CMS work to `main` so Git deploys match the live CLI build
2. Provision Neon; set `DATABASE_URL` + `BLOB_READ_WRITE_TOKEN` on Vercel
3. Open `/cms`, create first admin; run seed; flip `CONTENT_SOURCE=payload`
4. Generate Payload migrations; keep `PAYLOAD_DB_PUSH=false` in production

## Then

- Reading-progress continue-reading capability → production
- Volume-gated CF when ≥25 consented readers
- Real Sentry only when SDK installed
- Comments remain off until Turnstile + queue SLA
- Watch remaining P0: ads/CSP/legal triangle, DoIB identity

## Blocked

- DoIB / legal publisher chrome (needs verified env values)
- Network ads (needs legal copy + CSP mode allowlist first)
