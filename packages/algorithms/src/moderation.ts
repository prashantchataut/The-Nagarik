export type ModerationInput = {
  text: string
  bannedWords?: string[]
  previousRejects?: number
  accountAgeDays?: number
}

export type ModerationVerdict = {
  toxicity: number
  spam: number
  trollRisk: number
  /** Never auto-publish — humans own the queue. */
  suggested: 'reject' | 'review' | 'eligible'
}

const DEFAULT_BANNED = [
  'spamlink',
  'crypto-giveaway',
  'शिघ्र धनी',
]

export function moderateComment(input: ModerationInput): ModerationVerdict {
  const banned = [...DEFAULT_BANNED, ...(input.bannedWords ?? [])].map((w) => w.toLowerCase())
  const text = input.text.toLowerCase()
  let hits = 0
  for (const w of banned) {
    if (w && text.includes(w)) hits += 1
  }
  const urlCount = (input.text.match(/https?:\/\//g) ?? []).length
  const toxicity = Math.min(1, hits * 0.4)
  const spam = Math.min(1, urlCount * 0.35 + (input.text.length < 8 ? 0.2 : 0))
  const trollRisk = Math.min(
    1,
    (input.previousRejects ?? 0) * 0.2 + ((input.accountAgeDays ?? 365) < 1 ? 0.3 : 0),
  )
  const score = Math.max(toxicity, spam, trollRisk)
  const suggested = score >= 0.75 ? 'reject' : score >= 0.35 ? 'review' : 'eligible'
  return { toxicity, spam, trollRisk, suggested }
}

/** Wilson lower bound for comment ranking. */
export function wilsonLowerBound(up: number, n: number, z = 1.96): number {
  if (n === 0) return 0
  const p = up / n
  const z2 = z * z
  const denom = 1 + z2 / n
  const centre = p + z2 / (2 * n)
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n)
  return (centre - margin) / denom
}
