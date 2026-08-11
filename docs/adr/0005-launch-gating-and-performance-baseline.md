# ADR-0005: Launch gating + performance baseline

Date: 2026-08-11 · Status: Accepted

## Decision
1. Indexability is derived from `LAUNCH_STATUS` (live => index,follow;
   anything else => noindex). Never hardcoded.
2. Fonts: target is next/font self-hosting. The current build environment
   has no egress to fonts.googleapis.com (next/font fetches at compile time),
   so the interim standard is preconnect + parallel <link> stylesheet with
   display=swap, families driven by site.config. CSS @import for fonts is
   forbidden. Migrate to next/font as soon as builds run in CI with egress.
3. Archive surfaces must paginate (18/page, crawlable prev/next links);
   unbounded lists are rejected in review.
4. Search on Payload-backed sites runs database-side (bounded ILIKE now,
   tsvector+GIN when volume demands); the in-memory index is dev/facade-only.

## Why
These four were the launch blockers in docs/COMPLETION_AUDIT.md - the
difference between a demo and an indexable, scalable news site.
