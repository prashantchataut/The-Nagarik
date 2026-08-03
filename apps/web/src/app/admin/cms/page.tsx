import Link from 'next/link'

export default function CmsRedirectPage() {
  return (
    <div className="min-h-[100dvh] bg-paper px-4 py-16 text-ink">
      <div className="mx-auto max-w-[720px]">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Payload CMS</h1>
        <p className="mt-4 text-stone">
          Editorial admin lives at <code>/cms</code> (kept separate from ops at <code>/admin</code>).
        </p>
        <p className="mt-6">
          <Link href="/cms" className="text-accent underline-offset-2 hover:underline">
            Open CMS →
          </Link>
        </p>
        <p className="mt-6 text-sm">
          <Link href="/admin" className="text-accent">
            ← Admin home
          </Link>
        </p>
      </div>
    </div>
  )
}
