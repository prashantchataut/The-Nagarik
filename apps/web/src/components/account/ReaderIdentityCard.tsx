'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Fire, PencilSimple, SealCheck, SignOut, UserPlus } from '@phosphor-icons/react'
import { readingStreak } from '@thenagarik/algorithms'
import {
  PROFILE_EVENT,
  readBookmarks,
  readHistory,
  readProfile,
  swatchBg,
  type ReaderProfile,
} from './reader-store'

export type ReaderAccount = {
  id: string
  email: string
  name: string
  avatarColor: string
  interests: string[]
}

const COPY = {
  ne: {
    guest: 'नागरिक पाठक',
    accountBadge: 'पाठक खाता',
    edit: 'प्रोफाइल सम्पादन',
    logout: 'लगआउट',
    saved: 'सुरक्षित',
    read: 'पढाइ',
    interests: 'रुचि',
    streak: 'दिनको पढाइ शृङ्खला',
    milestone: 'माइलस्टोन!',
    signupTitle: 'आफ्नो पाठक खाता खोल्नुहोस्',
    signupBody: 'रुचिअनुसारको समाचार, प्रोफाइल र प्राथमिकता एकै ठाउँमा।',
    signupCta: 'खाता खोल्नुहोस्',
    loginCta: 'लगइन',
  },
  en: {
    guest: 'Nagarik Reader',
    accountBadge: 'Reader account',
    edit: 'Edit profile',
    logout: 'Log out',
    saved: 'Saved',
    read: 'Reading',
    interests: 'Interests',
    streak: 'day reading streak',
    milestone: 'Milestone!',
    signupTitle: 'Create your reader account',
    signupBody: 'Personalised news, profile, and preferences in one place.',
    signupCta: 'Create account',
    loginCta: 'Log in',
  },
} as const

export function ReaderIdentityCard({
  locale = 'ne',
  account = null,
}: {
  locale?: 'ne' | 'en'
  account?: ReaderAccount | null
}) {
  const copy = COPY[locale]
  const router = useRouter()
  const [profile, setProfile] = useState<ReaderProfile>({ name: '', color: 'teal', interests: [] })
  const [counts, setCounts] = useState({ saved: 0, history: 0 })
  const [streak, setStreak] = useState<{ current: number; milestone: number | null }>({
    current: 0,
    milestone: null,
  })
  const [hydrated, setHydrated] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    const sync = () => {
      setProfile(readProfile())
      const history = readHistory()
      setCounts({ saved: readBookmarks().length, history: history.length })
      // ALGO ret.streak_engine - consecutive local reading days.
      const toLocalDay = (iso: string) => {
        const d = new Date(iso)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      }
      const result = readingStreak(
        history.map((h) => toLocalDay(h.updatedAt)),
        toLocalDay(new Date().toISOString()),
      )
      setStreak({ current: result.current, milestone: result.milestone })
      setHydrated(true)
    }
    sync()
    window.addEventListener(PROFILE_EVENT, sync)
    return () => window.removeEventListener(PROFILE_EVENT, sync)
  }, [])

  async function logout() {
    setSigningOut(true)
    try {
      await fetch('/api/reader/logout', { method: 'POST' })
    } catch {
      // Cookie clearing is best-effort; refresh regardless.
    }
    router.refresh()
  }

  const displayName = account?.name || profile.name.trim() || copy.guest
  const color = account?.avatarColor || profile.color
  const interestsCount = account ? account.interests.length : profile.interests.length
  const initial = displayName.slice(0, 1).toUpperCase()

  return (
    <section className="surface-card p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <span
          aria-hidden="true"
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-3xl font-black text-white shadow-md"
          style={{ background: swatchBg(color) }}
        >
          {hydrated || account ? initial : '·'}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-black tracking-tight text-ink">
              {hydrated || account ? displayName : '...'}
            </h2>
            {account ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-2.5 py-0.5 text-[0.68rem] font-bold text-accent">
                <SealCheck size={13} weight="fill" aria-hidden="true" />
                {copy.accountBadge}
              </span>
            ) : null}
          </div>
          {account ? <p className="mt-1 text-xs text-stone">{account.email}</p> : null}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-stone">
            <span>
              {copy.saved}: <strong className="tabular-nums text-ink">{counts.saved}</strong>
            </span>
            <span>
              {copy.read}: <strong className="tabular-nums text-ink">{counts.history}</strong>
            </span>
            {interestsCount ? (
              <span>
                {copy.interests}: <strong className="tabular-nums text-ink">{interestsCount}</strong>
              </span>
            ) : null}
          </div>
          {streak.current >= 2 ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-warning-muted px-3 py-1 text-xs font-bold text-warning">
              <Fire size={14} weight="fill" aria-hidden="true" />
              <span className="tabular-nums">{streak.current}</span> {copy.streak}
              {streak.milestone ? <span className="ml-1">· {copy.milestone}</span> : null}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 self-start sm:flex-col sm:self-center">
          <Link
            href={`/${locale}/account/profile`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-line bg-paper px-4 text-xs font-bold text-ink hover:border-accent hover:text-accent"
          >
            <PencilSimple size={15} weight="bold" aria-hidden="true" />
            {copy.edit}
          </Link>
          {account ? (
            <button
              type="button"
              onClick={logout}
              disabled={signingOut}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-line bg-paper px-4 text-xs font-bold text-stone hover:border-danger hover:text-danger disabled:opacity-60"
            >
              <SignOut size={15} weight="bold" aria-hidden="true" />
              {copy.logout}
            </button>
          ) : null}
        </div>
      </div>

      {/* Signup call-to-action: readers without an account */}
      {!account ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-panel)] border border-accent/30 bg-accent-muted/40 p-4">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-sm font-black text-ink">
              <UserPlus size={18} weight="bold" className="text-accent" aria-hidden="true" />
              {copy.signupTitle}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-stone">{copy.signupBody}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/${locale}/register`}
              className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] accent-solid px-4 text-xs font-bold transition-opacity hover:opacity-90"
            >
              {copy.signupCta}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-line bg-paper px-4 text-xs font-bold text-ink hover:border-accent hover:text-accent"
            >
              {copy.loginCta}
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  )
}
