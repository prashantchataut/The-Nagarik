'use client'

import { useState } from 'react'
import { CheckCircle, EnvelopeSimple, WarningCircle } from '@phosphor-icons/react'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const COPY = {
  ne: {
    title: 'द नागरिक न्युजलेटर',
    body: 'हरेक बिहान मुख्य समाचार, विश्लेषण र पात्रो सोझै तपाईंको इमेलमा।',
    placeholder: 'तपाईंको इमेल ठेगाना',
    submit: 'सदस्यता लिनुहोस्',
    submitting: 'पठाउँदै...',
    invalid: 'कृपया मान्य इमेल ठेगाना हाल्नुहोस्।',
    success: 'धन्यवाद! तपाईंको सदस्यता दर्ता भयो।',
    error: 'अहिले दर्ता हुन सकेन। केही बेरपछि पुनः प्रयास गर्नुहोस्।',
    privacy: 'हामी तपाईंको इमेल कहिल्यै बेच्दैनौं। जुनसुकै बेला रद्द गर्न सकिन्छ।',
    label: 'इमेल ठेगाना',
  },
  en: {
    title: 'The Nagarik Newsletter',
    body: 'Top civic stories, analysis, and the daily patro in your inbox every morning.',
    placeholder: 'Your email address',
    submit: 'Subscribe',
    submitting: 'Sending...',
    invalid: 'Please enter a valid email address.',
    success: 'Thank you! Your subscription is registered.',
    error: 'Could not subscribe right now. Please try again shortly.',
    privacy: 'We never sell your email. Unsubscribe anytime.',
    label: 'Email address',
  },
} as const

/**
 * Newsletter signup card with client-side email validation.
 * Used in the site footer and article sidebar.
 */
export function NewsletterCard({
  locale = 'ne',
  variant = 'sidebar',
}: {
  locale?: 'ne' | 'en'
  variant?: 'sidebar' | 'footer'
}) {
  const copy = COPY[locale]
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'invalid' | 'error'>('idle')
  const inputId = `newsletter-email-${variant}`

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const value = email.trim()
    if (!EMAIL_RE.test(value)) {
      setStatus('invalid')
      return
    }
    setStatus('submitting')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: value, locale }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setStatus('done')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section
      aria-label={copy.title}
      className={
        variant === 'footer'
          ? 'rounded-[var(--radius-panel)] border border-line bg-paper p-5'
          : 'rounded-[var(--radius-panel)] border border-accent/30 bg-accent-muted/40 p-5'
      }
    >
      <div className="flex items-center gap-2 text-accent">
        <EnvelopeSimple size={20} weight="bold" aria-hidden="true" />
        <h2 className="text-sm font-black text-ink">{copy.title}</h2>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-stone">{copy.body}</p>

      {status === 'done' ? (
        <p
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-success"
          role="status"
        >
          <CheckCircle size={16} weight="fill" aria-hidden="true" />
          {copy.success}
        </p>
      ) : (
        <form className="mt-4" onSubmit={onSubmit} noValidate>
          <label className="sr-only" htmlFor={inputId}>
            {copy.label}
          </label>
          <div className="flex">
            <input
              id={inputId}
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (status === 'invalid' || status === 'error') setStatus('idle')
              }}
              placeholder={copy.placeholder}
              aria-invalid={status === 'invalid'}
              aria-describedby={status === 'invalid' || status === 'error' ? `${inputId}-msg` : undefined}
              className="min-h-11 w-full rounded-l-[var(--radius-control)] border border-r-0 border-line bg-field px-3 text-sm text-ink placeholder:text-stone/70 focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="inline-flex min-h-11 shrink-0 items-center rounded-r-[var(--radius-control)] accent-solid px-4 text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {status === 'submitting' ? copy.submitting : copy.submit}
            </button>
          </div>
          <div aria-live="polite">
            {status === 'invalid' || status === 'error' ? (
              <p
                id={`${inputId}-msg`}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-danger"
              >
                <WarningCircle size={14} weight="bold" aria-hidden="true" />
                {status === 'invalid' ? copy.invalid : copy.error}
              </p>
            ) : null}
          </div>
        </form>
      )}
      <p className="mt-3 text-[0.68rem] leading-relaxed text-stone">{copy.privacy}</p>
    </section>
  )
}
