'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Copy, IdentificationBadge, X } from '@phosphor-icons/react'

type Application = {
  id: string
  name: string
  email: string
  phone: string
  organization: string
  portfolioUrl: string
  message: string
  status: string
  createdAt: string
}

type ApprovalResult = {
  id: string
  email: string
  tempPassword?: string
  userExisted?: boolean
}

/**
 * Journalist onboarding review queue.
 * Approval creates the `users` account with the journalist role and shows
 * the one-time password EXACTLY once for manual handover.
 */
export function JournalistApplicationsPanel() {
  const [applications, setApplications] = useState<Application[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'unauthorized' | 'error'>('loading')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [approval, setApproval] = useState<ApprovalResult | null>(null)
  const [copied, setCopied] = useState(false)

  const refresh = useCallback(() => {
    setState('loading')
    fetch('/api/admin/journalist-applications')
      .then((res) => {
        if (res.status === 401) {
          setState('unauthorized')
          return null
        }
        if (!res.ok) throw new Error(String(res.status))
        return res.json()
      })
      .then((data: { applications?: Application[] } | null) => {
        if (!data) return
        setApplications(Array.isArray(data.applications) ? data.applications : [])
        setState('ready')
      })
      .catch(() => setState('error'))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function act(application: Application, action: 'approve' | 'reject') {
    if (
      action === 'approve' &&
      !window.confirm(
        `${application.name} (${application.email}) लाई पत्रकारका रूपमा प्रमाणित गर्नुहुन्छ? स्टाफ खाता बन्नेछ।`,
      )
    ) {
      return
    }
    setBusyId(application.id)
    try {
      const res = await fetch('/api/admin/journalist-applications', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: application.id, action }),
      })
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as { tempPassword?: string; userExisted?: boolean }
      setApplications((prev) => prev.filter((a) => a.id !== application.id))
      if (action === 'approve') {
        setApproval({
          id: application.id,
          email: application.email,
          tempPassword: data.tempPassword,
          userExisted: data.userExisted,
        })
        setCopied(false)
      }
    } catch {
      // Keep the row; the editor can retry.
    } finally {
      setBusyId(null)
    }
  }

  async function copyCredentials() {
    if (!approval?.tempPassword) return
    try {
      await navigator.clipboard.writeText(`${approval.email} / ${approval.tempPassword}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard permissions are optional.
    }
  }

  return (
    <section className="surface-card p-5" aria-labelledby="applications-queue-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <IdentificationBadge size={20} weight="bold" className="text-accent" aria-hidden="true" />
          <h2 id="applications-queue-title" className="text-base font-black text-ink">
            Journalist Applications
          </h2>
          <span className="rounded-full bg-warning-muted px-2.5 py-0.5 text-xs font-bold tabular-nums text-warning">
            {applications.length} pending
          </span>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex min-h-9 items-center rounded-[var(--radius-control)] border border-line px-3 text-xs font-bold text-ink hover:border-accent hover:text-accent"
        >
          Refresh
        </button>
      </div>

      {/* One-time credential handover */}
      {approval ? (
        <div
          className="mt-4 rounded-[var(--radius-panel)] border border-success/40 bg-success-muted/40 p-4"
          role="status"
        >
          {approval.userExisted ? (
            <p className="text-xs font-bold text-success">
              स्वीकृत। {approval.email} को स्टाफ खाता पहिले नै थियो; नयाँ खाता बनेन।
            </p>
          ) : (
            <>
              <p className="text-xs font-bold text-success">
                स्वीकृत! नयाँ पत्रकार खाता बन्यो। यो एक पटक मात्र देखिने अस्थायी पासवर्ड हो -
                व्यक्तिगत रूपमा हस्तान्तरण गर्नुहोस् र पहिलो लगइनमै फेर्न लगाउनुहोस्:
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="rounded bg-paper px-3 py-1.5 font-mono text-sm font-bold text-ink">
                  {approval.email} / {approval.tempPassword}
                </code>
                <button
                  type="button"
                  onClick={copyCredentials}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-control)] border border-line bg-paper px-3 text-xs font-bold text-ink hover:border-accent hover:text-accent"
                >
                  {copied ? (
                    <Check size={14} weight="bold" className="text-success" aria-hidden="true" />
                  ) : (
                    <Copy size={14} weight="bold" aria-hidden="true" />
                  )}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </>
          )}
          <button
            type="button"
            onClick={() => setApproval(null)}
            className="mt-3 text-xs font-bold text-stone underline underline-offset-2 hover:text-ink"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {state === 'loading' ? (
        <p className="py-6 text-xs text-stone">Loading applications...</p>
      ) : state === 'unauthorized' ? (
        <p className="py-6 text-xs text-stone">Editor role and staff session required.</p>
      ) : state === 'error' ? (
        <p className="py-6 text-xs text-danger">Could not load the application queue.</p>
      ) : applications.length ? (
        <ul className="divide-y divide-line">
          {applications.map((application) => (
            <li key={application.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                  <span className="font-bold text-ink">{application.name}</span>
                  <span className="text-xs text-stone">{application.email}</span>
                  {application.phone ? (
                    <span className="text-xs text-stone">{application.phone}</span>
                  ) : null}
                  <span className="text-xs tabular-nums text-stone" suppressHydrationWarning>
                    {application.createdAt
                      ? new Date(application.createdAt).toLocaleString('ne-NP')
                      : ''}
                  </span>
                </p>
                {application.organization ? (
                  <p className="mt-1 text-xs font-semibold text-ink">{application.organization}</p>
                ) : null}
                <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-stone">
                  {application.message}
                </p>
                {application.portfolioUrl ? (
                  <a
                    href={application.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-block break-all text-xs font-bold text-accent hover:underline"
                  >
                    {application.portfolioUrl}
                  </a>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={busyId === application.id}
                  onClick={() => act(application, 'approve')}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-control)] bg-success-muted px-3.5 text-xs font-bold text-success hover:opacity-85 disabled:opacity-50"
                >
                  <Check size={14} weight="bold" aria-hidden="true" />
                  Verify & Approve
                </button>
                <button
                  type="button"
                  disabled={busyId === application.id}
                  onClick={() => act(application, 'reject')}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-control)] bg-danger-muted px-3.5 text-xs font-bold text-danger hover:opacity-85 disabled:opacity-50"
                >
                  <X size={14} weight="bold" aria-hidden="true" />
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-xs text-stone">आवेदन कतार खाली छ। No applications waiting.</p>
      )}
    </section>
  )
}
