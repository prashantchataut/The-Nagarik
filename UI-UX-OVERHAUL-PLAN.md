# The Nagarik (द नागरिक) — Complete UI/UX Overhaul & Architecture Plan

## Executive Summary

The Nagarik is a Nepali-first national news portal designed to deliver high-quality, independent civic journalism. This document details the comprehensive investigation, benchmark analysis of leading Nepali news portals, architectural decisions, design system specifications, and complete technical implementation for the redesign of The Nagarik.

---

## 1. Benchmark Analysis of Reference Portals

We conducted a deep structural and aesthetic audit of five leading portals ranked by editorial quality and UI/UX craft:

### 1. OnlineKhabar (Rank #1)
- **Header & Navigation**: Two-tier header structure. Top subtle utility strip (36px) with live Devanagari date (`२०८३ साउन २५, सोमबार`), English edition switcher, and search. Main white navigation bar (64px) with bold branding, compact category links with icons, persistent across all pages.
- **Breaking & Trending**: Numbered "ट्रेन्डिङ" ticker where numbers 1-3 have distinctive visual weight.
- **Hero & News Feed**: Dominant 16:9 lead story with large typography (3rem+), balanced excerpt, author bylines, and read time.
- **Section Variety**: 4-5 distinct layout paradigms (Feature + List, 4-Column Card Grid, Photo Feature Strip, Dense Category Mix).
- **Mobile Experience**: Clean scroller, responsive drawer, and bottom navigation.

### 2. Ratopati (Rank #2)
- **Utilities & Tools**: Top bar with Nepali Patro, Preeti Unicode converter, gold/silver and forex widgets.
- **Article Reading**: Breadcrumbs, social sharing buttons (Facebook, X, WhatsApp, Viber), author profile cards, and related stories.

### 3. Techpana (Rank #3)
- **Visual Impact**: Strong 16:9 aspect ratios, clean white surfaces, subtle borders, high image density with zero empty acreage.

### 4. Nepalkhabar (Rank #4)
- **Discovery**: Trending hashtag pills (`#राजनीति`, `#संसद`), photo-first card grids, author byline integration.

### 5. ArthaKhabar (Rank #5)
- **Hierarchy**: Clean section differentiation with subtle background shifts (`--paper` to `--paper-elevated`), category badges, Devanagari date stamps.

---

## 2. Core Problems in Previous Implementation & Solutions Delivered

| Problem | Root Cause | Solution Implemented |
|---|---|---|
| **Blank / Empty Feeling** | Monotonous layout, plain text lists, weak visual weight | Rich image-forward cards, 16:9 / 16:10 / 4:3 ratios, varied section bands |
| **Weak Hero Hierarchy** | Lead story shared cramped space with side rail | Dominant 8-col lead story with 3rem typography + 4-col latest rail |
| **Category Page 404 Bug** | `[category]/page.tsx` was a clobbered copy of article page expecting `params.slug` | Completely rewritten Category Listing page with lead package, grid, and stream |
| **Navigation Monotony** | Plain text links without visual scanning cues | Phosphor category icons in desktop nav, mobile scroller, and mobile drawer |
| **Broken/Bare Admin Desk** | Root `/admin` was returning a media stub | Full Newsroom Desk dashboard, editorial queue, articles, users, and launch checks |
| **Social Sharing Missing** | News view lacked sharing mechanisms | One-click share buttons for Facebook, X, WhatsApp, Viber, and copy link |
| **Mobile Thumb Reach** | Navigation required opening hamburger menu for everything | Fixed 5-item mobile bottom navigation bar (Home, Latest, Search, Patro, Theme) |

---

## 3. Design System Specifications (`@thenagarik/ui`)

### Color Tokens (Light & Dark Mode Parity)
- `--ink`: `#10201d` (Light) / `#edf5f2` (Dark)
- `--paper`: `#fbfcfb` (Light) / `#121a18` (Dark)
- `--paper-elevated`: `#f1f5f3` (Light) / `#192421` (Dark)
- `--paper-alt`: `#f4f8f6` (Light) / `#16201e` (Dark)
- `--stone`: `#52645f` (Light) / `#a8bbb5` (Dark)
- `--line`: `#c9d5d1` (Light) / `#344943` (Dark)
- `--accent`: `#0b6b63` (Light) / `#54c8bd` (Dark)
- `--nav`: `#075d57` (Light) / `#0d2925` (Dark)
- `--danger`: `#a72b36` (Light) / `#ff9099` (Dark)

### Typography
- Sans / Display: Mukta, Noto Sans Devanagari, system-ui
- Serif: Noto Serif Devanagari, Georgia, serif
- Mono: IBM Plex Mono, monospace

---

## 4. Component Inventory

1. `UtilityStrip.tsx`: Top utility bar with Devanagari date, Patro link, Preeti Unicode converter, Trust link, Login, Theme toggle, and EN/NE switcher.
2. `CategoryIcon.tsx`: Phosphor icon mapping for all categories with bold weights.
3. `Chrome.tsx`: Two-strip desktop header, mobile header, fixed mobile bottom bar, accessible modal drawer, and 4-column rich footer.
4. `BreakingStrip.tsx`: OnlineKhabar-style numbered trending ticker with live pulsing indicator.
5. `HeroLead.tsx`: Dominant lead story (8 cols) + Latest updates rail (4 cols).
6. `TrendingSection.tsx`: Full-width 5-column numbered ranking block.
7. `LatestSection.tsx`: 4-column image card grid / 2-column row list.
8. `StoryCard.tsx`: Standardized reusable story card with aspect ratio control and breaking overlay.
9. `HomeCategoryBand.tsx`: 5 layout variants (`feature-grid`, `card-grid`, `image-strip`, `opinion`, `dense`).
10. `HomeProvinceTabs.tsx`: 7-province interactive tab selector.
11. `HomeFront.tsx`: Opinion callouts and dark alpine-teal photojournalism showcase (`HomeVisual`).
12. `ReaderClient.tsx`: Social sharing buttons, text size controls, reading progress bar, and consent telemetry.
13. `AdminShell.tsx` & `primitives.tsx`: Complete Newsroom Desk UI kit.

---

## 5. Skills Applied

- **design-taste-frontend**: Design read inference, dial calibration (`6/3/7`), anti-default discipline, layout hierarchy, and strict pre-flight checks (zero em-dashes, WCAG AA contrast, viewport stability).
- **impeccable**: UX design review, editorial information architecture, cognitive load reduction, dark mode parity, and component polish.
- **ui-ux-pro-max**: Responsive mechanics, mobile bottom navigation, accessible drawer modal with focus trapping, and micro-interactions.
- **payload**: Payload CMS 3 collections validation, RBAC hooks, and clean desk integration.
- **eeat-signals**: Verified author bylines, corrections policy, transparency banners, and JSON-LD NewsArticle schema.
- **web-perf**: Optimized image aspect ratios, Next.js Server Components, CSS-driven animations, and Core Web Vitals compliance.
