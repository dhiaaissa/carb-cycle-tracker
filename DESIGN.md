# Design

This app is a **logbook**, not a landing page. It is opened every day on a phone,
in three languages (one of them right-to-left), to answer one question: *what's
left today?* Every visual decision below serves that.

Read this before adding UI. If a change needs something not covered here, extend
this file in the same commit.

## Identity

Mediterranean, specifically Tunisian: the blue of Sidi Bou Said doors on
lime-washed walls, with saffron and olive as the food colours.

| Token | Role | Where |
|---|---|---|
| `door-600` `#1F4E9C` | Brand, primary actions, protein | Buttons, active nav icon, protein ring/bar, low-carb days |
| `saffron-400/500` | Carbs, medium days, "a bit over" | Carb ring/bar, med days, over-target (never red) |
| `olive-500` | Fat, high days, success | Fat ring/bar, high days, done states |
| `water-500` | Water only | Water goal check |
| `clay-*` | Real errors only (failed save, wrong password) | Never for eating "too much" |
| `ink-*` | Text and lines (warm neutral) | `ink-900` text, `ink-500` secondary, `ink-200` hairlines |
| `page` `#F3F1EA` | Page background (lime-wash) | `bg-page`, also the `theme-color` meta |
| `bg-white` | Raised surfaces (panels, sheets) | Becomes warm charcoal in dark mode |

Legacy Tailwind names (`indigo`, `purple`, `green`, `amber`, `red`, `gray`…) are
aliased onto these scales in `client/tailwind.config.js`, so old markup can't
reintroduce stock colours. New code should use the brand names.

Dark mode mirrors every scale (see the config). It is a user choice
(system / light / dark), not the default.

## Type

- **IBM Plex Sans** for UI text, **IBM Plex Sans Arabic** as its Arabic
  companion (same design family, so RTL doesn't look like a different app).
- **IBM Plex Sans Condensed** (`font-display`) for headings and big numbers.
- Numbers use tabular figures everywhere (`tnum` is on by default).
- Sentence case. No all-caps tracked labels.
- In Arabic, digits stay Western (`formatNumber` forces `latn`), as is usual in
  the Maghreb.

## Shape and depth

- Radii: `rounded-lg` (8px) for controls, `rounded-xl` (12px) for panels.
  `rounded-2xl/3xl` are remapped to 12/14px; don't reach for pills.
- Depth comes from **hairline borders** (`border-ink-200`) and surface colour,
  not shadows. The only shadow is on floating menus.
- No gradients. No glows. No `backdrop-blur` except none.

## Icons and emoji

- UI icons are **Phosphor** (`@phosphor-icons/react`), regular weight, `fill`
  for the active state. 18–20px in navigation and buttons.
- Emoji are **content only**: food items, the mood picker, custom-food icons.
  Never in navigation, headings, buttons, stats or translation strings.

## Signature components

- `TodaySummary` — calories *left* as the hero number, three macro rings in food
  colours, meal tiles that open logging in one tap.
- `ProgrammeLog` — the 56 days as a logbook page: one row per week, one cell per
  day, tinted by day type, solid once logged, today outlined.
- `BrandMark` — a ring in three arcs (door / saffron / olive), the three day types.
- Week strips in the sidebar — seven small squares per week instead of a
  progress bar.

## Motion

Quiet. Ring and bar fills ease out (≤700ms); presses scale to 0.98 on
`:active`. No entrance animations, no bounce, no count-ups, no pulsing dots.
Everything respects `prefers-reduced-motion`.

## Mobile

From the mobile-native checklist, already in place:

- Pinch-zoom is allowed; inputs are 16px on touch so iOS doesn't auto-zoom.
- `hover:` styles only apply where hover exists (`hoverOnlyWhenSupported`).
- No tap highlight, `touch-action: manipulation`, no text selection on controls.
- `overscroll-behavior: none` on the page, `contain` on scroll areas.
- `viewport-fit=cover` + safe-area padding on header, sheets and footers.
- `theme-color` per colour scheme (and updated when the user overrides it).
- Dialogs are bottom sheets on phones, with a grab handle.

These need a real phone to confirm (emulators don't reproduce them): tap delay,
sticky hover, input zoom, overscroll, safe areas, keyboard.

## Copy

Plain, specific and kind. Say what the number is, not how great the app is.
Going over a target is "a bit above today's target — that's okay", in saffron.
No "Elevate", "Seamless", "Powerful", "Get started →".

## Don't

- Purple/indigo anything, gradients, gradient text, glows, glassmorphism
- Emoji as icons, icons inside coloured rounded squares
- Pill badge above a centred hero, rows of icon-topped feature cards, stat banners
- Uppercase tracked labels, decorative 01/02/03 numbering
- Red for "you ate too much"
