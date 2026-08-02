# The Nagarik

Nepali-first bilingual news portal. See [PRODUCT.md](./PRODUCT.md), [DESIGN.md](./DESIGN.md), and [docs/CONTINUING_BACKLOG.md](./docs/CONTINUING_BACKLOG.md).

## Stack

- Next.js 15 (App Router) + Payload CMS 3 (embedded `/admin`)
- Neon Postgres + Vercel Blob
- pnpm monorepo: `apps/web`, `packages/{algorithms,content,ui}`

## Develop

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Reader: http://localhost:3000  
Admin (Phase 2): http://localhost:3000/admin

## Phases

0 Bootstrap · 1 Reader MVP · 2 CMS · 3 Engagement/algos · 4 Algorithm desk breadth
