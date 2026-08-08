'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

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
  const [pending, startTransition] = useTransition()
  void pitchHint

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!authReady) {
      setError('Login service unavailable. Connect the newsroom database and secret.')
      return
    }

    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? '')
      .trim()
      .toLowerCase()
    const password = String(form.get('password') ?? '')
    if (!email || !password) {
      setError('Email and password are required.')
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/staff/login', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        })
        const body = (await res.json().catch(() => ({}))) as {
          message?: string
          code?: string
        }
        if (!res.ok) {
          if (res.status === 503 || body.code === 'AUTH_UNAVAILABLE') {
            setError('Login unavailable. Database is not connected.')
            return
          }
          if (body.code === 'ACCOUNT_DISABLED') {
            setError('This account is disabled. Contact an administrator.')
            return
          }
          setError(body.message || 'Invalid email or password.')
          return
        }
        const safeNext =
          nextPath.startsWith('/admin') || nextPath.startsWith('/journalist')
            ? nextPath
            : '/admin'
        router.replace(safeNext)
        router.refresh()
      } catch {
        setError('Network error. Try again.')
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate autoComplete="on">
      {error ? (
        <div role="alert" className="border border-holiday/40 bg-paper-elevated px-3 py-2 text-sm text-holiday">
          {error}
        </div>
      ) : null}

      <label className="block text-sm">
        <span className="font-medium">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          disabled={pending || !authReady}
          placeholder="editor@thenagarik.com"
          className="mt-1.5 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending || !authReady}
          className="mt-1.5 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </label>

      <button
        type="submit"
        disabled={pending || !authReady}
        className="inline-flex w-full items-center justify-center rounded-[var(--radius-control)] bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg disabled:opacity-60"
      >
        {pending ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
}
