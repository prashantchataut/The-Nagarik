'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle,
  Desktop,
  DownloadSimple,
  Moon,
  Palette,
  SealCheck,
  SignOut,
  Sun,
  TextAa,
  Trash,
  UserCircle,
  WarningCircle,
} from '@phosphor-icons/react'
import type { ReaderAccount } from './ReaderIdentityCard'
import {
  PROFILE_SWATCHES,
  eraseReaderData,
  exportReaderData,
  readProfile,
  writeProfile,
  THEME_KEY,
  TINT_KEY,
  TYPE_SCALE_KEY,
} from './reader-store'

type ThemeMode = 'system' | 'light' | 'dark'
type TypeScale = 'sm' | 'md' | 'lg'
type Tint = 'paper' | 'night' | 'white'

export type CategoryOption = { slug: string; ne: string; en: string }

const COPY = {
  ne: {
    identity: 'पाठक परिचय',
    nameLabel: 'प्रदर्शन नाम',
    nameHint: 'यो नाम प्रतिक्रिया फारममा स्वतः भरिन्छ।',
    accountBadge: 'पाठक खाता',
    accountHint: 'यी विवरण तपाईंको खातामा सुरक्षित हुन्छन् र सबै उपकरणमा उपलब्ध रहन्छन्।',
    devicePrefsTitle: 'यस उपकरणका प्राथमिकता',
    logout: 'लगआउट',
    saveError: 'सुरक्षित हुन सकेन। पुनः प्रयास गर्नुहोस्।',
    colorLabel: 'प्रोफाइल रङ',
    interests: 'रुचिका विषय',
    interestsHint: 'तपाईंले रोजेका विभागहरू; भविष्यका सिफारिसका लागि आधार।',
    saved: 'प्रोफाइल सुरक्षित भयो।',
    save: 'प्रोफाइल सुरक्षित गर्नुहोस्',
    prefs: 'पढाइ प्राथमिकता',
    theme: 'थिम',
    themeSystem: 'प्रणाली',
    themeLight: 'उज्यालो',
    themeDark: 'अँध्यारो',
    textSize: 'अक्षर आकार',
    textSm: 'सानो',
    textMd: 'मध्यम',
    textLg: 'ठूलो',
    tint: 'फोकस मोड पृष्ठभूमि',
    tintPaper: 'न्यानो कागज',
    tintNight: 'रात',
    tintWhite: 'सेतो',
    data: 'मेरो डाटा',
    dataNote: 'सुरक्षित समाचार, पढाइ इतिहास र प्राथमिकता यही उपकरणमा भण्डारण हुन्छन्। जुनसुकै बेला डाउनलोड वा मेटाउन सकिन्छ।',
    export: 'डाटा डाउनलोड (JSON)',
    erase: 'सबै डाटा मेटाउनुहोस्',
    confirmErase:
      'प्रोफाइल, सुरक्षित समाचार, पढाइ इतिहास र प्राथमिकता सबै मेटिनेछ। यो कार्य फर्काउन सकिँदैन। निश्चित हुनुहुन्छ?',
    erased: 'सबै स्थानीय डाटा मेटाइयो।',
  },
  en: {
    identity: 'Reader identity',
    nameLabel: 'Display name',
    nameHint: 'Pre-fills the comment form.',
    accountBadge: 'Reader account',
    accountHint: 'These details are stored in your account and follow you across devices.',
    devicePrefsTitle: 'Preferences on this device',
    logout: 'Log out',
    saveError: 'Could not save. Please retry.',
    colorLabel: 'Profile color',
    interests: 'Topics you follow',
    interestsHint: 'Sections you care about; the base for future recommendations.',
    saved: 'Profile saved.',
    save: 'Save profile',
    prefs: 'Reading preferences',
    theme: 'Theme',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    textSize: 'Text size',
    textSm: 'Small',
    textMd: 'Medium',
    textLg: 'Large',
    tint: 'Focus mode background',
    tintPaper: 'Warm paper',
    tintNight: 'Night',
    tintWhite: 'Pure white',
    data: 'My data',
    dataNote: 'Saved stories, reading history, and preferences are stored on this device. Download or erase them anytime.',
    export: 'Download data (JSON)',
    erase: 'Erase all data',
    confirmErase:
      'This erases your profile, saved stories, reading history, and preferences. It cannot be undone. Continue?',
    erased: 'All local data erased.',
  },
} as const

function applyTheme(mode: ThemeMode) {
  const resolved =
    mode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : mode
  document.documentElement.dataset.themeMode = mode
  document.documentElement.dataset.theme = resolved
}

export function ReaderProfileForm({
  locale = 'ne',
  categories = [],
  account = null,
}: {
  locale?: 'ne' | 'en'
  categories?: CategoryOption[]
  account?: ReaderAccount | null
}) {
  const copy = COPY[locale]
  const router = useRouter()
  const [name, setName] = useState(account?.name ?? '')
  const [color, setColor] = useState(account?.avatarColor ?? 'teal')
  const [interests, setInterests] = useState<string[]>(account?.interests ?? [])
  const [status, setStatus] = useState<'idle' | 'saved' | 'erased' | 'error'>('idle')
  const [busy, setBusy] = useState(false)

  const [theme, setTheme] = useState<ThemeMode>('system')
  const [scale, setScale] = useState<TypeScale>('md')
  const [tint, setTint] = useState<Tint>('paper')

  useEffect(() => {
    if (!account) {
      const profile = readProfile()
      setName(profile.name)
      setColor(profile.color)
      setInterests(profile.interests)
    }
    try {
      const storedTheme = localStorage.getItem(THEME_KEY)
      if (storedTheme === 'light' || storedTheme === 'dark') setTheme(storedTheme)
      const storedScale = localStorage.getItem(TYPE_SCALE_KEY)
      if (storedScale === 'sm' || storedScale === 'md' || storedScale === 'lg') setScale(storedScale)
      const storedTint = localStorage.getItem(TINT_KEY)
      if (storedTint === 'paper' || storedTint === 'night' || storedTint === 'white') setTint(storedTint)
    } catch {
      // Preferences are optional
    }
    // Mount-only hydration: `account` is server-provided and stable per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault()
    // Convenience: pre-fill the comment form with the same name.
    try {
      if (name.trim()) localStorage.setItem('tn_comment_name_v1', name.trim())
    } catch {
      // optional
    }

    if (account) {
      setBusy(true)
      try {
        const res = await fetch('/api/reader/me', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: name.trim().slice(0, 60), avatarColor: color, interests }),
        })
        if (!res.ok) throw new Error(String(res.status))
        setStatus('saved')
        router.refresh()
      } catch {
        setStatus('error')
      } finally {
        setBusy(false)
        window.setTimeout(() => setStatus('idle'), 2600)
      }
      return
    }

    writeProfile({ name: name.trim().slice(0, 40), color, interests })
    setStatus('saved')
    window.setTimeout(() => setStatus('idle'), 2200)
  }

  async function logout() {
    try {
      await fetch('/api/reader/logout', { method: 'POST' })
    } catch {
      // best effort
    }
    router.refresh()
  }

  function toggleInterest(slug: string) {
    setInterests((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug].slice(0, 8),
    )
  }

  function chooseTheme(mode: ThemeMode) {
    setTheme(mode)
    try {
      if (mode === 'system') localStorage.removeItem(THEME_KEY)
      else localStorage.setItem(THEME_KEY, mode)
    } catch {
      // optional
    }
    applyTheme(mode)
  }

  function chooseScale(value: TypeScale) {
    setScale(value)
    const map = { sm: '0.95', md: '1', lg: '1.14' } as const
    document.documentElement.style.setProperty('--article-type-scale', map[value])
    try {
      localStorage.setItem(TYPE_SCALE_KEY, value)
    } catch {
      // optional
    }
  }

  function chooseTint(value: Tint) {
    setTint(value)
    try {
      localStorage.setItem(TINT_KEY, value)
    } catch {
      // optional
    }
  }

  function exportData() {
    const blob = new Blob([exportReaderData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'the-nagarik-reader-data.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  function eraseAll() {
    if (!window.confirm(copy.confirmErase)) return
    eraseReaderData()
    setName('')
    setColor('teal')
    setInterests([])
    setTheme('system')
    setScale('md')
    setTint('paper')
    applyTheme('system')
    setStatus('erased')
    window.setTimeout(() => setStatus('idle'), 2600)
  }

  const segButton = (active: boolean) =>
    `inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-control)] border px-3.5 text-xs font-bold transition-colors ${
      active
        ? 'border-accent bg-accent-muted text-accent'
        : 'border-line bg-paper text-ink hover:border-accent hover:text-accent'
    }`

  return (
    <div className="space-y-8">
      {/* Identity */}
      <form onSubmit={saveProfile} className="surface-card p-6" aria-labelledby="reader-identity-title">
        <div className="flex flex-wrap items-center gap-2 border-b-2 border-accent pb-3 text-accent">
          <UserCircle size={20} weight="bold" aria-hidden="true" />
          <h2 id="reader-identity-title" className="text-base font-black text-ink">
            {copy.identity}
          </h2>
          {account ? (
            <>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-2.5 py-0.5 text-[0.68rem] font-bold text-accent">
                <SealCheck size={13} weight="fill" aria-hidden="true" />
                {copy.accountBadge}
              </span>
              <span className="text-xs font-normal text-stone">{account.email}</span>
              <button
                type="button"
                onClick={logout}
                className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-control)] border border-line bg-paper px-3 text-xs font-bold text-stone hover:border-danger hover:text-danger"
              >
                <SignOut size={13} weight="bold" aria-hidden="true" />
                {copy.logout}
              </button>
            </>
          ) : null}
        </div>
        {account ? (
          <p className="mt-3 text-xs leading-relaxed text-stone">{copy.accountHint}</p>
        ) : null}

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <label className="grid gap-1 text-xs font-bold text-ink">
            {copy.nameLabel}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              className="newsroom-field min-h-11 px-3 text-sm font-normal"
            />
            <span className="font-normal text-stone">{copy.nameHint}</span>
          </label>

          <fieldset>
            <legend className="text-xs font-bold text-ink">{copy.colorLabel}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {PROFILE_SWATCHES.map((swatch) => (
                <button
                  key={swatch.id}
                  type="button"
                  onClick={() => setColor(swatch.id)}
                  aria-pressed={color === swatch.id}
                  aria-label={locale === 'ne' ? swatch.labelNe : swatch.labelEn}
                  title={locale === 'ne' ? swatch.labelNe : swatch.labelEn}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-transform ${
                    color === swatch.id
                      ? 'ring-2 ring-accent ring-offset-2 ring-offset-[var(--paper)] scale-105'
                      : 'hover:scale-105'
                  }`}
                  style={{ background: swatch.bg }}
                >
                  {color === swatch.id ? (
                    <CheckCircle size={18} weight="fill" className="text-white" aria-hidden="true" />
                  ) : null}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        {categories.length ? (
          <fieldset className="mt-6">
            <legend className="text-xs font-bold text-ink">{copy.interests}</legend>
            <p className="mt-0.5 text-xs text-stone">{copy.interestsHint}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {categories.map((category) => {
                const active = interests.includes(category.slug)
                return (
                  <button
                    key={category.slug}
                    type="button"
                    onClick={() => toggleInterest(category.slug)}
                    aria-pressed={active}
                    className={`inline-flex min-h-10 items-center rounded-full px-3.5 text-xs font-bold transition-colors ${
                      active
                        ? 'accent-solid'
                        : 'border border-line bg-paper text-stone hover:border-accent hover:text-accent'
                    }`}
                  >
                    {locale === 'ne' ? category.ne : category.en}
                  </button>
                )
              })}
            </div>
          </fieldset>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-line pt-4">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] accent-solid px-5 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {copy.save}
          </button>
          <div aria-live="polite">
            {status === 'saved' ? (
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-success">
                <CheckCircle size={16} weight="fill" aria-hidden="true" />
                {copy.saved}
              </p>
            ) : status === 'erased' ? (
              <p className="text-sm font-semibold text-success">{copy.erased}</p>
            ) : status === 'error' ? (
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-danger">
                <WarningCircle size={16} weight="bold" aria-hidden="true" />
                {copy.saveError}
              </p>
            ) : null}
          </div>
        </div>
      </form>

      {/* Preferences */}
      <section className="surface-card p-6" aria-labelledby="reader-prefs-title">
        <div className="flex items-center gap-2 border-b-2 border-accent pb-3 text-accent">
          <Palette size={20} weight="bold" aria-hidden="true" />
          <h2 id="reader-prefs-title" className="text-base font-black text-ink">
            {account ? copy.devicePrefsTitle : copy.prefs}
          </h2>
        </div>

        <div className="mt-5 grid gap-6 md:grid-cols-3">
          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wider text-stone">{copy.theme}</legend>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button type="button" onClick={() => chooseTheme('system')} className={segButton(theme === 'system')} aria-pressed={theme === 'system'}>
                <Desktop size={15} weight="bold" aria-hidden="true" />
                {copy.themeSystem}
              </button>
              <button type="button" onClick={() => chooseTheme('light')} className={segButton(theme === 'light')} aria-pressed={theme === 'light'}>
                <Sun size={15} weight="bold" aria-hidden="true" />
                {copy.themeLight}
              </button>
              <button type="button" onClick={() => chooseTheme('dark')} className={segButton(theme === 'dark')} aria-pressed={theme === 'dark'}>
                <Moon size={15} weight="bold" aria-hidden="true" />
                {copy.themeDark}
              </button>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wider text-stone">{copy.textSize}</legend>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {([['sm', copy.textSm], ['md', copy.textMd], ['lg', copy.textLg]] as const).map(([value, label]) => (
                <button key={value} type="button" onClick={() => chooseScale(value)} className={segButton(scale === value)} aria-pressed={scale === value}>
                  <TextAa size={15} weight="bold" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wider text-stone">{copy.tint}</legend>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {([['paper', copy.tintPaper], ['night', copy.tintNight], ['white', copy.tintWhite]] as const).map(([value, label]) => (
                <button key={value} type="button" onClick={() => chooseTint(value)} className={segButton(tint === value)} aria-pressed={tint === value}>
                  <span
                    aria-hidden="true"
                    className="inline-block h-3.5 w-3.5 rounded-full border border-line-strong"
                    style={{ background: value === 'paper' ? '#f6efdf' : value === 'night' ? '#141a19' : '#ffffff' }}
                  />
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      {/* Data controls */}
      <section className="surface-card p-6" aria-labelledby="reader-data-title">
        <h2 id="reader-data-title" className="border-b-2 border-accent pb-3 text-base font-black text-ink">
          {copy.data}
        </h2>
        <p className="mt-3 max-w-[56ch] text-xs leading-relaxed text-stone">{copy.dataNote}</p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={exportData}
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-line px-4 text-xs font-bold text-ink hover:border-accent hover:text-accent"
          >
            <DownloadSimple size={15} weight="bold" aria-hidden="true" />
            {copy.export}
          </button>
          <button
            type="button"
            onClick={eraseAll}
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-line px-4 text-xs font-bold text-stone hover:border-danger hover:text-danger"
          >
            <Trash size={15} weight="bold" aria-hidden="true" />
            {copy.erase}
          </button>
        </div>
      </section>
    </div>
  )
}
