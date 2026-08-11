'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  CheckCircle,
  IdentificationBadge,
  Newspaper,
  ShieldCheck,
  UserCircle,
  WarningCircle,
} from '@phosphor-icons/react'

type AccountKind = 'reader' | 'journalist'

const COPY = {
  ne: {
    chooseTitle: 'कस्तो खाता चाहिन्छ?',
    readerCard: 'पाठक खाता',
    readerDesc: 'रुचिअनुसारको समाचार, व्यक्तिगत प्रोफाइल र प्राथमिकता। तुरुन्तै खुल्छ।',
    readerBadge: 'तुरुन्तै',
    journalistCard: 'पत्रकार खाता',
    journalistDesc: 'समाचारकक्षमा लेख्न आवेदन दिनुहोस्। सम्पादकीय टोलीले पहिचान प्रमाणित गरेपछि मात्र खाता खुल्छ।',
    journalistBadge: 'प्रमाणीकरण आवश्यक',
    name: 'पूरा नाम',
    email: 'इमेल ठेगाना',
    password: 'पासवर्ड (कम्तीमा ८ अक्षर)',
    phone: 'फोन (ऐच्छिक)',
    organization: 'संस्था / अनुभव (ऐच्छिक)',
    portfolio: 'पोर्टफोलियो लिङ्क (ऐच्छिक)',
    message: 'तपाईंका बिट, अनुभव र किन जोडिन चाहनुहुन्छ? (कम्तीमा २० अक्षर)',
    readerSubmit: 'पाठक खाता खोल्नुहोस्',
    journalistSubmit: 'आवेदन पठाउनुहोस्',
    submitting: 'पठाउँदै...',
    haveAccount: 'खाता छ?',
    loginLink: 'पाठक लगइन',
    staffNote: 'समाचारकक्ष स्टाफ हुनुहुन्छ?',
    staffLink: 'स्टाफ लगइन',
    verifyNote: 'पत्रकार आवेदन सम्पादकीय टोलीले समीक्षा गर्छ। स्वीकृत भएपछि लगइन विवरण व्यक्तिगत रूपमा पठाइन्छ; कसैले आफैँ पत्रकार बन्न सक्दैन।',
    applied: 'आवेदन दर्ता भयो! सम्पादकीय टोलीले पहिचान प्रमाणित गरेपछि तपाईंलाई सम्पर्क गरिनेछ।',
    emailTaken: 'यो इमेलमा खाता पहिले नै छ। लगइन गर्नुहोस्।',
    offline: 'खाता सेवा अहिले उपलब्ध छैन। केही समयपछि पुनः प्रयास गर्नुहोस्।',
    genericError: 'काम पूरा हुन सकेन। पुनः प्रयास गर्नुहोस्।',
    rateLimit: 'धेरै प्रयास भयो। केही मिनेटपछि पुनः प्रयास गर्नुहोस्।',
    messageShort: 'सन्देश कम्तीमा २० अक्षरको हुनुपर्छ।',
  },
  en: {
    chooseTitle: 'Which account do you need?',
    readerCard: 'Reader account',
    readerDesc: 'Personalised news, profile, and preferences. Opens instantly.',
    readerBadge: 'Instant',
    journalistCard: 'Journalist account',
    journalistDesc: 'Apply to write in the newsroom. An editor verifies your identity before any account is created.',
    journalistBadge: 'Verification required',
    name: 'Full name',
    email: 'Email address',
    password: 'Password (8+ characters)',
    phone: 'Phone (optional)',
    organization: 'Organization / experience (optional)',
    portfolio: 'Portfolio link (optional)',
    message: 'Your beats, experience, and why you want to join (20+ characters)',
    readerSubmit: 'Create reader account',
    journalistSubmit: 'Submit application',
    submitting: 'Sending...',
    haveAccount: 'Already have an account?',
    loginLink: 'Reader login',
    staffNote: 'Newsroom staff?',
    staffLink: 'Staff login',
    verifyNote: 'Journalist applications are reviewed by the editorial team. Credentials are handed over personally after approval; nobody can self-assign the journalist role.',
    applied: 'Application received! The editorial team will contact you after verifying your identity.',
    emailTaken: 'An account with this email already exists. Please log in.',
    offline: 'The account service is unavailable right now. Please try again later.',
    genericError: 'Something went wrong. Please retry.',
    rateLimit: 'Too many attempts. Please retry in a few minutes.',
    messageShort: 'The message needs at least 20 characters.',
  },
} as const

export function RegisterClient({ locale = 'ne' }: { locale?: 'ne' | 'en' }) {
  const copy = COPY[locale]
  const router = useRouter()
  const [kind, setKind] = useState<AccountKind>('reader')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [applied, setApplied] = useState(false)

  // Shared fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  // Reader
  const [password, setPassword] = useState('')
  // Journalist
  const [phone, setPhone] = useState('')
  const [organization, setOrganization] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('') // honeypot

  async function submitReader(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/reader/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, password, locale, website }),
      })
      const data = (await res.json().catch(() => ({}))) as { reason?: string; code?: string }
      if (res.status === 503) return setError(copy.offline)
      if (res.status === 429) return setError(copy.rateLimit)
      if (data.reason === 'email-taken') return setError(copy.emailTaken)
      if (!res.ok) return setError(copy.genericError)
      router.push(`/${locale}/account/profile`)
      router.refresh()
    } catch {
      setError(copy.genericError)
    } finally {
      setBusy(false)
    }
  }

  async function submitJournalist(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (message.trim().length < 20) return setError(copy.messageShort)
    setBusy(true)
    try {
      const res = await fetch('/api/journalist/apply', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          organization,
          portfolioUrl,
          message,
          locale,
          website,
        }),
      })
      if (res.status === 503) return setError(copy.offline)
      if (res.status === 429) return setError(copy.rateLimit)
      if (!res.ok) return setError(copy.genericError)
      setApplied(true)
    } catch {
      setError(copy.genericError)
    } finally {
      setBusy(false)
    }
  }

  const cardClass = (active: boolean) =>
    `flex w-full flex-col gap-2 rounded-[var(--radius-panel)] border-2 p-5 text-left transition-all ${
      active
        ? 'border-accent bg-accent-muted/50 shadow-md'
        : 'border-line bg-paper hover:border-accent/50'
    }`

  return (
    <div>
      {/* Account type chooser */}
      <fieldset>
        <legend className="text-sm font-black text-ink">{copy.chooseTitle}</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={copy.chooseTitle}>
          <button
            type="button"
            role="radio"
            aria-checked={kind === 'reader'}
            onClick={() => {
              setKind('reader')
              setError('')
            }}
            className={cardClass(kind === 'reader')}
          >
            <span className="flex items-center gap-2">
              <UserCircle size={22} weight="bold" className="text-accent" aria-hidden="true" />
              <span className="text-base font-black text-ink">{copy.readerCard}</span>
              <span className="ml-auto rounded-full bg-success-muted px-2 py-0.5 text-[0.65rem] font-bold text-success">
                {copy.readerBadge}
              </span>
            </span>
            <span className="text-xs leading-relaxed text-stone">{copy.readerDesc}</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={kind === 'journalist'}
            onClick={() => {
              setKind('journalist')
              setError('')
            }}
            className={cardClass(kind === 'journalist')}
          >
            <span className="flex items-center gap-2">
              <IdentificationBadge size={22} weight="bold" className="text-accent" aria-hidden="true" />
              <span className="text-base font-black text-ink">{copy.journalistCard}</span>
              <span className="ml-auto rounded-full bg-warning-muted px-2 py-0.5 text-[0.65rem] font-bold text-warning">
                {copy.journalistBadge}
              </span>
            </span>
            <span className="text-xs leading-relaxed text-stone">{copy.journalistDesc}</span>
          </button>
        </div>
      </fieldset>

      {/* Honeypot */}
      <div className="sr-only" aria-hidden="true">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      {/* Reader signup */}
      {kind === 'reader' ? (
        <form onSubmit={submitReader} className="mt-6 space-y-4" noValidate>
          <label className="grid gap-1 text-xs font-bold text-ink">
            {copy.name}
            <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={60} autoComplete="name" className="newsroom-field min-h-11 px-3 text-sm font-normal" />
          </label>
          <label className="grid gap-1 text-xs font-bold text-ink">
            {copy.email}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="newsroom-field min-h-11 px-3 text-sm font-normal" />
          </label>
          <label className="grid gap-1 text-xs font-bold text-ink">
            {copy.password}
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" className="newsroom-field min-h-11 px-3 text-sm font-normal" />
          </label>

          <div aria-live="polite" className="min-h-5">
            {error ? (
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-danger">
                <WarningCircle size={14} weight="bold" aria-hidden="true" />
                {error}
              </p>
            ) : null}
          </div>

          <button type="submit" disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center rounded-[var(--radius-control)] accent-solid px-5 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60">
            {busy ? copy.submitting : copy.readerSubmit}
          </button>
        </form>
      ) : applied ? (
        <div className="mt-6 rounded-[var(--radius-panel)] border border-success/40 bg-success-muted/40 p-6 text-center">
          <CheckCircle size={36} weight="fill" className="mx-auto text-success" aria-hidden="true" />
          <p className="mt-3 text-sm font-bold leading-relaxed text-ink">{copy.applied}</p>
        </div>
      ) : (
        <form onSubmit={submitJournalist} className="mt-6 space-y-4" noValidate>
          <p className="inline-flex items-start gap-2 rounded-[var(--radius-control)] bg-warning-muted/60 px-3 py-2.5 text-xs leading-relaxed text-ink">
            <ShieldCheck size={16} weight="bold" className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
            {copy.verifyNote}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-bold text-ink">
              {copy.name}
              <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} autoComplete="name" className="newsroom-field min-h-11 px-3 text-sm font-normal" />
            </label>
            <label className="grid gap-1 text-xs font-bold text-ink">
              {copy.email}
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="newsroom-field min-h-11 px-3 text-sm font-normal" />
            </label>
            <label className="grid gap-1 text-xs font-bold text-ink">
              {copy.phone}
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} autoComplete="tel" className="newsroom-field min-h-11 px-3 text-sm font-normal" />
            </label>
            <label className="grid gap-1 text-xs font-bold text-ink">
              {copy.organization}
              <input value={organization} onChange={(e) => setOrganization(e.target.value)} maxLength={120} className="newsroom-field min-h-11 px-3 text-sm font-normal" />
            </label>
          </div>
          <label className="grid gap-1 text-xs font-bold text-ink">
            {copy.portfolio}
            <input type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} maxLength={300} placeholder="https://" className="newsroom-field min-h-11 px-3 text-sm font-normal" />
          </label>
          <label className="grid gap-1 text-xs font-bold text-ink">
            {copy.message}
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} required minLength={20} maxLength={2000} rows={4} className="newsroom-field px-3 py-2.5 text-sm font-normal leading-relaxed" />
          </label>

          <div aria-live="polite" className="min-h-5">
            {error ? (
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-danger">
                <WarningCircle size={14} weight="bold" aria-hidden="true" />
                {error}
              </p>
            ) : null}
          </div>

          <button type="submit" disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] border-2 border-accent bg-paper px-5 text-sm font-bold text-accent transition-colors hover:bg-accent-muted disabled:opacity-60">
            <Newspaper size={17} weight="bold" aria-hidden="true" />
            {busy ? copy.submitting : copy.journalistSubmit}
          </button>
        </form>
      )}

      {/* Cross links */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs">
        <p className="text-stone">
          {copy.haveAccount}{' '}
          <Link href={`/${locale}/login`} className="font-bold text-accent hover:underline">
            {copy.loginLink}
          </Link>
        </p>
        <p className="text-stone">
          {copy.staffNote}{' '}
          <Link href="/admin/login" className="font-bold text-accent hover:underline">
            {copy.staffLink}
          </Link>
        </p>
      </div>
    </div>
  )
}
