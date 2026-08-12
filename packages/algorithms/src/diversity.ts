/**
 * Feed diversity re-rankers. All operate on already-scored, ordered lists
 * and never invent items - they only reorder or defer.
 */

/**
 * ALGO div.mmr - Maximal Marginal Relevance re-ranking:
 * next = argmax( lambda * relevance - (1 - lambda) * maxSimilarityToPicked ).
 * lambda=1 is pure relevance; lambda=0 is pure diversity.
 */
export function mmrRerank<T>(
  items: Array<T & { score: number }>,
  similarity: (a: T, b: T) => number,
  lambda = 0.7,
  limit?: number,
): T[] {
  const pool = [...items]
  const picked: Array<T & { score: number }> = []
  const target = Math.min(limit ?? pool.length, pool.length)

  while (picked.length < target && pool.length) {
    let bestIdx = 0
    let bestValue = Number.NEGATIVE_INFINITY
    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i]
      const maxSim = picked.length
        ? Math.max(...picked.map((p) => similarity(candidate, p)))
        : 0
      const value = lambda * candidate.score - (1 - lambda) * maxSim
      if (value > bestValue) {
        bestValue = value
        bestIdx = i
      }
    }
    picked.push(pool.splice(bestIdx, 1)[0])
  }
  return picked
}

/**
 * ALGO div.category_quota - cap how many items of one category appear in
 * the top window; overflow defers below the window, order preserved.
 */
export function categoryQuota<T extends { categoryId?: string }>(
  items: T[],
  maxPerCategory: number,
  windowSize?: number,
): T[] {
  const window = windowSize ?? items.length
  const counts = new Map<string, number>()
  const kept: T[] = []
  const deferred: T[] = []
  for (const item of items) {
    if (kept.length >= window) {
      kept.push(item)
      continue
    }
    const cat = item.categoryId ?? ''
    const count = counts.get(cat) ?? 0
    if (cat && count >= maxPerCategory) {
      deferred.push(item)
      continue
    }
    counts.set(cat, count + 1)
    kept.push(item)
  }
  return [...kept, ...deferred]
}

/**
 * ALGO div.author_spacing - enforce a minimum gap between stories that
 * share an author; violators defer down the list.
 */
export function authorSpacing<T extends { authorIds?: string[] }>(
  items: T[],
  minGap = 2,
): T[] {
  const out: T[] = []
  const deferred: T[] = []
  const lastPosition = new Map<string, number>()

  for (const item of items) {
    const authors = item.authorIds ?? []
    const tooClose = authors.some((a) => {
      const pos = lastPosition.get(a)
      return pos !== undefined && out.length - pos < minGap
    })
    if (tooClose) {
      deferred.push(item)
      continue
    }
    for (const a of authors) lastPosition.set(a, out.length)
    out.push(item)
  }
  return [...out, ...deferred]
}

/**
 * ALGO div.serendipity - controlled exploration: replace every Nth slot in
 * the main list with the next unseen exploration item. Deterministic, so
 * slots are stable across renders.
 */
export function serendipityInject<T extends { id: string }>(
  mainList: T[],
  explorationPool: T[],
  everyN = 5,
): T[] {
  if (everyN < 2 || !explorationPool.length) return mainList
  const seen = new Set(mainList.map((i) => i.id))
  const fresh = explorationPool.filter((i) => !seen.has(i.id))
  if (!fresh.length) return mainList
  const out: T[] = []
  let freshIdx = 0
  for (let i = 0; i < mainList.length; i++) {
    // 1-based position: every Nth slot hosts an exploration item.
    if ((i + 1) % everyN === 0 && freshIdx < fresh.length) {
      out.push(fresh[freshIdx])
      freshIdx += 1
    } else {
      out.push(mainList[i])
    }
  }
  return out
}

/**
 * ALGO div.interleave - team-draft style A/B interleave of two ranked lists
 * (alternating picks, skipping already-picked ids). Standard for comparing
 * two rankers on live traffic without a full experiment split.
 */
export function interleaveLists<T extends { id: string }>(a: T[], b: T[], limit?: number): T[] {
  const out: T[] = []
  const seen = new Set<string>()
  const max = limit ?? a.length + b.length
  let ai = 0
  let bi = 0
  let turnA = true
  while (out.length < max && (ai < a.length || bi < b.length)) {
    const source = turnA ? a : b
    let idx = turnA ? ai : bi
    while (idx < source.length && seen.has(source[idx].id)) idx += 1
    if (idx < source.length) {
      out.push(source[idx])
      seen.add(source[idx].id)
    }
    if (turnA) ai = idx + 1
    else bi = idx + 1
    turnA = !turnA
  }
  return out
}
