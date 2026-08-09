'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CircleNotch, Eye, EyeSlash } from '@phosphor-icons/react'

type FieldErrors = { email?: string; password?: string }

export function StaffLoginForm({
  nextPath = '/admin',
  authReady = true,
  pitchHint = false,
}: {
  nextPath?: string
  authReady?: boolean
  pitchHint?: boolean
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [pending, startTransition] = useTransition()
  void pitchHint

  function validate(email: string, password: string): FieldErrors {
    const next: FieldErrors = {}
    if (!email) next.email = 'इमेल आवश्यक छ।'
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'मान्य इमेल ठेगाना लेख्नुहोस्।'
    if (!password) next.password = 'पासवर्ड आवश्यक छ।'
    return next
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!authReady) {
      setError('सम्पादकीय प्रवेश अहिले उपलब्ध छैन। प्रणाली प्रशासकलाई सम्पर्क गर्नुहोस्।')
      return
    }

    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? '').trim().toLowerCase()
    const password = String(form.get('password') ?? '')
    const validation = validate(email, password)
    setFieldErrors(validation)
    if (Object.keys(validation).length) return

    startTransition(async () => {
      try {
        const res = await fetch('/api/staff/login', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        })
        const body = (await res.json().catch(() => ({}))) as { message?: string; code?: string }

        if (!res.ok) {
          if (res.status === 503 || body.code === 'AUTH_UNAVAILABLE') {
            setError('सम्पादकीय प्रवेश अहिले उपलब्ध छैन। केही समयपछि पुनः प्रयास गर्नुहोस्।')
            return
          }
          if (body.code === 'ACCOUNT_DISABLED') {
            setError('यो खाता निष्क्रिय गरिएको छ। समाचारकक्ष प्रशासकलाई सम्पर्क गर्नुहोस्।')
            return
          }
          setError('इमेल वा पासवर्ड मिलेन। फेरि जाँच गर्नुहोस्।')
          return
        }

        const safeNext =
          nextPath.startsWith('/admin') || nextPath.startsWith('/journalist') ? nextPath : '/admin'
        router.replace(safeNext)
        router.refresh()
      } catch {
        setError('नेटवर्क जडान हुन सकेन। इन्टरनेट जाँचेर फेरि प्रयास गर्नुहोस्।')
      }
    })
  }

  const fieldClass =
    'newsroom-field mt-2 h-12 w-full px-3.5 text-[0.95rem] placeholder:text-stone/70 disabled:opacity-70'

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate autoComplete="on">
      {error ? (
        <div role="alert" className="rounded-[var(--radius-control)] bg-danger-muted px-4 py-3 text-sm leading-6 text-danger">
          {error}
        </div>
      ) : null}

      <label className="block text-sm font-semibold text-ink" htmlFor="staff-email">
        इमेल <span className="font-normal text-stone">/ Email</span>
        <input
          id="staff-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          autoFocus
          disabled={pending || !authReady}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? 'staff-email-error' : undefined}
          placeholder="name@thenagarik.com"
          className={fieldClass}
          onChange={() => fieldErrors.email && setFieldErrors((prev) => ({ ...prev, email: undefined }))}
        />
        {fieldErrors.email ? (
          <span id="staff-email-error" className="mt-1.5 block text-xs font-medium text-danger">
            {fieldErrors.email}
          </span>
        ) : null}
      </label>

      <label className="block text-sm font-semibold text-ink" htmlFor="staff-password">
        पासवर्ड <span className="font-normal text-stone">/ Password</span>
        <span className="relative mt-2 block">
          <input
            id="staff-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            disabled={pending || !authReady}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'staff-password-error' : undefined}
            className="newsroom-field h-12 w-full px-3.5 pr-12 text-[0.95rem] disabled:opacity-70"
            onChange={() =>
              fieldErrors.password && setFieldErrors((prev) => ({ ...prev, password: undefined }))
            }
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-0.5 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[var(--radius-control)] text-stone transition-colors hover:bg-paper hover:text-ink"
            aria-label={showPassword ? 'पासवर्ड लुकाउनुहोस्' : 'पासवर्ड देखाउनुहोस्'}
            disabled={pending}
          >
            {showPassword ? <EyeSlash size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
          </button>
        </span>
        {fieldErrors.password ? (
          <span id="staff-password-error" className="mt-1.5 block text-xs font-medium text-danger">
            {fieldErrors.password}
          </span>
        ) : null}
      </label>

      <button
        type="submit"
        disabled={pending || !authReady}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-accent px-4 text-sm font-bold text-accent-fg transition-[transform,background-color] hover:bg-[color-mix(in_oklab,var(--accent)_90%,var(--ink))] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55"
      >
        {pending ? <CircleNotch size={18} className="animate-spin" aria-hidden="true" /> : null}
        {pending ? 'प्रवेश हुँदैछ…' : 'समाचारकक्षमा प्रवेश गर्नुहोस्'}
      </button>

      <p className="text-xs leading-5 text-stone">
        पासवर्ड बिर्सनुभयो भने समाचारकक्ष प्रशासकमार्फत रिसेट गराउनुहोस्। अहिले स्वचालित पासवर्ड रिसेट सक्षम गरिएको छैन।
      </p>
    </form>
  )
}
