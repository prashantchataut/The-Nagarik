'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarBlank, Translate, ShieldCheck, User } from '@phosphor-icons/react'
import type { AppLocale, Dictionary } from '@/lib/i18n'
import { ChromeDate } from '@/components/ChromeDate'
import { ThemeToggle } from '@/components/ThemeToggle'
import { patroHref, swapLocalePath } from '@/lib/site'

export function UtilityStrip({
  locale,
  dict,
}: {
  locale: AppLocale
  dict: Dictionary
}) {
  const pathname = usePathname() ?? ''
  const otherLocale: AppLocale = locale === 'ne' ? 'en' : 'ne'
  const otherLocaleHref = swapLocalePath(pathname, otherLocale)
  const calendarUrl = patroHref(locale)

  return (
    <aside className="border-b border-line bg-paper-elevated text-[0.8rem] text-stone" aria-label={dict.utilities}>
      <div className="mx-auto flex min-h-9 max-w-[1280px] items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-3">
          <ChromeDate locale={locale} className="font-semibold text-ink" />
          <span className="hidden h-3.5 w-px bg-line sm:inline-block" aria-hidden="true" />
          <Link
            href={calendarUrl}
            className="hidden items-center gap-1 font-medium text-stone hover:text-accent sm:inline-flex"
          >
            <CalendarBlank size={14} weight="bold" aria-hidden="true" />
            <span>{dict.nepaliPatro}</span>
          </Link>
        </div>

        <nav className="flex items-center gap-3" aria-label={dict.utilities}>
          <Link
            href={`/${locale}/utilities/preeti-unicode`}
            className="hidden items-center gap-1 font-medium hover:text-accent md:inline-flex"
          >
            <Translate size={14} weight="bold" aria-hidden="true" />
            <span>{dict.preetiTranslator}</span>
          </Link>

          <Link
            href={`/${locale}/trust`}
            className="hidden items-center gap-1 font-medium hover:text-accent lg:inline-flex"
          >
            <ShieldCheck size={14} weight="bold" aria-hidden="true" />
            <span>{dict.trust}</span>
          </Link>

          <Link
            href={`/${locale}/login`}
            className="inline-flex items-center gap-1 font-medium text-ink hover:text-accent"
          >
            <User size={14} weight="bold" aria-hidden="true" />
            <span>{dict.login}</span>
          </Link>

          <span className="h-3.5 w-px bg-line" aria-hidden="true" />

          <ThemeToggle dict={dict} />

          <Link
            href={otherLocaleHref}
            hrefLang={otherLocale}
            className="inline-flex min-h-7 items-center rounded-[var(--radius-control)] border border-line bg-paper px-2.5 font-bold text-ink hover:border-accent hover:text-accent"
          >
            {locale === 'ne' ? 'EN' : 'नेपाली'}
          </Link>
        </nav>
      </div>
    </aside>
  )
}
