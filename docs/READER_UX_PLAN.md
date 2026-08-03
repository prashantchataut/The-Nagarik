# Reader UX plan (civic-dense)

**Reading this as:** redesign of a Nepali-first news portal for mobile-first civic readers, with Online Khabar IA density and Civic Ink materials (not OK red warehouse).

**Defaults locked (user said continue without picks):** civic-dense hybrid + reader-first. CMS/Neon remains Track B.

## Track A — Reader (now)

1. Masthead: utility bar + brand + category nav + search
2. Home: breaking strip, lead+latest rail, category rows, compact dual signals
3. Article: share, type size, denser related
4. Footer: sections + trust + RSS

## Track B — Backend / admin (next)

1. Neon `DATABASE_URL` + Blob token on Vercel
2. Live `/cms` first admin + seed
3. `CONTENT_SOURCE=payload`
4. Migrations, `PAYLOAD_DB_PUSH=false`

## Anti-goals

- Copy OnlineKhabar chrome wholesale
- Ads / Reels / horoscope equal rails
- Fake engagement numbers
- Full-viewport art-gallery hero on a news home
