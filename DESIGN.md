# Design

<!-- impeccable:design-schema 1 -->

## World

**Civic Newsroom / Valley Mist** — a photo-led Nepali newsroom with strong civic ink, crisp paper surfaces, an alpine-teal navigation system, and obvious editorial hierarchy. The product should feel full because journalism, photography, and structured modules occupy the page—not because every item is boxed.

## Design read

Nepali-first national news portal for high-frequency mobile and desktop readers. The visual language is dense, image-rich, authoritative, and highly scannable. The first viewport must immediately communicate one lead story, several current stories, navigation, and time-sensitive context. Empty gray acreage and long runs of plain text lists are failure states.

`DESIGN_VARIANCE: 6` · `MOTION_INTENSITY: 3` · `VISUAL_DENSITY: 7`

## Color

Strategy: restrained high-contrast neutrals + one civic teal accent.

| Token | Light | Dark |
|---|---|---|
| `--ink` | `#10201D` | `#EDF4F2` |
| `--paper` | `#FBFCFB` | `#121917` |
| `--paper-elevated` | `#F1F5F3` | `#192320` |
| `--paper-strong` | `#E7EEEB` | `#22302C` |
| `--stone` | `#52645F` | `#AEBDB8` |
| `--line` | `#C9D5D1` | `#34443F` |
| `--accent` | `#0B6B63` | `#55C9BD` |
| `--accent-strong` | `#07584F` | `#81DDD4` |
| `--nav` | `#075D57` | `#0A4A45` |
| `--nav-fg` | `#F8FFFD` | `#F8FFFD` |
| `--nav-accent` | `#BCE9E3` | `#8DDDD4` |
| `--danger` | `#A72B36` | `#FF8C96` |

Avoid pure black/white. Colored surfaces use hue-related foregrounds rather than gray text.

## Typography

- Primary Nepali/UI face stays the project's current Mukta implementation while structural redesign is evaluated.
- Noto Serif Devanagari may be reserved for essays/opinion if the final visual QA supports it.
- Body reading measure: ~65–72ch.
- Devanagari article line-height: ≥1.7.
- Headlines use clear scale steps rather than decorative tracking.

## Shape

- Editorial images: square/hard edges or very small radius.
- Controls: 8–10px radius.
- Pills only for compact status/category controls.
- Cards are not the default structure; use image + type + rules + whitespace.

## Motion

Subtle image hover scale and purposeful drawer/tab transitions only. Honor `prefers-reduced-motion`. No marquees or scroll hijacking.

## Homepage composition

1. Utility strip
2. Brand masthead
3. Primary category navigation
4. Current/breaking strip
5. One image-first lead + compact image-rich latest/popular rail
6. Three supporting stories
7. Differentiated category bands (feature + rows, image grids, province, opinion, visual)
8. Rich footer

The same story must not fill adjacent high-attention modules. Every major category should still look intentional with sparse content.

## Category pages

Five-story baseline should render as a visual editorial package: one lead, two supporting stories, then two image cards. Larger collections continue with image-rich grids/streams. Avoid a full page of numbered text-only lists.

## Login / newsroom

Public login is a real branded surface with actual staff authentication. Private journalist writing is a task-first workbench and does not reuse dense public newsroom chrome.

## Reading surface

Article column ~720px. Hero media may be wider. Dark mode uses lifted surfaces, not true black. Article toolbar remains compact on mobile and article completion must provide related/current continuation.
