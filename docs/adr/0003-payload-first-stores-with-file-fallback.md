# ADR-0003: Payload-first stores with gitignored file fallback

Date: 2026-08-11 · Status: Accepted

## Decision
Reader-generated data (comments, newsletter subscribers, engagement events)
writes to Payload/Postgres whenever `DATABASE_URL` + `PAYLOAD_SECRET` exist,
and to gitignored `.data/*.json` files otherwise. Public REST creation on
these collections is disabled; only validated, rate-limited server routes
insert (overrideAccess after zod + honeypot + limits).

## Why
Production correctness (multi-instance, survives deploys) without breaking
the zero-infrastructure facade/demo mode that sales demos and local dev use.

## Consequences
- Every store lives behind a lib module (lib/comments, lib/newsletter,
  lib/engagement) - routes never talk to storage directly.
- Schema changes always ship as generated migrations
  (`pnpm migrate:create`, push mode is dev-only). See BACKEND_RUNBOOK.
