import Link from 'next/link'

export default function AdminHomePage() {
  const hasDb = Boolean(process.env.DATABASE_URL)
  const hasSecret = Boolean(process.env.PAYLOAD_SECRET && process.env.PAYLOAD_SECRET.length >= 32)

  return (
    <div className="min-h-[100dvh] bg-paper text-ink">
      <div className="mx-auto max-w-[720px] px-4 py-16">
        <h1 className="font-[family-name:var(--font-display)] text-4xl">Newsroom admin</h1>
        <p className="mt-4 text-stone">
          Payload CMS embeds at <code>/admin/cms</code> when <code>DATABASE_URL</code> and{' '}
          <code>PAYLOAD_SECRET</code> are configured. Until then, use the algorithm desk and reader facade.
        </p>
        <ul className="mt-8 space-y-3 text-sm">
          <li>
            Database: {hasDb ? 'configured' : 'missing DATABASE_URL'}
          </li>
          <li>
            Payload secret: {hasSecret ? 'configured' : 'missing/short PAYLOAD_SECRET'}
          </li>
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/admin/algorithms"
            className="rounded-[var(--radius-control)] bg-accent px-4 py-2 text-accent-fg"
          >
            Algorithm desk
          </Link>
          <Link
            href="/admin/cms"
            className="rounded-[var(--radius-control)] border border-line px-4 py-2"
          >
            Open CMS
          </Link>
          <Link href="/ne" className="rounded-[var(--radius-control)] border border-line px-4 py-2">
            Reader
          </Link>
        </div>
      </div>
    </div>
  )
}
