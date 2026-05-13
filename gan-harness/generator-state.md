# Generator State — Iteration 002 (desktop layout redesign + wild animations)

## What Was Built This Iteration

### Mission 1 — Desktop Layout Redesign (>= 900 px)

The viewport is now a true desktop dashboard. The old "mobile design stretched
to desktop" stack is gone.

- New `app-body` is a CSS Grid: `minmax(0, 1fr) minmax(360px, 0.8fr)
  minmax(240px, 0.55fr)`. At >= 1280 px the proportions widen with a
  centered 1500 px max-width container.
- **Left panel (`panel-main`)** — Garden takes the full column height, with
  its own `overflow-y: auto` scroll.
- **Middle panel (`panel-center`)** — Tabbed: a pill row at top swaps between
  Butik / Uppdrag / Trofér / Stall / Hjulet. Active tab gets a pink
  `linear-gradient` pill with shadow lift. The bottom area scrolls. Inactive
  panel slots are `display: none` so only one renders.
- **Right panel (`panel-right`)** — new `SideStats` aside, always visible on
  desktop. Hidden via `display: none` on mobile.
- Bottom nav (mobile) is hidden via `@media (min-width: 900px)`.
- Top HUD spans the full width of the desktop layout.

### `SideStats` panel

`src/components/SideStats/SideStats.tsx` + `side-stats.css`. Four mini-cards:

1. **Mynt & tempo** — total earned + active speed boost chip (pulsing
   gradient pill with countdown), or "Ingen boost" muted.
2. **Dagens uppdrag** — up to 3 mini quest rows with mini progress bar,
   ready-to-claim highlighted. Flickering streak chip when streak >= 3.
3. **Senaste trofé** — last unlocked achievement, or "Inga trofér än —
   börja odla!".
4. **Väder** — "Stormvarning aktiv" with purple-tinted card +
   pulsing copy when a plot has active weather, otherwise "Lugnt väder
   i trädgården".

### Garden panel

- 3-column grid at >= 900 px (replaces the old 2-col responsive logic);
  plot cards drop the 1:1 aspect-ratio and grow to `min-height: 180px`
  (200 px at >= 1280 px) so growing/ready state has more vertical room.
- New "Nästa odlingsyta öppnas vid …" progress bar under the grid with
  coin/total numbers.
- AmbientGarden mounted inside the section (see below).

### Mission 2 — Wild Animations

#### A. Harvest Reveal (full-screen)

`src/components/effects/HarvestReveal.tsx`. Triggered by the new
`harvestReveal` store field every time `harvestCat()` resolves.

- Cat sprite balloons (scale 0.6 -> 14 -> 16 -> 0) over 950 ms with
  rotation kicks via Framer Motion `times` keyframes.
- 14 colored particles radiate from center (cat-palette gradient
  picked per cat).
- Legendary / mythic harvests get 3 stacked CSS shockwave rings
  (`shockwave-out` keyframe, 18x scale) and a screen-wash flash tinted
  to the rarity (sakura pink for mythic, gold for legendary).

#### B. Coin Cascade

`src/components/effects/FloatingCoins.tsx` extended.

- The existing "+N mynt" badge still floats up, **plus** 8 coin emoji
  arrange around the cascade origin in a fountain pattern and fly up to
  the top of the screen with staggered delay and per-coin rotation.
- The HUD coin counter already pulses on `coinPulseKey` change.

#### C. Bouncing ready cat + ambient sparks

`garden.css`:

- `ready-bounce` keyframe now runs at 0.6 s (was 1.4 s) with a 12 px
  jump.
- `::before` and `::after` pseudo elements float up sparkles around the
  bouncing cat in a 2.2 s loop.
- The harvest CTA pill pulses with a green glow ring
  (`ready-cta-pulse`).

#### D. Weather impact (per-event flair)

`PlotCard.tsx` — new `WeatherSpecial` subcomponent renders the right
animation per event id:

- **Lightning** — hand-drawn SVG bolt that strokes itself via
  `stroke-dashoffset` from 220 to 0, glow shadow on the bolt, plot
  shakes with a 5-step `lightning-shake` keyframe.
- **Tornado** — two nested rotating dashed circles
  (`tornado-vortex` keyframe, 1440 deg rotation).
- **Meteor** — emoji falls from -200 px to +220 px with
  `cubic-bezier(0.5, 0, 0.75, 0.2)` (gravity), then a circular
  shockwave (`meteor-shock` keyframe scales 0.3 -> 8x) expands at impact.
  Whole `.app-body` shakes via `camera-shake` keyframe.
- **Snow** — particle fall (existing) plus a soft frost overlay
  inside the plot that fades over 5 s.
- **Rain** — uses the existing rain raindrop streaks.

`LightningFlash.tsx` already does the fullscreen color-wash tinted per
event id.

#### E. Achievement / lottery fireworks

`src/components/effects/Fireworks.tsx` + queue in store
(`fireworks: FireworksBurst[]`).

- Each burst is 6 rockets: vertical trail line shoots up
  (`scaleY` 0 -> 1 -> 0), then a 12-star radial burst around the rocket
  apex, plus a soft bright flash, all tinted by burst.tint.
- 24 confetti strips fall across the full viewport in 2.4-3.4 s with
  per-strip delays and a rotation arc.
- Fired automatically by:
  - Newly-unlocked achievements (one per achievement, capped at 3).
  - Legendary / mythic cat harvests.
  - Lottery wins >= 500 coins or rare+ seeds.

#### F. Sell pop-up

`src/components/effects/SellPopUp.tsx`. Big rarity-colored "+1250"
floats up 120 px in 1.5 s with rotation kicks. Font size scales by
amount.

#### G. Planting splat

When a seed is planted, `PlotCard` flashes a brown soil blob
(`splat-pop`, 0.7 s) plus 6 dust dots scattering radially
(`splat-dust`, 0.9 s) over the plot. The growing-stage sprite springs
in via `sprout-in` (0 -> 1.15 -> 1, 0.7 s).

#### H. Streak fire animation

`SideStats` mini streak pill uses the existing `streak-flame-flicker`
keyframe (4-step scale + rotate, drop-shadow glow) when streak >= 3.

#### I. Ambient garden particles

`src/components/effects/AmbientGarden.tsx` + CSS keyframes in
`App.css`.

- 4 butterflies drift left -> right with a sinusoidal-style sway
  controlled by per-butterfly `--sway` CSS var and varied durations
  (18 / 22 / 26 / 30 s).
- 3 leaves do a slower diagonal drift with continuous rotation.
- 5 sparkle dots twinkle in place via `ambient-twinkle` (4 -> 7 s).
- All ambient layer is `overflow: hidden`-clipped inside
  `.garden-section` so nothing escapes.

### Reduced motion

- New `useReducedMotion()` hook reads both system
  `prefers-reduced-motion` and the in-app `settings.reducedMotion`
  toggle.
- `HarvestReveal`, `Fireworks`, and `AmbientGarden` short-circuit to
  `null` when reduced motion is on.
- `SellPopUp` runs a simple fade-only variant.
- All decorative CSS keyframes have a matching
  `@media (prefers-reduced-motion: reduce)` override that disables the
  animation.

### Store additions

- `harvestReveal: HarvestReveal | null` (set by `harvestCat`).
- `fireworks: FireworksBurst[]` (queued from achievements, lottery,
  rare harvests).
- `sellPopUps: SellPopUp[]` (set by `harvestCat`).
- Three new actions: `clearHarvestReveal()`, `clearFirework(id)`,
  `clearSellPopUp(id)`.
- No save-schema changes — these are all ephemeral UI state and aren't
  persisted.

## What Changed This Iteration

- Replaced single-column `.app-main` + side-panels layout with the
  three-panel grid described above.
- Added `panel-hidden-mobile` semantics (no-op at >= 900 px).
- Added a desktop "tab pill" bar inside the center panel; mobile keeps
  the existing bottom tabbar.
- Added 6 new components (`HarvestReveal`, `Fireworks`, `SellPopUp`,
  `AmbientGarden`, `SideStats`, plus `useReducedMotion` hook).
- Added per-weather extra flair to PlotCard (`WeatherSpecial`).
- Added planting splat + sprout-in to PlotCard.
- Updated `garden.css` for 3-col desktop, taller plots, and the
  unlock-progress card.
- Extended store with harvest reveal / fireworks / sell pop-up queues
  and the fireworks-on-achievement / fireworks-on-rare-lottery hooks.

## Known Issues / Limitations

- Coin cascade dots originate from the screen-centered floating-coin
  layer rather than from the actual harvest button — the dots fan
  outward but don't trace a literal line to the HUD coin counter.
- Meteor camera shake is single-direction (one animation cycle per
  strike); back-to-back meteors within 700 ms won't re-trigger.
- HarvestReveal scales the CatSprite SVG up 14x. The text inside the
  cat stays sharp because SVG, but the drop-shadow filter clamps at the
  viewport at very high scales — acceptable.

## Tests

- `npm test` — 89 passing across 6 files (unchanged set; no domain
  changes).
- `npm run build` — passes. Bundle: 440 kB JS (133 kB gzipped),
  82 kB CSS (15 kB gzipped).

## Dev Server

- URL: `http://localhost:5173`
- Status: running (verified `HTTP 200` on `/`).
- Command: `npm run dev`.
