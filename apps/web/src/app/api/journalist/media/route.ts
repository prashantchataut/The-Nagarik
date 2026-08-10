import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { contributorRoles, hasAnyRole } from '@/payload/access/rbac'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'

export const dynamic = 'force-dynamic'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
])

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB

export async function POST(request: Request) {
  if (!payloadDeskAvailable()) {
    return NextResponse.json({ message: 'CMS offline', code: 'CMS_OFFLINE' }, { status: 503 })
  }

  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || !hasAnyRole(user, contributorRoles)) {
    return NextResponse.json({ message: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const form = await request.formData()
  const file = form.get('file')
  const alt = String(form.get('alt') ?? '').trim()
  const credit = String(form.get('credit') ?? '').trim()

  if (!(file instanceof File)) {
    return NextResponse.json({ message: 'file required', code: 'VALIDATION' }, { status: 400 })
  }
  if (!alt || !credit) {
    return NextResponse.json(
      { message: 'alt and credit are required', code: 'VALIDATION' },
      { status: 400 },
    )
  }

  const mime = (file.type || '').toLowerCase().trim()
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    return NextResponse.json(
      { message: 'Only JPEG, PNG, WebP, AVIF, and GIF image files are permitted.', code: 'INVALID_MIME_TYPE' },
      { status: 400 },
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { message: 'File exceeds maximum upload size limit of 15MB.', code: 'FILE_TOO_LARGE' },
      { status: 400 },
    )
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const doc = await payload.create({
      collection: 'media',
      data: {
        alt,
        credit,
      } as never,
      file: {
        data: buffer,
        mimetype: file.type || 'application/octet-stream',
        name: file.name,
        size: file.size,
      },
      user,
      overrideAccess: false,
    })

    return NextResponse.json({
      id: String(doc.id),
      url: typeof doc.url === 'string' ? doc.url : null,
      alt: doc.alt,
      credit: doc.credit,
      width: typeof doc.width === 'number' ? doc.width : undefined,
      height: typeof doc.height === 'number' ? doc.height : undefined,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ message, code: 'UPLOAD_FAILED' }, { status: 400 })
  }
}
