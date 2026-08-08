'use client'

import { useEffect, useState } from 'react'
import { AdminCard } from '@/components/admin/primitives'

const STORAGE_KEY = 'nagarik-journalist-prefs'

export type JournalistPrefs = {
  uiLocale: 'ne' | 'en'
  compactEditor: boolean
  confirmBeforeSubmit: boolean
}

const DEFAULTS: JournalistPrefs = {
  uiLocale: 'ne',
  compactEditor: false,
  confirmBeforeSubmit: true,
}

export function readJournalistPrefs(): JournalistPrefs {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<JournalistPrefs>) }
  } catch {
    return DEFAULTS
  }
}

export function JournalistPreferencesForm() {
  const [prefs, setPrefs] = useState<JournalistPrefs>(DEFAULTS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setPrefs(readJournalistPrefs())
  }, [])

  function persist(next: JournalistPrefs) {
    setPrefs(next)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  return (
    <AdminCard className="max-w-lg space-y-4">
      <label className="block text-sm font-medium">
        Desk UI language preference
        <select
          className="mt-1.5 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm"
          value={prefs.uiLocale}
          onChange={(e) =>
            persist({ ...prefs, uiLocale: e.target.value === 'en' ? 'en' : 'ne' })
          }
        >
          <option value="ne">नेपाली</option>
          <option value="en">English</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={prefs.compactEditor}
          onChange={(e) => persist({ ...prefs, compactEditor: e.target.checked })}
        />
        Compact compose spacing
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={prefs.confirmBeforeSubmit}
          onChange={(e) => persist({ ...prefs, confirmBeforeSubmit: e.target.checked })}
        />
        Confirm before submit for review
      </label>
      {saved ? <p className="text-xs text-accent">Saved on this device.</p> : null}
      <p className="text-xs text-stone">
        Preferences stay in localStorage only — not a second user database.
      </p>
    </AdminCard>
  )
}
