# Generator State — Iteration 004 (day/night, parallax, Kattpedia, plot particles)

## What Was Built This Iteration

### Feature 1 — Animated Day/Night Cycle

New files:
- `src/hooks/useDayNight.ts` — drives a 10-minute (600s) sky cycle:
  - Dawn 0–15% (90s), Day 15–55% (240s), Sunset 55–75% (120s),
    Night 75–100% (150s).
  - Anchors the cycle to `Date.now() % 600_000` so reloads pick up
    where they were.
  - Returns `phase`, `progress` (0..1 within the phase), `cycleProgress`
    (0..1 across the full cycle), and `cssVars` (`--ambient-tint`,
    `--surface-warmth`, `--sky-vignette`).
  - Companion `phaseLabel()` returns `{emoji, label}` in Swedish.
- `src/components/effects/SkyBackground.tsx` + `sky-background.css` —
  fixed full-viewport layer at `z-index: -1`:
  - Four stacked gradient layers (dawn / day / sunset / night) cross-fade
    via an 8s ease opacity transition.
  - 48 procedurally generated, deterministic stars with stagger-twinkle
    keyframes; fade in for sunset/night, out for dawn.
  - 4 drifting clouds (80s–130s linear) visible during dawn/day.
  - 80px sun arcing across day phase (sine ease); 60px moon with craters
    arcing across night.
  - Vignette layer driven by `--sky-vignette` for a phase-aware bottom
    glow.
- `App.tsx`:
  - Replaced inline `.app-deco` decoration with `<SkyBackground />`.
  - Applies `cssVars` to `.app-shell` style + `data-phase` attribute
    for theming hooks.
  - Renders a `.phase-chip` indicator in the header
    (🌅 Gryning / ☀️ Dag / 🌇 Solnedgång / 🌙 Natt) with phase-tinted
    pill backgrounds.
- `App.css`:
  - Removed the static `.app-deco` block, replaced with an
    `.app-shell::after` ambient tint overlay that crossfades over 8s.
  - Added `.phase-chip` styles (4 phase variants); hides the label on
    very narrow screens (<=480px).

### Feature 2 — Mouse Parallax

New file:
- `src/hooks/useParallax.ts` — returns smoothed normalized pointer
  position (-1..1) scaled by `strength`. Uses `requestAnimationFrame`
  with a 0.12 easing factor; throttled state updates only when delta
  > 0.002. Honors `useReducedMotion()` (returns `{0,0}`) and the
  `(pointer: fine)` media query (touch returns `{0,0}`).

Wiring:
- `SkyBackground.tsx`: stars use `useParallax(8)`, clouds use
  `useParallax(15)`. Applied via `translate3d`.
- `AmbientGarden.tsx`: butterflies/leaves use `useParallax(20)`
  (y-axis dampened to 0.6 of the strength) on the layer root.
- `Garden.tsx`: the `.garden-grid` itself uses `useParallax(3)` for
  subtle foreground depth.

### Feature 3 — Kattpedia (replaces "Stall")

New files:
- `src/components/Kattpedia/Kattpedia.tsx` + `kattpedia.css` —
  collection screen with two views:
  - **Grid**: `repeat(auto-fill, minmax(160–170px, 1fr))` of cards.
    Each card shows: 80px CatSprite (glowing for non-common cats),
    Swedish name (or "??? Okänd katt" silhouette if not yet
    harvested), a per-rarity badge, and a "×N" total-grown badge.
  - **Detail**: opens via `motion.div layoutId` spring transition,
    fills the panel, shows: 160px CatSprite with halo + radial glow,
    rarity badge in oversized type, flavor description, Swedish lore
    paragraph in a left-bordered quote, three stat blocks (growth
    time, sell value, seed cost), and a "Din historia med X" panel
    with 6 personal stats (count grown, total earned, best weather
    bonus, top-rolled trait, last-named cat, seed inventory).
  - Mythic detail view triggers a 14-mote particle burst expanding
    out from the centre.
  - Back button uses inverse `layoutId` animation.
- Rarity shimmer (CSS):
  - **common** — no shimmer
  - **uncommon** — soft silver linear shimmer sweep, 5s
  - **rare** — blue/purple linear shimmer sweep, 4.2s
  - **epic** — gold conic-gradient border with rotating ray shimmer,
    9s
  - **legendary** — rainbow conic-gradient border with pulse +
    sweep shimmer
  - **mythic** — magenta/cyan conic border with blur-glow halo +
    overlay shimmer; the detail view additionally fires a 14-mote
    burst on open
- `App.tsx`: the "stall" panel slot now renders `<Kattpedia />` in
  place of the old `<CatDisplay />`. (CatDisplay file is kept but
  unused.)
- `src/domain/catTypes.ts`: added a `lore: string` field to the
  `CatType` interface and wrote a short, kid-friendly Swedish lore
  blurb for all 22 cat types.

### Feature 4 — Per-Plot Ambient Particles

New file:
- `src/components/Garden/PlotParticles.tsx` — renders 6–8 absolutely
  positioned particle spans inside the plot card while the plot is in
  the `growing` state. Each particle reads `--particle-color`,
  `--particle-glow`, `--particle-body`, `--particle-delay`,
  `--particle-x`, `--particle-size`, `--particle-drift-x` from the
  cat's palette. Selects a CSS variant per cat species:
  - `grass` (Gräskatt, Bamboukatt) — leaf shape, accent gradient
  - `spark` (Morotskatt, Citruskatt, Honeycat, Kokosnötkatt,
    Thundercat) — radial sparkle with glow
  - `blob` (Blåbärskatt, Lavendelkatt) — soft blurred berry-blobs
  - `snow` (Isbjörnkatt) — slow falling rotating dots, 3.2s
  - `ember` (Vulkankatt, Drakkatt, Phoenixkatt) — orange-red embers
    with shadow glow, lifted 52px with horizontal drift
  - `diamond` (Kristallkatt) — rotating diamond outlines with
    inner-shine
  - `wisp` (Spökkatt) — translucent blurred wisps, 3.8s
  - `rainbow` (Regnbågskatt) — conic-gradient + hue-rotate animation
    cycles through full spectrum, 2.5s
  - `droplet` (Tidvattenkatt) — teardrop with shadow
  - `star` (Stjärnkatt, Enhörningskatt) — clip-path star polygon
    with rotation
  - `cosmic` (Rymkatt, Kosmisk Katt) — magenta cosmic dust with
    inner halo
- For `rymkatt` and `cosmiccat` an additional `.plot-shooting-star`
  fires diagonally across the plot every ~5.5s.
- Wired into `PlotCard.tsx` inside `GrowingStage` so particles only
  appear while plot.state is `growing`.
- All keyframes added to `garden.css`; `prefers-reduced-motion`
  disables them.

## What Changed This Iteration

- Sky is now a living, looping day/night cycle rather than a single
  static deco.
- Headers have a Swedish phase indicator chip with phase-tinted
  backgrounds.
- Background layers parallax with the mouse on fine-pointer devices.
- The Stall tab is now a Pokédex-style Kattpedia with shimmer rarity
  effects and dramatic Framer Motion layout transitions.
- Every growing plot now emits species-specific particles, and the
  Rymkatt / Kosmisk Katt plots have a shooting star.
- New `lore` field on every cat type drives the Kattpedia detail
  copy.

## Tests

- `npm test` — 92 passing across 6 files (no test regressions).
- `npm run build` — clean. Bundle: 471 kB JS (143 kB gzipped),
  102 kB CSS (19 kB gzipped).

## Known Issues / Notes

- The old `CatDisplay` component still exists in
  `src/components/CatDisplay/`. The Kattpedia replaces it from
  `App.tsx`, but CatDisplay is unused — kept around in case the
  Evaluator wants to compare or in case some legacy reference needs
  it.
- Stars/clouds in `SkyBackground` use a seeded RNG with a fixed seed
  for deterministic layout. If two reviewers see the same page the
  star pattern matches.
- The day/night phase indicator updates on a 1s setInterval; the
  CSS transitions smooth the visual change. The full cycle is 10
  minutes — Evaluators briefly visiting the page will likely see one
  to two phase boundaries.
- The mouse parallax intentionally returns `{0,0}` on touch devices
  and respects the in-app `reducedMotion` toggle as well as the OS
  `prefers-reduced-motion` setting.

## Dev Server

- URL: `http://localhost:5173`
- Status: running (HTTP 200 on /).
- Command: `npm run dev`.
