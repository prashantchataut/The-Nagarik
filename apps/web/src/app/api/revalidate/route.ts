import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { assertRevalidateAuth } from '@/lib/security'

export async function POST(request: Request) {
  if (!assertRevalidateAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const body = (await request.json().catch(() => ({}))) as { paths?: string[] }
  const paths = body.paths?.length ? body.paths : ['/ne', '/en']
  for (const p of paths) revalidatePath(p)
  return NextResponse.json({ ok: true, revalidated: paths })
}
