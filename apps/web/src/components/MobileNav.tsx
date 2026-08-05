'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, MagnifyingGlass, Newspaper, SquaresFour } from '@phosphor-icons/react'
import type { AppLocale, Dictionary } from '@/lib/i18n'

export function MobileBottomNav({ locale, dict }: { locale: AppLocale; dict: Dictionary }) {
  const pathname = usePathname() ?? ''
  const items = [
    { href: `/${locale}`, label: dict.home, icon: House, match: (p: string) => p === `/${locale}` || p === `/${locale}/` },
    {
      href: `/${locale}/latest`,
      label: dict.latest,
      icon: Newspaper,
      match: (p: string) => p.startsWith(`/${locale}/latest`),
    },
    {
      href: `/${locale}/search`,
      label: dict.search,
      icon: MagnifyingGlass,
      match: (p: string) => p.startsWith(`/${locale}/search`),
    },
    {
      href: `/${locale}/utilities`,
      label: dict.utilities,
      icon: SquaresFour,
      match: (p: string) =>
        p.startsWith(`/${locale}/utilities`) ||
        p.startsWith(`/${locale}/pradesh`) ||
        p.startsWith(`/${locale}/rajniti`) ||
        p.startsWith(`/${locale}/samachar`) ||
        p.startsWith(`/${locale}/arth`) ||
        p.startsWith(`/${locale}/khel`) ||
        p.startsWith(`/${locale}/bishwa`) ||
        p.startsWith(`/${locale}/bichar`) ||
        p.startsWith(`/${locale}/pravas`) ||
        !p.startsWith(`/${locale}/latest`) &&
        !p.startsWith(`/${locale}/search`) &&
        !p.startsWith(`/${locale}/about`) &&
        !p.startsWith(`/${locale}/trust`) &&
        p.split('/').length >= 3 &&
        p !== `/${locale}` &&
        p !== `/${locale}/`,
    },
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label={dict.menu}
    >
      <ul className="mx-auto grid max-w-[1400px] grid-cols-4">
        {items.map((item) => {
          const active = item.match(pathname)
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 text-[0.7rem] ${
                  active ? 'text-accent' : 'text-stone'
                }`}
              >
                <Icon size={22} weight={active ? 'fill' : 'regular'} />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
