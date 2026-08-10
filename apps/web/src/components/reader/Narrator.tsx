'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Pause,
  Play,
  SpeakerHigh,
  SpeakerSlash,
  Stop,
  X,
} from '@phosphor-icons/react'

type NarratorPhase = 'idle' | 'playing' | 'paused'

type SentenceUnit = {
  /** Block element that owns this sentence (null for headline/deck). */
  block: HTMLElement | null
  text: string
  /** Character offsets within the block's textContent. */
  start: number
  end: number
}

const COPY = {
  ne: {
    listen: 'सुन्नुहोस्',
    listenLabel: 'समाचार वाचक खोल्नुहोस्',
    narrator: 'समाचार वाचक',
    play: 'बजाउनुहोस्',
    pause: 'रोक्नुहोस्',
    resume: 'जारी राख्नुहोस्',
    stop: 'बन्द गर्नुहोस्',
    close: 'वाचक बन्द गर्नुहोस्',
    speed: 'गति',
    unsupported: 'यो ब्राउजरमा आवाज वाचन समर्थन छैन।',
    sentence: 'वाक्य',
  },
  en: {
    listen: 'Listen',
    listenLabel: 'Open the article narrator',
    narrator: 'Article narrator',
    play: 'Play',
    pause: 'Pause',
    resume: 'Resume',
    stop: 'Stop',
    close: 'Close narrator',
    speed: 'Speed',
    unsupported: 'Speech synthesis is not supported in this browser.',
    sentence: 'Sentence',
  },
} as const

const DEVANAGARI = /[\u0900-\u097F]/

function detectLang(text: string): string {
  return DEVANAGARI.test(text) ? 'ne-NP' : 'en-US'
}

function splitSentences(text: string): Array<{ text: string; start: number; end: number }> {
  const out: Array<{ text: string; start: number; end: number }> = []
  const pattern = /[^।॥.!?]+[।॥.!?]*\s*/gu
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text))) {
    const raw = match[0]
    const trimmed = raw.trim()
    if (!trimmed) continue
    const leading = raw.length - raw.trimStart().length
    out.push({
      text: trimmed,
      start: match.index + leading,
      end: match.index + leading + trimmed.length,
    })
  }
  return out
}

/** Build a DOM Range over [start, end) character offsets of a block. */
function rangeForOffsets(block: HTMLElement, start: number, end: number): Range | null {
  try {
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT)
    const range = document.createRange()
    let position = 0
    let startSet = false
    let node: Node | null
    while ((node = walker.nextNode())) {
      const length = node.textContent?.length ?? 0
      if (!startSet && position + length > start) {
        range.setStart(node, start - position)
        startSet = true
      }
      if (startSet && position + length >= end) {
        range.setEnd(node, Math.min(end - position, length))
        return range
      }
      position += length
    }
    return startSet ? range : null
  } catch {
    return null
  }
}

type HighlightRegistry = { set: (name: string, value: unknown) => void; delete: (name: string) => void }
type HighlightCtor = new (...ranges: Range[]) => unknown

function highlightRegistry(): HighlightRegistry | null {
  const css = (globalThis as { CSS?: { highlights?: HighlightRegistry } }).CSS
  return css?.highlights ?? null
}

function highlightCtor(): HighlightCtor | null {
  return (globalThis as { Highlight?: HighlightCtor }).Highlight ?? null
}

/**
 * Web Speech API narrator: sentence-by-sentence playback with language
 * detection (ne-NP / en-US), active-sentence highlighting on the body copy,
 * and play/pause/stop controls.
 */
export function ArticleNarrator({
  locale = 'ne',
  title,
  deck,
}: {
  locale?: 'ne' | 'en'
  title?: string
  deck?: string
}) {
  const copy = COPY[locale]
  const [supported, setSupported] = useState(true)
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<NarratorPhase>('idle')
  const [cursor, setCursor] = useState(0)
  const [total, setTotal] = useState(0)
  const [rate, setRate] = useState(0.95)

  const unitsRef = useRef<SentenceUnit[]>([])
  const indexRef = useRef(0)
  const stoppedRef = useRef(true)
  const rateRef = useRef(rate)
  const activeBlockRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
  }, [])

  useEffect(() => {
    rateRef.current = rate
  }, [rate])

  const clearHighlight = useCallback(() => {
    highlightRegistry()?.delete('tn-narrator')
    activeBlockRef.current?.classList.remove('narrator-active-block')
    activeBlockRef.current = null
  }, [])

  const highlightUnit = useCallback(
    (unit: SentenceUnit) => {
      clearHighlight()
      if (!unit.block) return
      unit.block.classList.add('narrator-active-block')
      activeBlockRef.current = unit.block
      const registry = highlightRegistry()
      const Ctor = highlightCtor()
      if (registry && Ctor) {
        const range = rangeForOffsets(unit.block, unit.start, unit.end)
        if (range) registry.set('tn-narrator', new Ctor(range))
      }
      unit.block.scrollIntoView({ block: 'center', behavior: 'smooth' })
    },
    [clearHighlight],
  )

  const collectUnits = useCallback((): SentenceUnit[] => {
    const units: SentenceUnit[] = []
    for (const lead of [title, deck]) {
      if (lead?.trim()) {
        for (const s of splitSentences(lead)) {
          units.push({ block: null, text: s.text, start: 0, end: 0 })
        }
      }
    }
    const body = document.querySelector('[data-article-body]')
    if (body) {
      const blocks = body.querySelectorAll<HTMLElement>('p, h2, h3, li')
      blocks.forEach((block) => {
        const text = block.textContent ?? ''
        if (!text.trim()) return
        for (const s of splitSentences(text)) {
          units.push({ block, text: s.text, start: s.start, end: s.end })
        }
      })
    }
    return units
  }, [deck, title])

  const speakFrom = useCallback(
    (index: number) => {
      const units = unitsRef.current
      if (index >= units.length) {
        stoppedRef.current = true
        setPhase('idle')
        setCursor(units.length)
        clearHighlight()
        return
      }
      const unit = units[index]
      indexRef.current = index
      setCursor(index + 1)
      highlightUnit(unit)

      const utterance = new SpeechSynthesisUtterance(unit.text)
      const lang = detectLang(unit.text)
      utterance.lang = lang
      utterance.rate = rateRef.current
      const voices = window.speechSynthesis.getVoices()
      const family = lang.split('-')[0]
      const voice =
        voices.find((v) => v.lang.replace('_', '-').toLowerCase().startsWith(lang.toLowerCase())) ??
        voices.find((v) => v.lang.toLowerCase().startsWith(family)) ??
        (family === 'ne'
          ? voices.find((v) => v.lang.toLowerCase().startsWith('hi'))
          : undefined)
      if (voice) utterance.voice = voice

      utterance.onend = () => {
        if (stoppedRef.current) return
        speakFrom(indexRef.current + 1)
      }
      utterance.onerror = () => {
        if (stoppedRef.current) return
        speakFrom(indexRef.current + 1)
      }
      window.speechSynthesis.speak(utterance)
    },
    [clearHighlight, highlightUnit],
  )

  const start = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    if (!unitsRef.current.length) {
      unitsRef.current = collectUnits()
      setTotal(unitsRef.current.length)
    }
    stoppedRef.current = false
    setPhase('playing')
    speakFrom(indexRef.current >= unitsRef.current.length ? 0 : indexRef.current)
  }, [collectUnits, speakFrom, supported])

  const pause = useCallback(() => {
    window.speechSynthesis.pause()
    setPhase('paused')
  }, [])

  const resume = useCallback(() => {
    window.speechSynthesis.resume()
    setPhase('playing')
  }, [])

  const stop = useCallback(() => {
    stoppedRef.current = true
    window.speechSynthesis.cancel()
    indexRef.current = 0
    setCursor(0)
    setPhase('idle')
    clearHighlight()
  }, [clearHighlight])

  useEffect(() => {
    return () => {
      stoppedRef.current = true
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      highlightRegistry()?.delete('tn-narrator')
      activeBlockRef.current?.classList.remove('narrator-active-block')
    }
  }, [])

  function toggleOpen() {
    if (open) {
      stop()
      setOpen(false)
    } else {
      setOpen(true)
      start()
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        aria-label={copy.listenLabel}
        title={copy.listenLabel}
        className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-colors ${
          open
            ? 'border-accent bg-accent-muted text-accent'
            : 'border-line bg-paper text-ink hover:border-accent hover:text-accent'
        }`}
      >
        {open ? (
          <SpeakerSlash size={16} weight="bold" aria-hidden="true" />
        ) : (
          <SpeakerHigh size={16} weight="bold" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">{copy.listen}</span>
      </button>

      {open ? (
        <div
          role="group"
          aria-label={copy.narrator}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(19rem,86vw)] rounded-[var(--radius-panel)] border border-line bg-paper-elevated p-4 shadow-[0_16px_40px_rgb(16_32_29_/_0.18)]"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-accent">
              {copy.narrator}
            </p>
            <button
              type="button"
              onClick={toggleOpen}
              aria-label={copy.close}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-stone hover:bg-paper hover:text-ink"
            >
              <X size={16} weight="bold" aria-hidden="true" />
            </button>
          </div>

          {!supported ? (
            <p className="mt-3 text-xs leading-relaxed text-stone">{copy.unsupported}</p>
          ) : (
            <>
              <div className="mt-3 flex items-center gap-2">
                {phase === 'playing' ? (
                  <button
                    type="button"
                    onClick={pause}
                    aria-label={copy.pause}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full accent-solid"
                  >
                    <Pause size={18} weight="fill" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={phase === 'paused' ? resume : start}
                    aria-label={phase === 'paused' ? copy.resume : copy.play}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full accent-solid"
                  >
                    <Play size={18} weight="fill" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={stop}
                  aria-label={copy.stop}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-paper text-ink hover:border-accent hover:text-accent"
                >
                  <Stop size={16} weight="fill" aria-hidden="true" />
                </button>

                <label className="ml-auto flex items-center gap-1.5 text-[0.68rem] font-semibold text-stone">
                  {copy.speed}
                  <select
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                    className="min-h-9 rounded-[var(--radius-control)] border border-line bg-paper px-1.5 text-xs text-ink"
                  >
                    <option value={0.8}>0.8x</option>
                    <option value={0.95}>1x</option>
                    <option value={1.15}>1.2x</option>
                    <option value={1.4}>1.4x</option>
                  </select>
                </label>
              </div>

              <p className="mt-3 text-[0.7rem] font-semibold tabular-nums text-stone" aria-live="polite">
                {copy.sentence}: {cursor}/{total || 0}
              </p>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
