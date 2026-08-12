#!/usr/bin/env node
/**
 * Registry integrity audit: every library-backed capability marked
 * `production` must have a real call site in apps/web. Run from repo root:
 *   node --import tsx packages/algorithms/scripts/audit-production-claims.mjs
 * Exits 1 on unsubstantiated claims - wire the algorithm or flip to shadow.
 */
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CAPABILITIES } from '../src/registry.ts'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const WEB_SRC = path.join(REPO_ROOT, 'apps', 'web', 'src')

/** capability id -> function names, one of which must appear in apps/web. */
const CALL_SITES = {
  'stats.ewma': ['velocityRank'], 'stats.z_score': ['detectBurst'], 'stats.mad_z': ['detectBurst'],
  'stats.winsorize': ['velocityRank'], 'vel.velocity_rank': ['velocityRank'], 'vel.ewma_velocity': ['velocityRank'],
  'vel.spike_guard': ['velocityRank'], 'vel.burst_z': ['detectBurst', 'velocityRank'], 'vel.acceleration': ['acceleration'],
  'rank.half_life': ['velocityRank', 'halfLifeDecay'], 'score.freshness': ['recommendForReader', 'freshnessScore'],
  'text.tokenize': ['buildSearchIndex', 'tokenizeText'], 'text.jaccard': ['isDuplicateComment'],
  'div.category_quota': ['recommendForReader'], 'pers.fatigue': ['recommendForReader'],
  'quality.read_time': ['readTime'], 'quality.comment_spam': ['commentSpamScore'], 'quality.dup_comment': ['isDuplicateComment'],
  'trend.kleinberg': ['kleinbergBursts'], 'trend.poisson_surprise': ['poissonSurprise'],
  'trend.lifecycle': ['lifecyclePhase'], 'trend.topic_cluster': ['clusterTrendingTopics'],
  'search.trie_autocomplete': ['PrefixTrie'], 'search.transliterate': ['romanToDevanagari'],
  'search.levenshtein': ['fuzzyTermMatches'], 'com.queue_priority': ['prioritizeModerationQueue'],
  'com.brigading': ['detectBrigading'], 'ret.streak_engine': ['readingStreak'],
  'discover.trending': ['detectTrending', 'velocityRank'], 'discover.most_read': ['mostRead'],
  'discover.continue_reading': ['continueReading'], 'search.lexicon': ['buildSearchIndex'],
  'rec.hybrid': ['recommendForReader'], 'rec.cold_start': ['recommendForReader'], 'mod.lexical': ['moderateComment'],
}

function hasCallSite(fns) {
  for (const fn of fns) {
    try {
      const out = execFileSync('grep', ['-rl', fn, WEB_SRC, '--include=*.ts', '--include=*.tsx'], {
        encoding: 'utf8',
      })
      if (out.trim()) return fn
    } catch {
      // no match
    }
  }
  return null
}

const libraryProduction = CAPABILITIES.filter(
  (c) => c.status === 'production' && CALL_SITES[c.id] !== undefined,
)
const unaudited = CAPABILITIES.filter(
  (c) => c.status === 'production' && CALL_SITES[c.id] === undefined,
)
let failures = 0
for (const cap of libraryProduction) {
  const hit = hasCallSite(CALL_SITES[cap.id])
  if (hit) console.log(`OK  ${cap.id} -> ${hit}`)
  else {
    console.error(`BAD ${cap.id}: production claim without a call site`)
    failures += 1
  }
}
console.log(`\nlibrary production: ${libraryProduction.length} verified-checked | policy/infra production (not function-mapped): ${unaudited.length}`)
if (failures) {
  console.error(`\n${failures} UNSUBSTANTIATED production claims - wire them or flip to shadow.`)
  process.exit(1)
}
console.log('registry ledger is truthful.')
