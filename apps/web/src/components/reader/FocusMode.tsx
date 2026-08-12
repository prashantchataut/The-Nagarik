'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowsInSimple, ArrowsOutSimple, Palette } from '@phosphor-icons/react'

export type ReadingTint = 'paper' | 'night' | 'white'

const TINT_KEY = 'tn_reading_tint_v1'

const COPY = {
  ne: {
    enter: 'फोकस पढाइ',
    exit: 'फोकस बन्द',
    enterLabel: 'ध्यानभंगरहित पढाइ मोड खोल्नुहोस्',
    exitLabel: 'फोकस पढाइ मोड बन्द गर्नुहोस्',
    tint: 'पृष्ठभूमि',
    paper: 'न्यानो कागज',
    night: 'रात',
    white: 'शुद्ध सेतो',
  },
  en: {
    enter: 'Focus mode',
    exit: 'Exit focus',
    enterLabel: 'Enter distraction-free reading mode',
    exitLabel: 'Exit distraction-free reading mode',
    tint: 'Background',
    paper: 'Warm paper',
    night: 'Night',
    white: 'Pure white',
  },
} as const

function readStoredTint(): ReadingTint {
  try {
    const value = localStorage.getItem(TINT_KEY)
    if (value === 'paper' || value === 'night' || value === 'white') return value
  } catch {
    // Preference is optional
  }
  return 'paper'
}

function applyReadingState(active: boolean, tint: ReadingTint) {
  const root = document.documentElement
  if (active) {
    root.dataset.reading = 'on'
    root.dataset.readingTint = tint
  } else {
    delete root.dataset.reading
    delete root.dataset.readingTint
  }
}

/**
 * Distraction-free reading mode toggle. Hides site chrome, rails, and
 * comments via `[data-focus-hide]` CSS, centers the article column, and
 * offers three background tints: Warm paper, Night, Pure white.
 */
export function FocusModeToggle({ locale = 'ne' }: { locale?: 'ne' | 'en' }) {
  const copy = COPY[locale]
  const [active, setActive] = useState(false)
  const [tint, setTint] = useState<ReadingTint>('paper')
  const [tintOpen, setTintOpen] = useState(false)
  const tintRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTint(readStoredTint())
    return () => {
      // Never leave the site chrome hidden after navigating away.
      applyReadingState(false, 'paper')
    }
  }, [])

  useEffect(() => {
    applyReadingState(active, tint)
  }, [active, tint])

  useEffect(() => {
    if (!active) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActive(false)
        setTintOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [active])

  useEffect(() => {
    if (!tintOpen) return
    const onPointer = (event: PointerEvent) => {
      if (!tintRef.current?.contains(event.target as Node)) setTintOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [tintOpen])

  const chooseTint = useCallback((next: ReadingTint) => {
    setTint(next)
    setTintOpen(false)
    try {
      localStorage.setItem(TINT_KEY, next)
    } catch {
      // Preference is optional
    }
  }, [])

  const tintLabel = { paper: copy.paper, night: copy.night, white: copy.white }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setActive((v) => !v)}
        aria-pressed={active}
        aria-label={active ? copy.exitLabel : copy.enterLabel}
        title={active ? copy.exitLabel : copy.enterLabel}
        className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-colors ${
          active
            ? 'border-accent bg-accent-muted text-accent'
            : 'border-line bg-paper text-ink hover:border-accent hover:text-accent'
        }`}
      >
        {active ? (
          <ArrowsInSimple size={16} weight="bold" aria-hidden="true" />
        ) : (
          <ArrowsOutSimple size={16} weight="bold" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">{active ? copy.exit : copy.enter}</span>
      </button>

      {active ? (
        <div ref={tintRef} className="relative">
          <button
            type="button"
            onClick={() => setTintOpen((v) => !v)}
            aria-expanded={tintOpen}
            aria-haspopup="menu"
            aria-label={copy.tint}
            title={copy.tint}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-paper px-3.5 text-xs font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
          >
            <Palette size={16} weight="bold" aria-hidden="true" />
            <span className="hidden sm:inline">{tintLabel[tint]}</span>
          </button>
          {tintOpen ? (
            <div
              role="menu"
              aria-label={copy.tint}
              className="absolute right-0 top-[calc(100%+0.4rem)] z-50 min-w-44 rounded-[var(--radius-control)] border border-line bg-paper-elevated p-1 shadow-[0_12px_28px_rgb(16_32_29_/_0.15)]"
            >
              {(['paper', 'night', 'white'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={tint === value}
                  onClick={() => chooseTint(value)}
                  className={`flex min-h-11 w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 text-xs font-semibold ${
                    tint === value ? 'bg-accent-muted text-accent' : 'text-ink hover:bg-paper'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="inline-block h-4 w-4 rounded-full border border-line-strong"
                    style={{
                      background:
                        value === 'paper' ? '#f6efdf' : value === 'night' ? '#141a19' : '#ffffff',
                    }}
                  />
                  <span>{tintLabel[value]}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
