# Design

<!-- impeccable:design-schema 1 -->

## World

**Civic Ink / Valley Mist** — a cool civic paper after rain: mist stone ground, deep ink type, one alpine-teal accent. Photo journalism as the only hero plane. High design variance, low motion, low–medium density.

## Color

Strategy: Restrained (neutrals + one accent).

| Token | Light | Dark |
|---|---|---|
| `--ink` | `#12141A` | `#E8ECF1` |
| `--paper` | `#E8ECF1` | `#16181F` |
| `--paper-elevated` | `#F4F6F9` | `#1C1F28` |
| `--stone` | `#5C6570` | `#9AA3AD` |
| `--line` | `#C5CCD6` | `#2A2F3A` |
| `--accent` | `#0F6E6A` | `#3DB8B0` |
| `--accent-fg` | `#F4F6F9` | `#0A1A19` |

No portal red, no AI purple, no cream-terracotta craft palette. Never pure `#000` / `#FFF`.

## Typography

- Display / Nepali headlines: `Noto Serif Devanagari` (justified for Devanagari news display; not Fraunces/Instrument)
- UI / English / body UI chrome: `Manrope`
- Mono (desk, metadata sparingly): `IBM Plex Mono` only in ops desk, not marketing chrome

Body measure ~65ch. Devanagari line-height ≥ 1.7. Italic display with descenders needs `leading-[1.1]` + padding reserve.

## Shape

Corner radius: soft 12px for interactive controls; 0 for editorial photo edges / hairlines. One system: buttons 12px, inputs 12px, no mixed pill+sharp without rule.

## Motion

`MOTION_INTENSITY: 3` — opacity/transform reveals only; honor `prefers-reduced-motion`. No marquees in Phase 1. No scroll hijack.

## Layout dials

`DESIGN_VARIANCE: 8` · `VISUAL_DENSITY: 3`

Homepage first viewport: brand masthead · one lead headline · one dek (≤20 words) · language + primary CTA · one full-bleed image. No cards in hero. No trust strip in hero. Max one eyebrow per three sections.

## Components

Cards only for interactive groupings. Prefer divide-y / whitespace. Icons: Phosphor only. Em-dash banned in UI copy.

## Reading surface

Article column max-width ~720px; dark mode uses lifted paper (`--paper-elevated`), not true black. Progress indicator allowed; sticky toolbar optional and must not dominate on mobile.
