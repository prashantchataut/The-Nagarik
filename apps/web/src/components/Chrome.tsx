'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  CalendarBlank,
  House,
  Lightning,
  List,
  MagnifyingGlass,
  Moon,
  ShieldCheck,
  Translate,
  User,
  UserCircle,
  X,
} from '@phosphor-icons/react'
import type { AppLocale, Dictionary } from '@/lib/i18n'
import type { Category } from '@thenagarik/content'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ChromeDate } from '@/components/ChromeDate'
import { CategoryIcon } from '@/components/CategoryIcon'
import { NewsletterCard } from '@/components/reader/NewsletterCard'
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
    slug: category.slug,
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

    const menuButton = menuButtonRef.current
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      menuButton?.focus()
    }
  }, [open])

  const drawerLinkClass = (active = false) =>
    `flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-[0.98rem] font-medium transition-colors ${
      active
        ? 'bg-accent-muted font-semibold text-accent'
        : 'text-ink hover:bg-paper-elevated hover:text-ink'
    }`

  const accountHref = `/${locale}/account`
  const accountActive = isActive(accountHref)

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden bg-paper md:block" data-focus-hide>

        {/* Top utility bar */}
        <div className="border-b border-line bg-paper-elevated text-[0.78rem] text-stone">
          <div className="mx-auto flex min-h-9 max-w-[1280px] items-center justify-between gap-6 px-6">
            <div className="flex items-center gap-3">
              <ChromeDate locale={locale} className="font-semibold text-ink" />
              <span className="h-3 w-px bg-line" aria-hidden="true" />
              <Link href={calendarUrl} className="inline-flex items-center gap-1.5 font-medium hover:text-accent">
                <CalendarBlank size={13} weight="bold" aria-hidden="true" />
                <span>{dict.nepaliPatro}</span>
              </Link>
            </div>

            <nav className="flex items-center gap-3.5" aria-label={dict.utilities}>
              <Link href={`/${locale}/utilities/preeti-unicode`} className="inline-flex items-center gap-1 hover:text-accent">
                <Translate size={13} weight="bold" aria-hidden="true" />
                <span>{dict.preetiTranslator}</span>
              </Link>
              <Link href={`/${locale}/trust`} className="inline-flex items-center gap-1 hover:text-accent">
                <ShieldCheck size={13} weight="bold" aria-hidden="true" />
                <span>{dict.trust}</span>
              </Link>
              <Link
                href={accountHref}
                aria-current={accountActive ? 'page' : undefined}
                className={`inline-flex min-h-7 items-center gap-1.5 rounded-[var(--radius-control)] px-2 font-bold transition-colors ${
                  accountActive
                    ? 'bg-accent-muted text-accent'
                    : 'text-ink hover:bg-accent-muted hover:text-accent'
                }`}
              >
                <UserCircle size={15} weight="bold" aria-hidden="true" />
                <span>{dict.account}</span>
              </Link>
              <Link href={`/${locale}/login`} className="inline-flex items-center gap-1 text-ink hover:text-accent">
                <User size={13} weight="bold" aria-hidden="true" />
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
        </div>

        {/* Brand Masthead */}
        <div className="border-b border-line bg-paper">
          <div className="mx-auto grid min-h-[82px] max-w-[1280px] grid-cols-[minmax(12rem,1fr)_auto_minmax(12rem,1fr)] items-center gap-6 px-6 py-2">
            <p className="max-w-[24ch] text-xs font-medium leading-relaxed text-stone">
              {dict.tagline}
            </p>

            <Link
              href={`/${locale}`}
              className="justify-self-center text-center group"
              aria-current={isHome ? 'page' : undefined}
            >
              <span className="block text-[2.5rem] font-black leading-[0.9] tracking-[-0.035em] text-ink lg:text-[2.8rem] group-hover:text-accent transition-colors">
                {BRAND_NE}
              </span>
              <span className="mt-1 block text-[0.74rem] font-bold tracking-[0.14em] text-stone">
                {BRAND_EN.toUpperCase()}
              </span>
            </Link>

            <form
              action={`/${locale}/search`}
              method="get"
              className="w-full max-w-[19rem] justify-self-end"
              role="search"
            >
              <label className="sr-only" htmlFor="masthead-search">
                {dict.search}
              </label>
              <div className="relative flex">
                <MagnifyingGlass
                  size={16}
                  weight="bold"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone"
                  aria-hidden="true"
                />
                <input
                  id="masthead-search"
                  name="q"
                  type="search"
                  placeholder={dict.searchPlaceholder}
                  className="min-h-10 w-full rounded-l-[var(--radius-control)] border border-r-0 border-line bg-field pl-9 pr-3 text-sm text-ink placeholder:text-stone/70 focus:border-accent focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex min-h-10 shrink-0 items-center rounded-r-[var(--radius-control)] accent-solid px-3.5 text-xs font-bold transition-opacity hover:opacity-90"
                  aria-label={dict.search}
                >
                  {dict.search}
                </button>
              </div>
            </form>

          </div>
        </div>

        {/* Persistent Category Navigation Bar */}
        <nav
          className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur shadow-[0_2px_8px_rgb(16_32_29_/_0.04)]"
          aria-label={dict.categories}
        >
          <div className="nav-scroller mx-auto flex min-h-[46px] max-w-[1280px] items-stretch overflow-x-auto px-4 lg:px-6">
            <Link
              href={`/${locale}`}
              className="site-nav-link"
              data-active={isHome}
              aria-current={isHome ? 'page' : undefined}
            >
              <CategoryIcon slug="home" size={16} weight="bold" />
              <span>{dict.home}</span>
            </Link>

            <Link
              href={`/${locale}/latest`}
              className="site-nav-link"
              data-active={isActive(`/${locale}/latest`)}
              aria-current={isActive(`/${locale}/latest`) ? 'page' : undefined}
            >
              <CategoryIcon slug="latest" size={16} weight="bold" />
              <span>{dict.latest}</span>
            </Link>

            {sections.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="site-nav-link"
                  data-active={active}
                  aria-current={active ? 'page' : undefined}
                >
                  <CategoryIcon slug={item.slug} size={16} weight="bold" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </header>

      {/* Mobile Top Header */}
      <header
        className="sticky top-0 z-40 border-b border-line bg-paper shadow-[0_2px_8px_rgb(16_32_29_/_0.06)] md:hidden"
        data-focus-hide
      >
        <div className="grid h-14 grid-cols-[3rem_1fr_3rem] items-center px-2">
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
            className="min-w-0 justify-self-center text-center"
            aria-current={isHome ? 'page' : undefined}
          >
            <span className="block text-[1.45rem] font-black leading-none tracking-[-0.03em] text-ink">
              {BRAND_NE}
            </span>
            <span className="mt-0.5 block text-[0.6rem] font-bold tracking-[0.12em] text-stone">
              {BRAND_EN.toUpperCase()}
            </span>
          </Link>

          <Link
            href={`/${locale}/search`}
            className="inline-flex h-11 w-11 items-center justify-center justify-self-end rounded-[var(--radius-control)] text-ink hover:bg-paper-elevated"
            aria-label={dict.search}
          >
            <MagnifyingGlass size={22} weight="bold" aria-hidden="true" />
          </Link>
        </div>

        {/* Mobile Horizontal Category Scroller */}
        <nav className="border-t border-line bg-paper-elevated" aria-label={dict.categories}>
          <div className="nav-scroller flex min-h-10 items-stretch overflow-x-auto px-2">
            <Link
              href={`/${locale}`}
              className="mobile-section-link"
              data-active={isHome}
              aria-current={isHome ? 'page' : undefined}
            >
              <span>{dict.home}</span>
            </Link>
            <Link
              href={`/${locale}/latest`}
              className="mobile-section-link"
              data-active={isActive(`/${locale}/latest`)}
              aria-current={isActive(`/${locale}/latest`) ? 'page' : undefined}
            >
              <span>{dict.latest}</span>
            </Link>
            {sections.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="mobile-section-link"
                  data-active={active}
                  aria-current={active ? 'page' : undefined}
                >
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </header>

      {/* Trending Hashtag Strip */}
      {trendingTags.length ? (
        <aside className="hidden border-b border-line bg-paper-elevated md:block" data-focus-hide>
          <div className="nav-scroller mx-auto flex min-h-8 max-w-[1280px] items-center gap-3 overflow-x-auto px-6 py-1 text-xs">
            <span className="shrink-0 font-bold text-accent">{dict.trending}:</span>
            {trendingTags.map((tag) => (
              <Link
                key={tag}
                href={`/${locale}/search?q=${encodeURIComponent(tag)}`}
                className="shrink-0 font-medium text-stone hover:text-accent hover:underline"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </aside>
      ) : null}

      {/* Mobile Drawer */}
      {open ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-sm"
            aria-label={dict.close}
            onClick={() => setOpen(false)}
          />
          <div
            ref={drawerRef}
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-nav-title"
            className="absolute inset-y-0 left-0 flex w-[min(22rem,90vw)] flex-col border-r border-line bg-paper shadow-[12px_0_36px_rgb(16_32_29_/_0.2)]"
          >
            <div className="flex min-h-16 items-center justify-between border-b border-line px-4">
              <div>
                <p id="mobile-nav-title" className="text-[1.4rem] font-black leading-none text-ink">
                  {BRAND_NE}
                </p>
                <p className="mt-1 text-[0.66rem] font-bold tracking-[0.1em] text-stone">
                  {BRAND_EN.toUpperCase()}
                </p>
              </div>
              <button
                ref={drawerCloseRef}
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-ink hover:bg-paper-elevated"
                aria-label={dict.close}
                onClick={() => setOpen(false)}
              >
                <X size={22} weight="bold" aria-hidden="true" />
              </button>
            </div>

            <div className="border-b border-line bg-paper-elevated px-4 py-2.5">
              <ChromeDate locale={locale} className="text-xs font-semibold text-stone" />
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              <nav aria-label={dict.categories} className="space-y-0.5">
                <Link
                  href={`/${locale}`}
                  className={drawerLinkClass(isHome)}
                  aria-current={isHome ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  <CategoryIcon slug="home" size={18} weight="bold" />
                  <span>{dict.home}</span>
                </Link>
                <Link
                  href={`/${locale}/latest`}
                  className={drawerLinkClass(isActive(`/${locale}/latest`))}
                  aria-current={isActive(`/${locale}/latest`) ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  <CategoryIcon slug="latest" size={18} weight="bold" />
                  <span>{dict.latest}</span>
                </Link>
                {sections.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={drawerLinkClass(active)}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setOpen(false)}
                    >
                      <CategoryIcon slug={item.slug} size={18} weight="bold" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>

              <div className="my-3 border-t border-line" />

              <nav aria-label={dict.utilities} className="space-y-0.5">
                <p className="px-3 pb-1 text-xs font-bold uppercase tracking-wider text-stone">
                  {dict.utilities}
                </p>
                <Link
                  href={accountHref}
                  className={drawerLinkClass(accountActive)}
                  aria-current={accountActive ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  <UserCircle size={18} weight="bold" />
                  <span>{dict.account}</span>
                </Link>
                <Link href={calendarUrl} className={drawerLinkClass()} onClick={() => setOpen(false)}>
                  <CalendarBlank size={18} weight="bold" />
                  <span>{dict.nepaliPatro}</span>
                </Link>
                <Link
                  href={`/${locale}/utilities/preeti-unicode`}
                  className={drawerLinkClass()}
                  onClick={() => setOpen(false)}
                >
                  <Translate size={18} weight="bold" />
                  <span>{dict.preetiTranslator}</span>
                </Link>
                <Link
                  href={`/${locale}/trust`}
                  className={drawerLinkClass(isActive(`/${locale}/trust`))}
                  onClick={() => setOpen(false)}
                >
                  <ShieldCheck size={18} weight="bold" />
                  <span>{dict.trust}</span>
                </Link>
              </nav>
            </div>

            <div className="border-t border-line bg-paper-elevated px-3 py-3">
              <div className="grid grid-cols-2 gap-1.5">
                <Link
                  href={`/${locale}/authors`}
                  className="flex min-h-10 items-center px-3 text-xs font-semibold text-ink hover:text-accent"
                  onClick={() => setOpen(false)}
                >
                  {dict.authors}
                </Link>
                <Link
                  href={`/${locale}/login`}
                  className="flex min-h-10 items-center px-3 text-xs font-semibold text-ink hover:text-accent"
                  onClick={() => setOpen(false)}
                >
                  {dict.login}
                </Link>
                <Link
                  href={otherLocaleHref}
                  hrefLang={otherLocale}
                  className="flex min-h-10 items-center px-3 text-xs font-bold text-accent hover:underline"
                  onClick={() => setOpen(false)}
                >
                  {dict.language}
                </Link>
                <div className="flex min-h-10 items-center px-3">
                  <ThemeToggle dict={dict} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Fixed Mobile Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex h-14 items-center justify-around border-t border-line bg-paper/95 backdrop-blur px-2 shadow-[0_-2px_10px_rgb(16_32_29_/_0.06)] md:hidden"
        aria-label="Mobile quick actions"
        data-focus-hide
      >
        <Link
          href={`/${locale}`}
          className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-[0.68rem] font-bold ${
            isHome ? 'text-accent' : 'text-stone hover:text-ink'
          }`}
          aria-current={isHome ? 'page' : undefined}
        >
          <House size={20} weight={isHome ? 'fill' : 'bold'} />
          <span>{dict.home}</span>
        </Link>

        <Link
          href={`/${locale}/latest`}
          className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-[0.68rem] font-bold ${
            isActive(`/${locale}/latest`) ? 'text-accent' : 'text-stone hover:text-ink'
          }`}
          aria-current={isActive(`/${locale}/latest`) ? 'page' : undefined}
        >
          <Lightning size={20} weight={isActive(`/${locale}/latest`) ? 'fill' : 'bold'} />
          <span>{dict.latest}</span>
        </Link>

        <Link
          href={`/${locale}/search`}
          className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-[0.68rem] font-bold ${
            isActive(`/${locale}/search`) ? 'text-accent' : 'text-stone hover:text-ink'
          }`}
          aria-current={isActive(`/${locale}/search`) ? 'page' : undefined}
        >
          <MagnifyingGlass size={20} weight={isActive(`/${locale}/search`) ? 'fill' : 'bold'} />
          <span>{dict.search}</span>
        </Link>

        <Link
          href={calendarUrl}
          className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-[0.68rem] font-bold text-stone hover:text-ink"
        >
          <CalendarBlank size={20} weight="bold" />
          <span>{dict.patroShort}</span>
        </Link>

        <Link
          href={accountHref}
          className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-[0.68rem] font-bold ${
            accountActive ? 'text-accent' : 'text-stone hover:text-ink'
          }`}
          aria-current={accountActive ? 'page' : undefined}
        >
          <UserCircle size={20} weight={accountActive ? 'fill' : 'bold'} />
          <span>{dict.account}</span>
        </Link>
      </nav>
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
    <footer className="mt-12 border-t-2 border-line bg-paper-elevated pb-16 md:pb-0" data-focus-hide>
      <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-12">
          {/* Brand Column */}
          <div className="md:col-span-4">
            <Link href={`/${locale}`} className="inline-block">
              <span className="block text-2xl font-black tracking-[-0.03em] text-ink">
                {BRAND_NE}
              </span>
              <span className="mt-0.5 block text-xs font-bold tracking-[0.12em] text-stone">
                {BRAND_EN.toUpperCase()}
              </span>
            </Link>
            <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-stone">
              {dict.tagline}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-accent-muted px-2.5 py-1 text-accent">
                {locale === 'ne' ? 'नागरिक पत्रकारिता' : 'Civic Journalism'}
              </span>
              <span className="rounded-full bg-paper-strong px-2.5 py-1 text-stone">
                {locale === 'ne' ? 'सातै प्रदेश' : '7 Provinces'}
              </span>
            </div>
            <div className="mt-6">
              <NewsletterCard locale={locale} variant="footer" />
            </div>
          </div>

          {/* Categories Column */}
          <nav className="md:col-span-5" aria-label={dict.categories}>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink">
              {dict.categories}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm font-medium">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/${locale}/${category.slug}`}
                  className="inline-flex items-center gap-2 text-ink hover:text-accent"
                >
                  <CategoryIcon slug={category.slug} size={15} weight="bold" />
                  <span>{locale === 'en' ? category.nameEn : category.nameNe}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* Utilities & Links Column */}
          <nav className="md:col-span-3" aria-label={dict.utilities}>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink">
              {dict.utilities}
            </p>
            <div className="flex flex-col gap-2 text-sm font-medium">
              <Link href={calendarUrl} className="text-ink hover:text-accent">
                {dict.nepaliPatro}
              </Link>
              <Link href={`/${locale}/utilities/preeti-unicode`} className="text-ink hover:text-accent">
                {dict.preetiTranslator}
              </Link>
              <Link href={`/${locale}/about`} className="text-ink hover:text-accent">
                {dict.about}
              </Link>
              <Link href={`/${locale}/authors`} className="text-ink hover:text-accent">
                {dict.authors}
              </Link>
              <Link href={`/${locale}/trust`} className="text-ink hover:text-accent">
                {dict.trust}
              </Link>
              <Link href={`/${locale}/account`} className="text-ink hover:text-accent">
                {dict.account}
              </Link>
              <Link href={`/${locale}/login`} className="text-ink hover:text-accent">
                {dict.login}
              </Link>
              <Link href={`/${locale}/register`} className="text-ink hover:text-accent">
                {locale === 'ne' ? 'खाता खोल्नुहोस्' : 'Create account'}
              </Link>
              <Link href={locale === 'en' ? '/en/rss.xml' : '/rss.xml'} className="text-ink hover:text-accent">
                RSS
              </Link>
            </div>
          </nav>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-xs font-medium text-stone">
          <p suppressHydrationWarning>
            © {new Date().getFullYear()} {BRAND_EN} - {BRAND_NE}. सर्वाधिकार सुरक्षित।
          </p>
          <p className="text-stone">
            {locale === 'ne'
              ? 'निष्पक्ष, विश्वसनीय र नागरिक-केन्द्रित समाचार'
              : 'Independent, verified civic journalism for Nepal'}
          </p>
        </div>
      </div>
    </footer>
  )
}
