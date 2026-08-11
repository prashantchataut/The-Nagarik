# ADR-0002: site.config.ts is the only brand source

Date: 2026-08-11 · Status: Accepted

## Decision
`apps/web/src/site.config.ts` (zod-validated by `lib/site-schema.ts`) is the
single source for brand, theme seeds, layout flags, categories, legal
identity, and integrations. Nothing brand-specific may be hardcoded in
components, metadata, feeds, or seeds. `assertLaunchReady` refuses
`LAUNCH_STATUS=live` without a legal identity.

## Why
The site factory (docs/NETWORK_FACTORY_PLAN.md): a new portal = new config +
theme + content, never a fork.

## Consequences
Every new surface must read from `SITE`; review rejects hardcoded brand
strings. Per-site theme.css generation builds on this config.
