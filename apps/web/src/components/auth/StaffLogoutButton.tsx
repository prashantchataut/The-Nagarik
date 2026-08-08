'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export function StaffLogoutButton({
  className = '',
  label = 'Sign out',
}: {
  className?: string
  label?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      className={className}
      onClick={() => {
        startTransition(async () => {
          await fetch('/api/staff/logout', { method: 'POST', credentials: 'include' })
          router.replace('/admin/login')
          router.refresh()
        })
      }}
    >
      {pending ? '…' : label}
    </button>
  )
}
