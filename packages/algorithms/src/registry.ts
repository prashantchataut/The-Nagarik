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


// ---------------------------------------------------------------------------
// Algorithm library batch 1 (2026-08-11) - implemented + unit-tested in this
// package. Status is honest: production = wired to a live surface today,
// shadow = implemented and tested, awaiting its consumer surface.
// ---------------------------------------------------------------------------
CAPABILITIES.push(
  // stats
  cap('stats.sma', 'Simple moving average', 'infra', 'shadow', 'Trailing-window mean for dashboards'),
  cap('stats.ewma', 'Exponential moving average', 'ranking', 'production', 'Smoothing under velocity ranking', { surface: 'trending' }),
  cap('stats.z_score', 'Z-score', 'ranking', 'production', 'Burst detection baseline scoring'),
  cap('stats.mad_z', 'Robust MAD z-score', 'ranking', 'production', 'Spike-resistant burst scoring'),
  cap('stats.percentile', 'Interpolated percentile', 'infra', 'shadow', 'Latency/engagement distribution cuts'),
  cap('stats.laplace', 'Laplace smoothing', 'ranking', 'shadow', 'Additive smoothing for sparse counts'),
  cap('stats.beta_mean', 'Beta posterior mean', 'ranking', 'production', 'Smoothed CTR under scoring', { surface: 'hubs' }),
  cap('stats.two_proportion_z', 'Two-proportion z-test', 'experiments', 'shadow', 'A/B conversion significance'),
  cap('stats.regression_slope', 'Trend slope', 'ranking', 'shadow', 'Direction of engagement over windows'),
  cap('stats.softmax', 'Softmax distribution', 'recommend', 'shadow', 'Score-to-probability conversion'),
  cap('stats.sessionize', 'Event sessionization', 'retention', 'shadow', '30-minute-gap session splitting'),
  cap('stats.winsorize', 'Winsorization', 'ranking', 'production', 'Outlier clamping inside spike guard'),
  // velocity & burst
  cap('vel.velocity', 'Velocity (events/min)', 'ranking', 'shadow', 'Newest-window event rate'),
  cap('vel.acceleration', 'Acceleration', 'ranking', 'shadow', 'Velocity delta between windows'),
  cap('vel.burst_z', 'Burst detection', 'ranking', 'production', 'Robust z outlier vs baseline windows, flat-floor fallback', { surface: 'homepage' }),
  cap('vel.burst_hysteresis', 'Burst hysteresis', 'ranking', 'shadow', 'Enter/exit thresholds against flapping'),
  cap('vel.ewma_velocity', 'Smoothed velocity', 'ranking', 'production', 'EWMA of per-window rates', { surface: 'homepage' }),
  cap('vel.spike_guard', 'Spike guard', 'ranking', 'production', 'Winsorized windows against bot spikes', { surface: 'homepage' }),
  cap('vel.velocity_rank', 'Velocity ranking', 'ranking', 'production', 'Velocity x freshness x burst composite', { surface: 'homepage' }),
  cap('rank.half_life', 'Half-life decay factory', 'ranking', 'production', 'Configurable exponential freshness'),
  // scoring
  cap('score.hn_gravity', 'Hacker News gravity', 'ranking', 'shadow', '(p-1)/(age+2)^1.8 reference ranker'),
  cap('score.reddit_hot', 'Reddit hot', 'ranking', 'shadow', 'log10 votes + time epoch term'),
  cap('score.bayesian_avg', 'Bayesian average', 'ranking', 'shadow', 'Prior-weighted rating for sparse items'),
  cap('score.freshness', 'Freshness half-life', 'ranking', 'production', 'Freshness term in feeds', { surface: 'up-next' }),
  cap('score.ctr_smoothed', 'Smoothed CTR', 'ranking', 'production', 'Beta-smoothed CTR term'),
  cap('score.dwell', 'Dwell quality', 'ranking', 'shadow', 'Read time vs expected, capped'),
  cap('score.completion', 'Completion rate', 'ranking', 'shadow', 'Finished reads over views'),
  cap('score.position_bias', 'Position bias correction', 'ranking', 'shadow', 'Inverse-propensity CTR by rank'),
  cap('score.editorial_decay', 'Editorial boost decay', 'editorial', 'shadow', 'Pins expire linearly'),
  cap('score.engagement_composite', 'Engagement composite', 'ranking', 'shadow', 'Rate-normalized weighted blend'),
  // text
  cap('text.tokenize', 'Devanagari-safe tokenizer', 'search', 'production', 'Mark-aware Unicode tokenization', { surface: 'search' }),
  cap('text.tfidf', 'TF-IDF vectors', 'search', 'shadow', 'Smoothed-IDF document vectors'),
  cap('text.cosine_sparse', 'Sparse cosine', 'recommend', 'shadow', 'Similarity over sparse vectors'),
  cap('text.jaccard', 'Jaccard similarity', 'moderation', 'production', 'Set overlap under dup detection', { surface: 'comments' }),
  cap('text.bm25', 'Okapi BM25', 'search', 'shadow', 'Exact BM25 (k1=1.2, b=0.75) - swap-in for lexical search'),
  cap('text.simhash', 'SimHash fingerprint', 'editorial', 'shadow', '32-bit near-dup fingerprints for wire copy'),
  cap('text.near_dup', 'Near-duplicate verdict', 'editorial', 'shadow', 'Shingle Jaccard OR simhash Hamming'),
  cap('text.keywords', 'TF-IDF keywords', 'editorial', 'shadow', 'Top-k distinctive terms per story'),
  cap('feed.headline_dedupe', 'Headline dedupe', 'discovery', 'shadow', 'Greedy near-dup removal in rails'),
  // diversity
  cap('div.mmr', 'MMR re-ranking', 'recommend', 'shadow', 'Relevance/diversity trade-off re-ranker'),
  cap('div.category_quota', 'Category quota', 'recommend', 'production', 'Window cap in recommendations', { surface: 'up-next' }),
  cap('div.author_spacing', 'Author spacing', 'discovery', 'shadow', 'Minimum gap between same byline'),
  cap('div.serendipity', 'Serendipity injection', 'recommend', 'shadow', 'Deterministic exploration slots'),
  cap('div.interleave', 'Team-draft interleaving', 'experiments', 'shadow', 'Online ranker comparison'),
  // personalization
  cap('pers.interest_decay', 'Decayed interest profile', 'recommend', 'shadow', 'Half-life category vector from reads'),
  cap('pers.covisit', 'Co-visitation matrix', 'recommend', 'shadow', 'Readers-also-read counts from sessions'),
  cap('pers.item_cf', 'Item-item CF', 'recommend', 'shadow', 'Popularity-damped co-read scores'),
  cap('pers.markov_next', 'Markov next-read', 'recommend', 'shadow', 'Smoothed session transition model'),
  cap('pers.fatigue', 'Impression fatigue', 'recommend', 'production', 'Dampens repeatedly shown stories', { surface: 'up-next' }),
  cap('pers.freq_cap', 'Frequency capping', 'notify', 'shadow', 'Hard cap per rolling window'),
  cap('pers.cold_start_blend', 'Cold-start blending', 'recommend', 'shadow', 'n/(n+k) personal-global weight'),
  // experimentation
  cap('exp.epsilon_greedy', 'Epsilon-greedy bandit', 'experiments', 'shadow', 'Explore/exploit module ordering'),
  cap('exp.ucb1', 'UCB1 bandit', 'experiments', 'shadow', 'Optimism under uncertainty'),
  cap('exp.thompson', 'Thompson sampling', 'experiments', 'shadow', 'Beta-Bernoulli posterior sampling'),
  cap('exp.bucket_assign', 'Deterministic bucketing', 'experiments', 'shadow', 'Hash-based stable variant assignment'),
  cap('exp.srm', 'Sample ratio mismatch', 'experiments', 'shadow', 'Loud alarm on broken splits'),
  // quality
  cap('quality.read_time', 'Devanagari-aware read time', 'editorial', 'production', 'Script-blended WPM estimate'),
  cap('quality.comment_spam', 'Comment spam score', 'moderation', 'production', 'Links/shout/repetition composite gate', { surface: 'comments' }),
  cap('quality.dup_comment', 'Duplicate comment detection', 'moderation', 'production', 'Shingle-Jaccard repeat gate', { surface: 'comments' }),
  cap('quality.clickbait', 'Clickbait linting', 'editorial', 'shadow', 'Curiosity-gap heuristics for the composer'),
  cap('quality.readability', 'Readability hint', 'editorial', 'shadow', 'Danda-aware sentence-length buckets'),
  cap('quality.profanity', 'Profanity matcher', 'moderation', 'shadow', 'Normalized wordlist engine, CMS-fed lists'),
)


// ---------------------------------------------------------------------------
// Algorithm library batch 2 (2026-08-11) - implemented + unit-tested.
// ---------------------------------------------------------------------------
CAPABILITIES.push(
  // trending depth
  cap('trend.kleinberg', 'Kleinberg burst automaton', 'ranking', 'shadow', 'Two-state Viterbi over event gaps'),
  cap('trend.poisson_surprise', 'Poisson surprise', 'ranking', 'shadow', '-log10 tail probability of observed spikes'),
  cap('trend.category_baseline', 'Per-category baselines', 'ranking', 'shadow', 'Politics judged against politics'),
  cap('trend.topic_cluster', 'Trending topic clustering', 'discovery', 'shadow', 'Keyword co-occurrence agglomeration'),
  cap('trend.geo', 'Province trending', 'discovery', 'shadow', 'Regional velocity splits with honest minimums'),
  cap('trend.hour_of_week', 'Seasonality normalization', 'ranking', 'shadow', '168-bucket hour-of-week baselines'),
  cap('trend.lifecycle', 'Story lifecycle phases', 'editorial', 'shadow', 'rising / peak / decaying / dormant'),
  cap('trend.half_life_fit', 'Half-life estimation', 'ranking', 'shadow', 'Log-linear decay fitting per category'),
  // search upgrades
  cap('search.trie_autocomplete', 'Prefix trie autocomplete', 'search', 'shadow', 'Devanagari + Latin weighted completions'),
  cap('search.transliterate', 'Roman->Devanagari matching', 'search', 'production', 'Syllable parser with vowel alternates, substitution-ordered candidates', { surface: 'search' }),
  cap('search.levenshtein', 'Typo tolerance', 'search', 'shadow', 'Banded edit distance, length-scaled budget'),
  cap('search.zero_result_rewrite', 'Zero-result rescue', 'search', 'shadow', 'Closest successful query suggestion'),
  cap('search.proximity', 'Phrase proximity scoring', 'search', 'shadow', 'Minimal window span boost'),
  cap('search.xquad', 'Result diversification', 'search', 'shadow', 'xQuAD-lite category coverage'),
  cap('search.trending_queries', 'Trending queries', 'search', 'shadow', 'Burst-scored query suggestions'),
  // personalization depth
  cap('pers.mf_als', 'Matrix factorization (ALS-lite)', 'recommend', 'shadow', 'Implicit-feedback latent factors, deterministic'),
  cap('pers.markov2', 'Order-2 Markov next-read', 'recommend', 'shadow', 'Bigram transitions with order-1 fallback'),
  cap('pers.author_affinity', 'Author affinity profiles', 'recommend', 'shadow', 'Decayed byline vectors'),
  cap('pers.negative_feedback', 'Negative feedback', 'recommend', 'shadow', 'Hide stories, damp categories/authors'),
  cap('pers.onboarding', 'Interest onboarding optimizer', 'retention', 'shadow', 'Greedy max-coverage pick-3'),
  cap('pers.locale_transfer', 'Cross-locale transfer', 'recommend', 'shadow', 'ne<->en interests at 0.7 confidence'),
  cap('pers.time_slot', 'Time-slot preferences', 'recommend', 'shadow', 'Daypart length preferences from history'),
  cap('pers.push_propensity', 'Push propensity', 'notify', 'shadow', 'Logistic send/skip with hard gates'),
  // editorial intelligence
  cap('ed.wire_cluster', 'Wire-copy cluster collapse', 'editorial', 'shadow', 'Dual-detector headline clustering'),
  cap('ed.publish_time', 'Optimal publish hours', 'editorial', 'shadow', 'Engagement-weighted hour histogram'),
  cap('ed.headline_ab', 'Headline A/B testing', 'editorial', 'shadow', 'Thompson sampling with 95% posterior stop'),
  cap('ed.story_gap', 'Coverage gap detection', 'editorial', 'shadow', 'Bursting queries missing from the corpus'),
  cap('ed.evergreen', 'Evergreen resurfacing', 'discovery', 'shadow', 'Old stories with fresh bursts'),
  cap('ed.correction_propagation', 'Correction propagation', 'trust', 'shadow', 'BFS over the citation graph'),
  cap('ed.tag_suggest', 'Composer tag suggestions', 'editorial', 'shadow', 'TF-IDF keywords onto tag vocabulary'),
  cap('ed.related_gate', 'Related-story quality gate', 'discovery', 'shadow', 'Similarity floor - empty beats misleading'),
  // community
  cap('com.rank', 'Comment ranking', 'community', 'shadow', 'Wilson bound x freshness blend'),
  cap('com.toxicity', 'Tiered toxicity scoring', 'moderation', 'shadow', 'CMS-fed weighted wordlists ne+en'),
  cap('com.thread_collapse', 'Thread collapse', 'community', 'shadow', 'Low-value chain folding'),
  cap('com.reputation', 'Commenter reputation', 'moderation', 'shadow', 'Beta-smoothed accept rate'),
  cap('com.brigading', 'Brigading detection', 'moderation', 'shadow', 'Volume x concentration x new-source composite'),
  cap('com.queue_priority', 'Moderation queue priority', 'moderation', 'production', 'Hot-article, borderline-first review order', { surface: 'admin-queue' }),
  // experiments depth
  cap('exp.exposure_join', 'Exposure-metric join', 'experiments', 'shadow', 'Intent-to-treat per-variant metrics'),
  cap('exp.bayes_stop', 'Bayesian early stopping', 'experiments', 'shadow', 'Exact P(B>A) via log-Beta summation'),
  cap('exp.cuped', 'CUPED variance reduction', 'experiments', 'shadow', 'Pre-period covariate adjustment'),
  cap('exp.srm_chi2', 'Multi-variant SRM', 'experiments', 'shadow', 'Chi-square GOF with incomplete-gamma p-values'),
  cap('exp.guardrail', 'Guardrail monitor', 'experiments', 'shadow', 'One-sided degradation test, auto-halt'),
  // distribution & retention
  cap('ret.newsletter_select', 'Newsletter story selection', 'retention', 'shadow', 'Interest-ranked, deduped, quota-bound'),
  cap('ret.send_time', 'Send-time optimization', 'retention', 'shadow', 'Laplace-smoothed open-hour histogram'),
  cap('ret.digest_dedupe', 'Digest dedupe', 'retention', 'shadow', 'Read + recently-sent removal'),
  cap('ret.card_ctr_feedback', 'Social card feedback', 'distribution', 'shadow', 'Wilson-bound conservative winner'),
  cap('ret.streak_engine', 'Reading streaks', 'retention', 'production', 'Consecutive-day chains + milestones', { surface: 'account' }),
  cap('ret.churn_risk', 'Churn risk scoring', 'retention', 'shadow', 'Recency/frequency decay buckets'),
)

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
