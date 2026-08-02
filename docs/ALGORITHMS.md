# Algorithm registry

Runtime: `@thenagarik/algorithms` → `runDesk()` → `/admin/algorithms`.

## Honesty rules

- Statuses: `production` | `shadow` | `disabled` | `planned`
- Never label fixture-only as live
- Cold engagement → cold-start / fallback labels on rails
- Kill switch: `ALGORITHMS_ENABLED`

## Counts

Registry targets ≥232 newsroom capabilities. Production capabilities drive reader surfaces today (ranking terms, trending, most-read, BM25, hybrid recommend, moderation math, notify policy, SEO helpers, trust gates). Planned rows are explicit roadmap, not theater.
