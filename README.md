# The Nagarik

Nepali-first bilingual news portal. See [PRODUCT.md](./PRODUCT.md), [DESIGN.md](./DESIGN.md), and [docs/CONTINUING_BACKLOG.md](./docs/CONTINUING_BACKLOG.md).

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

## Phases

0 Bootstrap · 1 Reader MVP · 2 CMS · 3 Engagement/algos · 4 Algorithm desk breadth
