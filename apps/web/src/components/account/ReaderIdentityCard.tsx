'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PencilSimple } from '@phosphor-icons/react'
import {
  PROFILE_EVENT,
  readBookmarks,
  readHistory,
  readProfile,
  swatchBg,
  type ReaderProfile,
} from './reader-store'

const COPY = {
  ne: {
    guest: 'नागरिक पाठक',
    edit: 'प्रोफाइल सम्पादन',
    saved: 'सुरक्षित',
    read: 'पढाइ',
    interests: 'रुचि',
    localNote: 'तपाईंको प्रोफाइल यही उपकरणमा मात्र सुरक्षित छ। खाता वा ट्र्याकिङ आवश्यक छैन।',
  },
  en: {
    guest: 'Nagarik Reader',
    edit: 'Edit profile',
    saved: 'Saved',
    read: 'Reading',
    interests: 'Interests',
    localNote: 'Your profile lives on this device only. No account, no tracking.',
  },
} as const

export function ReaderIdentityCard({ locale = 'ne' }: { locale?: 'ne' | 'en' }) {
  const copy = COPY[locale]
  const [profile, setProfile] = useState<ReaderProfile>({ name: '', color: 'teal', interests: [] })
  const [counts, setCounts] = useState({ saved: 0, history: 0 })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const sync = () => {
      setProfile(readProfile())
      setCounts({ saved: readBookmarks().length, history: readHistory().length })
      setHydrated(true)
    }
    sync()
    window.addEventListener(PROFILE_EVENT, sync)
    return () => window.removeEventListener(PROFILE_EVENT, sync)
  }, [])

  const displayName = profile.name.trim() || copy.guest
  const initial = displayName.slice(0, 1).toUpperCase()

  return (
    <section className="surface-card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
      <span
        aria-hidden="true"
        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-3xl font-black text-white shadow-md"
        style={{ background: swatchBg(profile.color) }}
      >
        {hydrated ? initial : '·'}
      </span>

      <div className="min-w-0 flex-1">
        <h2 className="text-2xl font-black tracking-tight text-ink">
          {hydrated ? displayName : '...'}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-stone">
          <span>
            {copy.saved}: <strong className="tabular-nums text-ink">{counts.saved}</strong>
          </span>
          <span>
            {copy.read}: <strong className="tabular-nums text-ink">{counts.history}</strong>
          </span>
          {profile.interests.length ? (
            <span>
              {copy.interests}:{' '}
              <strong className="tabular-nums text-ink">{profile.interests.length}</strong>
            </span>
          ) : null}
        </div>
        <p className="mt-2 max-w-[52ch] text-[0.7rem] leading-relaxed text-stone">{copy.localNote}</p>
      </div>

      <Link
        href={`/${locale}/account/profile`}
        className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-[var(--radius-control)] border border-line bg-paper px-4 text-xs font-bold text-ink hover:border-accent hover:text-accent sm:self-center"
      >
        <PencilSimple size={15} weight="bold" aria-hidden="true" />
        {copy.edit}
      </Link>
    </section>
  )
}
