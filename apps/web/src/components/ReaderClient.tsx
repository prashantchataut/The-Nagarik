'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  BookmarkSimple,
  Check,
  Copy,
  FacebookLogo,
  LinkSimple,
  Printer,
  TextAa,
  WhatsappLogo,
  XLogo,
} from '@phosphor-icons/react'
import type { Dictionary } from '@/lib/i18n'
import { FocusModeToggle } from '@/components/reader/FocusMode'
import { ArticleNarrator } from '@/components/reader/Narrator'


const TYPE_SCALE_KEY = 'tn_article_type_scale_v1'
const BOOKMARKS_KEY = 'tn_saved_stories_v1'

export function SocialShareButtons({
  dict,
  title,
  url,
}: {
  dict: Dictionary
  title?: string
  url?: string
}) {
  const [copied, setCopied] = useState(false)
  const [currentUrl, setCurrentUrl] = useState(url ?? '')

  useEffect(() => {
    if (!url && typeof window !== 'undefined') {
      setCurrentUrl(window.location.href)
    }
  }, [url])

  const encodedUrl = encodeURIComponent(currentUrl)
  const encodedTitle = encodeURIComponent(
    title ?? (typeof document !== 'undefined' ? document.title : 'The Nagarik'),
  )

  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
  const xShareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
  const waShareUrl = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`
  const viberShareUrl = `viber://forward?text=${encodedTitle}%20${encodedUrl}`

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(currentUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ignore clipboard permission errors
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Social Share">
      <a
        href={fbShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-paper text-[#1877f2] hover:border-[#1877f2] hover:bg-[#1877f2]/10 transition-colors"
        aria-label={dict.shareOnFacebook}
        title={dict.shareOnFacebook}
      >
        <FacebookLogo size={18} weight="fill" />
      </a>

      <a
        href={xShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-paper text-ink hover:border-ink hover:bg-ink/10 transition-colors"
        aria-label={dict.shareOnX}
        title={dict.shareOnX}
      >
        <XLogo size={16} weight="bold" />
      </a>

      <a
        href={waShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-paper text-[#25d366] hover:border-[#25d366] hover:bg-[#25d366]/10 transition-colors"
        aria-label={dict.shareOnWhatsapp}
        title={dict.shareOnWhatsapp}
      >
        <WhatsappLogo size={18} weight="fill" />
      </a>

      <a
        href={viberShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-paper text-[#7360f2] hover:border-[#7360f2] hover:bg-[#7360f2]/10 transition-colors"
        aria-label={dict.shareOnViber}
        title={dict.shareOnViber}
      >
        <span className="text-xs font-black">V</span>
      </a>

      <button
        type="button"
        onClick={() => void copyToClipboard()}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-paper px-3.5 text-xs font-semibold text-ink hover:border-accent hover:text-accent transition-colors"
        aria-label={dict.copyLink}
      >
        {copied ? (
          <>
            <Check size={14} weight="bold" className="text-success" />
            <span className="text-success">{dict.copied}</span>
          </>
        ) : (
          <>
            <Copy size={14} weight="bold" />
            <span>{dict.share}</span>
          </>
        )}
      </button>
    </div>
  )
}


export function TextSizeControls({ dict }: { dict: Dictionary }) {
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(TYPE_SCALE_KEY) as 'sm' | 'md' | 'lg' | null
      if (saved === 'sm' || saved === 'md' || saved === 'lg') setSize(saved)
    } catch {
      // Device preference optional
    }
  }, [])

  useEffect(() => {
    const map = { sm: '0.95', md: '1', lg: '1.14' } as const
    document.documentElement.style.setProperty('--article-type-scale', map[size])
    try {
      localStorage.setItem(TYPE_SCALE_KEY, size)
    } catch {
      // Device preference optional
    }
  }, [size])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-paper px-3.5 text-xs font-semibold hover:border-accent hover:text-accent transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <TextAa size={16} weight="bold" aria-hidden="true" />
        <span className="hidden sm:inline">{dict.textSize}</span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={dict.textSize}
          className="absolute right-0 top-[calc(100%+0.35rem)] z-50 min-w-36 rounded-[var(--radius-control)] border border-line bg-paper-elevated p-1 shadow-[0_12px_28px_rgb(16_32_29_/_0.15)]"
        >
          {([
            ['sm', dict.textSmall],
            ['md', dict.textMedium],
            ['lg', dict.textLarge],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={size === value}
              className={`flex min-h-11 w-full items-center justify-between rounded-[var(--radius-sm)] px-3 text-xs font-semibold ${
                size === value ? 'bg-accent-muted text-accent' : 'hover:bg-paper text-ink'
              }`}
              onClick={() => {
                setSize(value)
                setOpen(false)
              }}
            >
              <span>{label}</span>
              {size === value ? <Check size={14} weight="bold" aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function BookmarkButton({
  storyId,
  title,
  categorySlug,
  slug,
}: {
  storyId: string
  title: string
  categorySlug: string
  slug: string
}) {
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const items = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]')
      if (Array.isArray(items)) {
        setSaved(items.some((i: { storyId: string }) => i.storyId === storyId))
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [storyId])

  function toggleBookmark() {
    try {
      let items = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]')
      if (!Array.isArray(items)) items = []

      if (saved) {
        items = items.filter((i: { storyId: string }) => i.storyId !== storyId)
        setSaved(false)
        notifyServiceWorker('UNCACHE_STORY')
      } else {
        items.unshift({
          storyId,
          title,
          categorySlug,
          slug,
          savedAt: new Date().toISOString(),
        })
        setSaved(true)
        notifyServiceWorker('CACHE_STORY')
      }
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(items.slice(0, 50)))
    } catch {
      // Ignore localStorage errors
    }
  }

  function notifyServiceWorker(type: 'CACHE_STORY' | 'UNCACHE_STORY') {
    // Offline mode: ask the service worker to pin or unpin this story.
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then((registration) => {
            registration.active?.postMessage({ type, url: window.location.pathname })
          })
          .catch(() => {})
      }
    } catch {
      // Offline pinning is best-effort
    }
  }

  return (
    <button
      type="button"
      onClick={toggleBookmark}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-colors ${
        saved
          ? 'bg-accent-muted border-accent text-accent'
          : 'border-line bg-paper text-ink hover:border-accent hover:text-accent'
      }`}
      aria-pressed={saved}
      aria-label={saved ? 'कथा सुरक्षित भयो' : 'कथा सुरक्षित गर्नुहोस्'}
      title={saved ? 'कथा सुरक्षित भयो' : 'कथा सुरक्षित गर्नुहोस्'}
    >
      <BookmarkSimple size={15} weight={saved ? 'fill' : 'bold'} />
      <span className="hidden sm:inline">{saved ? 'सुरक्षित' : 'सेभ'}</span>
    </button>
  )
}

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined') window.print()
      }}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-paper px-3.5 text-xs font-semibold text-ink hover:border-accent hover:text-accent transition-colors"
      aria-label="प्रिन्ट गर्नुहोस्"
      title="प्रिन्ट गर्नुहोस्"
    >
      <Printer size={15} weight="bold" />
      <span className="hidden lg:inline">प्रिन्ट</span>
    </button>
  )
}


export function ArticleToolbar({
  dict,
  locale = 'ne',
  bilingualHref,
  bilingualLabel,
  title,
  storyId,
  categorySlug,
  slug,
  deck,
}: {
  dict: Dictionary
  locale?: 'ne' | 'en'
  bilingualHref?: string
  bilingualLabel?: string
  title?: string
  storyId?: string
  categorySlug?: string
  slug?: string
  deck?: string
}) {
  return (
    <div
      data-article-toolbar
      className="sticky top-11 z-30 border-y border-line bg-paper/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-[840px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:gap-4 md:px-6">
        {/* Share group */}
        <div className="flex items-center gap-3" data-focus-hide>
          <SocialShareButtons dict={dict} title={title} />
        </div>

        {/* Reading tools group */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2" data-focus-hide>
            {storyId && title && categorySlug && slug ? (
              <BookmarkButton
                storyId={storyId}
                title={title}
                categorySlug={categorySlug}
                slug={slug}
              />
            ) : null}
            <PrintButton />
          </div>

          <span className="hidden h-6 w-px bg-line sm:block" aria-hidden="true" data-focus-hide />

          <div className="flex items-center gap-2">
            <ArticleNarrator locale={locale} title={title} deck={deck} />
            <FocusModeToggle locale={locale} />
          </div>

          <span className="hidden h-6 w-px bg-line sm:block" aria-hidden="true" />

          <div className="flex items-center gap-2">
            <TextSizeControls dict={dict} />
            {bilingualHref && bilingualLabel ? (
              <span data-focus-hide>
                <Link
                  href={bilingualHref}
                  className="inline-flex min-h-11 items-center gap-1 rounded-full border border-line bg-paper px-3.5 text-xs font-bold text-accent hover:border-accent"
                >
                  <LinkSimple size={13} weight="bold" aria-hidden="true" />
                  <span>{bilingualLabel}</span>
                </Link>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}


export function ReadingProgress() {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-1 origin-left accent-solid"
      style={{ transform: 'scaleX(var(--read-progress, 0))' }}
      aria-hidden="true"
    />
  )
}

export function ArticleEngagement({
  storyId,
  categorySlug,
  slug,
  title,
}: {
  storyId: string
  categorySlug: string
  slug: string
  title: string
}) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const KEY = 'tn_reading_progress_v1'
    function saveProgress(p: number) {
      try {
        let list: Array<{
          storyId: string
          progress: number
          updatedAt: string
          categorySlug: string
          slug: string
          title: string
        }> = []
        try {
          list = JSON.parse(localStorage.getItem(KEY) || '[]')
        } catch {
          list = []
        }
        if (!Array.isArray(list)) list = []
        list = list.filter((x) => x && x.storyId !== storyId)
        list.unshift({
          storyId,
          progress: Math.max(0, Math.min(1, p)),
          updatedAt: new Date().toISOString(),
          categorySlug,
          slug,
          title,
        })
        localStorage.setItem(KEY, JSON.stringify(list.slice(0, 40)))
      } catch {
        // Ignore quota/private browsing errors
      }
    }

    let ticking = false
    let lastSaved = 0
    function updateProgress() {
      ticking = false
      const el = document.documentElement
      const max = el.scrollHeight - el.clientHeight
      const p = max > 0 ? el.scrollTop / max : 0
      document.documentElement.style.setProperty('--read-progress', String(p))
      const now = Date.now()
      if (now - lastSaved > 1500) {
        saveProgress(p)
        lastSaved = now
      }
    }

    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(updateProgress)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    updateProgress()

    function onPageHide() {
      const el = document.documentElement
      const max = el.scrollHeight - el.clientHeight
      saveProgress(max > 0 ? el.scrollTop / max : 0)
    }
    window.addEventListener('pagehide', onPageHide, { once: true })

    const consentCookie = document.cookie
      .split('; ')
      .find((r) => r.startsWith('tn_consent_analytics='))
    if (!consentCookie || consentCookie.split('=')[1] !== '1') {
      return () => {
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('pagehide', onPageHide)
      }
    }

    const start = Date.now()
    fetch('/api/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'impression', storyId, consent: true }),
    }).catch(() => {})

    function sendDwell() {
      const dwellMs = Date.now() - start
      navigator.sendBeacon(
        '/api/events',
        new Blob(
          [JSON.stringify({ type: 'dwell', storyId, dwellMs, consent: true })],
          { type: 'application/json' },
        ),
      )
    }
    window.addEventListener('pagehide', sendDwell, { once: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('pagehide', sendDwell)
    }
  }, [storyId, categorySlug, slug, title])

  return null
}

export function ConsentBanner({ dict }: { dict: Dictionary }) {
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    const existing = document.cookie.split('; ').find((r) => r.startsWith('tn_consent_analytics='))
    setHidden(Boolean(existing))
  }, [])

  if (hidden) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper-elevated p-4 shadow-[0_-12px_40px_rgba(16,32,29,0.12)]"
      data-focus-hide
    >
      <div className="mx-auto flex max-w-[1280px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="max-w-2xl text-xs sm:text-sm text-stone">{dict.consentBody}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex min-h-9 items-center rounded-[var(--radius-control)] border border-line px-3 text-xs font-bold active:scale-[0.98]"
            onClick={() => {
              document.cookie = 'tn_consent_analytics=0; path=/; max-age=31536000; samesite=lax'
              setHidden(true)
            }}
          >
            {dict.consentReject}
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center rounded-[var(--radius-control)] accent-solid px-3 text-xs font-bold active:scale-[0.98]"
            onClick={() => {
              document.cookie = 'tn_consent_analytics=1; path=/; max-age=31536000; samesite=lax'
              setHidden(true)
            }}
          >
            {dict.consentAccept}
          </button>
        </div>
      </div>
    </div>
  )
}
