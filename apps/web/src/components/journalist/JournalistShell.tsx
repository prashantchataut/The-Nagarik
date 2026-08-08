'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowSquareOut } from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import { StaffLogoutButton } from '@/components/auth/StaffLogoutButton'
import type { StaffSession } from '@/lib/auth/staff-session'
import { primaryRole } from '@/lib/auth/staff-roles'

const NAV = [
  { href: '/journalist', label: 'ड्यासबोर्ड' },
  { href: '/journalist/compose', label: 'नयाँ लेख' },
  { href: '/journalist/preferences', label: 'सेटिङ' },
  { href: '/admin/queue', label: 'सम्पादकीय कतार' },
  { href: '/cms', label: 'Payload CMS', external: true },
]

export function JournalistShell({
  children,
  session,
}: {
  children: ReactNode
  session: StaffSession
}) {
  const pathname = usePathname() ?? '/journalist'
  const [open, setOpen] = useState(false)
  const role = primaryRole(session.roles)

  const isActive = (href: string) => {
    if (href === '/journalist') return pathname === '/journalist' || pathname === '/journalist/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Journalist desk">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium ${
            !item.external && isActive(item.href)
              ? 'bg-accent text-accent-fg'
              : 'text-ink hover:bg-accent-muted'
          }`}
          {...(item.external ? { target: '_blank', rel: 'noreferrer' } : {})}
        >
          {item.label}
          {item.external ? (
            <ArrowSquareOut size={13} weight="bold" className="ml-1 inline-block align-[-0.125em] opacity-70" />
          ) : null}
        </Link>
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
            <p className="truncate text-sm font-semibold">Journalist desk</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-xs font-medium">{session.name || session.email}</p>
              <p className="text-[0.65rem] uppercase tracking-wide text-stone">{role ?? 'staff'}</p>
            </div>
            <Link
              href="/admin"
              className="rounded-[var(--radius-control)] border border-line px-3 py-1.5 text-xs font-medium"
            >
              Ops desk
            </Link>
            <StaffLogoutButton className="rounded-[var(--radius-control)] border border-line px-3 py-1.5 text-xs font-semibold hover:border-holiday" />
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
      <div className="mx-auto grid max-w-[1400px] lg:grid-cols-[220px_1fr]">
        <aside className="hidden border-r border-line px-3 py-6 lg:block">{nav}</aside>
        <main className="min-w-0 px-4 py-8 md:px-6">{children}</main>
      </div>
    </div>
  )
}
