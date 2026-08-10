'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Check,
  Copy,
  FacebookLogo,
  LinkSimple,
  ShareNetwork,
  TextAa,
  WhatsappLogo,
  XLogo,
} from '@phosphor-icons/react'
import type { Dictionary } from '@/lib/i18n'

const TYPE_SCALE_KEY = 'tn_article_type_scale_v1'

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
  const encodedTitle = encodeURIComponent(title ?? (typeof document !== 'undefined' ? document.title : 'The Nagarik'))

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
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Social Share">
      <a
        href={fbShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-line bg-paper text-[#1877f2] hover:border-[#1877f2] hover:bg-[#1877f2]/10 transition-colors"
        aria-label={dict.shareOnFacebook}
        title={dict.shareOnFacebook}
      >
        <FacebookLogo size={18} weight="fill" />
      </a>

      <a
        href={xShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-line bg-paper text-ink hover:border-ink hover:bg-ink/10 transition-colors"
        aria-label={dict.shareOnX}
        title={dict.shareOnX}
      >
        <XLogo size={17} weight="bold" />
      </a>

      <a
        href={waShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-line bg-paper text-[#25d366] hover:border-[#25d366] hover:bg-[#25d366]/10 transition-colors"
        aria-label={dict.shareOnWhatsapp}
        title={dict.shareOnWhatsapp}
      >
        <WhatsappLogo size={18} weight="fill" />
      </a>

      <a
        href={viberShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-line bg-paper text-[#7360f2] hover:border-[#7360f2] hover:bg-[#7360f2]/10 transition-colors"
        aria-label={dict.shareOnViber}
        title={dict.shareOnViber}
      >
        <span className="text-xs font-black">V</span>
      </a>

      <button
        type="button"
        onClick={() => void copyToClipboard()}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-control)] border border-line bg-paper px-2.5 text-xs font-semibold text-ink hover:border-accent hover:text-accent transition-colors"
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
      // Device preference is optional.
    }
  }, [])

  useEffect(() => {
    const map = { sm: '0.95', md: '1', lg: '1.12' } as const
    document.documentElement.style.setProperty('--article-type-scale', map[size])
    try {
      localStorage.setItem(TYPE_SCALE_KEY, size)
    } catch {
      // Device preference is optional.
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
        className="inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-control)] border border-line bg-paper px-2.5 text-xs font-semibold hover:border-accent hover:text-accent transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <TextAa size={16} weight="bold" aria-hidden="true" />
        <span>{dict.textSize}</span>
      </button>
      {open ? (
        <div
          role="menu"
          aria-label={dict.textSize}
          className="absolute left-0 top-[calc(100%+0.35rem)] z-50 min-w-36 rounded-[var(--radius-control)] border border-line bg-paper-elevated p-1 shadow-[0_12px_28px_rgb(16_32_29_/_0.15)]"
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
              className={`flex min-h-9 w-full items-center justify-between rounded-[var(--radius-sm)] px-3 text-xs font-semibold ${
                size === value
                  ? 'bg-accent-muted text-accent'
                  : 'hover:bg-paper text-ink'
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

export function ArticleToolbar({
  dict,
  bilingualHref,
  bilingualLabel,
  title,
}: {
  dict: Dictionary
  bilingualHref?: string
  bilingualLabel?: string
  title?: string
}) {
  return (
    <div className="sticky top-11 z-30 border-y border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex min-h-12 max-w-[840px] flex-wrap items-center justify-between gap-3 px-4 md:px-6">
        <SocialShareButtons dict={dict} title={title} />

        <div className="flex items-center gap-2">
          <TextSizeControls dict={dict} />
          {bilingualHref && bilingualLabel ? (
            <Link
              href={bilingualHref}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-control)] border border-line bg-paper px-2.5 text-xs font-bold text-accent hover:border-accent"
            >
              <LinkSimple size={14} weight="bold" aria-hidden="true" />
              <span>{bilingualLabel}</span>
            </Link>
          ) : null}
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
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function(){
  try {
    var storyId = ${JSON.stringify(storyId)};
    var categorySlug = ${JSON.stringify(categorySlug)};
    var slug = ${JSON.stringify(slug)};
    var title = ${JSON.stringify(title)};
    var KEY = 'tn_reading_progress_v1';
    var saveProgress = function(p){
      try {
        var list = [];
        try { list = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { list = []; }
        if (!Array.isArray(list)) list = [];
        list = list.filter(function(x){ return x && x.storyId !== storyId; });
        list.unshift({
          storyId: storyId,
          progress: Math.max(0, Math.min(1, p)),
          updatedAt: new Date().toISOString(),
          categorySlug: categorySlug,
          slug: slug,
          title: title
        });
        localStorage.setItem(KEY, JSON.stringify(list.slice(0, 40)));
      } catch (e) {}
    };
    var ticking = false;
    var lastSaved = 0;
    var updateProgress = function(){
      ticking = false;
      var el = document.documentElement;
      var max = el.scrollHeight - el.clientHeight;
      var p = max > 0 ? el.scrollTop / max : 0;
      document.documentElement.style.setProperty('--read-progress', String(p));
      var now = Date.now();
      if (now - lastSaved > 1500) { saveProgress(p); lastSaved = now; }
    };
    var onScroll = function(){
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateProgress);
    };
    window.addEventListener('scroll', onScroll, {passive:true});
    updateProgress();
    window.addEventListener('pagehide', function(){
      var el = document.documentElement;
      var max = el.scrollHeight - el.clientHeight;
      saveProgress(max > 0 ? el.scrollTop / max : 0);
    }, {once:true});

    var consent = document.cookie.split('; ').find(function(r){return r.indexOf('tn_consent_analytics=')===0});
    if (!consent || consent.split('=')[1] !== '1') return;
    var start = Date.now();
    fetch('/api/events', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({type:'impression', storyId:storyId, consent:true})});
    window.addEventListener('pagehide', function(){
      var dwellMs = Date.now() - start;
      navigator.sendBeacon('/api/events', new Blob([JSON.stringify({type:'dwell', storyId:storyId, dwellMs:dwellMs, consent:true})], {type:'application/json'}));
    });
  } catch (e) {}
})();
`,
      }}
    />
  )
}

export function ConsentBanner({ dict }: { dict: Dictionary }) {
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    const existing = document.cookie.split('; ').find((r) => r.startsWith('tn_consent_analytics='))
    setHidden(Boolean(existing))
  }, [])

  if (hidden) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper-elevated p-4 shadow-[0_-12px_40px_rgba(16,32,29,0.12)]">
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
