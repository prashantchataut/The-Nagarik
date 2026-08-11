/**
 * Text algorithms: Devanagari-aware tokenization, TF-IDF, BM25, similarity,
 * near-duplicate detection, and keyword extraction.
 */

/**
 * ALGO text.tokenize - Unicode-aware tokenizer (Devanagari + Latin).
 * CRITICAL: \p{M} (combining marks) must stay inside tokens - Devanagari
 * vowel signs and virama are marks, and splitting on them destroys words
 * (e.g. "नेपालको" would shatter into consonant fragments).
 */
export function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFC')
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter((t) => t.length > 1)
}

/** ALGO text.shingles - k-gram token shingles for near-duplicate detection. */
export function shingles(tokens: string[], k = 3): Set<string> {
  const out = new Set<string>()
  if (k <= 0) return out
  for (let i = 0; i + k <= tokens.length; i++) {
    out.add(tokens.slice(i, i + k).join(' '))
  }
  return out
}

/** ALGO text.jaccard - Jaccard similarity of two sets in [0,1]. */
export function jaccardSimilarity<T>(a: Set<T>, b: Set<T>): number {
  if (a.size === 0 && b.size === 0) return 1
  let intersection = 0
  for (const item of a) if (b.has(item)) intersection += 1
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

/** ALGO text.tf - term frequency map of a token list. */
export function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>()
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1)
  return tf
}

export type TfIdfModel = {
  idf: Map<string, number>
  vectors: Array<Map<string, number>>
  docCount: number
}

/**
 * ALGO text.tfidf - TF-IDF vectors with smoothed IDF:
 * idf = ln(1 + N / (1 + df)), tf normalized by document length.
 */
export function buildTfIdf(docsTokens: string[][]): TfIdfModel {
  const df = new Map<string, number>()
  for (const tokens of docsTokens) {
    for (const term of new Set(tokens)) df.set(term, (df.get(term) ?? 0) + 1)
  }
  const n = docsTokens.length
  const idf = new Map<string, number>()
  for (const [term, freq] of df) idf.set(term, Math.log(1 + n / (1 + freq)))

  const vectors = docsTokens.map((tokens) => {
    const tf = termFrequency(tokens)
    const vec = new Map<string, number>()
    for (const [term, count] of tf) {
      vec.set(term, (count / Math.max(1, tokens.length)) * (idf.get(term) ?? 0))
    }
    return vec
  })
  return { idf, vectors, docCount: n }
}

/** ALGO text.cosine_sparse - cosine similarity of sparse vectors. */
export function cosineSimilaritySparse(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0
  let na = 0
  let nb = 0
  for (const [term, weight] of a) {
    na += weight * weight
    const other = b.get(term)
    if (other !== undefined) dot += weight * other
  }
  for (const [, weight] of b) nb += weight * weight
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

export type Bm25Index = {
  score: (queryTokens: string[], docIndex: number) => number
  search: (queryTokens: string[], limit?: number) => Array<{ docIndex: number; score: number }>
}

/**
 * ALGO search.bm25 - Okapi BM25 (k1=1.2, b=0.75), the standard lexical
 * ranking function. Exact formula, no shortcuts.
 */
export function buildBm25(docsTokens: string[][], k1 = 1.2, b = 0.75): Bm25Index {
  const n = docsTokens.length
  const docLengths = docsTokens.map((d) => d.length)
  const avgDl = docLengths.reduce((a, x) => a + x, 0) / Math.max(1, n)
  const tfs = docsTokens.map((tokens) => termFrequency(tokens))
  const df = new Map<string, number>()
  for (const tokens of docsTokens) {
    for (const term of new Set(tokens)) df.set(term, (df.get(term) ?? 0) + 1)
  }
  const idf = (term: string) => {
    const d = df.get(term) ?? 0
    // BM25+ style floor keeps very common terms from going negative.
    return Math.max(0, Math.log((n - d + 0.5) / (d + 0.5) + 1))
  }

  const score = (queryTokens: string[], docIndex: number): number => {
    if (docIndex < 0 || docIndex >= n) return 0
    const tf = tfs[docIndex]
    const dl = docLengths[docIndex]
    let total = 0
    for (const term of queryTokens) {
      const f = tf.get(term) ?? 0
      if (f === 0) continue
      total += idf(term) * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * dl) / Math.max(1, avgDl))))
    }
    return total
  }

  const search = (queryTokens: string[], limit = 20) =>
    docsTokens
      .map((_, docIndex) => ({ docIndex, score: score(queryTokens, docIndex) }))
      .filter((r) => r.score > 0)
      .sort((a, b2) => b2.score - a.score)
      .slice(0, limit)

  return { score, search }
}

/** FNV-1a 32-bit hash - the stable primitive under simhash and bucketing. */
export function fnv1a32(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/**
 * ALGO text.simhash - 32-bit SimHash fingerprint over tokens.
 * Near-duplicate documents land within a small Hamming distance.
 */
export function simhash32(tokens: string[]): number {
  const acc = new Array<number>(32).fill(0)
  for (const token of tokens) {
    const h = fnv1a32(token)
    for (let bit = 0; bit < 32; bit++) {
      acc[bit] += (h >>> bit) & 1 ? 1 : -1
    }
  }
  let out = 0
  for (let bit = 0; bit < 32; bit++) {
    if (acc[bit] > 0) out |= 1 << bit
  }
  return out >>> 0
}

/** ALGO text.hamming - Hamming distance between two 32-bit fingerprints. */
export function hammingDistance32(a: number, b: number): number {
  let x = (a ^ b) >>> 0
  let count = 0
  while (x) {
    x &= x - 1
    count += 1
  }
  return count
}

/**
 * ALGO text.near_dup - near-duplicate verdict: shingle Jaccard >= threshold
 * OR simhash Hamming distance <= maxHamming. Two independent detectors.
 */
export function isNearDuplicate(
  textA: string,
  textB: string,
  opts: { jaccardThreshold?: number; maxHamming?: number; shingleK?: number } = {},
): boolean {
  const tokensA = tokenizeText(textA)
  const tokensB = tokenizeText(textB)
  const jac = jaccardSimilarity(
    shingles(tokensA, opts.shingleK ?? 3),
    shingles(tokensB, opts.shingleK ?? 3),
  )
  if (jac >= (opts.jaccardThreshold ?? 0.6)) return true
  const dist = hammingDistance32(simhash32(tokensA), simhash32(tokensB))
  return dist <= (opts.maxHamming ?? 3)
}

/**
 * ALGO text.keywords - TF-IDF keyword extraction: top-k terms of one doc
 * against a corpus, minimum length 2, stable tie-break by term.
 */
export function extractKeywords(
  docTokens: string[],
  corpusTokens: string[][],
  k = 8,
): Array<{ term: string; weight: number }> {
  const model = buildTfIdf([docTokens, ...corpusTokens])
  const vec = model.vectors[0]
  return [...vec.entries()]
    .filter(([term]) => term.length >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, k)
    .map(([term, weight]) => ({ term, weight }))
}

/**
 * ALGO feed.headline_dedupe - greedy feed dedupe: keep first occurrence,
 * drop later headlines that are near-duplicates of anything kept.
 * Prevents four outlets' copies of one wire story flooding a rail.
 */
export function dedupeHeadlines<T>(
  items: T[],
  headlineOf: (item: T) => string,
  threshold = 0.55,
): T[] {
  const kept: T[] = []
  const keptShingles: Array<Set<string>> = []
  for (const item of items) {
    const sh = shingles(tokenizeText(headlineOf(item)), 2)
    const dupe = keptShingles.some((existing) => jaccardSimilarity(existing, sh) >= threshold)
    if (!dupe) {
      kept.push(item)
      keptShingles.push(sh)
    }
  }
  return kept
}
