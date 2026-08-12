import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { hasAnyRole, STAFF_ROLES } from '@/payload/access/rbac'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'
import { cookieSecure } from '@/lib/auth/session-cookie'

export const dynamic = 'force-dynamic'

type LoginBody = {
  email?: string
  password?: string
}

/**
 * Branded staff login → Payload Users collection.
 * Sets the same auth cookie Payload CMS uses at /cms.
 */
export async function POST(request: Request) {
  if (!payloadDeskAvailable()) {
    return NextResponse.json(
      { message: 'Auth unavailable. DATABASE_URL and PAYLOAD_SECRET required.', code: 'AUTH_UNAVAILABLE' },
      { status: 503 },
    )
  }

  let body: LoginBody
  try {
    body = (await request.json()) as LoginBody
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body.', code: 'BAD_REQUEST' }, { status: 400 })
  }

  const email = String(body.email ?? '')
    .trim()
    .toLowerCase()
  const password = String(body.password ?? '')
  if (!email || !password) {
    return NextResponse.json(
      { message: 'Email and password required.', code: 'MISSING_CREDENTIALS' },
      { status: 400 },
    )
  }

  try {
    const payload = await getPayload({ config })
    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    })

    if (!result.user || !hasAnyRole(result.user, STAFF_ROLES)) {
      return NextResponse.json(
        { message: 'Not a newsroom staff account.', code: 'NOT_STAFF' },
        { status: 403 },
      )
    }

    const response = NextResponse.json({
      user: {
        id: String(result.user.id),
        email: result.user.email,
        name: result.user.name,
        roles: result.user.roles,
      },
      exp: result.exp,
    })

    if (result.token) {
      const secure = cookieSecure()
      response.cookies.set('payload-token', result.token, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure,
        maxAge: 60 * 60 * 24 * 7,
      })
    }

    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed'
    if (/disabled|inactive/i.test(message)) {
      return NextResponse.json({ message, code: 'ACCOUNT_DISABLED' }, { status: 403 })
    }
    return NextResponse.json(
      { message: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' },
      { status: 401 },
    )
  }
}
