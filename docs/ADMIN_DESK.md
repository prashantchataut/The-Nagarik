# Newsroom admin desk

The Nagarik reuses **Nagarik Watch’s desk shape** (dashboard → lists → launch → algorithms) without copying Watch’s UI, dual-CMS editor, or role explosion.

## Split (intentional)

| Surface | Job |
|---------|-----|
| `/journalist/*` | Journalist desk: own drafts, block compose, submit for review |
| `/admin/*` | Ops desk: metrics, published lists, launch gates, algorithm honesty |
| `/cms` | Payload CMS: publish/schedule, media alt+credit, users/roles |

Watch already learned this: when Payload is canonical, the web admin must **not** shadow-store articles. The journalist compose UI writes the **same** Payload `bodyNe` JSON blocks — it is not a second CMS.

## What we reused from Watch

- Desk IA: primary nav + grouped sidebar (Devanagari labels)
- Dashboard metrics + recent published
- Launch readiness checklist (env honesty)
- Canonical banner: Payload is SoT
- Timing-safe cron auth (already in `lib/security.ts`)
- Journalist inbox shape (draft / in_review) without Better Auth

## What we deliberately did **not** copy

Watch problems / traps (see also `docs/nagarik-watch-gap-report.md`):

1. **JSON shadow store + Payload** — dual content paths; English gate divergence
2. **20+ newsroom roles** — The Nagarik keeps journalist / editor / publisher / admin
3. **Better Auth + Payload dual login** — one Users cookie for `/admin`, `/journalist`, `/cms`
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
- `/journalist` — journalist dashboard (status metrics + own stories)
- `/journalist/compose` · `/journalist/compose/[id]` — block composer → Payload
- `/journalist/preferences` — device-local editor prefs
- `/ne/login` · `/en/login` — redirect to `/admin/login`
- `/ne/account` · `/en/account` — staff profile or membership-deferred CTA

## Auth (intentional vs Watch)

| Choice | Why |
|--------|-----|
| Payload Users only | Watch’s Better Auth + Payload dual login caused drift |
| One staff login | Compact roles; journalist desk shares the same session |
| Desk lists Payload only | Never show facade fixtures as if they were CMS news |
| Journalists: draft / in_review only | Publishers publish/schedule in `/cms` (hook-enforced) |
| Reader membership later | PRODUCT Phase 1 |

## Watch problems we keep avoiding

1. JSON shadow store + Payload
2. 20+ newsroom roles
3. Better Auth dual stack
4. Ads / CSP / consent theater
5. Sentry stub claiming ready
6. Unmoderated anonymous comments
