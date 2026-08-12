import { jaccardSimilarity, shingles, tokenizeText } from './text'

/**
 * Content quality and comment-abuse heuristics. Scores are advisory:
 * humans own the moderation queue (see ADR in COMMENTS_POLICY).
 */

const DEVANAGARI_RE = /[\u0900-\u097F]/

/**
 * ALGO quality.read_time - Devanagari-aware read time estimate.
 * Nepali prose reads slower in words/minute than English (average adult:
 * ~180 wpm Nepali vs ~240 wpm English); mixed text blends by script share.
 */
export function estimateReadTimeMinutes(text: string, opts: { neWpm?: number; enWpm?: number } = {}): number {
  const words = text.split(/\s+/u).filter(Boolean)
  if (!words.length) return 1
  const neWords = words.filter((w) => DEVANAGARI_RE.test(w)).length
  const enWords = words.length - neWords
  const minutes = neWords / (opts.neWpm ?? 180) + enWords / (opts.enWpm ?? 240)
  return Math.max(1, Math.round(minutes))
}

export type SpamSignals = {
  score: number
  reasons: string[]
}

/**
 * ALGO quality.comment_spam - composite comment spam score in [0,1]:
 * links, link-only posts, shout ratio, character repetition, and
 * copy-paste length anomalies. Weights sum to 1.
 */
export function commentSpamScore(text: string): SpamSignals {
  const reasons: string[] = []
  const trimmed = text.trim()
  if (!trimmed) return { score: 1, reasons: ['empty'] }

  const urls = (trimmed.match(/https?:\/\/|www\./gi) ?? []).length
  const urlTerm = Math.min(1, urls / 2)
  if (urls > 0) reasons.push(`links:${urls}`)

  const uppers = trimmed.replace(/[^A-Z]/g, '').length
  const latinLetters = trimmed.replace(/[^A-Za-z]/g, '').length
  const shoutRatio = latinLetters >= 12 ? uppers / latinLetters : 0
  const shoutTerm = shoutRatio > 0.7 ? 1 : 0
  if (shoutTerm) reasons.push('all-caps')

  // Character repetition: aaaaaa / !!!!!! / ？？？？
  const repeatTerm = /(.)\1{5,}/u.test(trimmed) ? 1 : 0
  if (repeatTerm) reasons.push('char-repetition')

  // Token repetition: same token > 40% of a longer comment.
  const tokens = tokenizeText(trimmed)
  let tokenRepeatTerm = 0
  if (tokens.length >= 8) {
    const counts = new Map<string, number>()
    for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1)
    const maxShare = Math.max(...counts.values()) / tokens.length
    if (maxShare > 0.4) {
      tokenRepeatTerm = 1
      reasons.push('token-repetition')
    }
  }

  const withoutUrls = trimmed.replace(/https?:\/\/\S+|www\.\S+/gi, '')
  const lettersOutsideUrls = withoutUrls.replace(/[^\p{L}]/gu, '')
  const tooShortLinkOnly = urls > 0 && lettersOutsideUrls.length < 12 ? 1 : 0
  if (tooShortLinkOnly) reasons.push('link-only')

  const score = Math.min(
    1,
    urlTerm * 0.35 + shoutTerm * 0.15 + repeatTerm * 0.15 + tokenRepeatTerm * 0.15 + tooShortLinkOnly * 0.3,
  )
  return { score, reasons }
}

/**
 * ALGO quality.dup_comment - duplicate comment detection against recent
 * comments (shingle Jaccard, k=2 for short texts).
 */
export function isDuplicateComment(text: string, recentTexts: string[], threshold = 0.8): boolean {
  const sh = shingles(tokenizeText(text), 2)
  if (sh.size === 0) return false
  return recentTexts.some((prev) => jaccardSimilarity(sh, shingles(tokenizeText(prev), 2)) >= threshold)
}

const CLICKBAIT_PATTERNS: RegExp[] = [
  /तपाईं(लाई)?\s+(थाहा|विश्वास)/u, // "you won't believe"-family
  /यो\s+(एउटा|कुरा)\s+(कारण|तरिका)/u,
  /\byou won'?t believe\b/i,
  /\bshocking\b/i,
  /\bwhat happened next\b/i,
  /छक्क\s*पर्नु/u,
  /हेर्नुहोस्\s*भिडियो/u,
]

/**
 * ALGO quality.clickbait - clickbait heuristic score in [0,1]:
 * curiosity-gap phrases, exclamation stacking, ALL-CAPS words, and
 * unresolved pronoun openers. Editorial linting, not censorship.
 */
export function clickbaitScore(headline: string): number {
  const trimmed = headline.trim()
  if (!trimmed) return 0
  let score = 0
  if (CLICKBAIT_PATTERNS.some((re) => re.test(trimmed))) score += 0.45
  const exclamations = (trimmed.match(/!/g) ?? []).length
  if (exclamations >= 2) score += 0.2
  else if (exclamations === 1) score += 0.08
  const capsWords = trimmed.split(/\s+/).filter((w) => /^[A-Z]{4,}$/.test(w)).length
  if (capsWords > 0) score += 0.15
  if (/^(यो|यस्तो|उनी|त्यो|this|these|she|he|they)\b/iu.test(trimmed)) score += 0.2
  if ((trimmed.match(/\?/g) ?? []).length >= 2) score += 0.1
  return Math.min(1, score)
}

/**
 * ALGO quality.readability - crude readability hint from average sentence
 * length (Devanagari danda-aware). Returns average words per sentence and
 * a hint bucket for the composer UI.
 */
export function readabilityHint(text: string): {
  avgWordsPerSentence: number
  hint: 'easy' | 'medium' | 'dense'
} {
  const sentences = text
    .split(/[।!?.]+/u)
    .map((s) => s.trim())
    .filter(Boolean)
  if (!sentences.length) return { avgWordsPerSentence: 0, hint: 'easy' }
  const totalWords = sentences.reduce(
    (sum, s) => sum + s.split(/\s+/u).filter(Boolean).length,
    0,
  )
  const avg = totalWords / sentences.length
  return { avgWordsPerSentence: avg, hint: avg <= 14 ? 'easy' : avg <= 24 ? 'medium' : 'dense' }
}

/**
 * ALGO quality.profanity - normalized wordlist matcher. Lists live in CMS
 * config; this is the matching engine (NFC normalization, word boundaries
 * for Latin, substring for Devanagari conjunct safety).
 */
export function profanityMatch(text: string, blocklist: string[]): string[] {
  const normalized = text.toLowerCase().normalize('NFC')
  const hits: string[] = []
  for (const raw of blocklist) {
    const word = raw.toLowerCase().normalize('NFC').trim()
    if (!word) continue
    if (DEVANAGARI_RE.test(word)) {
      if (normalized.includes(word)) hits.push(raw)
    } else {
      const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      if (re.test(normalized)) hits.push(raw)
    }
  }
  return hits
}
