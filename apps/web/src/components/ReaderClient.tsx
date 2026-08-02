'use client'

import { useState } from 'react'
import type { Dictionary } from '@/lib/i18n'

export function ShareCopyButton({ dict }: { dict: Dictionary }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="rounded-[var(--radius-control)] border border-line px-3 py-1.5 text-sm hover:border-accent active:scale-[0.98]"
      onClick={async () => {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1600)
      }}
    >
      {copied ? dict.copied : dict.share}
    </button>
  )
}

export function ReadingProgress() {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-accent"
      style={{ transform: 'scaleX(var(--read-progress, 0))' }}
      aria-hidden
    />
  )
}

export function ArticleEngagement({ storyId }: { storyId: string }) {
  // Consent-gated beacon: only fires after explicit analytics consent cookie.
  if (typeof document !== 'undefined') {
    // no-op placeholder for SSR
  }
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function(){
  try {
    var consent = document.cookie.split('; ').find(function(r){return r.indexOf('tn_consent_analytics=')===0});
    if (!consent || consent.split('=')[1] !== '1') return;
    var start = Date.now();
    fetch('/api/events', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({type:'impression', storyId:${JSON.stringify(storyId)}, consent:true})});
    var onScroll = function(){
      var el = document.documentElement;
      var max = el.scrollHeight - el.clientHeight;
      var p = max > 0 ? el.scrollTop / max : 0;
      document.documentElement.style.setProperty('--read-progress', String(p));
    };
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('pagehide', function(){
      var dwellMs = Date.now() - start;
      navigator.sendBeacon('/api/events', new Blob([JSON.stringify({type:'dwell', storyId:${JSON.stringify(storyId)}, dwellMs:dwellMs, consent:true})], {type:'application/json'}));
    });
  } catch (e) {}
})();
`,
      }}
    />
  )
}

export function ConsentBanner({ locale }: { locale: string }) {
  const [hidden, setHidden] = useState(false)
  if (hidden) return null
  const isEn = locale === 'en'
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper-elevated p-4 shadow-[0_-8px_30px_rgba(18,20,26,0.08)]">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="max-w-2xl text-sm text-stone">
          {isEn
            ? 'We use first-party analytics only after you opt in. No invented rankings without consented events.'
            : 'तपाईंले अनुमति दिएपछि मात्र पहिलो-पक्ष विश्लेषण चल्छ। सहमति बिना र्याङ्किङ बनाइँदैन।'}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-[var(--radius-control)] border border-line px-3 py-2 text-sm"
            onClick={() => {
              document.cookie = 'tn_consent_analytics=0; path=/; max-age=31536000; samesite=lax'
              setHidden(true)
            }}
          >
            {isEn ? 'Reject' : 'अस्वीकार'}
          </button>
          <button
            type="button"
            className="rounded-[var(--radius-control)] bg-accent px-3 py-2 text-sm text-accent-fg"
            onClick={() => {
              document.cookie = 'tn_consent_analytics=1; path=/; max-age=31536000; samesite=lax'
              setHidden(true)
            }}
          >
            {isEn ? 'Accept analytics' : 'स्वीकार'}
          </button>
        </div>
      </div>
    </div>
  )
}
