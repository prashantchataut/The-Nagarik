# Payload migrations

Generate against a running Postgres (embedded `local:pg`, Docker, or Neon):

```bash
pnpm --filter @thenagarik/web migrate:create
pnpm --filter @thenagarik/web migrate
```

Production must set `PAYLOAD_DB_PUSH=false` and apply migrations in release — never schema-push shared DBs.

If `migrate:create` fails on Node 24 ESM interop, run the same commands under Node 22 LTS.
