'use client'

import Link from 'next/link'
import { useState } from 'react'
import { EnvelopeSimple, PaperPlaneTilt, WarningCircle } from '@phosphor-icons/react'

const COPY = {
  ne: {
    email: 'इमेल ठेगाना',
    submit: 'रिसेट लिङ्क पठाउनुहोस्',
    submitting: 'पठाउँदै...',
    sentTitle: 'इमेल जाँच गर्नुहोस्',
    sentBody:
      'यो इमेलमा खाता छ भने पासवर्ड रिसेट लिङ्क पठाइएको छ। लिङ्क १ घण्टासम्म मान्य रहन्छ। स्प्याम फोल्डर पनि हेर्नुहोस्।',
    backToLogin: 'लगइनमा फर्कनुहोस्',
    rateLimit: 'धेरै प्रयास भयो। केही मिनेट कुर्नुहोस्।',
    offline: 'खाता सेवा अहिले उपलब्ध छैन।',
    invalid: 'मान्य इमेल ठेगाना चाहिन्छ।',
    generic: 'अनुरोध पठाउन सकिएन। पुनः प्रयास गर्नुहोस्।',
  },
  en: {
    email: 'Email address',
    submit: 'Send reset link',
    submitting: 'Sending...',
    sentTitle: 'Check your email',
    sentBody:
      'If an account exists for this email, a password reset link is on its way. The link is valid for 1 hour. Check your spam folder too.',
    backToLogin: 'Back to login',
    rateLimit: 'Too many attempts. Please wait a few minutes.',
    offline: 'The account service is unavailable right now.',
    invalid: 'A valid email address is required.',
    generic: 'The request could not be sent. Please retry.',
  },
} as const

export function ForgotPasswordForm({ locale = 'ne' }: { locale?: 'ne' | 'en' }) {
  const copy = COPY[locale]
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/reader/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setSent(true)
        return
      }
      if (res.status === 429) setError(copy.rateLimit)
      else if (res.status === 503) setError(copy.offline)
      else if (res.status === 400) setError(copy.invalid)
      else setError(copy.generic)
    } catch {
      setError(copy.generic)
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div role="status" className="space-y-4">
        <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-line bg-paper-elevated p-4">
          <EnvelopeSimple size={22} weight="bold" className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
          <div>
            <p className="text-sm font-black text-ink">{copy.sentTitle}</p>
            <p className="mt-1 text-sm leading-relaxed text-stone">{copy.sentBody}</p>
          </div>
        </div>
        <Link
          href={`/${locale}/login`}
          className="inline-flex min-h-11 items-center text-sm font-bold text-accent underline-offset-4 hover:underline"
        >
          {copy.backToLogin}
        </Link>
      </div>
    )
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
          autoFocus
          className="newsroom-field min-h-12 px-3 text-sm font-normal"
        />
      </label>
      {error ? (
        <p role="alert" className="flex items-start gap-1.5 text-xs font-semibold text-danger">
          <WarningCircle size={15} weight="bold" className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy || !email.trim()}
        className="accent-solid inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] text-sm font-black disabled:opacity-60"
      >
        <PaperPlaneTilt size={17} weight="bold" aria-hidden="true" />
        {busy ? copy.submitting : copy.submit}
      </button>
    </form>
  )
}
