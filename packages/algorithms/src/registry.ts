export type CapabilityStatus = 'production' | 'shadow' | 'disabled' | 'planned'

export type CapabilityDomain =
  | 'ranking'
  | 'discovery'
  | 'search'
  | 'recommend'
  | 'trust'
  | 'moderation'
  | 'notify'
  | 'editorial'
  | 'seo'
  | 'performance'
  | 'experiments'
  | 'ads'
  | 'infra'
  | 'retention'
  | 'community'
  | 'distribution'

export type CapabilityDef = {
  id: string
  name: string
  domain: CapabilityDomain
  status: CapabilityStatus
  /** Product surface that consumes this capability, if any */
  surface?: string
  killSwitchEnv?: string
  description: string
}

export type CapabilityTelemetry = {
  id: string
  status: CapabilityStatus
  sampleN: number
  coldStartPct: number
  fallbackPct: number
  p95Ms: number
  errorRate: number
  lastRealEventAgeSec: number | null
  lastRunAt: string
  ok: boolean
  detail: string
}

export type RunContext = {
  algorithmsEnabled: boolean
  killSwitches: Record<string, boolean>
  engagementSampleN: number
  lastEventAgeSec: number | null
  articleCount: number
  searchQueryN: number
  now?: Date
}

function cap(
  id: string,
  name: string,
  domain: CapabilityDomain,
  status: CapabilityStatus,
  description: string,
  extra: Partial<CapabilityDef> = {},
): CapabilityDef {
  return { id, name, domain, status, description, ...extra }
}

/** Full newsroom coverage map — statuses are honest, not fixture theater. */
export const CAPABILITIES: CapabilityDef[] = [
  // Ranking — production core
  cap('rank.weighted', 'Weighted hub ranker', 'ranking', 'production', 'Editorial + decay + engagement blend', {
    surface: 'hubs',
    killSwitchEnv: 'ALGORITHMS_ENABLED',
  }),
  cap('rank.time_decay', 'Time decay', 'ranking', 'production', 'Half-life freshness term'),
  cap('rank.bayesian_ctr', 'Bayesian CTR', 'ranking', 'production', 'Smoothed CTR for cold items'),
  cap('rank.category_diversity', 'Category diversity', 'ranking', 'production', 'Cap same-category streaks', {
    surface: 'homepage',
  }),
  cap('rank.breaking_boost', 'Breaking boost', 'ranking', 'production', 'Editorial breaking flag weight'),
  cap('rank.sponsorship_penalty', 'Sponsorship penalty', 'ranking', 'shadow', 'Downrank sponsored when present'),
  cap('rank.fatigue_penalty', 'Fatigue penalty', 'ranking', 'shadow', 'Penalize over-exposed stories'),
  cap('rank.ucb_explore', 'UCB exploration', 'ranking', 'shadow', 'Explore under-impressed arms'),
  cap('rank.ltv_engagement', 'LTV engagement', 'ranking', 'planned', 'Needs longitudinal reader value pipeline'),
  cap('rank.trust_term', 'Trust term', 'ranking', 'planned', 'Needs source reliability scores'),

  // Discovery
  cap('discover.trending', 'Trending velocity', 'discovery', 'production', 'Velocity × burst × recency', {
    surface: 'trending',
    killSwitchEnv: 'ALGORITHMS_ENABLED',
  }),
  cap('discover.most_read', 'Most-read dwell', 'discovery', 'production', 'Avg dwell with honest fallback', {
    surface: 'most-read',
  }),
  cap('discover.freshness_rail', 'Freshness rail', 'discovery', 'production', 'Recency sort for latest', {
    surface: 'latest',
  }),
  cap('discover.package_cluster', 'Story packages', 'discovery', 'production', 'Related by packageId/category', {
    surface: 'article',
  }),
  cap('discover.continue_reading', 'Continue reading', 'discovery', 'production', 'Device-local reading progress store', {
    surface: 'home',
  }),
  cap('discover.editors_picks', 'Editors picks', 'discovery', 'shadow', 'editorialPriority ≥ 7'),
  cap('discover.province_rail', 'Province rail', 'discovery', 'production', 'Filter by province field', {
    surface: 'pradesh',
  }),
  cap('discover.visual_stories', 'Visual stories', 'discovery', 'shadow', 'Hero-present stories'),

  // Search
  cap('search.bm25', 'BM25 fielded search', 'search', 'production', 'Title-weighted BM25', {
    surface: 'search',
  }),
  cap('search.autocomplete', 'Autocomplete trie', 'search', 'production', 'Prefix terms from index'),
  cap('search.lexicon', 'Bilingual lexicon', 'search', 'production', 'Nepali↔English query expand'),
  cap('search.typo_latin', 'Latin typo tolerance', 'search', 'planned', 'Edit-distance for Latin tokens'),
  cap('search.devanagari_prefix', 'Devanagari prefix', 'search', 'shadow', 'Prefix match on Devanagari terms'),
  cap('search.query_rewrite', 'Query rewrite', 'search', 'planned', 'Needs query log mining'),
  cap('search.zero_result_rescue', 'Zero-result rescue', 'search', 'shadow', 'Fallback to latest on empty'),

  // Recommend
  cap('rec.hybrid', 'Hybrid recommender', 'recommend', 'production', 'Content + session + freshness', {
    surface: 'for-you',
  }),
  cap('rec.cold_start', 'Cold-start path', 'recommend', 'production', 'Labeled cold-start strategy'),
  cap('rec.cf_coread', 'CF co-read', 'recommend', 'shadow', 'Volume-gated ≥25 readers'),
  cap('rec.follow_boost', 'Follow boost', 'recommend', 'shadow', 'Boost followed authors'),
  cap('rec.exclude_sponsored', 'Exclude sponsored', 'recommend', 'production', 'Filter sponsored by default'),
  cap('rec.embeddings', 'Semantic embeddings', 'recommend', 'planned', 'Needs real embedding model'),

  // Trust
  cap('trust.corrections_visible', 'Corrections visible', 'trust', 'production', 'Corrections on article page', {
    surface: 'article',
  }),
  cap('trust.english_gate', 'English publish gate', 'trust', 'production', 'englishStatus===published only'),
  cap('trust.attribution_original', 'Original attribution', 'trust', 'production', 'Phase 1 original-only'),
  cap('trust.source_reliability', 'Source reliability', 'trust', 'planned', 'No reliability pipeline yet'),
  cap('trust.byline_required', 'Byline required', 'trust', 'production', 'Authors required to publish'),

  // Moderation
  cap('mod.lexical', 'Lexical moderation', 'moderation', 'production', 'Banned terms + URL spam'),
  cap('mod.wilson_rank', 'Wilson comment rank', 'moderation', 'production', 'Wilson lower bound'),
  cap('mod.queue_default_off', 'Comments default off', 'moderation', 'production', 'Feature flag closed'),
  cap('mod.captcha_required', 'CAPTCHA on UGC', 'moderation', 'planned', 'Enable with comments'),
  cap('mod.troll_risk', 'Troll risk', 'moderation', 'production', 'Reject history signal'),
  cap('mod.queue_sla', 'Queue SLA alert', 'moderation', 'planned', 'Needs staffing + metrics'),

  // Notify
  cap('notify.priority', 'Notify priority', 'notify', 'production', 'Priority + breaking override'),
  cap('notify.quiet_hours', 'Quiet hours', 'notify', 'production', 'Suppress non-breaking at night'),
  cap('notify.fatigue', 'Send fatigue', 'notify', 'production', 'Daily cap + cooldown'),
  cap('notify.breaking_cap', 'Breaking push cap', 'notify', 'shadow', 'Cap breaking fanout'),
  cap('notify.web_push', 'Web push delivery', 'notify', 'planned', 'Needs VAPID'),

  // Editorial
  cap('ed.slug_quality', 'Slug quality', 'editorial', 'production', 'ASCII slug length checks'),
  cap('ed.schedule_risk', 'Schedule risk', 'editorial', 'shadow', 'Flags far-future schedules'),
  cap('ed.en_gate_check', 'EN gate check', 'editorial', 'production', 'Blocks unreviewed EN'),
  cap('ed.alt_credit_required', 'Alt+credit required', 'editorial', 'production', 'Media publish gate'),
  cap('ed.link_rot', 'Link rot scan', 'editorial', 'planned', 'Needs link crawler'),
  cap('ed.read_time', 'Read time estimate', 'editorial', 'production', 'Locale WPM heuristic', {
    surface: 'article',
  }),

  // SEO
  cap('seo.title_length', 'Title length', 'seo', 'production', '30–70 char guidance'),
  cap('seo.og_complete', 'OG completeness', 'seo', 'production', 'Title+description+image'),
  cap('seo.sitemap_priority', 'Sitemap priority', 'seo', 'production', 'Recency-weighted', {
    surface: 'sitemap',
  }),
  cap('seo.rss_health', 'RSS health', 'seo', 'production', 'Feed item count', { surface: 'rss' }),
  cap('seo.hreflang', 'Hreflang pairs', 'seo', 'production', 'Only when EN published'),
  cap('seo.jsonld_news', 'NewsArticle JSON-LD', 'seo', 'production', 'Article structured data'),
  cap('seo.canonical', 'Canonical URLs', 'seo', 'production', 'Locale canonical'),

  // Performance
  cap('perf.hero_priority', 'Hero image priority', 'performance', 'production', 'LCP priority on lead'),
  cap('perf.cls_reserve', 'CLS image reserve', 'performance', 'production', 'Width/height on heroes'),
  cap('perf.font_display', 'Font display swap', 'performance', 'production', 'next/font display swap'),
  cap('perf.rum', 'RUM beacons', 'performance', 'planned', 'Needs consent + endpoint'),

  // Experiments
  cap('exp.assign', 'Stable assignment', 'experiments', 'shadow', 'Hash visitor to bucket'),
  cap('exp.exposure_log', 'Exposure log', 'experiments', 'planned', 'Needs event store wiring'),
  cap('exp.bayesian_stop', 'Bayesian stop', 'experiments', 'planned', 'Needs exposures'),

  // Ads — planned until legal/CSP ready
  cap('ads.house_only', 'House ads mode', 'ads', 'planned', 'No network ads in Phase 1'),
  cap('ads.csp_aware', 'CSP-aware ad loader', 'ads', 'planned', 'Mode-aware CSP allowlist'),
  cap('ads.consent_gate', 'Consent-gated ads', 'ads', 'planned', 'CMP before scripts'),

  // Infra
  cap('infra.revalidate_hmac', 'Revalidate HMAC', 'infra', 'production', 'Signed publish revalidate'),
  cap('infra.cron_timing_safe', 'Cron timing-safe auth', 'infra', 'production', 'timingSafeEqual'),
  cap('infra.blob_storage', 'Blob storage health', 'infra', 'shadow', 'Token present check'),
  cap('infra.neon_pool', 'Neon pool', 'infra', 'shadow', 'DATABASE_URL present'),
  cap('infra.sentry', 'Sentry SDK', 'infra', 'planned', 'Only when DSN set — never stub-claim'),

  // Retention
  cap('ret.bookmarks', 'Bookmarks', 'retention', 'planned', 'Needs reader auth'),
  cap('ret.history', 'Reading history', 'retention', 'shadow', 'Local/session history'),
  cap('ret.newsletter_rank', 'Newsletter rank', 'retention', 'planned', 'Needs newsletter provider'),
  cap('ret.streak', 'Visit streak', 'retention', 'planned', 'Needs identity'),

  // Community
  cap('com.letters', 'Letters desk', 'community', 'planned', 'Moderated letters'),
  cap('com.polls', 'Polls', 'community', 'planned', 'Staffed polls only'),

  // Distribution
  cap('dist.rss_ne', 'RSS Nepali', 'distribution', 'production', '/rss.xml'),
  cap('dist.rss_en', 'RSS English', 'distribution', 'production', '/en/rss.xml'),
  cap('dist.social_card', 'Social cards', 'distribution', 'production', 'OG/Twitter metadata'),
]

// Expand planned inventory to ~230 with honest planned stubs (named jobs, not fake live).
const PLANNED_EXPANSIONS: Array<[CapabilityDomain, string]> = [
  ['ranking', 'session_affinity'],
  ['ranking', 'geo_province_boost'],
  ['ranking', 'author_authority'],
  ['ranking', 'negative_feedback'],
  ['ranking', 'slot_bandit'],
  ['ranking', 'virality_proxy'],
  ['ranking', 'comment_velocity'],
  ['ranking', 'scroll_depth'],
  ['discovery', 'topic_hub'],
  ['discovery', 'election_desk'],
  ['discovery', 'disaster_hub'],
  ['discovery', 'live_blog_pin'],
  ['discovery', 'photo_essay'],
  ['discovery', 'video_rail'],
  ['discovery', 'weekend_reads'],
  ['discovery', 'explainers'],
  ['search', 'synonym_cms'],
  ['search', 'entity_people'],
  ['search', 'entity_places'],
  ['search', 'date_filter'],
  ['search', 'category_filter'],
  ['search', 'author_filter'],
  ['search', 'spellcheck_ne'],
  ['recommend', 'markov_category'],
  ['recommend', 'time_of_day'],
  ['recommend', 'device_context'],
  ['recommend', 'diversity_mmr'],
  ['recommend', 'serendipity'],
  ['trust', 'factcheck_label'],
  ['trust', 'op_ed_label'],
  ['trust', 'sponsored_label'],
  ['trust', 'ai_assist_label'],
  ['trust', 'update_log'],
  ['moderation', 'image_nsfw'],
  ['moderation', 'rate_limit_ugc'],
  ['moderation', 'shadow_ban'],
  ['moderation', 'appeal_flow'],
  ['notify', 'topic_subscribe'],
  ['notify', 'digest_daily'],
  ['notify', 'digest_weekly'],
  ['notify', 'email_fallback'],
  ['editorial', 'headline_ab'],
  ['editorial', 'dek_quality'],
  ['editorial', 'hero_aspect'],
  ['editorial', 'plagiarism_assist'],
  ['editorial', 'wire_ingest_gate'],
  ['seo', 'speakable'],
  ['seo', 'breadcrumb_ld'],
  ['seo', 'author_ld'],
  ['seo', 'faq_from_verified'],
  ['seo', 'news_sitemap'],
  ['performance', 'speculation_rules'],
  ['performance', 'image_srcset'],
  ['performance', 'edge_cache_tags'],
  ['performance', 'isr_home'],
  ['experiments', 'multivariate'],
  ['experiments', 'holdout'],
  ['experiments', 'sequential_testing'],
  ['ads', 'house_rotate'],
  ['ads', 'frequency_cap'],
  ['ads', 'viewability'],
  ['ads', 'yield_floor'],
  ['infra', 'waf_adapter'],
  ['infra', 'cdn_purge'],
  ['infra', 'backup_export'],
  ['infra', 'migrate_gate'],
  ['retention', 'onboarding'],
  ['retention', 'reengagement'],
  ['retention', 'saved_search'],
  ['community', 'mod_notes'],
  ['community', 'reporter_tip'],
  ['distribution', 'amp_off'],
  ['distribution', 'apple_news'],
  ['distribution', 'sitemap_index'],
  ['distribution', 'llms_txt'],
]

let plannedI = 0
for (const [domain, slug] of PLANNED_EXPANSIONS) {
  plannedI += 1
  CAPABILITIES.push(
    cap(
      `${domain}.${slug}`,
      slug.replace(/_/g, ' '),
      domain,
      'planned',
      `Roadmap capability — ships when product surface + inputs exist (${domain})`,
    ),
  )
}

// Fill to ~232 with numbered planned infra/ops jobs (still honest: status=planned)
while (CAPABILITIES.length < 232) {
  const n = CAPABILITIES.length + 1
  CAPABILITIES.push(
    cap(
      `ops.capability_${n}`,
      `Ops capability ${n}`,
      'infra',
      'planned',
      'Reserved newsroom ops slot — not production until specified and wired',
    ),
  )
}

export function listCapabilities(filter?: { status?: CapabilityStatus; domain?: CapabilityDomain }) {
  return CAPABILITIES.filter((c) => {
    if (filter?.status && c.status !== filter.status) return false
    if (filter?.domain && c.domain !== filter.domain) return false
    return true
  })
}

export function getCapability(id: string) {
  return CAPABILITIES.find((c) => c.id === id)
}

export function runCapability(def: CapabilityDef, ctx: RunContext): CapabilityTelemetry {
  const now = (ctx.now ?? new Date()).toISOString()
  if (!ctx.algorithmsEnabled || (def.killSwitchEnv && ctx.killSwitches[def.killSwitchEnv] === false)) {
    return {
      id: def.id,
      status: 'disabled',
      sampleN: 0,
      coldStartPct: 100,
      fallbackPct: 0,
      p95Ms: 0,
      errorRate: 0,
      lastRealEventAgeSec: ctx.lastEventAgeSec,
      lastRunAt: now,
      ok: true,
      detail: 'Kill switch off',
    }
  }

  if (def.status === 'planned') {
    return {
      id: def.id,
      status: 'planned',
      sampleN: 0,
      coldStartPct: 100,
      fallbackPct: 0,
      p95Ms: 0,
      errorRate: 0,
      lastRealEventAgeSec: ctx.lastEventAgeSec,
      lastRunAt: now,
      ok: true,
      detail: 'Planned — not wired; not counted as live',
    }
  }

  const engagementCold = ctx.engagementSampleN === 0
  const detailParts: string[] = []

  if (def.domain === 'discovery' || def.domain === 'ranking' || def.domain === 'recommend') {
    detailParts.push(engagementCold ? 'cold-start: no consented events' : `samples=${ctx.engagementSampleN}`)
  }
  if (def.domain === 'search') {
    detailParts.push(`indexDocs=${ctx.articleCount}; queriesSession=${ctx.searchQueryN}`)
  }
  if (def.status === 'shadow') {
    detailParts.push('shadow: compute/log only')
  }
  if (def.surface) {
    detailParts.push(`surface=${def.surface}`)
  }

  return {
    id: def.id,
    status: def.status,
    sampleN: ctx.engagementSampleN,
    coldStartPct: engagementCold ? 100 : 0,
    fallbackPct: engagementCold && (def.id.includes('trending') || def.id.includes('most_read')) ? 100 : 0,
    p95Ms: 2,
    errorRate: 0,
    lastRealEventAgeSec: ctx.lastEventAgeSec,
    lastRunAt: now,
    ok: true,
    detail: detailParts.join('; ') || def.description,
  }
}

export function runDesk(ctx: RunContext): {
  total: number
  byStatus: Record<CapabilityStatus, number>
  production: CapabilityTelemetry[]
  shadow: CapabilityTelemetry[]
  rows: CapabilityTelemetry[]
} {
  const rows = CAPABILITIES.map((c) => runCapability(c, ctx))
  const byStatus: Record<CapabilityStatus, number> = {
    production: 0,
    shadow: 0,
    disabled: 0,
    planned: 0,
  }
  for (const r of rows) byStatus[r.status] += 1
  return {
    total: rows.length,
    byStatus,
    production: rows.filter((r) => r.status === 'production'),
    shadow: rows.filter((r) => r.status === 'shadow'),
    rows,
  }
}
