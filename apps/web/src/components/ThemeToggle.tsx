'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from '@phosphor-icons/react'
import type { Dictionary } from '@/lib/i18n'

export function ThemeToggle({ dict }: { dict: Dictionary }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const stored = window.localStorage.getItem('tn_theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const next = stored === 'light' || stored === 'dark' ? stored : prefersDark ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
  }, [])

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    window.localStorage.setItem('tn_theme', next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-1.5 hover:text-ink active:scale-[0.98]"
      aria-label={dict.theme}
    >
      {theme === 'dark' ? <Sun size={14} weight="regular" /> : <Moon size={14} weight="regular" />}
      <span className="hidden sm:inline">{dict.theme}</span>
    </button>
  )
}
