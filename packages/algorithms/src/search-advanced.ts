import { detectBurst } from './velocity'
import { tokenizeText } from './text'

/**
 * Search upgrades: autocomplete, transliteration, typo tolerance, query
 * rewriting, proximity scoring, diversification, and trending queries.
 */

/** ALGO search.trie - prefix trie for Devanagari + Latin autocomplete. */
export class PrefixTrie {
  private root: TrieNode = { children: new Map(), terminalWeight: 0 }

  insert(term: string, weight = 1): void {
    let node = this.root
    for (const ch of term.toLowerCase().normalize('NFC')) {
      let next = node.children.get(ch)
      if (!next) {
        next = { children: new Map(), terminalWeight: 0 }
        node.children.set(ch, next)
      }
      node = next
    }
    node.terminalWeight += weight
  }

  /** Top-k completions for a prefix, weighted, lexicographic tie-break. */
  complete(prefix: string, k = 8): Array<{ term: string; weight: number }> {
    let node = this.root
    const normalized = prefix.toLowerCase().normalize('NFC')
    for (const ch of normalized) {
      const next = node.children.get(ch)
      if (!next) return []
      node = next
    }
    const results: Array<{ term: string; weight: number }> = []
    const walk = (current: TrieNode, path: string) => {
      if (current.terminalWeight > 0) {
        results.push({ term: normalized + path, weight: current.terminalWeight })
      }
      for (const [ch, child] of [...current.children.entries()].sort((a, b) =>
        a[0].localeCompare(b[0]),
      )) {
        walk(child, path + ch)
      }
    }
    walk(node, '')
    return results.sort((a, b) => b.weight - a.weight || a.term.localeCompare(b.term)).slice(0, k)
  }
}

type TrieNode = { children: Map<string, TrieNode>; terminalWeight: number }

/**
 * Romanized-Nepali consonant and vowel tables (ITRANS-adjacent pragmatic
 * scheme). Longest-match-first parsing.
 */
const ROMAN_CONSONANTS: Array<[string, string]> = [
  ['chh', 'छ'], ['ksh', 'क्ष'], ['gy', 'ज्ञ'],
  ['kh', 'ख'], ['gh', 'घ'], ['ch', 'च'], ['jh', 'झ'], ['th', 'थ'], ['dh', 'ध'],
  ['ph', 'फ'], ['bh', 'भ'], ['sh', 'श'], ['Th', 'ठ'], ['Dh', 'ढ'],
  ['k', 'क'], ['g', 'ग'], ['c', 'च'], ['j', 'ज'], ['t', 'त'], ['d', 'द'], ['n', 'न'],
  ['p', 'प'], ['b', 'ब'], ['m', 'म'], ['y', 'य'], ['r', 'र'], ['l', 'ल'], ['w', 'व'],
  ['v', 'व'], ['s', 'स'], ['h', 'ह'],
]

const ROMAN_VOWELS: Array<[string, { independent: string; sign: string }]> = [
  ['aa', { independent: 'आ', sign: 'ा' }],
  ['ee', { independent: 'ई', sign: 'ी' }],
  ['oo', { independent: 'ऊ', sign: 'ू' }],
  ['ai', { independent: 'ऐ', sign: 'ै' }],
  ['au', { independent: 'औ', sign: 'ौ' }],
  ['a', { independent: 'अ', sign: '' }],
  ['i', { independent: 'इ', sign: 'ि' }],
  ['u', { independent: 'उ', sign: 'ु' }],
  ['e', { independent: 'ए', sign: 'े' }],
  ['o', { independent: 'ओ', sign: 'ो' }],
]

/**
 * ALGO search.transliterate - Romanized Nepali -> Devanagari candidates.
 * Parses consonant+vowel syllables longest-match-first and emits candidate
 * variants (schwa kept/dropped at word end, long/short vowel alternates for
 * i/u) because Roman spelling of Nepali is not deterministic.
 */
export function romanToDevanagari(roman: string, maxCandidates = 16): string[] {
  const input = roman.trim()
  if (!input || /[^a-zA-Z]/.test(input)) return []

  type State = { out: string; pendingConsonant: string | null; subs: number }
  let states: State[] = [{ out: '', pendingConsonant: null, subs: 0 }]
  let i = 0
  const lower = input.toLowerCase()

  const flush = (state: State, vowelSign: string, independent: string): string => {
    if (state.pendingConsonant) return state.out + state.pendingConsonant + vowelSign
    return state.out + independent
  }

  while (i < lower.length) {
    const nextStates: State[] = []
    let matched = false

    // Vowels first (longest match).
    for (const [rom, dev] of ROMAN_VOWELS) {
      if (lower.startsWith(rom, i)) {
        for (const state of states) {
          nextStates.push({
            out: flush(state, dev.sign, dev.independent),
            pendingConsonant: null,
            subs: state.subs,
          })
          // Alternates: loose romanization writes long vowels short.
          // Each alternate counts as a substitution so plausibility ordering
          // (fewest substitutions first) survives candidate caps.
          if (rom === 'a') nextStates.push({ out: flush(state, 'ा', 'आ'), pendingConsonant: null, subs: state.subs + 1 })
          if (rom === 'i') nextStates.push({ out: flush(state, 'ी', 'ई'), pendingConsonant: null, subs: state.subs + 1 })
          if (rom === 'u') nextStates.push({ out: flush(state, 'ू', 'ऊ'), pendingConsonant: null, subs: state.subs + 1 })
        }
        i += rom.length
        matched = true
        break
      }
    }
    if (matched) {
      states = dedupeStates(nextStates, maxCandidates)
      continue
    }

    for (const [rom, dev] of ROMAN_CONSONANTS) {
      if (lower.startsWith(rom.toLowerCase(), i)) {
        for (const state of states) {
          // A pending consonant with no vowel forms a conjunct via virama.
          const out = state.pendingConsonant ? state.out + state.pendingConsonant + '्' : state.out
          nextStates.push({ out, pendingConsonant: dev, subs: state.subs })
        }
        i += rom.length
        matched = true
        break
      }
    }
    if (!matched) return [] // unmappable character sequence
    states = dedupeStates(nextStates, maxCandidates)
  }

  const finals: Array<{ text: string; subs: number }> = []
  const seenFinal = new Set<string>()
  const pushFinal = (text: string, subs: number) => {
    if (!text || seenFinal.has(text)) return
    seenFinal.add(text)
    finals.push({ text, subs })
  }
  for (const state of states) {
    if (state.pendingConsonant) {
      // Word-final consonant: emit both with and without the inherent schwa.
      pushFinal(state.out + state.pendingConsonant, state.subs)
      pushFinal(state.out + state.pendingConsonant + '्', state.subs)
    } else {
      pushFinal(state.out, state.subs)
    }
  }
  return finals
    .sort((a, b) => a.subs - b.subs)
    .slice(0, maxCandidates)
    .map((f) => f.text)
}

function dedupeStates(
  states: Array<{ out: string; pendingConsonant: string | null; subs: number }>,
  max: number,
): Array<{ out: string; pendingConsonant: string | null; subs: number }> {
  const seen = new Set<string>()
  const out: typeof states = []
  // Fewest substitutions first: plausible readings survive the state cap.
  for (const state of [...states].sort((a, b) => a.subs - b.subs)) {
    const key = `${state.out}|${state.pendingConsonant ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(state)
    if (out.length >= max) break
  }
  return out
}

/**
 * ALGO search.transliterate_match - match a Roman query token against
 * Devanagari index terms via candidate generation + prefix comparison.
 */
export function transliterationMatches(
  romanToken: string,
  indexTerms: string[],
  limit = 5,
): string[] {
  const candidates = romanToDevanagari(romanToken)
  if (!candidates.length) return []
  const hits: string[] = []
  for (const term of indexTerms) {
    if (candidates.some((c) => term === c || term.startsWith(c) || c.startsWith(term))) {
      hits.push(term)
      if (hits.length >= limit) break
    }
  }
  return hits
}

/**
 * ALGO search.levenshtein - banded Levenshtein distance. Early-exits with
 * maxDistance+1 when the bound is exceeded (Ukkonen band optimization).
 */
export function levenshtein(a: string, b: string, maxDistance = Infinity): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const curr = new Array<number>(n + 1)
    curr[0] = i
    let rowMin = curr[0]
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
      rowMin = Math.min(rowMin, curr[j])
    }
    if (rowMin > maxDistance) return maxDistance + 1
    prev = curr
  }
  return prev[n]
}

/**
 * ALGO search.fuzzy_term - typo-tolerant term match: distance budget scales
 * with term length (0 for <=3 chars, 1 for <=6, else 2). Returns matching
 * index terms ordered by distance then frequency.
 */
export function fuzzyTermMatches(
  queryTerm: string,
  indexTerms: Array<{ term: string; frequency: number }>,
  limit = 5,
): Array<{ term: string; distance: number }> {
  const budget = queryTerm.length <= 3 ? 0 : queryTerm.length <= 6 ? 1 : 2
  return indexTerms
    .map(({ term, frequency }) => ({
      term,
      frequency,
      distance: levenshtein(queryTerm.toLowerCase(), term.toLowerCase(), budget),
    }))
    .filter((x) => x.distance <= budget)
    .sort((a, b) => a.distance - b.distance || b.frequency - a.frequency || a.term.localeCompare(b.term))
    .slice(0, limit)
    .map(({ term, distance }) => ({ term, distance }))
}

/**
 * ALGO search.query_rewrite - zero-result rescue: suggest the closest
 * historically successful query by token overlap, then edit distance.
 */
export function rewriteZeroResultQuery(
  failedQuery: string,
  successfulQueries: Array<{ query: string; resultCount: number }>,
): string | null {
  const failedTokens = new Set(tokenizeText(failedQuery))
  if (!successfulQueries.length) return null
  const scored = successfulQueries
    .filter((q) => q.resultCount > 0)
    .map(({ query }) => {
      const tokens = new Set(tokenizeText(query))
      let overlap = 0
      for (const t of failedTokens) if (tokens.has(t)) overlap += 1
      const union = new Set([...failedTokens, ...tokens]).size
      const tokenScore = union === 0 ? 0 : overlap / union
      const editScore = 1 / (1 + levenshtein(failedQuery.toLowerCase(), query.toLowerCase(), 10))
      return { query, score: tokenScore * 0.7 + editScore * 0.3 }
    })
    .sort((a, b) => b.score - a.score || a.query.localeCompare(b.query))
  const best = scored[0]
  return best && best.score >= 0.2 ? best.query : null
}

/**
 * ALGO search.proximity - minimum window span containing all query terms
 * (token positions); boost = queryLen / span in (0,1]. 0 when any term
 * is missing. Standard phrase-proximity reranking term.
 */
export function proximityBoost(docTokens: string[], queryTokens: string[]): number {
  const unique = [...new Set(queryTokens)]
  if (!unique.length) return 0
  const positions = new Map<string, number[]>()
  for (const term of unique) positions.set(term, [])
  docTokens.forEach((token, idx) => {
    positions.get(token)?.push(idx)
  })
  if ([...positions.values()].some((list) => list.length === 0)) return 0
  if (unique.length === 1) return 1

  // Sliding minimal-window over merged position lists.
  const merged = unique
    .flatMap((term) => (positions.get(term) ?? []).map((pos) => ({ term, pos })))
    .sort((a, b) => a.pos - b.pos)
  let best = Infinity
  const counts = new Map<string, number>()
  let covered = 0
  let left = 0
  for (let right = 0; right < merged.length; right++) {
    const r = merged[right]
    counts.set(r.term, (counts.get(r.term) ?? 0) + 1)
    if (counts.get(r.term) === 1) covered += 1
    while (covered === unique.length) {
      best = Math.min(best, merged[right].pos - merged[left].pos + 1)
      const l = merged[left]
      counts.set(l.term, (counts.get(l.term) ?? 0) - 1)
      if (counts.get(l.term) === 0) covered -= 1
      left += 1
    }
  }
  return best === Infinity ? 0 : unique.length / best
}

/**
 * ALGO search.xquad - xQuAD-lite result diversification: greedily pick
 * results balancing relevance against aspects (categories) already covered.
 */
export function diversifySearchResults<T extends { score: number; categoryId?: string }>(
  results: T[],
  lambda = 0.7,
  limit?: number,
): T[] {
  const pool = [...results]
  const picked: T[] = []
  const coverage = new Map<string, number>()
  const target = Math.min(limit ?? pool.length, pool.length)

  while (picked.length < target && pool.length) {
    let bestIdx = 0
    let bestValue = Number.NEGATIVE_INFINITY
    for (let i = 0; i < pool.length; i++) {
      const item = pool[i]
      const covered = coverage.get(item.categoryId ?? '') ?? 0
      // Diminishing value for aspects already covered: (1/2)^covered.
      const noveltyTerm = Math.pow(0.5, covered)
      const value = lambda * item.score + (1 - lambda) * item.score * noveltyTerm
      if (value > bestValue) {
        bestValue = value
        bestIdx = i
      }
    }
    const chosen = pool.splice(bestIdx, 1)[0]
    coverage.set(chosen.categoryId ?? '', (coverage.get(chosen.categoryId ?? '') ?? 0) + 1)
    picked.push(chosen)
  }
  return picked
}

/**
 * ALGO search.trending_queries - burst-scored query suggestions: queries
 * whose latest-window count is an outlier against their own baseline.
 */
export function trendingQueries(
  queryWindows: Map<string, number[]>,
  opts: { minTotal?: number; limit?: number } = {},
): Array<{ query: string; burstScore: number }> {
  const minTotal = opts.minTotal ?? 5
  const limit = opts.limit ?? 8
  const out: Array<{ query: string; burstScore: number }> = []
  for (const [query, windows] of queryWindows) {
    const total = windows.reduce((a, b) => a + b, 0)
    if (total < minTotal) continue
    const verdict = detectBurst(windows)
    if (verdict.bursting) out.push({ query, burstScore: verdict.score })
  }
  return out
    .sort((a, b) => b.burstScore - a.burstScore || a.query.localeCompare(b.query))
    .slice(0, limit)
}
