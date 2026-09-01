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
    noVoice: 'यो उपकरणमा वाचन आवाज भेटिएन। ब्राउजर वा प्रणालीको आवाज सेटिङ जाँच गर्नुहोस्।',
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
    noVoice: 'No speech voice was found on this device. Check your browser or system voice settings.',
    sentence: 'Sentence',
  },
} as const

const DEVANAGARI = /[\u0900-\u097F]/

function detectLang(text: string): string {
  return DEVANAGARI.test(text) ? 'ne-NP' : 'en-US'
}

/**
 * Browsers populate getVoices() asynchronously; Chrome fires `voiceschanged`.
 * Resolve with whatever is available after the event or a short timeout.
 */
function loadVoices(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis
    const existing = synth.getVoices()
    if (existing.length) {
      resolve(existing)
      return
    }
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      synth.removeEventListener('voiceschanged', finish)
      resolve(synth.getVoices())
    }
    synth.addEventListener('voiceschanged', finish)
    window.setTimeout(finish, timeoutMs)
  })
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined {
  const family = lang.split('-')[0]
  return (
    voices.find((v) => v.lang.replace('_', '-').toLowerCase().startsWith(lang.toLowerCase())) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(family)) ??
    (family === 'ne'
      ? voices.find((v) => v.lang.toLowerCase().startsWith('hi'))
      : undefined) ??
    voices.find((v) => v.default) ??
    voices[0]
  )
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
 * Inject the `::highlight(tn-narrator)` stylesheet at runtime.
 *
 * The CSS Custom Highlight API pseudo-element cannot live in globals.css:
 * Turbopack's CSS parser rejects it and every page 500s in dev. Injecting it
 * here is strictly better anyway — only browsers that ship the Highlight API
 * ever parse the rule.
 */
function ensureHighlightStyle(): void {
  if (typeof document === 'undefined') return
  const STYLE_ID = 'tn-narrator-highlight-style'
  if (document.getElementById(STYLE_ID)) return
  if (!highlightRegistry() || !highlightCtor()) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    ::highlight(tn-narrator) {
      background: color-mix(in oklab, var(--accent) 30%, transparent);
      color: var(--ink);
    }
  `
  document.head.appendChild(style)
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

  const [voiceError, setVoiceError] = useState(false)
  const unitsRef = useRef<SentenceUnit[]>([])
  const indexRef = useRef(0)
  const stoppedRef = useRef(true)
  const rateRef = useRef(rate)
  const activeBlockRef = useRef<HTMLElement | null>(null)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])
  const watchdogRef = useRef<number | null>(null)
  const keepAliveRef = useRef<number | null>(null)

  useEffect(() => {
    const ok = typeof window !== 'undefined' && 'speechSynthesis' in window
    setSupported(ok)
    // Register the ::highlight(tn-narrator) rule in supporting browsers.
    ensureHighlightStyle()
    if (ok) {
      // Warm the voice list early so the first tap speaks immediately.
      void loadVoices().then((voices) => {
        voicesRef.current = voices
      })
    }
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

  const clearTimers = useCallback(() => {
    if (watchdogRef.current !== null) {
      window.clearTimeout(watchdogRef.current)
      watchdogRef.current = null
    }
    if (keepAliveRef.current !== null) {
      window.clearInterval(keepAliveRef.current)
      keepAliveRef.current = null
    }
  }, [])

  const speakFrom = useCallback(
    (index: number) => {
      const units = unitsRef.current
      if (index >= units.length) {
        stoppedRef.current = true
        setPhase('idle')
        setCursor(units.length)
        clearHighlight()
        clearTimers()
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
      const voice = pickVoice(voicesRef.current, lang)
      if (voice) utterance.voice = voice

      let started = false
      utterance.onstart = () => {
        started = true
        setVoiceError(false)
        if (watchdogRef.current !== null) {
          window.clearTimeout(watchdogRef.current)
          watchdogRef.current = null
        }
      }
      utterance.onend = () => {
        if (stoppedRef.current) return
        speakFrom(indexRef.current + 1)
      }
      utterance.onerror = () => {
        if (stoppedRef.current) return
        speakFrom(indexRef.current + 1)
      }

      // Watchdog: some engines (no installed voices, broken TTS service)
      // accept speak() but never start. Surface it instead of hanging.
      if (watchdogRef.current !== null) window.clearTimeout(watchdogRef.current)
      watchdogRef.current = window.setTimeout(() => {
        if (!started && !stoppedRef.current) {
          window.speechSynthesis.cancel()
          stoppedRef.current = true
          setPhase('idle')
          setVoiceError(true)
          clearHighlight()
          clearTimers()
        }
      }, 3500)

      window.speechSynthesis.speak(utterance)
      // Chromium quirk: long sessions silently pause; nudge it back.
      if (keepAliveRef.current === null) {
        keepAliveRef.current = window.setInterval(() => {
          if (!stoppedRef.current && !window.speechSynthesis.paused) {
            window.speechSynthesis.resume()
          }
        }, 10_000)
      }
    },
    [clearHighlight, clearTimers, highlightUnit],
  )

  const start = useCallback(() => {
    if (!supported) return
    setVoiceError(false)
    window.speechSynthesis.cancel()
    if (!unitsRef.current.length) {
      unitsRef.current = collectUnits()
      setTotal(unitsRef.current.length)
    }
    stoppedRef.current = false
    setPhase('playing')
    const begin = () =>
      speakFrom(indexRef.current >= unitsRef.current.length ? 0 : indexRef.current)
    if (voicesRef.current.length) {
      begin()
    } else {
      void loadVoices().then((voices) => {
        voicesRef.current = voices
        if (!stoppedRef.current) begin()
      })
    }
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
    clearTimers()
  }, [clearHighlight, clearTimers])

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
              {voiceError ? (
                <p className="mt-2 text-xs font-semibold leading-relaxed text-danger" role="alert">
                  {copy.noVoice}
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
