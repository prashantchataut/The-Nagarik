'use client'

import { useEffect, useState } from 'react'
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

export function ConsentBanner({ dict }: { dict: Dictionary }) {
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    const existing = document.cookie.split('; ').find((r) => r.startsWith('tn_consent_analytics='))
    setHidden(Boolean(existing))
  }, [])

  if (hidden) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper-elevated p-4 shadow-[0_-12px_40px_rgba(18,20,26,0.08)]">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="max-w-2xl text-sm text-stone">{dict.consentBody}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-[var(--radius-control)] border border-line px-3 py-2 text-sm active:scale-[0.98]"
            onClick={() => {
              document.cookie = 'tn_consent_analytics=0; path=/; max-age=31536000; samesite=lax'
              setHidden(true)
            }}
          >
            {dict.consentReject}
          </button>
          <button
            type="button"
            className="rounded-[var(--radius-control)] bg-accent px-3 py-2 text-sm text-accent-fg active:scale-[0.98]"
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
