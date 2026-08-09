'use client'

import { useEffect, useState } from 'react'
import { Desktop, Moon, Sun } from '@phosphor-icons/react'
import type { Dictionary } from '@/lib/i18n'

type ThemeMode = 'system' | 'light' | 'dark'

function systemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(mode: ThemeMode) {
  const resolved = mode === 'system' ? systemTheme() : mode
  document.documentElement.dataset.themeMode = mode
  document.documentElement.dataset.theme = resolved
}

export function ThemeToggle({ dict }: { dict: Dictionary }) {
  const [mode, setMode] = useState<ThemeMode>('system')

  useEffect(() => {
    const stored = window.localStorage.getItem('tn_theme')
    const next: ThemeMode = stored === 'light' || stored === 'dark' ? stored : 'system'
    setMode(next)
    applyTheme(next)

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if ((window.localStorage.getItem('tn_theme') ?? 'system') === 'system') applyTheme('system')
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  function cycle() {
    const next: ThemeMode = mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system'
    setMode(next)
    if (next === 'system') window.localStorage.removeItem('tn_theme')
    else window.localStorage.setItem('tn_theme', next)
    applyTheme(next)
  }

  const label =
    mode === 'system'
      ? `${dict.theme}: System`
      : mode === 'light'
        ? `${dict.theme}: Light`
        : `${dict.theme}: Dark`

  return (
    <button
      type="button"
      onClick={cycle}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-control)] px-2 font-medium text-ink transition-colors hover:bg-paper-elevated hover:text-accent active:translate-y-px"
      aria-label={label}
      title={label}
    >
      {mode === 'system' ? (
        <Desktop size={15} weight="regular" aria-hidden="true" />
      ) : mode === 'dark' ? (
        <Moon size={15} weight="regular" aria-hidden="true" />
      ) : (
        <Sun size={15} weight="regular" aria-hidden="true" />
      )}
      <span className="hidden sm:inline">{dict.theme}</span>
    </button>
  )
}
