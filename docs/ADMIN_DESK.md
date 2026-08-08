# Newsroom admin desk

The Nagarik reuses **Nagarik Watch’s desk shape** (dashboard → lists → launch → algorithms) without copying Watch’s UI, dual-CMS editor, or role explosion.

## Split (intentional)

| Surface | Job |
|---------|-----|
| `/admin/*` | Ops desk: metrics, published lists, launch gates, algorithm honesty |
| `/cms` | Payload CMS: create/edit/publish, media alt+credit, users/roles |

Watch already learned this: when Payload is canonical, the web admin must **not** shadow-edit articles. We keep that rule from day one.

## What we reused from Watch

- Desk IA: primary nav + grouped sidebar (Devanagari labels)
- Dashboard metrics + recent published
- Launch readiness checklist (env honesty)
- Canonical banner: Payload is SoT
- Timing-safe cron auth (already in `lib/security.ts`)

## What we deliberately did **not** copy

Watch problems / traps (see also `docs/nagarik-watch-gap-report.md`):

1. **JSON shadow store + Payload** — dual content paths; English gate divergence
2. **20+ newsroom roles** — The Nagarik keeps journalist / editor / publisher / admin
3. **Custom article editor in Next** — wastes pitch time; Payload already embeds
4. **Ads / CSP / consent triangle** — Watch still has legal/ad mismatches
5. **Sentry stub claiming ready** — we only report DSN when set
6. **Comments without Turnstile** — remain off (`docs/COMMENTS_POLICY.md`)
7. **Watch brand / seed news / algorithm catalog IDs** — PRODUCT forbids

## Routes

- `/admin` — dashboard
- `/admin/articles` — published list → edit in `/cms`
- `/admin/categories` · `/authors` · `/tags` · `/media` — browse + CMS deep link
- `/admin/algorithms` — honest desk
- `/admin/launch` — env gates
- `/admin/cms` — redirect helper to `/cms`
