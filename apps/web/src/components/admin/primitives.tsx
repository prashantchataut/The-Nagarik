import Link from 'next/link'
import type { ReactNode } from 'react'

export function AdminCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`border border-line bg-paper-elevated p-4 ${className}`}>{children}</div>
  )
}

export function AdminMetric({
  label,
  value,
  href,
  tone = 'default',
}: {
  label: string
  value: string | number
  href?: string
  tone?: 'default' | 'accent' | 'danger'
}) {
  const toneClass =
    tone === 'accent' ? 'text-accent' : tone === 'danger' ? 'text-holiday' : 'text-ink'
  const inner = (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-stone">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
    </>
  )
  if (!href) return <AdminCard>{inner}</AdminCard>
  return (
    <Link href={href} className="block transition-colors hover:border-accent">
      <AdminCard className="h-full hover:border-accent">{inner}</AdminCard>
    </Link>
  )
}

export function AdminButton({
  href,
  children,
  variant = 'primary',
}: {
  href: string
  children: ReactNode
  variant?: 'primary' | 'ghost'
}) {
  const cls =
    variant === 'primary'
      ? 'inline-flex items-center justify-center rounded-[var(--radius-control)] bg-accent px-4 py-2 text-sm font-semibold text-accent-fg'
      : 'inline-flex items-center justify-center rounded-[var(--radius-control)] border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent'
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  )
}

export function CmsCanonicalBanner({ onPayload }: { onPayload: boolean }) {
  if (onPayload) {
    return (
      <p className="border border-accent/30 bg-accent-muted px-3 py-2 text-sm text-ink">
        Content is live from <strong>Payload</strong> at <code className="text-accent">/cms</code>.
        This desk tracks publishing, review, and launch readiness.
      </p>
    )
  }
  return (
    <p className="border border-holiday/40 bg-paper-elevated px-3 py-2 text-sm text-stone">
      Payload is not connected yet. Add <code>DATABASE_URL</code> and <code>PAYLOAD_SECRET</code>,
      then set <code>CONTENT_SOURCE=payload</code> before launch.
    </p>
  )
}
