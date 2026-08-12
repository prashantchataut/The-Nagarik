'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookmarkSimple,
  ClockCounterClockwise,
  SquaresFour,
  UserCircle,
} from '@phosphor-icons/react'

const COPY = {
  ne: {
    overview: 'खाता',
    profile: 'प्रोफाइल',
    history: 'पढाइ इतिहास',
    saved: 'सुरक्षित समाचार',
    ariaLabel: 'खाता नेभिगेसन',
  },
  en: {
    overview: 'Account',
    profile: 'Profile',
    history: 'Reading history',
    saved: 'Saved stories',
    ariaLabel: 'Account navigation',
  },
} as const

export function AccountNav({ locale = 'ne' }: { locale?: 'ne' | 'en' }) {
  const copy = COPY[locale]
  const pathname = usePathname() ?? ''
  const base = `/${locale}/account`

  const items = [
    { href: base, label: copy.overview, icon: SquaresFour, exact: true },
    { href: `${base}/profile`, label: copy.profile, icon: UserCircle, exact: false },
    { href: `${base}/history`, label: copy.history, icon: ClockCounterClockwise, exact: false },
    { href: `${base}/saved`, label: copy.saved, icon: BookmarkSimple, exact: false },
  ]

  return (
    <nav aria-label={copy.ariaLabel} className="border-b border-line">
      <div className="nav-scroller -mb-px flex items-stretch gap-1 overflow-x-auto">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href || pathname === `${item.href}/`
            : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex min-h-12 shrink-0 items-center gap-2 border-b-[3px] px-4 text-sm font-bold transition-colors ${
                active
                  ? 'border-accent text-accent'
                  : 'border-transparent text-stone hover:text-ink'
              }`}
            >
              <Icon size={17} weight={active ? 'fill' : 'bold'} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
