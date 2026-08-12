'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { LockKey, WarningCircle } from '@phosphor-icons/react'
import { invalidateSessionProbe, syncLibrary } from '@/components/account/library-sync'

const COPY = {
  ne: {
    password: 'नयाँ पासवर्ड (कम्तीमा ८ अक्षर)',
    confirm: 'पासवर्ड पुनः लेख्नुहोस्',
    submit: 'पासवर्ड बदल्नुहोस्',
    submitting: 'बदल्दै...',
    mismatch: 'दुई पासवर्ड मिलेनन्।',
    tooShort: 'पासवर्ड कम्तीमा ८ अक्षरको हुनुपर्छ।',
    badToken: 'यो रिसेट लिङ्क अमान्य वा म्याद सकिएको छ। नयाँ लिङ्क माग्नुहोस्।',
    requestNew: 'नयाँ लिङ्क माग्नुहोस्',
    rateLimit: 'धेरै प्रयास भयो। केही मिनेट कुर्नुहोस्।',
    offline: 'खाता सेवा अहिले उपलब्ध छैन।',
    generic: 'पासवर्ड बदल्न सकिएन। पुनः प्रयास गर्नुहोस्।',
    missingToken: 'रिसेट लिङ्क अपूर्ण छ। इमेलको लिङ्क सिधै खोल्नुहोस्।',
  },
  en: {
    password: 'New password (8+ characters)',
    confirm: 'Repeat the password',
    submit: 'Change password',
    submitting: 'Changing...',
    mismatch: 'The two passwords do not match.',
    tooShort: 'The password must be at least 8 characters.',
    badToken: 'This reset link is invalid or has expired. Request a new one.',
    requestNew: 'Request a new link',
    rateLimit: 'Too many attempts. Please wait a few minutes.',
    offline: 'The account service is unavailable right now.',
    generic: 'The password could not be changed. Please retry.',
    missingToken: 'This reset link is incomplete. Open the link from the email directly.',
  },
} as const

export function ResetPasswordForm({ locale = 'ne' }: { locale?: 'ne' | 'en' }) {
  const copy = COPY[locale]
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [tokenDead, setTokenDead] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (password.length < 8) return setError(copy.tooShort)
    if (password !== confirm) return setError(copy.mismatch)
    setBusy(true)
    try {
      const res = await fetch('/api/reader/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (res.ok) {
        // The token proved email ownership; the API logged the reader in.
        invalidateSessionProbe()
        void syncLibrary()
        router.push(`/${locale}/account`)
        router.refresh()
        return
      }
      const body = (await res.json().catch(() => null)) as { reason?: string } | null
      if (res.status === 429) setError(copy.rateLimit)
      else if (res.status === 503) setError(copy.offline)
      else if (body?.reason === 'bad-token') {
        setTokenDead(true)
        setError(copy.badToken)
      } else setError(copy.generic)
    } catch {
      setError(copy.generic)
    } finally {
      setBusy(false)
    }
  }

  if (!token) {
    return (
      <div role="alert" className="space-y-4">
        <p className="text-sm leading-relaxed text-stone">{copy.missingToken}</p>
        <Link
          href={`/${locale}/forgot-password`}
          className="inline-flex min-h-11 items-center text-sm font-bold text-accent underline-offset-4 hover:underline"
        >
          {copy.requestNew}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <label className="grid gap-1 text-xs font-bold text-ink">
        {copy.password}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          autoFocus
          className="newsroom-field min-h-12 px-3 text-sm font-normal"
        />
      </label>
      <label className="grid gap-1 text-xs font-bold text-ink">
        {copy.confirm}
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="newsroom-field min-h-12 px-3 text-sm font-normal"
        />
      </label>
      {error ? (
        <p role="alert" className="flex items-start gap-1.5 text-xs font-semibold text-danger">
          <WarningCircle size={15} weight="bold" className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
      {tokenDead ? (
        <Link
          href={`/${locale}/forgot-password`}
          className="inline-flex min-h-11 items-center text-sm font-bold text-accent underline-offset-4 hover:underline"
        >
          {copy.requestNew}
        </Link>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="accent-solid inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] text-sm font-black disabled:opacity-60"
      >
        <LockKey size={17} weight="bold" aria-hidden="true" />
        {busy ? copy.submitting : copy.submit}
      </button>
    </form>
  )
}
