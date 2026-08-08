import type { ReactNode } from 'react'
import Link from 'next/link'

export function StaffAuthShell({
  title,
  lede,
  formTitle,
  children,
  footer,
}: {
  title: string
  lede: string
  formTitle: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="min-h-[100dvh] bg-paper text-ink">
      <div className="mx-auto grid min-h-[100dvh] max-w-[1100px] lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative flex flex-col justify-between border-b border-line bg-[linear-gradient(160deg,color-mix(in_oklab,var(--accent)_12%,var(--paper)),var(--paper)_55%)] px-6 py-10 md:px-10 lg:border-b-0 lg:border-r">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-accent">द नागरिक</p>
            <h1 className="mt-4 max-w-[16ch] text-4xl font-bold tracking-[-0.03em] md:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-[42ch] text-sm leading-relaxed text-stone">{lede}</p>
            <ul className="mt-8 space-y-2 text-sm text-ink">
              <li>Payload CMS at <code className="text-accent">/cms</code> is the only editor</li>
              <li>Roles: journalist / editor / publisher / admin</li>
              <li>Desk views list, route, and review content from Payload</li>
            </ul>
          </div>
          <p className="mt-10 text-xs text-stone">
            Same staff account works for the ops desk and Payload.
          </p>
        </aside>

        <main className="flex flex-col justify-center px-6 py-10 md:px-10">
          <div className="mx-auto w-full max-w-md">
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">{formTitle}</h2>
            <div className="mt-6">{children}</div>
            {footer ? <div className="mt-8 flex flex-wrap gap-4 text-sm text-stone">{footer}</div> : null}
            <p className="mt-10 text-xs text-stone">
              <Link href="/ne" className="font-medium text-accent hover:underline">
                Reader home
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
