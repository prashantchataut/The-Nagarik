# The Nagarik

Nepali-first bilingual news portal. See [PRODUCT.md](./PRODUCT.md), [DESIGN.md](./DESIGN.md), and [docs/CONTINUING_BACKLOG.md](./docs/CONTINUING_BACKLOG.md).

**Status & plan:** [docs/SITE_COMPLETENESS.md](./docs/SITE_COMPLETENESS.md) — completeness audit (~78% to v1.0) and the prioritized launch roadmap.

## Stack

- Next.js 15 (App Router) + Payload CMS 3 (embedded `/cms`)
- Neon Postgres + Vercel Blob
- pnpm monorepo: `apps/web`, `packages/{algorithms,content,ui}`
- Production: https://the-nagarik.vercel.app

## Develop

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Reader: http://localhost:3000
CMS: http://localhost:3000/cms
Ops: http://localhost:3000/admin
Production: https://the-nagarik.vercel.app

### Content

`packages/content/src/fixtures.ts` carries the seeded newsroom: 30 real
bilingual original stories (the Bhada 10 Bhotekoshi–Trishuli flood series
`bhotekoshi-2083` plus national politics, economy, sports, provinces, world,
diaspora), 10 bylines, 8 categories, and original editorial artwork in
`apps/web/public/media/news/`. The same newsroom is seeded into Payload via:

```bash
pnpm --filter @thenagarik/web migrate
pnpm --filter @thenagarik/web seed   # categories, authors, tags, media, all 30 articles
```

## Phases

0 Bootstrap · 1 Reader MVP · 2 CMS · 3 Engagement/algos · 4 Algorithm desk breadth
