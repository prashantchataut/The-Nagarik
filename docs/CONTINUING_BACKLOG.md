Updated as work ships. Next prompt should take the top **Next slice**.

## Shipped (this implementation)

- PRODUCT.md + DESIGN.md (Civic Ink / Valley Mist)
- pnpm monorepo: `apps/web`, `packages/{content,algorithms,ui}`
- Nepali-first locale routing (`/` → `/ne`, `/en`)
- Reader MVP + portal UI redesign + contrast/nav hardening
- Content façade + DEV_ONLY fixtures (fallback only)
- Unified English gate (`englishStatus === published`)
- SEO: metadata, JSON-LD, sitemap, RSS (ne/en)
- Consent-gated engagement API + cold-start honest trending/most-read
- `@thenagarik/algorithms` desk at `/admin/algorithms`
- Payload 3.85 embedded: collections, `/cms`, Blob plugin, publish gates, revalidate
- Expanded seed (demo roles, bilingual + breaking + opinion NE-only, `packageId`)
- Scheduled publish cron + richer ops probe + CSP Report-Only headers
- Pitch / local DB / production hardening / comments policy docs
- **Admin desk** (Watch IA, Payload SoT): `/admin` dashboard, articles list, taxonomy browse, launch check — see [ADMIN_DESK.md](./ADMIN_DESK.md)
- **Local cutover path:** `pnpm --filter @thenagarik/web local:pg` → seed → `CONTENT_SOURCE=payload`
- Locale `error.tsx` + root `not-found.tsx`; empty CMS home state; Patro sample-rate labels
- **Production on Vercel:** https://the-nagarik.vercel.app — still needs Neon `DATABASE_URL` + Blob + `CONTENT_SOURCE=payload` (not set yet)

## Next slice (you must supply Neon / Blob for prod)

1. Create Neon project; set `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `CONTENT_SOURCE=payload`, `PAYLOAD_DB_PUSH=false` on Vercel Production
2. Run migrations against Neon; seed once from a trusted machine
3. Walk [PITCH_DEMO.md](./PITCH_DEMO.md) on the production URL; then [PRODUCTION_HARDENING.md](./PRODUCTION_HARDENING.md)

## Local (no Docker)

```bash
pnpm --filter @thenagarik/web local:pg   # keep running
pnpm --filter @thenagarik/web seed
pnpm --filter @thenagarik/web dev
```

## Then

- Volume-gated CF when ≥25 consented readers
- Real Sentry only when SDK installed
- Comments remain off until Turnstile + queue SLA ([COMMENTS_POLICY.md](./COMMENTS_POLICY.md))
- Live gold/forex only when `LIVE_MARKET_RATES=true` + fetchers exist
- DoIB / legal chrome when verified

## Blocked without human infra

- Live Payload reader on Vercel (no `DATABASE_URL` / Blob in Vercel env yet)
- Network ads (legal + enforcing CSP)
