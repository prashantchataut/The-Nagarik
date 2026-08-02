export type NotifyCandidate = {
  id: string
  priority: number
  isBreaking?: boolean
}

export type NotifyPrefs = {
  enabled: boolean
  quietHoursStart?: number
  quietHoursEnd?: number
  maxPerDay?: number
  cooldownMinutes?: number
}

export type NotifyDecision = {
  willSend: boolean
  reason:
    | 'ok'
    | 'disabled'
    | 'quiet-hours'
    | 'daily-cap'
    | 'cooldown'
    | 'low-priority'
}

export function scoreNotification(
  candidate: NotifyCandidate,
  prefs: NotifyPrefs,
  ctx: {
    hourLocal: number
    sentToday: number
    minutesSinceLast: number
  },
): NotifyDecision {
  if (!prefs.enabled) return { willSend: false, reason: 'disabled' }

  const start = prefs.quietHoursStart ?? 22
  const end = prefs.quietHoursEnd ?? 7
  const inQuiet =
    start > end
      ? ctx.hourLocal >= start || ctx.hourLocal < end
      : ctx.hourLocal >= start && ctx.hourLocal < end
  if (inQuiet && !candidate.isBreaking) return { willSend: false, reason: 'quiet-hours' }

  if (ctx.sentToday >= (prefs.maxPerDay ?? 6)) return { willSend: false, reason: 'daily-cap' }
  if (ctx.minutesSinceLast < (prefs.cooldownMinutes ?? 30) && !candidate.isBreaking) {
    return { willSend: false, reason: 'cooldown' }
  }
  if (candidate.priority < 3 && !candidate.isBreaking) {
    return { willSend: false, reason: 'low-priority' }
  }
  return { willSend: true, reason: 'ok' }
}
