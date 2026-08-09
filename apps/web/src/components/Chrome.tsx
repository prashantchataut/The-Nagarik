'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { CalendarBlank, List, MagnifyingGlass, X } from '@phosphor-icons/react'
import type { AppLocale, Dictionary } from '@/lib/i18n'
import type { Category } from '@thenagarik/content'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ChromeDate } from '@/components/ChromeDate'
import { BRAND_EN, BRAND_NE, patroHref, swapLocalePath } from '@/lib/site'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function SiteHeader({
  locale,
  dict,
  categories,
  trendingTags = [],
}: {
  locale: AppLocale
  dict: Dictionary
  categories: Category[]
  trendingTags?: string[]
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname() ?? ''
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const drawerCloseRef = useRef<HTMLButtonElement>(null)
  const otherLocale: AppLocale = locale === 'ne' ? 'en' : 'ne'
  const otherLocaleHref = swapLocalePath(pathname, otherLocale)
  const sections = categories.map((category) => ({
    href: `/${locale}/${category.slug}`,
    label: locale === 'en' ? category.nameEn : category.nameNe,
  }))
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`
  const calendarUrl = patroHref(locale)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    drawerCloseRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        return
      }
      if (event.key !== 'Tab' || !drawerRef.current) return

      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => !element.hasAttribute('disabled') && element.tabIndex !== -1)
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

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      menuButtonRef.current?.focus()
    }
  }, [open])

  const desktopNavLinkClass = (active: boolean) => 'site-nav-link'
  const mobileNavLinkClass = (active: boolean) => 'mobile-section-link'

  const drawerLinkClass = (active = false) =>
    `flex min-h-11 items-center rounded-[var(--radius-control)] px-3 py-2.5 text-[1.02rem] font-medium transition-colors ${
      active
        ? 'bg-accent-muted font-semibold text-accent'
        : 'text-ink hover:bg-paper-elevated hover:text-ink'
    }`

  return (
    <>
      <header className="hidden bg-paper md:block">
        <div className="border-b border-line bg-paper-elevated">
          <div className="mx-auto flex min-h-9 max-w-[1280px] items-center justify-between gap-6 px-6 text-[0.78rem] text-stone">
            <ChromeDate locale={locale} className="font-medium text-ink" />
            <nav className="flex items-center gap-3.5" aria-label={dict.utilities}>
              <Link href={`/${locale}/utilities/preeti-unicode`} className="hover:text-accent">
                {dict.preetiTranslator}
              </Link>
              <Link href={calendarUrl} className="inline-flex items-center gap-1 hover:text-accent">
                <CalendarBlank size={13} weight="bold" aria-hidden="true" />
                {dict.patroShort}
              </Link>
              <Link href={`/${locale}/trust`} className="hover:text-accent">
                {dict.trust}
              </Link>
              <Link href={`/${locale}/login`} className="hover:text-accent">
                {dict.login}
              </Link>
              <span className="h-3.5 w-px bg-line" aria-hidden="true" />
              <ThemeToggle dict={dict} />
              <Link
                href={otherLocaleHref}
                hrefLang={otherLocale}
                className="inline-flex min-h-7 items-center rounded-[var(--radius-control)] border border-line bg-paper px-2 font-bold text-ink hover:border-accent hover:text-accent"
              >
                {locale === 'ne' ? 'EN' : 'NE'}
              </Link>
            </nav>
          </div>
        </div>

        <div className="border-b border-line">
          <div className="mx-auto grid min-h-[80px] max-w-[1280px] grid-cols-[minmax(12rem,1fr)_auto_minmax(12rem,1fr)] items-center gap-6 px-6">
            <p className="max-w-[24ch] text-sm font-medium leading-relaxed text-stone">{dict.tagline}</p>
            <Link
              href={`/${locale}`}
              className="justify-self-center text-center hover:text-ink"
              aria-current={isHome ? 'page' : undefined}
            >
              <span className="block text-[2.45rem] font-bold leading-[0.92] tracking-[-0.03em] text-ink lg:text-[2.7rem]">
                {BRAND_NE}
              </span>
              <span className="mt-1 block text-[0.78rem] font-semibold tracking-[0.12em] text-stone">
                {BRAND_EN.toUpperCase()}
              </span>
            </Link>
            <form action={`/${locale}/search`} method="get" className="w-full max-w-[17rem] justify-self-end" role="search">
              <label className="sr-only" htmlFor="masthead-search">
                {dict.search}
              </label>
              <div className="relative">
                <MagnifyingGlass
                  size={17}
                  weight="bold"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone"
                  aria-hidden="true"
                />
                <input
                  id="masthead-search"
                  name="q"
                  type="search"
                  placeholder={dict.searchPlaceholder}
                  className="min-h-11 w-full rounded-[var(--radius-control)] border border-line bg-field pl-9 pr-3 text-sm text-ink placeholder:text-stone focus:border-accent"
                />
              </div>
            </form>
          </div>
        </div>
      </header>

      <nav
        className="sticky top-0 z-40 hidden border-b border-nav bg-nav text-nav-fg shadow-[0_2px_10px_rgb(12_14_18_/_12%)] md:block"
        aria-label={dict.categories}
      >
        <div className="nav-scroller mx-auto flex min-h-12 max-w-[1280px] items-stretch overflow-x-auto px-4 lg:px-6">
          <Link href={`/${locale}`} className={desktopNavLinkClass(isHome)} data-active={isHome} aria-current={isHome ? 'page' : undefined}>
            {dict.home}
          </Link>
          {sections.map((item) => {
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href} className={desktopNavLinkClass(active)} data-active={active} aria-current={active ? 'page' : undefined}>
                {item.label}
              </Link>
            )
          })}
          <Link
            href={`/${locale}/latest`}
            className={desktopNavLinkClass(isActive(`/${locale}/latest`))}
            data-active={isActive(`/${locale}/latest`)}
            aria-current={isActive(`/${locale}/latest`) ? 'page' : undefined}
          >
            {dict.latest}
          </Link>
        </div>
      </nav>

      <header className="sticky top-0 z-40 border-t-[3px] border-accent bg-paper shadow-[0_2px_10px_rgb(12_14_18_/_8%)] md:hidden">
        <div className="grid h-14 grid-cols-[3rem_1fr_3rem] items-center border-b border-line px-2">
          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-ink hover:bg-paper-elevated"
            aria-expanded={open}
            aria-controls="mobile-nav-drawer"
            aria-label={open ? dict.close : dict.menu}
            onClick={() => setOpen((value) => !value)}
          >
            <List size={24} weight="bold" aria-hidden="true" />
          </button>
          <Link
            href={`/${locale}`}
            className="min-w-0 justify-self-center text-center hover:text-ink"
            aria-current={isHome ? 'page' : undefined}
          >
            <span className="block text-[1.36rem] font-bold leading-none tracking-[-0.025em] text-ink">{BRAND_NE}</span>
            <span className="mt-0.5 block text-[0.61rem] font-semibold tracking-[0.11em] text-stone">{BRAND_EN.toUpperCase()}</span>
          </Link>
          <Link
            href={`/${locale}/search`}
            className="inline-flex h-11 w-11 items-center justify-center justify-self-end rounded-[var(--radius-control)] text-ink hover:bg-paper-elevated"
            aria-label={dict.search}
          >
            <MagnifyingGlass size={22} weight="bold" aria-hidden="true" />
          </Link>
        </div>

        <nav className="bg-nav text-nav-fg" aria-label={dict.categories}>
          <div className="nav-scroller flex min-h-11 items-stretch overflow-x-auto px-1">
            <Link
              href={`/${locale}/latest`}
              className={mobileNavLinkClass(isActive(`/${locale}/latest`))}
              data-active={isActive(`/${locale}/latest`)}
              aria-current={isActive(`/${locale}/latest`) ? 'page' : undefined}
            >
              {dict.latest}
            </Link>
            {sections.map((item) => {
              const active = isActive(item.href)
              return (
                <Link key={item.href} href={item.href} className={mobileNavLinkClass(active)} data-active={active} aria-current={active ? 'page' : undefined}>
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </header>

      {trendingTags.length ? (
        <div className="hidden border-b border-line bg-paper-elevated md:block">
          <div className="nav-scroller mx-auto flex min-h-9 max-w-[1280px] items-center gap-3 overflow-x-auto px-6 py-1 text-xs">
            <span className="shrink-0 font-bold text-ink">{dict.trending}</span>
            <span className="h-3.5 w-px shrink-0 bg-line" aria-hidden="true" />
            {trendingTags.map((tag) => (
              <Link key={tag} href={`/${locale}/search?q=${encodeURIComponent(tag)}`} className="shrink-0 font-medium text-stone hover:text-accent">
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button type="button" className="absolute inset-0 bg-[var(--overlay)]" aria-label={dict.close} onClick={() => setOpen(false)} />
          <div
            ref={drawerRef}
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-nav-title"
            className="absolute inset-y-0 left-0 flex w-[min(21rem,90vw)] flex-col border-r border-line bg-paper shadow-[12px_0_36px_rgb(12_14_18_/_18%)]"
          >
            <div className="flex min-h-16 items-center justify-between border-b border-line px-4">
              <div>
                <p id="mobile-nav-title" className="text-[1.35rem] font-bold leading-none text-ink">{BRAND_NE}</p>
                <p className="mt-1 text-[0.67rem] font-semibold tracking-[0.1em] text-stone">{BRAND_EN.toUpperCase()}</p>
              </div>
              <button
                ref={drawerCloseRef}
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-ink hover:bg-paper-elevated"
                aria-label={dict.close}
                onClick={() => setOpen(false)}
              >
                <X size={23} weight="bold" aria-hidden="true" />
              </button>
            </div>

            <div className="border-b border-line bg-paper-elevated px-4 py-2.5">
              <ChromeDate locale={locale} className="text-xs font-medium text-stone" />
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              <nav aria-label={dict.categories}>
                <Link href={`/${locale}`} className={drawerLinkClass(isHome)} aria-current={isHome ? 'page' : undefined} onClick={() => setOpen(false)}>
                  {dict.home}
                </Link>
                <Link
                  href={`/${locale}/latest`}
                  className={drawerLinkClass(isActive(`/${locale}/latest`))}
                  aria-current={isActive(`/${locale}/latest`) ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {dict.latest}
                </Link>
                {sections.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link key={item.href} href={item.href} className={drawerLinkClass(active)} aria-current={active ? 'page' : undefined} onClick={() => setOpen(false)}>
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              <div className="my-3 border-t border-line" />

              <nav aria-label={dict.utilities}>
                <p className="px-3 pb-1.5 text-xs font-bold text-stone">{dict.utilities}</p>
                <Link href={calendarUrl} className={drawerLinkClass()} onClick={() => setOpen(false)}>{dict.nepaliPatro}</Link>
                <Link href={`/${locale}/utilities/preeti-unicode`} className={drawerLinkClass()} onClick={() => setOpen(false)}>{dict.preetiTranslator}</Link>
                <Link href={`/${locale}/utilities`} className={drawerLinkClass(isActive(`/${locale}/utilities`))} onClick={() => setOpen(false)}>{dict.utilities}</Link>
              </nav>
            </div>

            <div className="border-t border-line bg-paper-elevated px-3 py-3">
              <div className="grid grid-cols-2 gap-1">
                <Link href={`/${locale}/authors`} className="flex min-h-11 items-center px-3 text-sm font-medium text-ink hover:text-accent" onClick={() => setOpen(false)}>{dict.authors}</Link>
                <Link href={`/${locale}/trust`} className="flex min-h-11 items-center px-3 text-sm font-medium text-ink hover:text-accent" onClick={() => setOpen(false)}>{dict.trust}</Link>
                <Link href={`/${locale}/login`} className="flex min-h-11 items-center px-3 text-sm font-medium text-ink hover:text-accent" onClick={() => setOpen(false)}>{dict.login}</Link>
                <Link href={otherLocaleHref} hrefLang={otherLocale} className="flex min-h-11 items-center px-3 text-sm font-semibold text-ink hover:text-accent" onClick={() => setOpen(false)}>{dict.language}</Link>
                <div className="col-span-2 flex min-h-11 items-center px-3 text-sm"><ThemeToggle dict={dict} /></div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export function SiteFooter({
  locale,
  dict,
  categories = [],
}: {
  locale: AppLocale
  dict: Dictionary
  categories?: Category[]
}) {
  const calendarUrl = patroHref(locale)
  return (
    <footer className="mt-10 border-t-2 border-line bg-paper-elevated">
      <div className="mx-auto max-w-[1240px] px-4 py-10 md:px-6">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="text-2xl font-bold tracking-[-0.02em] text-ink">{BRAND_NE}</p>
            <p className="mt-0.5 text-sm font-semibold text-ink/80">{BRAND_EN}</p>
            <p className="mt-2 max-w-[36ch] text-sm leading-relaxed text-stone">{dict.tagline}</p>
          </div>
          <nav className="md:col-span-4" aria-label={dict.categories}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink">{dict.categories}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-ink">
              {categories.map((category) => (
                <Link key={category.id} href={`/${locale}/${category.slug}`} className="hover:text-accent">
                  {locale === 'en' ? category.nameEn : category.nameNe}
                </Link>
              ))}
            </div>
          </nav>
          <nav className="md:col-span-4" aria-label={dict.utilities}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink">{dict.utilities}</p>
            <div className="flex flex-col gap-2 text-sm font-medium">
              <Link href={calendarUrl} className="text-ink hover:text-accent">{dict.nepaliPatro}</Link>
              <Link href={`/${locale}/utilities/preeti-unicode`} className="text-ink hover:text-accent">{dict.preetiTranslator}</Link>
              <Link href={`/${locale}/about`} className="text-ink hover:text-accent">{dict.about}</Link>
              <Link href={`/${locale}/authors`} className="text-ink hover:text-accent">{dict.authors}</Link>
              <Link href={`/${locale}/trust`} className="text-ink hover:text-accent">{dict.trust}</Link>
              <Link href={`/${locale}/account`} className="text-ink hover:text-accent">{dict.account}</Link>
              <Link href={`/${locale}/login`} className="text-ink hover:text-accent">{dict.login}</Link>
              <Link href={locale === 'en' ? '/en/rss.xml' : '/rss.xml'} className="text-ink hover:text-accent">RSS</Link>
            </div>
          </nav>
        </div>
        <div className="mt-8 border-t border-line pt-5 text-xs font-medium text-stone">
          <p suppressHydrationWarning>© {new Date().getFullYear()} {BRAND_EN} · {BRAND_NE}</p>
        </div>
      </div>
    </footer>
  )
}
