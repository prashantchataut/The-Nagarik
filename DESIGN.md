# Design

<!-- impeccable:design-schema 1 -->

## World

**Civic Ink / Valley Mist** — a cool civic paper after rain: mist stone ground, deep ink type, one alpine-teal accent. Photo journalism as the only hero plane. Portal IA with calm materials (not a red warehouse).

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

No OnlineKhabar portal red, no AI purple, no cream-terracotta craft palette. Never pure `#000` / `#FFF`.

## Typography

- Display / Nepali headlines: `Noto Serif Devanagari`
- UI / English / body UI chrome: `Manrope`
- Mono (desk, metadata sparingly): `IBM Plex Mono` only in ops desk, not marketing chrome

Body measure ~65ch. Devanagari line-height ≥ 1.7.

## Shape

Corner radius: soft 12px for interactive controls; 0 for editorial photo edges / hairlines.

## Motion

`MOTION_INTENSITY: 3` — opacity/transform reveals only; honor `prefers-reduced-motion`. No marquees. No scroll hijack.

## Layout dials

`DESIGN_VARIANCE: 6` · `VISUAL_DENSITY: 6`

**Civic-dense hybrid** (Online Khabar IA lessons, Civic Ink materials):

- Utility strip (date, search, language) above brand
- Brand row + full category nav (second sticky band on desktop)
- Breaking / ताजा अपडेट strip under nav
- Homepage first block: lead + side latest rail (not full-viewport art hero)
- Category section rows with divide-y lists + optional thumb
- Dual trending / most-read rail stays compact
- Article: share + type size + related list

Learn from OnlineKhabar / Ratopati / Kantipur: density, update cadence, section rows. Do not copy: portal red, ad racks, fake comment counts, Reels/horoscope as equal rails.

## Components

Cards only for interactive groupings. Prefer divide-y / whitespace. Icons: Phosphor only. Em-dash banned in UI copy.

## Reading surface

Article column max-width ~720px; dark mode uses lifted paper (`--paper-elevated`), not true black. Progress indicator allowed; article toolbar must stay thin on mobile.
