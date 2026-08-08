import Link from 'next/link'
import { AdminButton } from '@/components/admin/primitives'
import { CMS_BASE } from '@/lib/admin/nav'

export const metadata = {
  title: 'CMS · Newsroom',
  robots: { index: false, follow: false },
}

export default function CmsRedirectPage() {
  return (
    <div>
      <p className="text-sm font-semibold text-accent">CMS</p>
      <h1 className="mt-1 text-3xl font-bold">Payload editorial</h1>
      <p className="mt-2 max-w-[54ch] text-sm text-stone">
        Article create/edit/publish lives in Payload at <code>{CMS_BASE}</code>, separate from this
        ops desk.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <AdminButton href={CMS_BASE}>Open /cms</AdminButton>
        <Link href="/admin" className="text-sm font-medium text-accent hover:underline">
          ← Dashboard
        </Link>
      </div>
    </div>
  )
}
