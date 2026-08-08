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

- `/admin/login` — staff sign-in (Payload Users cookie; same as `/cms`)
- `/admin` — dashboard (auth required)
- `/admin/account` — signed-in profile + logout
- `/admin/articles` — published list → edit in `/cms`
- `/admin/queue` — draft / in_review / scheduled from Payload
- `/admin/users` — staff roster → edit in `/cms`
- `/admin/categories` · `/authors` · `/tags` · `/media` — browse + CMS deep link
- `/admin/algorithms` — honest desk
- `/admin/launch` — env gates
- `/admin/cms` — redirect helper to `/cms`
- `/ne/login` · `/en/login` — redirect to `/admin/login`
- `/ne/account` · `/en/account` — staff profile or membership-deferred CTA

## Auth (intentional vs Watch)

| Choice | Why |
|--------|-----|
| Payload Users only | Watch’s Better Auth + Payload dual login caused drift |
| One staff login | Compact roles; no separate journalist Better Auth app |
| Desk lists Payload only | Never show facade fixtures as if they were CMS news |
| Reader membership later | PRODUCT Phase 1 |

## Watch problems we keep avoiding

1. JSON shadow store + Payload
2. 20+ newsroom roles
3. Custom Next article editor
4. Ads / CSP / consent theater
5. Sentry stub claiming ready
6. Unmoderated anonymous comments
