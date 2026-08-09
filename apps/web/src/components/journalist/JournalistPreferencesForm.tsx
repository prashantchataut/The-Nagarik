'use client'

import { CheckCircle } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

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
    window.setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="max-w-[760px]">
      <fieldset className="border-y border-line py-1">
        <legend className="sr-only">लेखन प्राथमिकता</legend>

        <label className="flex cursor-pointer items-start justify-between gap-6 border-b border-line py-5">
          <span>
            <span className="block text-sm font-bold">सघन लेखन दृश्य</span>
            <span className="mt-1 block max-w-[54ch] text-sm leading-6 text-stone">
              सामग्री ब्लकबीचको खाली ठाउँ घटाएर लामो समाचारमा बढी सामग्री एकै पटक देखाउँछ।
            </span>
          </span>
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent)]"
            checked={prefs.compactEditor}
            onChange={(event) => persist({ ...prefs, compactEditor: event.target.checked })}
          />
        </label>

        <label className="flex cursor-pointer items-start justify-between gap-6 py-5">
          <span>
            <span className="block text-sm font-bold">समीक्षाअघि पुष्टि</span>
            <span className="mt-1 block max-w-[54ch] text-sm leading-6 text-stone">
              लेख सम्पादकीय समीक्षामा पठाउनुअघि एक पटक पुष्टि माग्छ। गल्तीले पठिनबाट जोगाउन यो सिफारिस गरिएको सेटिङ हो।
            </span>
          </span>
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent)]"
            checked={prefs.confirmBeforeSubmit}
            onChange={(event) => persist({ ...prefs, confirmBeforeSubmit: event.target.checked })}
          />
        </label>
      </fieldset>

      <div className="mt-5 min-h-6" aria-live="polite">
        {saved ? (
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-success">
            <CheckCircle size={18} weight="fill" aria-hidden="true" />
            यो उपकरणमा सेटिङ सुरक्षित भयो।
          </p>
        ) : (
          <p className="text-xs leading-5 text-stone">
            यी लेखन प्राथमिकता यही ब्राउजरमा मात्र सुरक्षित हुन्छन्। खाता भूमिका, समाचार स्वामित्व र सम्पादकीय अनुमति केन्द्रीय प्रणालीमै सुरक्षित रहन्छन्।
          </p>
        )}
      </div>
    </div>
  )
}
