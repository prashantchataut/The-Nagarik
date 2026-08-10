'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowSquareOut, List, X, House, Article, Users, Folder, Sparkle, Rocket, SignOut } from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import { StaffLogoutButton } from '@/components/auth/StaffLogoutButton'
import { ADMIN_NAV_GROUPS, ADMIN_PRIMARY_NAV, CMS_BASE } from '@/lib/admin/nav'
import { primaryRole } from '@/lib/auth/staff-roles'
import type { StaffSession } from '@/lib/auth/staff-session'

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
      className={`flex items-center justify-between rounded-[var(--radius-control)] px-3 py-2 text-xs font-bold transition-all ${
        active
          ? 'accent-solid shadow-sm'
          : 'text-ink hover:bg-accent-muted hover:text-accent'
      }`}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      <span>{label}</span>
      {external ? (
        <ArrowSquareOut size={12} weight="bold" className="opacity-70" />
      ) : null}
    </Link>
  )
}

export function AdminShell({
  children,
  session,
}: {
  children: ReactNode
  session: StaffSession
}) {
  const pathname = usePathname() ?? '/admin'
  const [open, setOpen] = useState(false)
  const role = primaryRole(session.roles)

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin' || pathname === '/admin/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const nav = (
    <nav className="flex flex-col gap-6" aria-label="Newsroom desk">
      {/* Primary Section */}
      <div>
        <p className="mb-2 px-3 text-[0.68rem] font-black uppercase tracking-wider text-stone">
          प्राथमिक
        </p>
        <ul className="space-y-1">
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

      {/* Nav Groups */}
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.heading}>
          <p className="mb-2 px-3 text-[0.68rem] font-black uppercase tracking-wider text-stone">
            {group.heading}
          </p>
          <ul className="space-y-1">
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

      {/* Account Section */}
      <div>
        <p className="mb-2 px-3 text-[0.68rem] font-black uppercase tracking-wider text-stone">
          खाता
        </p>
        <ul className="space-y-1">
          <li>
            <NavLink href="/admin/account" label="मेरो खाता" active={isActive('/admin/account')} />
          </li>
        </ul>
      </div>
    </nav>
  )

  return (
    <div className="min-h-[100dvh] bg-paper text-ink">
      {/* Top Desk Header */}
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-2.5 md:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] bg-accent text-accent-fg font-black text-sm">
                ना
              </span>
              <div>
                <p className="text-[0.68rem] font-black uppercase tracking-wider text-accent leading-none">
                  द नागरिक
                </p>
                <p className="text-xs font-bold text-ink leading-tight">Newsroom Desk</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            {/* User Chip */}
            <div className="hidden items-center gap-2 rounded-full border border-line bg-paper-elevated px-3 py-1 text-xs sm:flex">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-fg text-[0.65rem] font-black">
                {(session.name || session.email || 'U').slice(0, 1).toUpperCase()}
              </span>
              <span className="font-semibold text-ink max-w-[120px] truncate">
                {session.name || session.email}
              </span>
              <span className="rounded-full bg-paper px-1.5 py-0.5 text-[0.65rem] font-extrabold uppercase text-accent border border-line">
                {role ?? 'staff'}
              </span>
            </div>

            <Link
              href={CMS_BASE}
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-[var(--radius-control)] accent-solid px-3 py-1.5 text-xs font-bold sm:inline-flex items-center gap-1"
            >
              <span>Open CMS</span>
              <ArrowSquareOut size={12} weight="bold" />
            </Link>

            <Link
              href="/ne"
              className="rounded-[var(--radius-control)] border border-line bg-paper px-3 py-1.5 text-xs font-bold text-ink hover:border-accent hover:text-accent"
            >
              Reader View
            </Link>

            <StaffLogoutButton className="rounded-[var(--radius-control)] border border-line bg-paper px-3 py-1.5 text-xs font-bold text-stone hover:text-danger hover:border-danger" />

            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-line lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label="Toggle Desk Nav"
            >
              {open ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {open ? (
          <div className="border-t border-line bg-paper-elevated px-4 py-5 lg:hidden" onClick={() => setOpen(false)}>
            {nav}
          </div>
        ) : null}
      </header>

      {/* Main Grid Layout */}
      <div className="mx-auto grid max-w-[1400px] lg:grid-cols-[240px_1fr]">
        <aside className="hidden border-r border-line bg-paper-elevated/40 p-5 lg:block min-h-[calc(100dvh-53px)]">
          {nav}
        </aside>

        <main className="min-w-0 px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  )
}
