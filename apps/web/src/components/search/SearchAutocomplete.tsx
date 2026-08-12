'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'

/**
 * Search input with algorithm-backed suggestions (trie autocomplete,
 * transliteration, typo tolerance). ARIA combobox pattern: full keyboard
 * navigation, listbox semantics, Escape closes, Enter submits.
 */
export function SearchAutocomplete({
  locale = 'ne',
  placeholder,
  submitLabel,
  defaultValue = '',
  inputId = 'search-autocomplete',
  size = 'md',
}: {
  locale?: 'ne' | 'en'
  placeholder: string
  submitLabel: string
  defaultValue?: string
  inputId?: string
  size?: 'md' | 'lg'
}) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchSuggestions = useCallback(
    (query: string) => {
      abortRef.current?.abort()
      if (query.trim().length < 2) {
        setSuggestions([])
        setOpen(false)
        return
      }
      const controller = new AbortController()
      abortRef.current = controller
      fetch(`/api/search/suggest?q=${encodeURIComponent(query)}&locale=${locale}`, {
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { suggestions?: string[] } | null) => {
          const list = Array.isArray(data?.suggestions) ? data.suggestions : []
          setSuggestions(list)
          setOpen(list.length > 0)
          setActiveIndex(-1)
        })
        .catch(() => {
          // Suggestions are progressive enhancement.
        })
    },
    [locale],
  )

  function onChange(next: string) {
    setValue(next)
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => fetchSuggestions(next), 160)
  }

  function submit(query: string) {
    const q = query.trim()
    if (!q) return
    setOpen(false)
    router.push(`/${locale}/search?q=${encodeURIComponent(q)}`)
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown' && suggestions.length) {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((i) => (i + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp' && suggestions.length) {
      event.preventDefault()
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      submit(activeIndex >= 0 ? suggestions[activeIndex] : value)
    } else if (event.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [])

  const listboxId = `${inputId}-listbox`
  const inputHeight = size === 'lg' ? 'h-12 text-base' : 'min-h-10 text-sm'

  return (
    <div ref={rootRef} className="relative w-full">
      <div className="relative flex">
        <MagnifyingGlass
          size={16}
          weight="bold"
          className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-stone"
          aria-hidden="true"
        />
        <input
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${inputId}-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => suggestions.length && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={`${inputHeight} w-full rounded-l-[var(--radius-control)] border border-r-0 border-line bg-field pl-9 pr-3 text-ink placeholder:text-stone/70 focus:border-accent focus:outline-none`}
        />
        <button
          type="button"
          onClick={() => submit(value)}
          className={`inline-flex ${size === 'lg' ? 'h-12 px-5 text-sm' : 'min-h-10 px-3.5 text-xs'} shrink-0 items-center rounded-r-[var(--radius-control)] accent-solid font-bold transition-opacity hover:opacity-90`}
          aria-label={submitLabel}
        >
          {submitLabel}
        </button>
      </div>

      {open && suggestions.length ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+0.3rem)] z-50 overflow-hidden rounded-[var(--radius-control)] border border-line bg-paper-elevated py-1 shadow-[0_14px_36px_rgb(16_32_29_/_0.18)]"
        >
          {suggestions.map((suggestion, index) => (
            <li key={suggestion} role="presentation">
              <button
                id={`${inputId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  submit(suggestion)
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex min-h-10 w-full items-center gap-2.5 px-3.5 text-left text-sm ${
                  index === activeIndex ? 'bg-accent-muted text-accent' : 'text-ink'
                }`}
              >
                <MagnifyingGlass size={13} weight="bold" className="shrink-0 text-stone" aria-hidden="true" />
                <span className="truncate font-semibold">{suggestion}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
