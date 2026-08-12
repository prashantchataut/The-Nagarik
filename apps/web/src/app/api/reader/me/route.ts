import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { z } from 'zod'
import { apiError, apiOk } from '@/lib/api/http'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'
import { getReaderSession, toReaderSession } from '@/lib/auth/reader-session'

export const dynamic = 'force-dynamic'

const UpdateSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  avatarColor: z.enum(['teal', 'blue', 'maroon', 'violet', 'forest', 'slate']).optional(),
  interests: z.array(z.string().trim().min(1).max(40)).max(8).optional(),
  locale: z.enum(['ne', 'en']).optional(),
})

export async function GET(): Promise<NextResponse> {
  if (!payloadDeskAvailable()) {
    return apiOk({ reader: null, authReady: false })
  }
  const reader = await getReaderSession()
  return apiOk({ reader, authReady: true })
}

export async function PATCH(request: Request): Promise<NextResponse> {
  if (!payloadDeskAvailable()) {
    return apiError('cms-offline', 'Account service is unavailable right now.')
  }
  const session = await getReaderSession()
  if (!session) {
    return apiError('unauthorized', 'Reader session required.')
  }

  const parsed = UpdateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return apiError('invalid', 'Profile update failed validation.')
  }

  const data: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) data.name = parsed.data.name
  if (parsed.data.avatarColor !== undefined) data.avatarColor = parsed.data.avatarColor
  if (parsed.data.locale !== undefined) data.locale = parsed.data.locale
  if (parsed.data.interests !== undefined) {
    data.interests = parsed.data.interests.map((slug) => ({ slug }))
  }
  if (!Object.keys(data).length) {
    return apiError('invalid', 'Nothing to update.')
  }

  try {
    const payload = await getPayload({ config })
    const updated = await payload.update({
      collection: 'readers',
      id: session.id,
      data,
      overrideAccess: true,
    })
    return apiOk({ reader: toReaderSession(updated as never) })
  } catch {
    return apiError('server-error', 'Profile could not be saved; please retry.')
  }
}
