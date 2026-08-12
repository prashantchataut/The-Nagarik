import { NextResponse } from 'next/server'

/**
 * Consistent API response contract for reader-facing routes.
 *
 * Success: { ok: true, ...data }
 * Failure: { ok: false, code, message }
 *
 * Machine-readable `code` values are stable API surface; `message` is
 * human-facing and may change.
 */

export type ApiErrorCode =
  | 'invalid'
  | 'rate-limit'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'cms-offline'
  | 'server-error'

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  invalid: 400,
  unauthorized: 401,
  forbidden: 403,
  'not-found': 404,
  'rate-limit': 429,
  'cms-offline': 503,
  'server-error': 500,
}

export function apiOk<T extends Record<string, unknown>>(
  data: T,
  init?: { status?: number; cacheControl?: string },
): NextResponse {
  const headers: Record<string, string> = {}
  if (init?.cacheControl) headers['cache-control'] = init.cacheControl
  return NextResponse.json({ ok: true, ...data }, { status: init?.status ?? 200, headers })
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json(
    { ok: false, code, message, ...extra },
    { status: STATUS_BY_CODE[code] },
  )
}

/** Client IP from proxy headers; 'local' in development. */
export function clientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'local'
  )
}
