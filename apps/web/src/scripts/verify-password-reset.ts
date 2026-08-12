/**
 * End-to-end password reset verification (run against a live local server):
 *
 *   node --require ./src/scripts/patch-next-env.cjs --import tsx \
 *     src/scripts/verify-password-reset.ts [baseUrl]
 *
 * The reset token normally travels only inside the email. Here we generate
 * it via the Payload local API (same code path forgotPassword uses), then
 * drive the PUBLIC HTTP endpoint with it - proving the whole loop:
 * token issue -> /api/reader/reset-password -> session cookie -> new
 * password works, old password dead.
 */
import { getPayload } from 'payload'
import config from '../payload/payload.config'

const BASE = process.argv[2] ?? 'http://localhost:3000'

async function main() {
  const payload = await getPayload({ config })
  const email = `reset-verify-${Date.now()}@example.local`
  const oldPassword = 'OldPass-12345!'
  const newPassword = 'NewPass-67890!'

  // 1. Create a throwaway reader.
  const reader = await payload.create({
    collection: 'readers',
    data: { name: 'Reset Verify', email, password: oldPassword, locale: 'ne', isActive: true },
    overrideAccess: true,
  })
  console.log(`[1] reader created: ${email}`)

  // 2. Issue the reset token (what the email would carry).
  const token = await payload.forgotPassword({
    collection: 'readers',
    data: { email },
    disableEmail: true,
  })
  if (!token) throw new Error('forgotPassword returned no token')
  console.log(`[2] reset token issued (${String(token).length} chars)`)

  // 3. Consume it through the public endpoint.
  const res = await fetch(`${BASE}/api/reader/reset-password`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.250.0.1' },
    body: JSON.stringify({ token, password: newPassword }),
  })
  const body = (await res.json()) as { ok?: boolean; reader?: { email?: string } }
  if (!res.ok || !body.ok) throw new Error(`reset endpoint failed: ${res.status} ${JSON.stringify(body)}`)
  const setCookie = res.headers.get('set-cookie') ?? ''
  if (!setCookie.includes('payload-token=')) throw new Error('no session cookie after reset')
  console.log(`[3] reset accepted for ${body.reader?.email}; session cookie set`)

  // 4. New password logs in; old password is dead.
  await payload.login({ collection: 'readers', data: { email, password: newPassword } })
  console.log('[4] login with NEW password: OK')
  let oldWorks = false
  try {
    await payload.login({ collection: 'readers', data: { email, password: oldPassword } })
    oldWorks = true
  } catch {
    console.log('[5] login with OLD password: rejected (correct)')
  }
  if (oldWorks) throw new Error('old password still valid after reset')

  // 5. Cleanup.
  await payload.delete({ collection: 'readers', id: reader.id, overrideAccess: true })
  console.log('[6] cleanup done. PASSWORD RESET LOOP VERIFIED.')
  process.exit(0)
}

main().catch((err) => {
  console.error('VERIFICATION FAILED:', err instanceof Error ? err.message : err)
  process.exit(1)
})
