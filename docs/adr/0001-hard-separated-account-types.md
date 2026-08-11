# ADR-0001: Reader and journalist accounts are hard-separated

Date: 2026-08-11 · Status: Accepted

## Decision
Two Payload auth collections: `readers` (public, instant signup, zero
editorial capability, CMS admin blocked) and `users` (staff, role-gated).
One session cookie carries one identity; every staff gate verifies
`collection === 'users'`, every reader gate verifies `collection === 'readers'`.
There is NO switch/upgrade path between the types in-product.

## Why
Editorial integrity: a reader must never acquire newsroom capability through
account-surface bugs. Nepal press accountability requires verified authorship.

## Consequences
- Becoming a journalist = application (`journalist-applications`) + editor
  verification + staff account issuance with a one-time password.
- Logging into one identity replaces the other session (cookie is shared).
- UI must always label which world a surface belongs to (reader vs newsroom).
