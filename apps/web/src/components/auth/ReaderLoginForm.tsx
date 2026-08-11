'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { SignIn, WarningCircle } from '@phosphor-icons/react'

const COPY = {
  ne: {
    email: 'इमेल ठेगाना',
    password: 'पासवर्ड',
    submit: 'लगइन गर्नुहोस्',
    submitting: 'लगइन हुँदै...',
    invalid: 'इमेल वा पासवर्ड मिलेन।',
    disabled: 'यो खाता निष्क्रिय गरिएको छ।',
    offline: 'खाता सेवा अहिले उपलब्ध छैन।',
    rateLimit: 'धेरै प्रयास भयो। केही मिनेट कुर्नुहोस्।',
    generic: 'लगइन हुन सकेन। पुनः प्रयास गर्नुहोस्।',
    staffHint: 'स्टाफ खाताले यहाँ होइन, स्टाफ लगइनबाट प्रवेश गर्छ।',
  },
  en: {
    email: 'Email address',
    password: 'Password',
    submit: 'Log in',
    submitting: 'Logging in...',
    invalid: 'Email or password did not match.',
    disabled: 'This account has been disabled.',
    offline: 'The account service is unavailable right now.',
    rateLimit: 'Too many attempts. Please wait a few minutes.',
    generic: 'Login failed. Please retry.',
    staffHint: 'Staff accounts sign in through the staff login, not here.',
  },
} as const

export function ReaderLoginForm({ locale = 'ne' }: { locale?: 'ne' | 'en' }) {
  const copy = COPY[locale]
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/reader/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        const next = searchParams?.get('next')
        // Only same-site relative paths are honoured.
        const target = next && next.startsWith('/') && !next.startsWith('//')
          ? next
          : `/${locale}/account`
        router.push(target)
        router.refresh()
        return
      }
      if (res.status === 503) setError(copy.offline)
      else if (res.status === 429) setError(copy.rateLimit)
      else if (res.status === 403) setError(copy.disabled)
      else if (res.status === 401) setError(`${copy.invalid} ${copy.staffHint}`)
      else setError(copy.generic)
    } catch {
      setError(copy.generic)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <label className="grid gap-1 text-xs font-bold text-ink">
        {copy.email}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="newsroom-field min-h-12 px-3 text-sm font-normal"
        />
      </label>
      <label className="grid gap-1 text-xs font-bold text-ink">
        {copy.password}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="newsroom-field min-h-12 px-3 text-sm font-normal"
        />
      </label>

      <div aria-live="polite" className="min-h-5">
        {error ? (
          <p className="inline-flex items-start gap-1.5 text-xs font-semibold leading-relaxed text-danger">
            <WarningCircle size={14} weight="bold" className="mt-0.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] accent-solid px-5 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        <SignIn size={17} weight="bold" aria-hidden="true" />
        {busy ? copy.submitting : copy.submit}
      </button>
    </form>
  )
}
