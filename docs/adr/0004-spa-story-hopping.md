# ADR-0004: SPA-style story hopping via recommendation sheet

Date: 2026-08-11 · Status: Accepted

## Decision
Article-to-article navigation is a first-class flow: a floating "Read next"
control opens a bottom sheet (`UpNextSheet`) of personalized recommendations
(`/api/recommendations` blending current story category, reader interests -
account first, device profile fallback - recent reading history, and
freshness via `recommendForReader`). Items use client-side <Link> transitions;
readers hop without back navigation or full reloads.

## Why
Session depth is the primary growth metric for the network; App Router
already gives SPA transitions - the product needed the surface.

## Consequences
- Recommendations API returns full story cards (not ids) - it is a UI feed.
- The sheet is a dialog: focus trap, Escape, scroll lock, closes on route
  change. Bottom-sheet pattern is the standard for future overlays.
- Personalization signals stay anonymous-friendly (no reader id required).
