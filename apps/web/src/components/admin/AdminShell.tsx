'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { ADMIN_NAV_GROUPS, ADMIN_PRIMARY_NAV, CMS_BASE } from '@/lib/admin/nav'

function NavLink({
  href,
  label,
  active,
  external,
}: {
  href: string
  label: string
  active: boolean
  external?: boolean
}) {
  return (
    <Link
      href={href}
      className={`block rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium ${
        active ? 'bg-accent text-accent-fg' : 'text-ink hover:bg-accent-muted'
      }`}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {label}
      {external ? <span className="ml-1 text-[0.7em] opacity-70">↗</span> : null}
    </Link>
  )
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/admin'
  const [open, setOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin' || pathname === '/admin/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const nav = (
    <nav className="flex flex-col gap-6" aria-label="Newsroom desk">
      <div>
        <p className="mb-2 px-3 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-stone">
          प्राथमिक
        </p>
        <ul className="space-y-0.5">
          {ADMIN_PRIMARY_NAV.map((item) => (
            <li key={item.href + item.label}>
              <NavLink
                href={item.cmsHref && item.external ? item.cmsHref : item.href}
                label={item.label}
                active={!item.external && isActive(item.href)}
                external={item.external}
              />
            </li>
          ))}
        </ul>
      </div>
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.heading}>
          <p className="mb-2 px-3 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-stone">
            {group.heading}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.href + item.label}>
                <NavLink
                  href={item.href}
                  label={item.label}
                  active={!item.external && isActive(item.href)}
                  external={item.external}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )

  return (
    <div className="min-h-[100dvh] bg-paper text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="min-w-0">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-accent">
              द नागरिक
            </p>
            <p className="truncate text-sm font-semibold">Newsroom desk</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={CMS_BASE}
              className="hidden rounded-[var(--radius-control)] bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg sm:inline-flex"
            >
              Open CMS
            </Link>
            <Link
              href="/ne"
              className="rounded-[var(--radius-control)] border border-line px-3 py-1.5 text-xs font-medium"
            >
              Reader
            </Link>
            <button
              type="button"
              className="rounded-[var(--radius-control)] border border-line px-3 py-1.5 text-xs font-semibold lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
            >
              Menu
            </button>
          </div>
        </div>
        {open ? (
          <div className="border-t border-line px-4 py-4 lg:hidden" onClick={() => setOpen(false)}>
            {nav}
          </div>
        ) : null}
      </header>

      <div className="mx-auto grid max-w-[1400px] lg:grid-cols-[240px_1fr]">
        <aside className="hidden border-r border-line px-3 py-6 lg:block">{nav}</aside>
        <main className="min-w-0 px-4 py-8 md:px-6">{children}</main>
      </div>
    </div>
  )
}
