import { defineConfig, devices } from '@playwright/test'

/**
 * E2E strategy (see docs/adr/0006-ci-and-test-strategy.md):
 *
 * - `api` project: request-context specs (*.api.spec.ts). No browser binary
 *   needed, so they run in restricted sandboxes AND in CI. They cover the
 *   contracts that must never regress silently: reader/staff auth separation,
 *   the comment moderation loop, cron auth, health.
 * - `chromium` project: real-browser smoke (*.ui.spec.ts). Runs in CI where
 *   browser downloads are available (`playwright install chromium`).
 *
 * Server: reuses an already-running production server on E2E_BASE_URL when
 * provided; otherwise starts `next start` against the prebuilt .next output
 * (run `pnpm build` first).
 */

const PORT = Number(process.env.E2E_PORT ?? 3000)
// `localhost` (not 127.0.0.1): the session cookie carries `Secure` under
// NODE_ENV=production, and cookie jars only accept it over HTTP when the
// host is literally localhost.
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  // Shared DB + per-IP rate limiters: keep runs deterministic.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'api',
      testMatch: /.*\.api\.spec\.ts/,
      use: {
        // Payload's CSRF check accepts cookie auth only from same-origin
        // requests; browsers send this fetch-metadata header automatically,
        // so the request-context project mirrors them.
        extraHTTPHeaders: { 'sec-fetch-site': 'same-origin' },
      },
    },
    {
      name: 'chromium',
      testMatch: /.*\.ui\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
