'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowSquareOut, CheckCircle, Warning, XCircle } from '@phosphor-icons/react'

export function AdminCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-[var(--radius-panel)] border border-line bg-paper-elevated p-5 shadow-[0_1px_3px_rgb(16_32_29_/_0.04)] ${className}`}
    >
      {children}
    </div>
  )
}

export function AdminMetric({
  label,
  value,
  href,
  tone = 'default',
  sublabel,
}: {
  label: string
  value: string | number
  href?: string
  tone?: 'default' | 'accent' | 'danger' | 'warning'
  sublabel?: string
}) {
  const toneClass =
    tone === 'accent'
      ? 'text-accent'
      : tone === 'danger'
        ? 'text-holiday'
        : tone === 'warning'
          ? 'text-warning'
          : 'text-ink'

  const inner = (
    <div className="flex flex-col justify-between h-full">
      <p className="text-xs font-bold uppercase tracking-wider text-stone">{label}</p>
      <div className="mt-2">
        <p className={`text-3xl font-black tabular-nums tracking-tight ${toneClass}`}>
          {value}
        </p>
        {sublabel ? <p className="mt-1 text-xs text-stone">{sublabel}</p> : null}
      </div>
    </div>
  )

  if (!href) return <AdminCard>{inner}</AdminCard>

  return (
    <Link href={href} className="block group">
      <AdminCard className="h-full group-hover:border-accent group-hover:shadow-md transition-all">
        {inner}
      </AdminCard>
    </Link>
  )
}

export function AdminButton({
  href,
  children,
  variant = 'primary',
  external,
}: {
  href: string
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  external?: boolean
}) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-control)] px-4 py-2 text-xs font-bold transition-all active:scale-[0.98]'
  const cls =
    variant === 'primary'
      ? `${base} accent-solid shadow-sm hover:opacity-95`
      : variant === 'secondary'
        ? `${base} bg-paper-strong text-ink hover:bg-line`
        : variant === 'danger'
          ? `${base} bg-danger text-danger-fg hover:opacity-90`
          : `${base} border border-line bg-paper text-ink hover:border-accent hover:text-accent`

  return (
    <Link href={href} className={cls} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
      <span>{children}</span>
      {external ? <ArrowSquareOut size={13} weight="bold" /> : null}
    </Link>
  )
}

export function AdminBadge({
  children,
  tone = 'default',
}: {
  children: ReactNode
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger'
}) {
  const cls =
    tone === 'accent'
      ? 'bg-accent-muted text-accent'
      : tone === 'success'
        ? 'bg-success-muted text-success'
        : tone === 'warning'
          ? 'bg-warning-muted text-warning'
          : tone === 'danger'
            ? 'bg-danger-muted text-danger'
            : 'bg-paper-strong text-stone'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}
    >
      {children}
    </span>
  )
}

export function AdminStatusPill({ status }: { status: string }) {
  const norm = status.toLowerCase()
  if (norm === 'published' || norm === 'active' || norm === 'ok' || norm === 'true') {
    return (
      <AdminBadge tone="success">
        <CheckCircle size={12} weight="bold" />
        <span>{status}</span>
      </AdminBadge>
    )
  }
  if (norm === 'in_review' || norm === 'pending' || norm === 'scheduled') {
    return (
      <AdminBadge tone="warning">
        <Warning size={12} weight="bold" />
        <span>{status}</span>
      </AdminBadge>
    )
  }
  if (norm === 'draft' || norm === 'disabled' || norm === 'false') {
    return (
      <AdminBadge tone="default">
        <span>{status}</span>
      </AdminBadge>
    )
  }
  return (
    <AdminBadge tone="danger">
      <XCircle size={12} weight="bold" />
      <span>{status}</span>
    </AdminBadge>
  )
}

export function CmsCanonicalBanner({ onPayload }: { onPayload: boolean }) {
  if (onPayload) {
    return (
      <div className="flex items-center gap-3 rounded-[var(--radius-panel)] border border-accent/30 bg-accent-muted/60 p-4 text-xs sm:text-sm text-ink">
        <CheckCircle size={20} weight="bold" className="shrink-0 text-accent" />
        <div>
          <p className="font-bold">
            Content is live from <strong>Payload CMS</strong> at{' '}
            <code className="text-accent font-bold">/cms</code>.
          </p>
          <p className="mt-0.5 text-stone text-xs">
            This desk tracks publishing, editorial queue, and launch readiness.
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-panel)] border border-warning/40 bg-warning-muted/40 p-4 text-xs sm:text-sm text-ink">
      <Warning size={20} weight="bold" className="shrink-0 text-warning" />
      <div>
        <p className="font-bold">
          Payload database is not connected yet.
        </p>
        <p className="mt-0.5 text-stone text-xs">
          Add <code>DATABASE_URL</code> and <code>PAYLOAD_SECRET</code>, then set{' '}
          <code>CONTENT_SOURCE=payload</code> before live launch.
        </p>
      </div>
    </div>
  )
}

export function AdminEmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string
  description?: string
  actionHref?: string
  actionLabel?: string
}) {
  return (
    <div className="rounded-[var(--radius-panel)] border border-line bg-paper p-12 text-center">
      <p className="text-base font-bold text-ink">{title}</p>
      {description ? <p className="mt-1 text-xs text-stone">{description}</p> : null}
      {actionHref && actionLabel ? (
        <div className="mt-5">
          <AdminButton href={actionHref}>{actionLabel}</AdminButton>
        </div>
      ) : null}
    </div>
  )
}
