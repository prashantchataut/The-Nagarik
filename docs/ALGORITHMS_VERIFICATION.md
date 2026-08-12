# Algorithms Verification Audit - 2026-08-12

Method (repeatable, adversarial):
1. Fresh test run: 140 tests green (111 algorithms + 28 web + 1 content).
2. Export enumeration: 148 exports, 146 callable.
3. **Smoke-execution**: all 143 mapped algorithms invoked with real inputs;
   all computed real output (no stubs, no NaN, no throws). Script inline in
   session log; representative checks live in the unit suites.
4. **Claim-to-call-site audit**: every registry capability marked
   `production` that maps to a library function was grepped for a real call
   site in `apps/web/src`. Now automated:
   `node --import tsx packages/algorithms/scripts/audit-production-claims.mjs`
   (exits 1 on unsubstantiated claims - CI-ready).

## Findings and corrections

**9 false `production` claims found and flipped to `shadow`:**
- Inherited from the pre-existing registry (before the algorithm batches):
  `rank.weighted`, `rank.time_decay`, `rank.bayesian_ctr`,
  `rank.category_diversity`, `rank.breaking_boost`, `search.bm25`,
  `mod.wilson_rank` - all implemented + tested, none called by the app.
- From batch 1 registry entries: `stats.beta_mean`, `score.ctr_smoothed` -
  over-claimed as production; the direct functions have no app call site.

Registry after audit: 269 capabilities = 68 production (35 library-backed and
call-site-verified + 33 policy/infra properties) / 104 shadow / 97 planned.

## Verified production algorithms (35, each with a named call site)

Homepage trending: velocityRank (EWMA velocity, spike guard, burst z, half-life)
Signals desk: kleinbergBursts, poissonSurprise, lifecyclePhase,
clusterTrendingTopics, acceleration, detectBurst (z + MAD-z)
Search: buildSearchIndex (lexicon), tokenizeText, romanToDevanagari,
PrefixTrie, fuzzyTermMatches (suggest API)
Recommendations/up-next: recommendForReader (hybrid + cold-start),
freshnessScore, categoryQuota, impressionFatigue
Comments: commentSpamScore, isDuplicateComment (jaccard), moderateComment,
prioritizeModerationQueue, detectBrigading
Reader: readingStreak (account), continueReading, detectTrending + mostRead
(category pages), estimateReadTime (article pages)

Everything else in the library (~110 functions) is `shadow`: implemented,
unit-tested, exported, executable - but not yet feeding a product surface,
and the ledger now says exactly that.
