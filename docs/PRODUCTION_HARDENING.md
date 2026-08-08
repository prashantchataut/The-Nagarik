# Production hardening checklist

Complete only after Payload cutover is verified on production.

## Schema

- [ ] `PAYLOAD_DB_PUSH=false` on Vercel Production
- [ ] Create migrations: `pnpm --filter @thenagarik/web migrate:create`
- [ ] Apply: `pnpm --filter @thenagarik/web migrate` in CI/release, not via push
- [ ] Neon point-in-time restore / backup plan documented for the team

## Launch flags

```env
CONTENT_SOURCE=payload
LAUNCH_STATUS=live
ALLOW_DEV_FIXTURES=false
PAYLOAD_DB_PUSH=false
```

Live launch refuses facade fixtures when fixtures are disabled ([`getContent()`](../apps/web/src/lib/content.ts)).

## Secrets

- [ ] Rotate pitch demo passwords (`*@nagarik.local`)
- [ ] `PAYLOAD_SECRET`, `REVALIDATE_SECRET`, `CRON_SECRET` unique ≥32 chars
- [ ] Blob token scoped; media prefix `the-nagarik/media`

## Observability

- [ ] Install Sentry SDK only when `SENTRY_DSN` is real — do not claim monitoring otherwise
- [ ] `POST /api/cron/ops-probe` with Bearer cron secret returns `liveSafe: true`
- [ ] `POST /api/cron/scheduled-publish` flips due scheduled articles

## Security / ads

- [x] CSP **Report-Only** baseline shipped in `apps/web/next.config.ts` (not enforcing — ads still blocked)
- [ ] Promote CSP to enforcing only after ad/legal allowlists are decided
- [ ] Legal/DoIB copy only after verified publisher identity env values
- [ ] Comments remain off until Turnstile + moderation SLA ([COMMENTS_POLICY.md](./COMMENTS_POLICY.md))

## Reader honesty

- [ ] No fixture banner
- [ ] Trending/most-read show cold-start label until consented volume
- [ ] Patro market widgets remain labeled sample until live APIs
