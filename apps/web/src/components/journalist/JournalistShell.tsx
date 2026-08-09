'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowSquareOut,
  FileText,
  GearSix,
  House,
  List,
  NotePencil,
  Queue,
  X,
} from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { StaffLogoutButton } from '@/components/auth/StaffLogoutButton'
import type { StaffSession } from '@/lib/auth/staff-session'
import { primaryRole } from '@/lib/auth/staff-roles'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

type NavItem = {
  href: string
  label: string
  hint: string
  icon: typeof House
  external?: boolean
  elevatedOnly?: boolean
}

const NAV: NavItem[] = [
  { href: '/journalist', label: 'मेरो डेस्क', hint: 'समाचार र स्थिति', icon: House },
  { href: '/journalist/compose', label: 'नयाँ लेख', hint: 'मस्यौदा सुरु गर्नुहोस्', icon: NotePencil },
  { href: '/journalist/preferences', label: 'लेखन सेटिङ', hint: 'यो उपकरणका प्राथमिकता', icon: GearSix },
  {
    href: '/admin/queue',
    label: 'सम्पादकीय कतार',
    hint: 'समीक्षाका समाचार',
    icon: Queue,
    elevatedOnly: true,
  },
  {
    href: '/cms',
    label: 'सामग्री व्यवस्थापन',
    hint: 'उन्नत सामग्री उपकरण',
    icon: FileText,
    external: true,
    elevatedOnly: true,
  },
]

function deskLinkActive(pathname: string, href: string) {
  if (href === '/journalist') return pathname === '/journalist' || pathname === '/journalist/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function DeskNav({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[]
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <nav aria-label="पत्रकार डेस्क" className="space-y-1">
      {items.map((item) => {
        const active = !item.external && deskLinkActive(pathname, item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`group flex min-h-12 items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 transition-colors ${
              active
                ? 'bg-accent text-accent-fg'
                : 'text-ink hover:bg-accent-muted hover:text-ink'
            }`}
            onClick={onNavigate}
            {...(item.external ? { target: '_blank', rel: 'noreferrer' } : {})}
          >
            <Icon size={20} weight={active ? 'fill' : 'regular'} aria-hidden="true" className="shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold leading-5">{item.label}</span>
              <span className={`block truncate text-[0.7rem] leading-4 ${active ? 'text-accent-fg/72' : 'text-stone'}`}>
                {item.hint}
              </span>
            </span>
            {item.external ? <ArrowSquareOut size={15} aria-hidden="true" className="shrink-0 opacity-65" /> : null}
          </Link>
        )
      })}
    </nav>
  )
}

export function JournalistShell({ children, session }: { children: ReactNode; session: StaffSession }) {
  const pathname = usePathname() ?? '/journalist'
  const [open, setOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const role = primaryRole(session.roles)
  const elevated = role === 'editor' || role === 'publisher' || role === 'admin'

  const items = useMemo(() => NAV.filter((item) => !item.elevatedOnly || elevated), [elevated])

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        return
      }
      if (event.key !== 'Tab' || !drawerRef.current) return
      const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      menuButtonRef.current?.focus()
    }
  }, [open])

  return (
    <div className="min-h-[100dvh] bg-paper text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-paper-elevated">
        <div className="mx-auto grid h-16 max-w-[1500px] grid-cols-[auto_1fr_auto] items-center gap-3 px-3 sm:px-4 md:px-6">
          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-ink hover:bg-paper lg:hidden"
            aria-expanded={open}
            aria-controls="journalist-mobile-nav"
            aria-label="डेस्क मेनु खोल्नुहोस्"
            onClick={() => setOpen(true)}
          >
            <List size={23} weight="bold" aria-hidden="true" />
          </button>

          <div className="min-w-0 lg:pl-1">
            <Link href="/journalist" className="inline-flex min-w-0 items-baseline gap-2 hover:text-ink">
              <span className="truncate text-lg font-bold tracking-[-0.025em]">द नागरिक</span>
              <span className="hidden text-xs font-semibold text-stone sm:inline">पत्रकार डेस्क</span>
            </Link>
          </div>

          <div className="flex items-center justify-end gap-2">
            <div className="hidden min-w-0 text-right md:block">
              <p className="max-w-[14rem] truncate text-xs font-semibold">{session.name || session.email}</p>
              <p className="text-[0.68rem] font-medium text-stone">{role ?? 'कर्मचारी'}</p>
            </div>
            {elevated ? (
              <Link
                href="/admin"
                className="hidden min-h-11 items-center rounded-[var(--radius-control)] border border-line bg-paper px-3 text-xs font-semibold hover:border-accent hover:text-accent sm:inline-flex"
              >
                सञ्चालन डेस्क
              </Link>
            ) : null}
            <StaffLogoutButton className="hidden min-h-11 rounded-[var(--radius-control)] border border-line bg-paper px-3 text-xs font-semibold hover:border-danger hover:text-danger sm:inline-flex sm:items-center" />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100dvh-4rem)] border-r border-line bg-paper-elevated px-3 py-5 lg:block">
          <DeskNav items={items} pathname={pathname} />
          <div className="mt-7 border-t border-line px-3 pt-5">
            <p className="text-xs font-semibold text-stone">साइन इन गरिएको खाता</p>
            <p className="mt-1 truncate text-sm font-semibold">{session.name || session.email}</p>
            <p className="mt-0.5 text-xs text-stone">{session.email}</p>
            <div className="mt-4 flex flex-col gap-1.5">
              <Link href="/ne" className="text-xs font-semibold text-stone hover:text-accent">
                पाठक साइट
              </Link>
              <StaffLogoutButton className="w-fit text-xs font-semibold text-stone hover:text-danger" />
            </div>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-6 sm:px-5 md:px-7 md:py-8 xl:px-9">{children}</main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[var(--overlay)]"
            aria-label="डेस्क मेनु बन्द गर्नुहोस्"
            onClick={() => setOpen(false)}
          />
          <div
            ref={drawerRef}
            id="journalist-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-labelledby="journalist-nav-title"
            className="absolute inset-y-0 left-0 flex w-[min(22rem,90vw)] flex-col border-r border-line bg-paper-elevated shadow-[12px_0_32px_rgb(18_20_26_/_18%)]"
          >
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <div>
                <p id="journalist-nav-title" className="font-bold">द नागरिक</p>
                <p className="text-xs text-stone">पत्रकार डेस्क</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] hover:bg-paper"
                aria-label="डेस्क मेनु बन्द गर्नुहोस्"
                onClick={() => setOpen(false)}
              >
                <X size={22} weight="bold" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <DeskNav items={items} pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t border-line px-4 py-4">
              <p className="truncate text-sm font-semibold">{session.name || session.email}</p>
              <p className="mt-0.5 text-xs text-stone">{role ?? 'कर्मचारी'}</p>
              <div className="mt-4 flex items-center gap-4">
                <Link href="/ne" className="text-sm font-semibold text-accent" onClick={() => setOpen(false)}>
                  पाठक साइट
                </Link>
                <StaffLogoutButton className="text-sm font-semibold text-danger" />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
